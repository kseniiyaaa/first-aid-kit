const express         = require('express');
const https           = require('https');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map();
function getCached(key) {
    const e = cache.get(key);
    if (!e) return null;
    if (Date.now() > e.expiry) { cache.delete(key); return null; }
    return e.value;
}
function setCached(key, value, ttlMs) {
    cache.set(key, { value, expiry: Date.now() + ttlMs });
    if (cache.size > 300) cache.delete(cache.keys().next().value);
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function httpsPostJSON(url, payload) {
    return new Promise((resolve, reject) => {
        const body   = JSON.stringify(payload);
        const urlObj = new URL(url);
        const opts   = {
            hostname: urlObj.hostname, port: 443,
            path: urlObj.pathname + urlObj.search, method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124',
                'Accept': 'application/json, */*',
                'Accept-Language': 'uk-UA,uk;q=0.9',
                'Origin': 'https://anc.ua', 'Referer': 'https://anc.ua/',
            },
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { reject(new Error('ANC: invalid JSON')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(12000, () => { req.destroy(); reject(new Error('ANC timeout')); });
        req.write(body); req.end();
    });
}

function httpsGetJSON(url) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: new URL(url).hostname, port: 443,
            path: new URL(url).pathname + new URL(url).search, method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 Chrome/124',
                'Accept': 'application/json',
                'Origin': 'https://anc.ua', 'Referer': 'https://anc.ua/',
            },
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('ANC categories: invalid JSON')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
    });
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function normalizePicture(pic) {
    if (!pic || typeof pic !== 'string') return null;
    let url = pic.trim();
    if (!url) return null;
    if (url.startsWith('//'))  url = 'https:' + url;
    else if (url.startsWith('/')) url = 'https://anc.ua' + url;
    return url + '.min.webp';
}

function mapFormToUnit(form) {
    if (!form) return null;
    const f = String(form).toLowerCase();
    if (f.includes('таблетк') ||
        f.includes('льод') ||
        f.includes('пастил'))  return 'tablets';
    if (f.includes('капсул'))   return 'capsules';
    if (f.includes('пластир')) return 'patches';
    if (f.includes('ампул'))          return 'ampoules';
    if (f.includes('туб'))                      return 'tubes';
    if (f.includes('крапл') ||
        f.includes('насто') ||
        f.includes('насті') ||
        f.includes('екстр') ||
        f.includes('олія'))               return 'ml';
    if (f.includes('гель') ||
        f.includes('крем') ||
        f.includes('маз') ||
        f.includes('лось'))               return 'g';
    if (f.includes('сироп') ||
        f.includes('суспенз') ||
        f.includes('розчин') ||
        f.includes('емуль') ||
        f.includes('рідин') ||
        f.includes('спрей'))         return 'ml';
    return null;
}

function extractProducts(body) {
    if (Array.isArray(body))                   return body;
    if (Array.isArray(body?.products?.items))  return body.products.items;
    if (Array.isArray(body?.products))         return body.products;
    if (Array.isArray(body?.data?.items))      return body.data.items;
    if (Array.isArray(body?.data))             return body.data;
    if (Array.isArray(body?.result?.items))    return body.result.items;
    if (Array.isArray(body?.result))           return body.result;
    if (Array.isArray(body?.items))            return body.items;
    return [];
}

// Root category names to skip when picking "purpose" from the categories array
const ROOT_CAT_IDS = new Set([1, 2]); // Медикаменти, Медичні вироби (top level)

function purposeFromCategories(cats) {
    if (!Array.isArray(cats) || cats.length === 0) return '';
    // Skip root-level entries and pick the most specific one (last non-root)
    const useful = cats.filter(c => !ROOT_CAT_IDS.has(c.id));
    if (useful.length === 0) return '';
    return useful[useful.length - 1].name || '';
}

// Each entry: [searchPrefix, canonicalDisplayName]
// Ordered most-specific first to avoid false prefix matches
const FORM_ENTRIES = [
    ['супозитор',  'супозиторії'],
    ['суспенз',    'суспензія'],
    ['таблетк',    'таблетки'],
    ['таблета',    'таблетка'],
    ['капсул',     'капсули'],
    ['льодяник',   'льодяники'],
    ['пастил',     'пастилки'],
    ['настоянка',  'настоянка'],
    ['настойка',   'настойка'],
    ['настій',     'настій'],
    ['екстракт',   'екстракт'],
    ['сироп',      'сироп'],
    ['розчин',     'розчин'],
    ['емульс',     'емульсія'],
    ['олія',       'олія'],
    ['крапл',      'краплі'],
    ['гель',       'гель'],
    ['крем',       'крем'],
    ['мазь',       'мазь'],
    ['лосьйон',    'лосьйон'],
    ['пластир',    'пластир'],
    ['ампул',      'ампули'],
    ['туба',       'туба'],
    ['спрей',      'спрей'],
    ['порошок',    'порошок'],
];

