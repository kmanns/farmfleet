#!/usr/bin/env node
/**
 * sync-categories.js
 *
 * Regenerates the `categories` sheet in the repo-root `placeholders.json`
 * from the LIVE Adobe Commerce (SaaS) Catalog Service category tree, so
 * the da.live Sidekick > Library > Placeholders picker never drifts from
 * the real catalog. Categories change slowly - run this on a schedule
 * (nightly is plenty).
 *
 * It reads endpoint + store-view headers straight from the repo's
 * config.json so there's nothing to configure twice. It uses the SaaS
 * Catalog Service `categories(ids: [...])` query (CategoryView), where
 * `children` is an array of child category ID strings, and walks the tree
 * breadth-first from a root id.
 *
 * Usage:
 *   node tools/category-sync/sync-categories.js [--root <id>] [--depth <n>] [--dry-run]
 *
 * Notes:
 *  - On this sandbox the Catalog Service category index may be empty until
 *    the catalog is synced/indexed into the data services. When the query
 *    returns nothing, the script leaves the existing placeholders.json
 *    untouched and exits 0 with a warning, so a scheduled run never wipes
 *    a good sheet.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config.json');
const PLACEHOLDERS_PATH = path.join(ROOT, 'placeholders.json');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const DRY_RUN = process.argv.includes('--dry-run');
const ROOT_ID = arg('--root', '2'); // Commerce default catalog root is category id 2
const MAX_DEPTH = Number(arg('--depth', '2'));

function loadConfig() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const pub = cfg.public.default;
  const endpoint = pub['commerce-endpoint'] || pub['commerce-core-endpoint'];
  const csHeaders = (pub.headers && pub.headers.cs) || {};
  const allHeaders = (pub.headers && pub.headers.all) || {};
  return {
    endpoint,
    headers: {
      'Content-Type': 'application/json',
      ...allHeaders,
      ...csHeaders,
    },
  };
}

const CATEGORIES_QUERY = `query Categories($ids: [String!]!) {
  categories(ids: $ids) {
    id
    name
    urlKey
    urlPath
    level
    children
  }
}`;

async function queryCategories(endpoint, headers, ids) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: CATEGORIES_QUERY, variables: { ids } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data.categories || [];
}

function titleCase(urlKey, name) {
  if (name) return name;
  return urlKey
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function collectTree(endpoint, headers) {
  const collected = [];
  const seen = new Set();
  let frontier = [ROOT_ID];
  let depth = 0;

  while (frontier.length && depth <= MAX_DEPTH) {
    // eslint-disable-next-line no-await-in-loop
    const nodes = await queryCategories(endpoint, headers, frontier);
    const nextFrontier = [];
    nodes.forEach((node) => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      // Skip the invisible root (level 1 / id 2) itself.
      if (String(node.id) !== String(ROOT_ID)) {
        collected.push({
          Key: titleCase(node.urlKey, node.name),
          Value: node.urlPath || node.urlKey,
        });
      }
      (node.children || []).forEach((childId) => {
        if (!seen.has(String(childId))) nextFrontier.push(String(childId));
      });
    });
    frontier = nextFrontier;
    depth += 1;
  }

  // Stable alphabetical order for a predictable picker.
  collected.sort((a, b) => a.Key.localeCompare(b.Key));
  return collected;
}

function writeSheet(rows) {
  const doc = JSON.parse(fs.readFileSync(PLACEHOLDERS_PATH, 'utf8'));
  doc.categories = {
    total: rows.length,
    offset: 0,
    limit: rows.length,
    data: rows,
  };
  if (!doc[':names'].includes('categories')) doc[':names'].push('categories');
  fs.writeFileSync(PLACEHOLDERS_PATH, `${JSON.stringify(doc, null, 2)}\n`);
}

(async () => {
  try {
    const { endpoint, headers } = loadConfig();
    // eslint-disable-next-line no-console
    console.log(`[category-sync] querying ${endpoint} (root=${ROOT_ID}, depth=${MAX_DEPTH})`);
    const rows = await collectTree(endpoint, headers);

    if (!rows.length) {
      // eslint-disable-next-line no-console
      console.warn('[category-sync] Catalog Service returned no categories '
        + '(index likely not populated yet). Leaving placeholders.json unchanged.');
      process.exit(0);
    }

    if (DRY_RUN) {
      // eslint-disable-next-line no-console
      console.log(`[category-sync] --dry-run: ${rows.length} categories\n`
        + rows.map((r) => `  ${r.Value.padEnd(28)} ${r.Key}`).join('\n'));
      process.exit(0);
    }

    writeSheet(rows);
    // eslint-disable-next-line no-console
    console.log(`[category-sync] wrote ${rows.length} categories to placeholders.json`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[category-sync] failed:', e.message);
    process.exit(1);
  }
})();
