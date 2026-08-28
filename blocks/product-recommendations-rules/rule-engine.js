/**
 * Pure, side-effect-free rule engine for the rule-based Product
 * Recommendations block. Kept separate from DOM/query code so the
 * filter/sort logic is identical whether products come from live
 * Catalog Service / Live Search or the demo fallback dataset, and so it
 * can be unit-tested in isolation.
 */

/**
 * Parse a comma/semicolon/newline separated author string into a clean,
 * lowercased token list.
 * @param {string} raw
 * @returns {string[]}
 */
export function parseList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Coerce a possibly-empty author price string to a finite number or null.
 * @param {string|number} raw
 * @returns {number|null}
 */
export function parsePrice(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Apply the author's rule "recipe" to a product list.
 * @param {Array<Object>} products normalized ProductView-like objects
 * @param {Object} rules
 * @param {string[]} [rules.categories]
 * @param {string[]} [rules.brands]
 * @param {number|null} [rules.priceMin]
 * @param {number|null} [rules.priceMax]
 * @param {string[]} [rules.excludeKeywords]
 * @returns {Array<Object>}
 */
export function applyRules(products, rules = {}) {
  const {
    categories = [], brands = [], priceMin = null, priceMax = null, excludeKeywords = [],
  } = rules;

  return products.filter((p) => {
    if (categories.length) {
      const pCats = (p.categories || []).map((c) => String(c).toLowerCase());
      if (!categories.some((c) => pCats.includes(c))) return false;
    }
    if (brands.length) {
      const pBrand = String(p.brand || '').toLowerCase();
      if (!brands.includes(pBrand)) return false;
    }
    if (priceMin !== null && !(p.price >= priceMin)) return false;
    if (priceMax !== null && !(p.price <= priceMax)) return false;
    if (excludeKeywords.length) {
      const haystack = [
        p.name, p.brand, ...(p.keywords || []), ...(p.categories || []),
      ].join(' ').toLowerCase();
      if (excludeKeywords.some((kw) => haystack.includes(kw))) return false;
    }
    return true;
  });
}

const SORTERS = {
  bestseller: (a, b) => (a.bestsellerRank ?? 1e9) - (b.bestsellerRank ?? 1e9),
  newest: (a, b) => new Date(b.created || 0) - new Date(a.created || 0),
  'top-rated': (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  'price-asc': (a, b) => (a.price ?? 0) - (b.price ?? 0),
  'price-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
  random: () => Math.random() - 0.5,
};

/**
 * Sort a product list per the author's chosen model. `recommended` is a
 * hand-off signal handled upstream (Sensei), not sorted here; if it ever
 * reaches this function we leave order untouched.
 * @param {Array<Object>} products
 * @param {string} sort
 * @returns {Array<Object>}
 */
export function applySort(products, sort) {
  const sorter = SORTERS[sort];
  if (!sorter) return products;
  return [...products].sort(sorter);
}

/**
 * Full pipeline: filter then sort then cap to itemCount.
 * @param {Array<Object>} products
 * @param {Object} rules
 * @returns {Array<Object>}
 */
export function evaluateRecipe(products, rules) {
  const filtered = applyRules(products, rules);
  const sorted = applySort(filtered, rules.sort);
  const count = Number(rules.itemCount) > 0 ? Number(rules.itemCount) : 4;
  return sorted.slice(0, count);
}
