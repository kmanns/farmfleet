/**
 * Demo fallback catalog for the rule-based Product Recommendations block.
 *
 * The live Adobe Commerce sandbox behind this storefront (store view
 * `blaineseng`) has Catalog Service / Live Search reachable but not yet
 * indexed, so an anonymous `productSearch` currently returns 0 results.
 * This dataset lets the block render a convincing demo TODAY, using the
 * SAME category slugs that the live navigation exposes
 * (lawn-and-garden, automotive, farm-and-livestock, ...). The moment the
 * sandbox is indexed, `fetchRuleBasedProducts()` will prefer live results
 * and this data is never used.
 *
 * Shape mirrors the Catalog Service `ProductView` fields the block reads,
 * so downstream filter/sort/render logic is identical for mock and live.
 */
export const MOCK_PRODUCTS = [
  {
    sku: 'BLN-MWR-PUSH-21', name: '21 in. Gas Push Mower', urlKey: 'gas-push-mower-21in',
    categories: ['lawn-and-garden'], brand: 'Yard Machines', price: 289, rating: 4.3,
    created: '2025-03-11', bestsellerRank: 2, keywords: ['mower', 'push', 'gas'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_push-mower.png',
  },
  {
    sku: 'BLN-MWR-RIDE-42', name: '42 in. Riding Lawn Mower', urlKey: 'riding-lawn-mower-42in',
    categories: ['lawn-and-garden'], brand: 'Troy-Bilt', price: 1899, rating: 4.6,
    created: '2025-05-02', bestsellerRank: 1, keywords: ['mower', 'riding', 'tractor'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_riding-mower.png',
  },
  {
    sku: 'BLN-MWR-ZT-54', name: '54 in. Zero-Turn Mower', urlKey: 'zero-turn-mower-54in',
    categories: ['lawn-and-garden'], brand: 'Cub Cadet', price: 3499, rating: 4.8,
    created: '2025-06-20', bestsellerRank: 4, keywords: ['mower', 'zero-turn', 'commercial'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_zero-turn.png',
  },
  {
    sku: 'BLN-GRD-TILL-16', name: '16 in. Dual-Rotating Tiller', urlKey: 'dual-rotating-tiller',
    categories: ['lawn-and-garden'], brand: 'Troy-Bilt', price: 649, rating: 4.1,
    created: '2025-02-08', bestsellerRank: 9, keywords: ['tiller', 'garden'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_tiller.png',
  },
  {
    sku: 'BLN-GRD-TRIM-STR', name: 'String Trimmer, 2-Cycle', urlKey: 'string-trimmer-2cycle',
    categories: ['lawn-and-garden'], brand: 'Yard Machines', price: 129, rating: 3.9,
    created: '2025-01-15', bestsellerRank: 12, keywords: ['trimmer', 'string', 'training'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_trimmer.png',
  },
  {
    sku: 'BLN-AUT-OIL-5W30', name: 'Full Synthetic Motor Oil 5W-30, 5 qt', urlKey: 'motor-oil-5w30-5qt',
    categories: ['automotive'], brand: 'Blaine\u2019s Choice', price: 27, rating: 4.7,
    created: '2025-04-19', bestsellerRank: 3, keywords: ['oil', 'motor', 'synthetic'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_motor-oil.png',
  },
  {
    sku: 'BLN-AUT-BATT-H6', name: 'AGM Automotive Battery, Group H6', urlKey: 'agm-battery-h6',
    categories: ['automotive'], brand: 'DieHard', price: 219, rating: 4.5,
    created: '2025-03-30', bestsellerRank: 6, keywords: ['battery', 'agm'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_battery.png',
  },
  {
    sku: 'BLN-FRM-FEED-50', name: 'All-Stock Livestock Feed, 50 lb', urlKey: 'all-stock-feed-50lb',
    categories: ['farm-and-livestock'], brand: 'Purina', price: 24, rating: 4.9,
    created: '2025-06-01', bestsellerRank: 5, keywords: ['feed', 'livestock', 'grain'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_feed.png',
  },
  {
    sku: 'BLN-FRM-TROUGH-2', name: 'Galvanized Stock Tank, 2 ft', urlKey: 'galvanized-stock-tank-2ft',
    categories: ['farm-and-livestock'], brand: 'Tarter', price: 89, rating: 4.4,
    created: '2025-02-27', bestsellerRank: 11, keywords: ['tank', 'trough', 'water'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_stock-tank.png',
  },
  {
    sku: 'BLN-FRM-GLOVE-LX', name: 'Leather Work Gloves, Large', urlKey: 'leather-work-gloves-lg',
    categories: ['farm-and-livestock', 'clothing-and-footwear'], brand: 'Wells Lamont', price: 18, rating: 4.2,
    created: '2025-01-05', bestsellerRank: 8, keywords: ['gloves', 'leather', 'work'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_gloves.png',
  },
  {
    sku: 'BLN-PET-DOG-40', name: 'Complete Dry Dog Food, 40 lb', urlKey: 'complete-dry-dog-food-40lb',
    categories: ['pet-supplies'], brand: 'Blue Buffalo', price: 54, rating: 4.6,
    created: '2025-05-18', bestsellerRank: 7, keywords: ['dog', 'food', 'pet'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_dog-food.png',
  },
  {
    sku: 'BLN-SPT-COOL-52', name: '52 qt Hard Cooler', urlKey: 'hard-cooler-52qt',
    categories: ['sports-and-outdoors'], brand: 'Igloo', price: 79, rating: 4.3,
    created: '2025-04-02', bestsellerRank: 10, keywords: ['cooler', 'outdoor'],
    image: 'https://main--farmfleet--kmanns.aem.live/media_cooler.png',
  },
];
