/*
 * Category Picker — Experience Workspace library plugin (proof of concept).
 *
 * A DA App SDK micro-frontend that lets an author pick a Blaine's catalog
 * category from a searchable list and inserts the category SLUG straight
 * into the current document cell (e.g. the "Category" row of the
 * product-recommendations-rules block) via actions.sendText().
 *
 * Why this exists: the built-in Placeholders picker inserts a {{token}}
 * that the block then has to resolve. This plugin inserts the real slug
 * directly (no token, no block-side resolution) AND can pull the list LIVE
 * from Commerce so it never drifts from the catalog.
 *
 * Data strategy (demo-safe): try live Catalog Service categories first;
 * if the index has none yet (current sandbox state), fall back to the same
 * known Blaine's categories used elsewhere, so the UI always shows content.
 *
 * This is a standalone tool file — it does not touch the working blocks or
 * placeholders. Registered as a library plugin via the DA site config.
 */

import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const COMMERCE_ENDPOINT = 'https://na1-sandbox.api.commerce.adobe.com/JNyhFUqfNDvt6PUvqesSdY/graphql';
const CS_HEADERS = {
  'Content-Type': 'application/json',
  Store: 'blaineseng',
  'Magento-Store-Code': 'blaines',
  'Magento-Store-View-Code': 'blaineseng',
  'Magento-Website-Code': 'blaines',
};

// Demo fallback — mirrors the Placeholders categories so the picker always
// has something to show even before the catalog is indexed to Live Search.
const FALLBACK_CATEGORIES = [
  { name: 'Power Tools', slug: 'power-tools' },
  { name: 'Lawn & Garden', slug: 'lawn-and-garden' },
  { name: 'Automotive', slug: 'automotive' },
  { name: 'Farm & Livestock', slug: 'farm-and-livestock' },
  { name: 'Pet Supplies', slug: 'pet-supplies' },
  { name: 'Sports & Outdoors', slug: 'sports-and-outdoors' },
  { name: 'Clothing & Footwear', slug: 'clothing-and-footwear' },
  { name: 'Home Basics', slug: 'home-basics' },
  { name: 'Food & Beverage', slug: 'food-and-beverage' },
  { name: 'Home Improvement', slug: 'home-improvement' },
  { name: 'Toys & Games', slug: 'toys-and-games' },
];

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Try to pull real categories from Commerce. Uses two sources:
 *  1) Catalog Service `categories` tree (when the category index is populated)
 *  2) productSearch category facet buckets (when products carry categories)
 * Returns [] on any failure so the caller can fall back.
 */
async function fetchLiveCategories() {
  const out = new Map();
  // Source 1: category tree
  try {
    const res = await fetch(COMMERCE_ENDPOINT, {
      method: 'POST',
      headers: CS_HEADERS,
      body: JSON.stringify({
        query: '{ categories(ids:["2"]) { name urlKey urlPath children } }',
      }),
    });
    const json = await res.json();
    (json?.data?.categories || []).forEach((c) => {
      const slug = c.urlPath || c.urlKey;
      if (c.name && slug) out.set(slug, { name: c.name, slug });
    });
  } catch (e) { /* ignore, fall through */ }

  // Source 2: category facet from productSearch (index-derived)
  try {
    const res = await fetch(COMMERCE_ENDPOINT, {
      method: 'POST',
      headers: CS_HEADERS,
      body: JSON.stringify({
        query: `query{ productSearch(phrase:"", page_size:1){ facets{ attribute buckets{
          title __typename ... on CategoryView { name path } } } } }`,
      }),
    });
    const json = await res.json();
    const facets = json?.data?.productSearch?.facets || [];
    const catFacet = facets.find((f) => /categor/i.test(f.attribute));
    (catFacet?.buckets || []).forEach((b) => {
      const name = b.name || b.title;
      if (name) {
        const slug = b.path ? String(b.path).split('/').pop() : slugify(name);
        out.set(slug, { name, slug });
      }
    });
  } catch (e) { /* ignore */ }

  return [...out.values()];
}

function render(container, categories, actions) {
  container.textContent = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'cp__search';
  search.placeholder = 'Search categories…';
  container.append(search);

  const list = document.createElement('ul');
  list.className = 'cp__list';
  container.append(list);

  const draw = (filter = '') => {
    list.textContent = '';
    const f = filter.trim().toLowerCase();
    categories
      .filter((c) => !f || c.name.toLowerCase().includes(f) || c.slug.includes(f))
      .forEach((c) => {
        const li = document.createElement('li');
        li.className = 'cp__item';

        const label = document.createElement('span');
        label.className = 'cp__label';
        label.textContent = c.name;

        const slug = document.createElement('code');
        slug.className = 'cp__slug';
        slug.textContent = c.slug;

        const insert = document.createElement('button');
        insert.className = 'cp__insert';
        insert.textContent = 'Insert';
        // Insert the SLUG (not a token) directly into the current cell.
        insert.addEventListener('click', () => {
          actions.sendText(c.slug);
          actions.closeLibrary();
        });

        li.append(label, slug, insert);
        list.append(li);
      });
    if (!list.children.length) {
      const empty = document.createElement('li');
      empty.className = 'cp__empty';
      empty.textContent = 'No matching categories.';
      list.append(empty);
    }
  };

  search.addEventListener('input', () => draw(search.value));
  draw();
  search.focus();
}

(async function init() {
  const app = document.getElementById('app');
  let actions;
  try {
    // The SDK resolves once DA has handshaked; gives context/token/actions.
    ({ actions } = await DA_SDK);
  } catch (e) {
    app.innerHTML = '<div class="cp__status">This tool must run inside the Experience Workspace library.</div>';
    return;
  }

  let categories = [];
  try {
    categories = await fetchLiveCategories();
  } catch (e) { /* ignore */ }

  const live = categories.length > 0;
  if (!live) categories = FALLBACK_CATEGORIES;

  // Sort alphabetically for a predictable list.
  categories.sort((a, b) => a.name.localeCompare(b.name));

  app.textContent = '';

  const banner = document.createElement('div');
  banner.className = `cp__source cp__source--${live ? 'live' : 'demo'}`;
  banner.textContent = live
    ? 'Live categories from Commerce Catalog Service'
    : 'Demo categories (Catalog Service index empty — showing known list)';
  app.append(banner);

  const controls = document.createElement('div');
  controls.className = 'cp__controls';
  app.append(controls);

  render(controls, categories, actions);
}());