const LIQUID_FORM_PARTS = [
    'насто',
    'екстр',
    'сироп',
    'розчин',
    'емуль',
    'олія',
    'крапл',
    'спрей',
];

function parseFormFromName(name) {
    const n = (name || '').toLowerCase();
    for (const [prefix, canonical] of FORM_ENTRIES) {
        if (n.includes(prefix)) return canonical;
    }
    return '';
}

function parseDosageFromName(name, form) {
    const isLiquid = LIQUID_FORM_PARTS.some(f => (form || '').toLowerCase().includes(f));
    if (isLiquid) {
        const m = (name || '').match(/(\d+(?:[.,]\d+)?\s*(?:мг|г|мкг|%|од\.)(?:\s*\/\s*\S+)?)/i);
        return m ? m[0].replace(/\s+/, ' ') : '';
    }
    const m = (name || '').match(/(\d+(?:[.,]\d+)?\s*(?:мг|г|мл|мкг|%|од\.))/i);
    return m ? m[0].replace(/\s+/, ' ') : '';
}

// Extract package quantity from "№N" in the product name (e.g. "Парацетамол №20" → 20)
function extractQuantityFromName(name) {
    const m = (name || '').match(/№\s*(\d+)/);
    return m ? Number(m[1]) : null;
}

function normalizeProduct(p) {
    const producerRaw = p.producer ?? p.manufacturer ?? p.brand ?? '';
    const producer    = typeof producerRaw === 'string' ? producerRaw
                        : producerRaw?.name || producerRaw?.title || '';
    const name   = p.name || p.productName || p.title || '';
    const form   = p.form || p.formName || p.drugForm || p.release_form || parseFormFromName(name);
    const dosage = p.dosage || p.dose || p.strength || parseDosageFromName(name, form);
    const purpose = purposeFromCategories(p.categories) ||
                    p.categoryName || p.category || p.indication || '';
    return {
        id:                p.id ?? p.morionId ?? p.productId ?? null,
        name,
        picture:           normalizePicture(p.picture ?? p.image ?? p.photo ?? p.img ?? null),
        dosage,
        producer,
        form,
        unit:              mapFormToUnit(form),
        purpose,
        quantity:          extractQuantityFromName(name),
        apiDescriptionUrl: p.full_description || p.fullDescription || null,
    };
}

// ── Flatten categories tree into a sorted list of subcategory names ───────────
// Only include descendants of medical/vitamin top-level categories (skip cosmetics, baby gear, etc.)
const MEDICAL_ROOT_IDS = new Set([1]); // 1 = Медикаменти

function flattenMedicalCategories(topCats, out) {
    for (const top of (topCats || [])) {
        if (!MEDICAL_ROOT_IDS.has(top.id)) continue; // skip non-medical roots
        for (const sub of (top.subcategories || [])) {
            out.add(sub.name); // level-2 (e.g. "Препарати від застуди")
            for (const leaf of (sub.subcategories || [])) {
                out.add(leaf.name); // level-3 (e.g. "Препарати від кашлю")
            }
        }
    }
}

async function fetchCategoryNames() {
    const cached = getCached('anc:categories');
    if (cached) return cached;
    const data = await httpsGetJSON('https://anc.ua/productbrowser/v2/ua/categories');
    const out = new Set();
    flattenMedicalCategories(data?.categories || [], out);
    const names = [...out].sort((a, b) => a.localeCompare(b, 'uk'));
    setCached('anc:categories', names, 60 * 60 * 1000); // cache 1 hour
    return names;
}

