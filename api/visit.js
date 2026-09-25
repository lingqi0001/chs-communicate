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

async function resolveLocation(ip, ccHint) {
    const sources = [];
    if (ip) {
        sources.push(
            {
                url: `https://ipwho.is/${encodeURIComponent(ip)}?language=en`,
                parse: g => g && g.success !== false ? g : null,
                pick: g => ({ cc: g.country_code, country: g.country, region: g.region, city: g.city, isp: g.connection?.isp || '' })
            },
            {
                url: `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
                parse: g => g && !g.error ? g : null,
                pick: g => ({ cc: g.country_code, country: g.country_name, region: g.region, city: g.city, isp: g.org })
            }
        );
    }
    for (const src of sources) {
        try {
            const resp = await fetch(src.url, { signal: AbortSignal.timeout(1500) });
            const g = src.parse(await resp.json());
            if (g) {
                const p = src.pick(g);
                if (p.cc || p.country) {
                    return { ...p, loc: [p.cc, p.region, p.city].filter(Boolean).join(' / ') };
                }
            }
        } catch (e) { /* try next source */ }
    }
    // Cloudflare terminates the visitor's request, so it already tells us the
    // country without any third-party lookup.
    if (ccHint && ccHint !== 'XX') {
        return { cc: ccHint, country: '', region: '', city: '', isp: '', loc: ccHint };
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

    // Temporary bisection probes: each returns before touching the next stage,
    // so a hard kill (no logs, edge 502) can be attributed to one step.
    if (body.probe === 'env') {
        const v = process.env.GOOGLE_SA_JSON || '';
        let parsed = 'fail';
        let keys = null;
        let pkLen = null;
        try { const s = JSON.parse(v); keys = Object.keys(s).join(','); pkLen = (s.private_key || '').length; parsed = 'ok'; } catch (e) { parsed = String(e.message).slice(0, 120); }
        return res.status(200).json({ ok: true, envLen: v.length, head: v.slice(0, 10), parse: parsed, keys, pkLen, mem: Math.round(process.memoryUsage().heapUsed / 1048576) });
    }
    if (body.probe === 'sign') {
        const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
        const now = Math.floor(Date.now() / 1000);
        const h = b64url(JSON.stringify({ alg: 'RS256', type: 'JWT' }));
        const c = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.database', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
        const sig = b64url(crypto.createSign('RSA-SHA256').update(`${h}.${c}`).sign(sa.private_key));
        return res.status(200).json({ ok: true, stage: 'sign', sigLen: sig.length });
    }
    if (body.probe === 'token') {
        const t = await getAccessToken();
        return res.status(200).json({ ok: true, stage: 'token', tokLen: t.length });
    }
    if (body.probe === 'dbget') {
        const t = await getAccessToken();
        const r = await fetch(`${DB_URL}/tool_visits/.json?shallow=true&auth=${t}`, { signal: AbortSignal.timeout(4000) });
        return res.status(200).json({ ok: true, stage: 'dbget', http: r.status, body: (await r.text()).slice(0, 150) });
    }
    if (body.probe === 'geo') {
        const g = await resolveLocation('8.8.8.8', String(req.headers['cf-ipcountry'] || '').toUpperCase());
        return res.status(200).json({ ok: true, stage: 'geo', geo: g });
    }
    if (body.probe === 'hdr') {
        return res.status(200).json({
            ok: true, stage: 'hdr',
            xff: String(req.headers['x-forwarded-for'] || ''),
            cfCountry: String(req.headers['cf-ipcountry'] || ''),
            realIp: String(req.headers['x-real-ip'] || ''),
            vercelIp: String(req.headers['x-vercel-forwarded-for'] || '')
        });
    }

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

    // Cloudflare terminates the visitor's request, so x-forwarded-for carries
    // the real client IP and cf-ipcountry already gives the country.
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || String(req.headers['x-real-ip'] || '');
    const ccHint = String(req.headers['cf-ipcountry'] || '').toUpperCase();

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
        return res.status(500).json({ ok: false, stage: 'db-read', err: readErr });
    }

    // Repeat visit: cheap merge, never re-resolve an already-known location.
    if (existing && typeof existing === 'object') {
        const patch = {
            lastSeen: now,
            opens: (existing.opens || 1) + 1,
            uid: uid || existing.uid || null
        };
        if (!existing.loc) {
            const geoRetry = await resolveLocation(ip, ccHint);
            if (geoRetry) {
                if (ip) patch.ipMask = maskIp(ip);
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
                // 500, not 502: Cloudflare replaces 502 bodies with its own
                // error page, which hides the actual reason.
                return res.status(500).json({
                    ok: false, stage: 'db-patch',
                    err: `HTTP ${patchResp.status}: ${(await patchResp.text()).slice(0, 200)}`
                });
            }
        } catch (e) {
            return res.status(500).json({ ok: false, stage: 'db-patch', err: String(e && e.message || e).slice(0, 200) });
        }
        return res.status(200).json({ ok: true, known: true });
    }

    const geo = await resolveLocation(ip, ccHint);
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
            return res.status(500).json({
                ok: false, stage: 'db-write',
                err: `HTTP ${put.status}: ${(await put.text()).slice(0, 200)}`,
                readErr
            });
        }
    } catch (e) {
        return res.status(500).json({
            ok: false, stage: 'db-write',
            err: String(e && e.message || e).slice(0, 200), readErr
        });
    }
    return res.status(200).json({ ok: true });
}
