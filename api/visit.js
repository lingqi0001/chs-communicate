/**
 * POST /api/visit  { tool, deviceId, uid? }
 *
 * Extension visit beacon. The browser cannot report its own IP, so this
 * function is the only place that sees it: it resolves the IP's geolocation
 * (city level) and merges a device-deduplicated record into
 * tool_visits/<tool>/<deviceId> in the RTDB. Raw IPs are never stored.
 *
 * Deliberately dependency-free (native crypto + RTDB REST via the App Engine
 * service account from GOOGLE_SA_JSON) so Vercel needs no install step.
 */

import crypto from 'crypto';

const DB_URL = 'https://chscommunication-default-rtdb.firebaseio.com';

let _cachedToken = { value: '', expiresAt: 0 };

const b64url = (buf) =>
    Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function getAccessToken() {
    if (_cachedToken.value && Date.now() < _cachedToken.expiresAt) return _cachedToken.value;
    const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', type: 'JWT' }));
    const claims = b64url(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.database',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    }));
    const signingInput = `${header}.${claims}`;
    const signature = b64url(
        crypto.createSign('RSA-SHA256').update(signingInput).sign(sa.private_key)
    );
    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${signingInput}.${signature}`
        }),
        signal: AbortSignal.timeout(4000)
    });
    if (!resp.ok) throw new Error('token exchange failed: ' + resp.status + ' ' + (await resp.text()).slice(0, 200));
    const data = await resp.json();
    _cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 120) * 1000 };
    return _cachedToken.value;
}

function maskIp(ip) {
    const v4 = ip.replace(/^::ffff:/, '');
    const parts = v4.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    return v4.split(':').slice(0, 3).join(':') + '::/48';
}

async function resolveLocation(ip) {
    if (!ip) return null;
    // Primary is ip-api.com (free, HTTP-only); ipapi.com is the HTTPS fallback.
    const sources = [
        {
            url: `http://api.ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,isp&lang=en`,
            parse: g => g && g.status === 'success' ? g : null,
            pick: g => ({ cc: g.countryCode, country: g.country, region: g.regionName, city: g.city, isp: g.isp })
        },
        {
            url: `https://api.ipapi.com/api/check/?access_key=${process.env.IPAPI_ACCESS_KEY || ''}&fields=country_name,country_code,region_name,city`,
            parse: g => g && !g.error ? g : null,
            pick: g => ({ cc: g.country_code, country: g.country_name, region: g.region_name, city: g.city, isp: '' })
        }
    ];
    for (const src of sources) {
        try {
            const resp = await fetch(src.url, { signal: AbortSignal.timeout(1500) });
            const g = src.parse(await resp.json());
            if (g) {
                const p = src.pick(g);
                return { ...p, loc: [p.cc, p.region, p.city].filter(Boolean).join(' / ') };
            }
        } catch (e) { /* try next source */ }
    }
    return null;
}

const geoFields = (g) => ({
    cc: g.cc || null,
    country: g.country || null,
    region: g.region || null,
    city: g.city || null,
    isp: g.isp || null,
    loc: g.loc || null
});

const clean = (s, max) => String(s || '').slice(0, max);
const KEY_RE = /^[A-Za-z0-9_-]{1,64}$/;

export default async function handler(req, res) {
    try {
        return await visit(req, res);
    } catch (e) {
        // Surface the real failure instead of letting the edge turn it into a
        // generic 502 page nobody can read.
        return res.status(500).json({ ok: false, stage: 'unhandled', err: String(e && e.message || e).slice(0, 300) });
    }
}

async function visit(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    if (!process.env.GOOGLE_SA_JSON) return res.status(500).json({ ok: false, stage: 'env', err: 'GOOGLE_SA_JSON missing' });

    const body = req.body || {};
    // Canonical eid, same normalisation the client and scans use.
    const tool = clean(body.tool, 64).toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    const deviceId = clean(body.deviceId, 64);
    const uid = clean(body.uid, 64);
    if (!tool || !KEY_RE.test(tool) || !KEY_RE.test(deviceId)) {
        return res.status(400).json({ ok: false, stage: 'input' });
    }

    let token;
    try {
        token = await getAccessToken();
    } catch (e) {
        return res.status(500).json({ ok: false, stage: 'token', err: String(e && e.message || e).slice(0, 300) });
    }

    const path = `tool_visits/${tool}/${encodeURIComponent(deviceId)}.json`;
    const auth = `?auth=${token}`;
    const now = Date.now();

    let existing = null;
    let readErr = null;
    try {
        const cur = await fetch(`${DB_URL}/${path}${auth}`, { signal: AbortSignal.timeout(3000) });
        if (cur.ok) existing = await cur.json();
        else readErr = `HTTP ${cur.status}: ${(await cur.text()).slice(0, 200)}`;
    } catch (e) {
        readErr = String(e && e.message || e).slice(0, 200);
    }
    // A denied read means the credential has no DB access at all; stop early
    // with the reason instead of writing a doomed record.
    if (readErr && /401|403/.test(readErr)) {
        return res.status(502).json({ ok: false, stage: 'db-read', err: readErr });
    }

    // Repeat visit: cheap merge, never re-resolve an already-known location.
    if (existing && typeof existing === 'object') {
        const fwdNow = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
        const ipNow = fwdNow || String(req.headers['x-real-ip'] || '');
        const patch = {
            lastSeen: now,
            opens: (existing.opens || 1) + 1,
            uid: uid || existing.uid || null
        };
        if (!existing.loc && ipNow) {
            const geoRetry = await resolveLocation(ipNow);
            if (geoRetry) {
                patch.ipMask = maskIp(ipNow);
                Object.assign(patch, geoFields(geoRetry));
            }
        }
        try {
            const patchResp = await fetch(`${DB_URL}/${path}${auth}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
                signal: AbortSignal.timeout(3000)
            });
            if (!patchResp.ok) {
                return res.status(502).json({
                    ok: false, stage: 'db-patch',
                    err: `HTTP ${patchResp.status}: ${(await patchResp.text()).slice(0, 200)}`
                });
            }
        } catch (e) {
            return res.status(502).json({ ok: false, stage: 'db-patch', err: String(e && e.message || e).slice(0, 200) });
        }
        return res.status(200).json({ ok: true, known: true });
    }

    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = fwd || String(req.headers['x-real-ip'] || '');
    const geo = await resolveLocation(ip);
    const record = {
        deviceId,
        uid: uid || null,
        c: now,
        lastSeen: now,
        opens: 1,
        ipMask: ip ? maskIp(ip) : ''
    };
    if (geo) Object.assign(record, geoFields(geo));
    try {
        const put = await fetch(`${DB_URL}/${path}${auth}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
            signal: AbortSignal.timeout(3000)
        });
        if (!put.ok) {
            return res.status(502).json({
                ok: false, stage: 'db-write',
                err: `HTTP ${put.status}: ${(await put.text()).slice(0, 200)}`,
                readErr
            });
        }
    } catch (e) {
        return res.status(502).json({
            ok: false, stage: 'db-write',
            err: String(e && e.message || e).slice(0, 200), readErr
        });
    }
    return res.status(200).json({ ok: true });
}
