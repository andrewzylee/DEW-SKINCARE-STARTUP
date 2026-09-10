// Strict Open Beauty Facts matcher for Dew.
// Correctness over coverage: a catalog product only gets a real OBF photo when there is exactly
// ONE OBF product for the same (normalized) brand whose core word-tokens match exactly and whose
// numbers are consistent, and whose front image is verified live. Everything else keeps its
// polished placeholder. Fragrance is skipped entirely (OBF barely covers scent). Every outcome is
// logged to obf-curation.md for later manual curation. Never touches products that already have an
// image (the gap set was computed as "no image" in the app).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const GAP = process.argv[2];
const OUT_MAP = process.argv[3];
const OUT_LOG = process.argv[4];
const UA = 'Dew/0.1 (skincare taste-graph prototype; contact azlee@axon.com)';

const gap = JSON.parse(readFileSync(GAP, 'utf8'));

// ---- normalization ----
const STOP = new Set(['the', 'of', 'and', 'for', 'with', 'a', 'an', 'to', 'in', 'de', 'la', 'le']);
const UNIT = new Set(['ml', 'oz', 'g', 'gr', 'kg', 'fl', 'floz', 'l', 'pcs', 'pc', 'x', 'pa', 'ct']);
const strip = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const brandKey = (s) => strip(s).replace(/ /g, '');
const tokens = (s) => strip(s).split(' ').filter(Boolean).filter((t) => !STOP.has(t) && !UNIT.has(t));
const coreWords = (toks) => new Set(toks.filter((t) => !/^\d+$/.test(t)));
const nums = (toks) => new Set(toks.filter((t) => /^\d+$/.test(t)));
const setEq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const subset = (a, b) => [...a].every((x) => b.has(x));

