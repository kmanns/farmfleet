# Product Recommendations (Rules) Block

## Overview

A rule-based product recommendation rail - an author-driven "recommendation
recipe" built from category / brand / price range / exclude keywords / sort,
evaluated per page. It is the direct analog of a DXP "recommendation recipe":
no merchandiser has to pre-build anything in Commerce Admin first.

It runs in two modes:

- **Rule-based (default)** - filters and sorts a live product feed
  client-side per the author's recipe.
- **Recommended (Sensei)** - set `Sort` to `Recommended (Sensei)` and provide
  a `Rec ID`; the block hands off entirely to the boilerplate's real
  `@dropins/storefront-recommendations` block (`blocks/product-recommendations`),
  powered by Adobe Sensei. Nothing is re-implemented - it reuses that block.

This is a distinct block from the boilerplate's Sensei `product-recommendations`
block; it does not replace it.

## Data source

`fetchRuleBasedProducts()` queries Adobe Commerce **Live Search**
(`productSearch`) via the repo's `performCatalogServiceQuery` helper. When
Live Search returns nothing (e.g. the sandbox catalog is not yet indexed) or
errors, the block falls back to a bundled demo dataset (`mock-data.js`) that
mirrors the real Blaine's category slugs, so the demo always renders. The
filter/sort logic downstream is identical for live and mock data - this is the
single swap point.

## Integration

### Block Configuration

Read via `readBlockConfig()`. da.live labels are `toClassName()`'d to the keys
below; Universal Editor uses `component-models.json` field names.

| Configuration Key | Type | Default | Description | Required |
|-------------------|------|---------|-------------|----------|
| `title` | string | `''` | Heading rendered above the rail | No |
| `category` | string | `''` | Category slug(s), comma-separated | No |
| `brand` | string | `''` | Brand name(s), comma-separated | No |
| `price-min` | number | none | Minimum price (inclusive) | No |
| `price-max` | number | none | Maximum price (inclusive) | No |
| `exclude-keywords` | string | `''` | Comma-separated; any match removes the product | No |
| `sort` | string | `bestseller` | `bestseller` \| `newest` \| `top-rated` \| `price-asc` \| `price-desc` \| `random` \| `recommended` | No |
| `layout` | string | `carousel` | `carousel` \| `grid` \| `list` \| `hero` | No |
| `item-count` | number | `4` | Max items rendered | No |
| `rec-id` | string | `''` | Sensei mode only - Recommendation unit ID from Commerce Admin | Only when `sort=recommended` |
| `current-sku` | string | `''` | Sensei mode only - context SKU | No |
| `current-price` | number | none | Sensei mode only - context price | No |

### Behavior Patterns

- **Sort = recommended with a Rec ID**: hands off to the Sensei block.
- **Sort = recommended without a Rec ID**: warns and falls back to rule-based
  so the block still renders (never blank).
- **Live query empty/failed**: falls back to bundled demo data.
- **Image 404**: card media degrades to a styled placeholder.

## Authoring in da.live

Author as a key/value table:

| Product Recommendations (Rules) | |
|---|---|
| Title | Shop Riding Mowers |
| Category | lawn-and-garden |
| Price Max | 2500 |
| Exclude Keywords | choke, training |
| Sort | bestseller |
| Layout | carousel |
| Item Count | 4 |

Populate `Category` from **Sidekick > Library > Placeholders** (the `Categories`
sheet registered in `library.json` / `placeholders.json`). Regenerate that sheet
from the live catalog with `tools/category-sync/sync-categories.js`.

For Sensei mode, add a `Sort` = `recommended` row and a `Rec ID` row (copy the ID
from Commerce Admin > Recommendations).

## Authoring in Universal Editor

Grouped under **Blaine's Demo Blocks** in the component picker. All fields are
exposed as a proper properties panel via `component-models.json`; the `Category`
field can be populated with the repo's Commerce picker (Sidekick "Commerce"
palette).

## Files

- `product-recommendations-rules.js` - decorator, config read, data fetch, render
- `rule-engine.js` - pure filter/sort/cap logic (unit-testable)
- `mock-data.js` - demo fallback dataset
- `product-recommendations-rules.css` - four layouts
- `_product-recommendations-rules.json` - da.live + Universal Editor model
