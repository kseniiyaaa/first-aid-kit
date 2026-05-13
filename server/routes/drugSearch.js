const express         = require('express');
const https           = require('https');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── HTTP helper ───────────────────────────────────────────────────────────────

function httpsGetJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'MediKit/1.0' } }, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
                try { resolve(JSON.parse(body)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}


// ── Text helpers ──────────────────────────────────────────────────────────────

/** Trims a long text to maxChars, always cutting at a word boundary. */
function truncateAtWord(text, maxChars) {
    if (!text || text.length <= maxChars) return text || '';
    const cut       = text.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut) + '…';
}

function extractPurpose(text) {
    if (!text) return '';
    // Strip leading all-caps section header, e.g. "INDICATIONS AND USAGE\n"
    const clean = text.replace(/^[A-Z][A-Z\s/&,]+\n+/, '').trim();
    // Try to return the first complete sentence
    const m = clean.match(/^[^.!?]+[.!?]/);
    if (m) return truncateAtWord(m[0].trim(), 220);
    return truncateAtWord(clean, 200);
}

function extractInstructions(text) {
    if (!text) return '';
    const clean = text.replace(/^[A-Z][A-Z\s/&,]+\n+/, '').trim();
    // Try to end on a sentence boundary within 500 chars
    if (clean.length <= 500) return clean;
    const cutoff  = clean.slice(0, 500);
    const lastDot = cutoff.lastIndexOf('.');
    return lastDot > 300 ? cutoff.slice(0, lastDot + 1) : truncateAtWord(cutoff, 480);
}

function mapToUnit(dosageForm, route) {
    const d = (dosageForm || '').toUpperCase();
    const r = (route      || '').toUpperCase();
    if (d.includes('TABLET') || d.includes('CAPLET'))                                        return 'tablets';
    if (d.includes('CAPSULE'))                                                               return 'capsules';
    if (d.includes('PATCH'))                                                                 return 'patches';
    if (d.includes('DROP') || r.includes('OPHTHALMIC') || r.includes('OTIC'))               return 'drops';
    if (d.includes('CREAM') || d.includes('OINTMENT') || d.includes('GEL') || d.includes('LOTION')) return 'g';
    if (d.includes('SOLUTION') || d.includes('SUSPENSION') || d.includes('LIQUID') || d.includes('SYRUP')) return 'ml';
    if (d.includes('AMPOULE') || d.includes('VIAL'))                                         return 'ampoules';
    if (r.includes('ORAL'))                                                                  return 'tablets';
    return null;
}

// ── GET /api/drug-search/search?q=aspi ───────────────────────────────────────
// Primary: openFDA prefix wildcard  →  partial match ("aspi" → "aspirin")
// Fallback: RxNorm spellingsuggestions  →  fuzzy full-word match

router.get('/search', requireAuth, async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 3) return res.json([]);

    const seen    = new Set();
    const results = [];

    const add = (name) => {
        const key = (name || '').toLowerCase().trim();
        if (!key || seen.has(key) || results.length >= 10) return;
        seen.add(key);
        results.push(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
    };

    // Strategy 1: openFDA prefix wildcard — works great for partial input
    try {
        const data = await httpsGetJSON(
            `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encodeURIComponent(q)}*&limit=20`
        );
        for (const label of (data?.results ?? [])) {
            for (const name of (label?.openfda?.generic_name ?? [])) add(name);
        }
    } catch (e) {
        console.error('openFDA prefix search error:', e.message);
    }

    // Strategy 2: RxNorm spellingsuggestions — catches typos / different endings
    try {
        const data = await httpsGetJSON(
            `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(q)}`
        );
        for (const name of (data?.suggestionGroup?.suggestionList?.suggestion ?? [])) add(name);
    } catch (e) {
        console.error('RxNorm spellingsuggestions error:', e.message);
    }

    res.json(results);
});

// ── GET /api/drug-search/enrich?name=Aspirin ─────────────────────────────────
// Returns purpose, instructions, unit + base64 photo (server-downloaded, no CORS).

router.get('/enrich', requireAuth, async (req, res) => {
    const name = (req.query.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const fdaLabel = await fetchOpenFDALabel(name);

    const dosageForm = fdaLabel?.openfda?.dosage_form?.[0] ?? '';
    const route      = fdaLabel?.openfda?.route?.[0]      ?? '';

    res.json({
        purpose:      extractPurpose(fdaLabel?.indications_and_usage?.[0]),
        instructions: extractInstructions(fdaLabel?.dosage_and_administration?.[0]),
        unit:         mapToUnit(dosageForm, route),
    });
});

// ── External API helpers ──────────────────────────────────────────────────────

async function fetchOpenFDALabel(name) {
    const attempts = [
        `openfda.generic_name:"${name}"`,
        `openfda.brand_name:"${name}"`,
        `openfda.substance_name:"${name}"`,
    ];
    for (const q of attempts) {
        try {
            const data = await httpsGetJSON(
                `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(q)}&limit=1`
            );
            if (data?.results?.[0]) return data.results[0];
        } catch { /* try next */ }
    }
    return null;
}


module.exports = router;