// ── Level-2 categories only (broad groups) — used for filter chips ────────────
function extractLevel2Categories(topCats) {
    const result = [];
    for (const top of (topCats || [])) {
        if (!MEDICAL_ROOT_IDS.has(top.id)) continue;
        for (const sub of (top.subcategories || [])) {
            if (sub.id && sub.name) result.push({ id: sub.id, name: sub.name });
        }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}

async function fetchFilterCategories() {
    const cached = getCached('anc:filter-categories');
    if (cached) return cached;
    const data = await httpsGetJSON('https://anc.ua/productbrowser/v2/ua/categories');
    const cats = extractLevel2Categories(data?.categories || []);
    setCached('anc:filter-categories', cats, 60 * 60 * 1000); // cache 1 hour
    return cats;
}

// ── Cities to query in parallel (different regions = different stock = more unique results) ──
const SEARCH_CITIES          = [5, 1, 2, 7, 10, 14, 17, 22]; // for free-text search
const CATEGORY_SEARCH_CITIES = [5, 1, 2];                     // 3 cities is enough per term

// ── Curated category → search-term mapping ─────────────────────────────────
// Using specific medicine/brand names ensures ANC text search reliably finds
// relevant products (generic category words like "знеболюючі" often return 0).
const CATEGORY_SEARCHES = {
    cold:        ['терафлю', 'антигрипін', 'фервекс', 'риніколд'],
    cough:       ['амброксол', 'лазолван', 'мукалтин', 'бромгексин'],
    pain:        ['ібупрофен', 'кетопрофен', 'диклофенак', 'кетанов'],
    fever:       ['парацетамол', 'нурофен', 'аспірин', 'панадол'],
    allergy:     ['лоратадін', 'цетиризин', 'супрастин', 'еріус'],
    vitamins:    ['вітамін c', 'вітамін d3', 'мультивітамін', 'магній b6'],
    heart:       ['аспірин кардіо', 'корвалол', 'валідол', 'тріампур'],
    pressure:    ['еналаприл', 'лозартан', 'бісопролол', 'амлодипін'],
    stomach:     ['омепразол', 'маалокс', 'мотиліум', 'панкреатин'],
    diarrhea:    ['ентерос-гель', 'смекта', 'лоперамід', 'активоване вугілля'],
    antibiotics: ['амоксицилін', 'азитроміцин', 'цефтріаксон', 'офлоксацин'],
    sedative:    ['валеріана', 'персен', 'ново-пасит', 'гліцин'],
    nose:        ['ксилометазолін', 'аквамаріс', 'називін', 'отривін'],
    throat:      ['стрепсілс', 'фалімінт', 'нео-ангін', 'люголь'],
    eye:         ['візин', 'тауфон', 'систейн', 'офтагель'],
    antiseptic:  ['хлоргексидин', 'мірамістин', 'йод', 'перекис водню'],
    diabetes:    ['метформін', 'глюкофаж', 'тест-смужки глюкометр', 'ланцети'],
};

async function searchCity(q, city) {
    try {
        const { status, body } = await httpsPostJSON(
            'https://anc.ua/productbrowser/v3/ua/search/query',
            { city, query: q, includeCategory: true, pharmacyPrice: true, source: 'webApp' }
        );
        if (status !== 200) return [];
        return extractProducts(body);
    } catch {
        return [];
    }
}

// Deduplicate a flat array of raw ANC product objects by id/name
function deduplicateProducts(allItems, limit = 30) {
    const seen   = new Set();
    const merged = [];
    for (const item of allItems) {
        const key = item.id ?? item.name ?? item.productName ?? item.title;
        if (key && seen.has(String(key))) continue;
        if (key) seen.add(String(key));
        merged.push(item);
        if (merged.length >= limit) break;
    }
    return merged;
}

// ── GET /api/drug-search/search?q=...  OR  ?category=... ─────────────────────
router.get('/search', requireAuth, async (req, res) => {
    const q        = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();

    // ── Category browse mode ──────────────────────────────────────────────────
    if (category && CATEGORY_SEARCHES[category]) {
        const cacheKey = `anc:cat:${category}`;
        const cached   = getCached(cacheKey);
        if (cached) return res.json(cached);

        try {
            const terms = CATEGORY_SEARCHES[category];
            // All (term × city) combinations in one parallel batch
            const calls   = terms.flatMap(term =>
                CATEGORY_SEARCH_CITIES.map(city => searchCity(term, city))
            );
            const buckets = await Promise.all(calls);
            const merged  = deduplicateProducts(buckets.flat(), 30);
            const results = merged.map(normalizeProduct).filter(p => p.name.length > 0);

            if (results.length > 0) setCached(cacheKey, results, 10 * 60 * 1000); // 10 min
            return res.json(results);
        } catch (err) {
            console.error('ANC category search error:', err.message);
            return res.json([]);
        }
    }

    // ── Text search mode ──────────────────────────────────────────────────────
    if (q.length < 3) return res.json([]);

    const cacheKey = `anc:search:${q.toLowerCase()}`;
    const cached   = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
        // Query all cities in parallel; ANC hard-limits to 5 per city but different
        // cities return different products, so we aggregate for more unique results
        const buckets = await Promise.all(SEARCH_CITIES.map(city => searchCity(q, city)));
        const merged  = deduplicateProducts(buckets.flat(), 20);
        const results = merged.map(normalizeProduct).filter(p => p.name.length > 0);

        if (results.length > 0) setCached(cacheKey, results, 3 * 60 * 1000); // 3 min
        res.json(results);
    } catch (err) {
        console.error('ANC search error:', err.message);
        res.json([]);
    }
});

// ── GET /api/drug-search/categories ──────────────────────────────────────────
router.get('/categories', requireAuth, async (req, res) => {
    try {
        const names = await fetchCategoryNames();
        res.json(names);
    } catch (err) {
        console.error('ANC categories error:', err.message);
        res.json([]);
    }
});

// ── GET /api/drug-search/filter-categories ────────────────────────────────────
// Returns broad level-2 medical categories as [{id, name}] for filter chips UI
router.get('/filter-categories', requireAuth, async (req, res) => {
    try {
        const cats = await fetchFilterCategories();
        res.json(cats);
    } catch (err) {
        console.error('ANC filter-categories error:', err.message);
        res.json([]);
    }
});

module.exports = router;
