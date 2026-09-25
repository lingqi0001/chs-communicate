/**
 * POST /api/visit
 *
 * Answers "where is this requester from?".  The browser cannot see its own IP,
 * but Cloudflare hands it to us in x-forwarded-for (and a country code in
 * cf-ipcountry), so this endpoint is the only place that can resolve a
 * location.  It is deliberately read-only and credential-free: the visitor's
 * own browser writes the tool_visits record.  If this endpoint fails, visits
 * are still counted, just without a location.
 */

function maskIp(ip) {
    const v4 = String(ip).replace(/^::ffff:/, '');
    const parts = v4.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    return v4.split(':').slice(0, 3).join(':') + '::/48';
}

async function resolveLocation(ip, ccHint) {
    const sources = ip ? [
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
    ] : [];
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
    // Cloudflare already classified the country, so a visitor still gets
    // counted geographically even when both lookups are down.
    if (ccHint && ccHint !== 'XX' && ccHint !== 'T1') {
        return { cc: ccHint, country: '', region: '', city: '', isp: '', loc: ccHint };
    }
    return null;
}

export default async function handler(req, res) {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'OPTIONS') return res.status(204).end();
        if (req.method !== 'POST') return res.status(405).json({ ok: false });

        const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
            || String(req.headers['x-real-ip'] || '');
        const ccHint = String(req.headers['cf-ipcountry'] || '').toUpperCase();
        const geo = await resolveLocation(ip, ccHint);

        return res.status(200).json({
            ok: true,
            ipMask: ip ? maskIp(ip) : '',
            ...(geo || {})
        });
    } catch (e) {
        // 500 rather than 502: Cloudflare replaces 502 bodies with its own
        // error page, which hides the actual reason.
        return res.status(500).json({ ok: false });
    }
}
