import { readBlockConfig, createOptimizedPicture } from '../../scripts/aem.js';
import { getProductLink } from '../../scripts/commerce.js';
import { performCatalogServiceQuery } from '../product-teaser/product-teaser-utils.js';
import {
  parseList, parsePrice, evaluateRecipe,
} from './rule-engine.js';
import { MOCK_PRODUCTS } from './mock-data.js';

const CURRENCY_FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * Live Search query. `productSearch` is the correct production data path
 * for a rule-based recommendation rail. We fetch a generous page and let
 * the client-side rule engine do category/brand/price/exclude/sort so the
 * SAME logic runs against mock and live data. When the sandbox's Live
 * Search index is empty (current sandbox state) this returns 0 items and
 * the block falls back to the bundled demo dataset.
 */
const PRODUCT_SEARCH_QUERY = `query RuleBasedRecs($phrase: String!, $pageSize: Int!, $filter: [SearchClauseInput!]) {
  productSearch(phrase: $phrase, page_size: $pageSize, filter: $filter) {
    total_count
    items {
      productView {
        sku
        name
        urlKey
        images(roles: ["thumbnail","small_image","image"]) { url label }
        ... on SimpleProductView {
          price { final { amount { value currency } } }
        }
        ... on ComplexProductView {
          priceRange { minimum { final { amount { value currency } } } }
        }
        attributes(roles: ["visible_in_compare_list"]) { name value }
      }
    }
  }
}`;

/**
 * Normalize a live Catalog Service ProductView into the flat shape the
 * rule engine and renderer expect (matching mock-data.js).
 */
function normalizeLive(pv) {
  const price = pv?.price?.final?.amount?.value
    ?? pv?.priceRange?.minimum?.final?.amount?.value
    ?? 0;
  const attrs = Object.fromEntries((pv?.attributes || []).map((a) => [a.name, a.value]));
  return {
    sku: pv.sku,
    name: pv.name,
    urlKey: pv.urlKey,
    price,
    brand: attrs.brand || '',
    categories: [],
    keywords: [],
    rating: Number(attrs.rating) || 0,
    created: attrs.created_at || '',
    bestsellerRank: undefined,
    image: pv?.images?.[0]?.url || '',
  };
}

/**
 * Fetch candidate products for rule-based mode. Prefers live Live Search;
 * falls back to the bundled demo dataset when live returns nothing (e.g.
 * unindexed sandbox) or errors. This is the single swap point the README
 * calls out: the filter/sort logic downstream never changes.
 * @param {Object} rules
 * @returns {Promise<Array<Object>>}
 */