function curlJSON(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const out = execFileSync('curl', ['-s', '-m', '30', '-A', UA, url], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      return JSON.parse(out);
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  return null;
}

function imageLive(url) {
  try {
    const out = execFileSync(
      'curl',
      ['-s', '-o', '/dev/null', '-w', '%{http_code} %{content_type} %{size_download}', '-m', '25', '-A', UA, url],
      { encoding: 'utf8' },
    );
    const [code, ctype, size] = out.trim().split(/\s+/);
    return code === '200' && /image\//.test(ctype || '') && Number(size) > 1500;
  } catch {
    return false;
  }
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); // blocking delay

// ---- fetch OBF products for a brand (cached) ----
const brandCache = new Map();
function obfForBrand(brand) {
  if (brandCache.has(brand)) return brandCache.get(brand);
  const slug = brandKey(brand).replace(/([a-z])([0-9])/g, '$1$2'); // keep as-is
  const dashSlug = strip(brand).replace(/ /g, '-');
  let products = [];
  try {
    const v2 = curlJSON(
      `https://world.openbeautyfacts.org/api/v2/search?brands_tags=${encodeURIComponent(dashSlug)}&fields=code,product_name,product_name_en,brands,image_front_url&page_size=100`,
    );
    products = (v2 && v2.products) || [];
    if (products.length === 0) {
      const cgi = curlJSON(
        `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(brand)}&search_simple=1&action=process&json=1&page_size=100`,
      );
      products = (cgi && cgi.products) || [];
    }
  } catch (e) {
    brandCache.set(brand, { error: String(e.message || e), products: [] });
    return brandCache.get(brand);
  }
  const res = { error: null, products };
  brandCache.set(brand, res);
  return res;
}

// ---- match ----
const matched = []; // {id,brand,name,code,obfName,url}
const ambiguous = []; // {id,brand,name,candidates:[{code,obfName}]}
const noCandidate = []; // {id,brand,name}
const deadImage = []; // {id,brand,name,url}
const brandErrors = new Map();
const skippedFragrance = [];

const byBrand = new Map();
for (const p of gap) {
  if (p.domain === 'fragrance') {
    skippedFragrance.push(p);
    continue;
  }
  if (!byBrand.has(p.brand)) byBrand.set(p.brand, []);
  byBrand.get(p.brand).push(p);
}

const brands = [...byBrand.keys()];
let bi = 0;
for (const brand of brands) {
  bi += 1;
  process.stderr.write(`[${bi}/${brands.length}] ${brand} … `);
  const { error, products } = obfForBrand(brand);
  if (error) {
    brandErrors.set(brand, error);
    byBrand.get(brand).forEach((p) => noCandidate.push({ ...p, note: 'brand query failed' }));
    process.stderr.write('ERR\n');
    sleep(250);
    continue;
  }
  // pre-normalize OBF candidates for this brand
  const cands = products
    .map((op) => {
      const nm = op.product_name_en || op.product_name || '';
      const toks = tokens(nm);
      return {
        code: op.code,
        obfName: nm,
        brandOk: brandKey(op.brands || '').includes(brandKey(brand)) || brandKey(brand).includes(brandKey(op.brands || '')),
        core: coreWords(toks),
        nums: nums(toks),
        img: op.image_front_url || '',
      };
    })
    .filter((c) => c.obfName && c.img && c.brandOk);

  for (const p of byBrand.get(brand)) {
    const ptoks = tokens(p.name);
    const pcore = coreWords(ptoks);
    const pnums = nums(ptoks);
    if (pcore.size === 0) {
      noCandidate.push({ ...p, note: 'empty name tokens' });
      continue;
    }
    // exact: same core word set, and every number in catalog name present in OBF name
    const hits = cands.filter((c) => setEq(pcore, c.core) && subset(pnums, c.nums));
    if (hits.length === 1) {
      const c = hits[0];
      if (imageLive(c.img)) matched.push({ ...p, code: c.code, obfName: c.obfName, url: c.img });
      else deadImage.push({ ...p, url: c.img });
      sleep(150);
    } else if (hits.length > 1) {
      ambiguous.push({ ...p, candidates: hits.slice(0, 5).map((c) => ({ code: c.code, obfName: c.obfName })) });
    } else {
      noCandidate.push({ ...p });
    }
  }
  process.stderr.write(`ok (cands:${cands.length})\n`);
  sleep(250);
}

// ---- write map ----
const mapEntries = matched
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((m) => `  ${JSON.stringify(m.id)}: ${JSON.stringify(m.url)},`)
  .join('\n');
const mapFile = `// AUTO-GENERATED by scripts/obf-match — do not edit by hand.
// Real product photos sourced from Open Beauty Facts (https://openbeautyfacts.org), an open,
// crowd-sourced database (data under the Open Database License; images under their per-photo
// licenses). Only HIGH-CONFIDENCE exact brand + exact name matches with a verified-live image are
// included — everything uncertain kept its polished placeholder. See obf-curation.md for the full
// audit (matched / ambiguous / unmatched) and the OBF barcodes to verify against.
//
// This map is consulted ONLY as a last resort in lib/productImages.ts, so it never overrides a
// manually set \`image\` field or a bundled asset in src/assets/products.
export const OBF_IMAGES: Record<string, string> = {
${mapEntries}
};
`;
writeFileSync(OUT_MAP, mapFile);

// ---- write curation log ----
const fmt = (rows, cols) => rows.map((r) => '- ' + cols.map((c) => `${c}: ${r[c] ?? ''}`).join(' · ')).join('\n');
const log = `# Open Beauty Facts backfill — curation log

Generated ${new Date().toISOString()}.

**Policy:** correctness over coverage. A real photo is used only for an exact brand + exact
product-name match with exactly one OBF candidate and a verified-live front image. Fragrance is
skipped. Prestige / luxury / newer products with weak OBF coverage keep their placeholder.
**Never overwrite manually verified images** — \`OBF_IMAGES\` is last-resort only.

## Summary
- Gap products considered: ${gap.length}
- ✅ Matched (real photo applied): **${matched.length}**
- ⚠️ Ambiguous (multiple OBF candidates — kept placeholder): ${ambiguous.length}
- ❌ No confident candidate (kept placeholder): ${noCandidate.length}
- 🖼️ Matched name but image dead (kept placeholder): ${deadImage.length}
- 🌸 Fragrance skipped: ${skippedFragrance.length}
- Brand queries that errored: ${brandErrors.size}

## ✅ Matched — verify these against the OBF barcode
${matched.length ? fmt(matched.sort((a,b)=>a.brand.localeCompare(b.brand)), ['id', 'brand', 'name', 'obfName', 'code']) : '_none_'}

## ⚠️ Ambiguous — need manual pick (multiple OBF products share the name; likely different shades)
${ambiguous.length ? ambiguous.map((a) => `- ${a.id} · ${a.brand} · ${a.name}\n` + a.candidates.map((c) => `    - candidate: ${c.obfName} (barcode ${c.code})`).join('\n')).join('\n') : '_none_'}

## 🖼️ Matched name but image was dead
${deadImage.length ? fmt(deadImage, ['id', 'brand', 'name', 'url']) : '_none_'}

## ❌ No confident OBF match — curate manually (prestige/luxury/newer/K-beauty mostly)
${noCandidate.length ? fmt(noCandidate.sort((a,b)=>a.brand.localeCompare(b.brand)), ['id', 'brand', 'name']) : '_none_'}

## 🌸 Fragrance (intentionally skipped)
${skippedFragrance.length ? fmt(skippedFragrance.sort((a,b)=>a.brand.localeCompare(b.brand)), ['id', 'brand', 'name']) : '_none_'}

${brandErrors.size ? '## Brand query errors\n' + [...brandErrors].map(([b, e]) => `- ${b}: ${e}`).join('\n') : ''}
`;
writeFileSync(OUT_LOG, log);

console.log(
  `DONE matched=${matched.length} ambiguous=${ambiguous.length} noCand=${noCandidate.length} deadImg=${deadImage.length} fragranceSkipped=${skippedFragrance.length} brandErrors=${brandErrors.size}`,
);
