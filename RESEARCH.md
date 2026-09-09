# Market research sample — September 7, 2026 (Pacific)

This is a manually researched sample of three models, not comprehensive market coverage. No weekly updater is running. Structured summaries and evidence are in `lib/research.ts` and `lib/deals.ts`. All amounts are USD item-only, before tax and shipping; delivered totals are unknown. These are retail offers, not completed-sale benchmarks or resale valuations.

## Kask Protone Icon, red / small

Bike Closet option 1743127, SKU 8057099242479: $139, regular/reference $300, stock true. Rechecked through the public WooCommerce Store API near 22:00 Pacific on September 7. Parent description advertises new-in-box goods. Outdoor Bros Shopify public product JSON confirmed variant 62655696175263, Small / Red, $179.99, available true; description says brand new in box. Model/color/size/condition match by listing, but barcode is absent at the competitor, and regional certification, manufacturing date, retailer authorization, and identical warranty treatment were not independently verified. Confidence: medium. No transaction or checkout performed.

- Bike Closet: https://bikecloset.com/product/kask-protone-icon/?attribute_size=S&attribute_color=Red
- Competitor: https://www.outdoorbros.com/products/kask-protone-icon-helmet?variant=62655696175263
- Read-only verification: https://www.outdoorbros.com/products/kask-protone-icon-helmet.js
- Excluded: https://www.craniologie.com/products/kask-protone-icon-red-s — its public .js data matched the barcode at $300 but available=false.
- Summit Bicycles also had a model listing around $300 but matching online availability was not established; excluded.
- Review: https://www.bikeradar.com/reviews/helmets/road-cycling-helmets/kask-protone-icon-helmet-review — March 16, 2024, 4.5/5. Model-level review, black/medium tested; no comparative safety verdict inferred.

Savings against checked available offer: $40.99, 22.7735%. Retailer-reference discount: 53.6667%. Do not call either a price drop; no second full historical snapshot exists. White M/L variants receive no score.

Draft editorial score: round(100 × [0.6 × min(1, market discount / 0.5) + 0.3 × review rating / maximum rating + 0.1 × editorial tier]). Kask tier is 0.8, representing a premium model below the flagship in the cited review, not a measured property or safety score. Result 62/100. Scores are experimental and not calibrated across categories. A single retailer comparison does not establish the entire market's lowest price. Both observed prices must be no more than seven days old, with an unchanged Bike Closet price.

## Assos EQUIPE R S11, Black Series S / XL

Bike Closet variants 1718677 / 1718678 rechecked at $210, stock true. Competitive Cyclist's rendered default Edge Green selection was $230. Black Series was offered as a selector, but exact black size availability and price were not established. No market score or claimed savings.

- https://www.competitivecyclist.com/assos-equipe-r-bib-shorts-s11-mens
- https://road.cc/content/review/assos-equipe-r-bib-shorts-s11-313323 — April 2025, 9/10; review applies to model, different color and size tested. Core racing range with simplified RS construction. Race-position fit caveat retained.

## LOOK KEO Classic 3 Plus OEM

Bike Closet 1773097 rechecked at $59.99, stock true. Manufacturer US page previously checked September 7 at $95; manufacturer reference is not a comparable OEM street price. Retail package/cleat equivalence remains unknown; no market score.

- https://www.lookcycle.com/us-en/products/pedals/road/comfort/keo-classic-3-plus
- https://www.cyclingnews.com/reviews/look-keo-classic-3-plus-pedals-review/
- https://road.cc/content/review/look-keo-classic-3-plus-287507 — 7/10, November 2021. Bearing-play findings refer to reviewers' samples, not a universal failure rate.

## Scope and verification

Pirelli OEM tire briefly investigated but not included: packaging and generation equivalence need more work. Full catalog timestamp remains unchanged; only selected product prices and stock were rechecked. No original screenshots, page copies, or private owner profile are included in the site. Build and TypeScript checks plus `audit-deals.mjs` verify eligible IDs, changed prices, stale evidence and unavailable competitors.