export async function fetchRuleBasedProducts(rules) {
  const phrase = (rules.categories[0] || rules.brands[0] || '').replace(/-/g, ' ');
  try {
    const data = await performCatalogServiceQuery(PRODUCT_SEARCH_QUERY, {
      phrase,
      pageSize: 40,
      filter: [],
    });
    const items = data?.productSearch?.items || [];
    if (items.length) {
      return items.map((i) => normalizeLive(i.productView));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[product-recommendations-rules] live query failed, using demo data', e);
  }
  return MOCK_PRODUCTS;
}

/**
 * Read the author's recipe from the block DOM. Tolerant of BOTH authoring
 * surfaces:
 *  - da.live key/value table -> readBlockConfig() gives camelCased keys.
 *  - Universal Editor -> same keys arrive via component-models.json;
 *    readBlockConfig() reads the generated rows identically.
 * @param {HTMLElement} block
 */
function readRecipe(block) {
  // readBlockConfig() keys are toClassName()'d: lowercased and dash-cased
  // ("Price Max" -> "price-max", "Rec ID" -> "rec-id"). We also accept a
  // couple of spelling variants so both da.live labels and any hand-built
  // tables resolve. This dual-read is what keeps the block working
  // identically across da.live tables and Universal Editor markup.
  const cfg = readBlockConfig(block);
  const pick = (...keys) => {
    const key = keys.find((k) => cfg[k] !== undefined && cfg[k] !== '');
    return key ? cfg[key] : '';
  };
  return {
    title: pick('title'),
    categories: parseList(pick('category', 'categories')),
    brands: parseList(pick('brand', 'brands')),
    priceMin: parsePrice(pick('price-min', 'pricemin')),
    priceMax: parsePrice(pick('price-max', 'pricemax')),
    excludeKeywords: parseList(pick('exclude-keywords', 'excludekeywords')),
    sort: (pick('sort') || 'bestseller').trim().toLowerCase(),
    layout: (pick('layout') || 'carousel').trim().toLowerCase(),
    itemCount: Number(pick('item-count', 'itemcount')) || 4,
    // Sensei hand-off fields
    recId: pick('rec-id', 'recid'),
    currentSku: pick('current-sku', 'currentsku'),
    currentPrice: pick('current-price', 'currentprice'),
  };
}

function productCard(p, layout) {
  const href = getProductLink(p.urlKey, p.sku);
  const card = document.createElement('a');
  card.className = 'prr-card';
  card.href = href;

  const media = document.createElement('div');
  media.className = 'prr-card__media';
  if (p.image) {
    const picture = createOptimizedPicture(p.image, p.name, false, [{ width: '400' }]);
    // Demo dataset points at illustrative asset URLs that may not exist on
    // the sandbox; degrade cleanly to the styled placeholder instead of a
    // broken-image glyph. Real (indexed) Catalog Service images just load.
    const img = picture.querySelector('img');
    if (img) {
      img.addEventListener('error', () => {
        media.classList.add('prr-card__media--placeholder');
        picture.remove();
      }, { once: true });
    }
    media.append(picture);
  } else {
    media.classList.add('prr-card__media--placeholder');
  }

  const body = document.createElement('div');
  body.className = 'prr-card__body';
  const name = document.createElement('span');
  name.className = 'prr-card__name';
  name.textContent = p.name;
  const price = document.createElement('span');
  price.className = 'prr-card__price';
  price.textContent = p.price ? CURRENCY_FMT.format(p.price) : '';
  body.append(name, price);

  card.append(media, body);
  card.dataset.sku = p.sku;
  if (layout === 'hero') card.classList.add('prr-card--hero-eligible');
  return card;
}

function renderRail(block, recipe, products) {
  block.textContent = '';
  block.classList.add(`prr--${recipe.layout}`);

  if (recipe.title) {
    const h = document.createElement('h2');
    h.className = 'prr__title';
    h.textContent = recipe.title;
    block.append(h);
  }

  const list = document.createElement('div');
  list.className = 'prr__list';

  if (!products.length) {
    const empty = document.createElement('p');
    empty.className = 'prr__empty';
    empty.textContent = 'No products match this recommendation recipe.';
    list.append(empty);
  } else {
    products.forEach((p, i) => {
      const card = productCard(p, recipe.layout);
      if (recipe.layout === 'hero' && i === 0) card.classList.add('prr-card--hero');
      list.append(card);
    });
  }
  block.append(list);
}

/**
 * Sensei hand-off. When Sort = "recommended" (and a recId is present) we
 * defer entirely to the boilerplate's real Adobe Sensei drop-in block
 * (`blocks/product-recommendations`), rather than re-implementing it.
 * We rebuild that block's expected key/value rows and invoke its default
 * export against this same element.
 */
async function handOffToSensei(block, recipe) {
  const rows = [
    ['recid', recipe.recId],
    ['currentSku', recipe.currentSku],
    ['currentPrice', recipe.currentPrice],
  ];
  block.textContent = '';
  block.classList.add('product-recommendations');
  rows.forEach(([k, v]) => {
    const row = document.createElement('div');
    const kc = document.createElement('div');
    kc.textContent = k;
    const vc = document.createElement('div');
    vc.textContent = v ?? '';
    row.append(kc, vc);
    block.append(row);
  });
  try {
    const { default: senseiDecorate } = await import('../product-recommendations/product-recommendations.js');
    await senseiDecorate(block);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[product-recommendations-rules] Sensei hand-off failed', e);
    const msg = document.createElement('p');
    msg.className = 'prr__empty';
    msg.textContent = 'Recommended (Sensei) mode needs a valid Rec ID from Commerce Admin.';
    block.append(msg);
  }
}

export default async function decorate(block) {
  const recipe = readRecipe(block);

  if (recipe.sort === 'recommended') {
    if (recipe.recId) {
      await handOffToSensei(block, recipe);
      return;
    }
    // No recId: fall through to rule-based so the block still renders.
    // eslint-disable-next-line no-console
    console.warn('[product-recommendations-rules] Sort=recommended without a Rec ID; falling back to rule-based.');
  }

  const products = await fetchRuleBasedProducts(recipe);
  const result = evaluateRecipe(products, recipe);
  renderRail(block, recipe, result);
}
