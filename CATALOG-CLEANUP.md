# Catalog cleanup process

These rules apply to every update, including new products. Use deterministic shared code; routine cleanup does not need AI or paid APIs.

1. Validate the complete feed before saving it. Preserve IDs, URLs, price/stock history and observation dates. Missing listings are not evidence of a stock-out.
2. Decode numeric and supported named HTML entities in names, categories, size, color and variant text using `lib/catalog-text.ts`. Decode as plain text, never injected HTML. The collector, page and CSV use the same function, so older snapshots are readable too.
3. Use `lib/catalog-groups.ts` for product types and clothing classification. Only explicit evidence establishes gender or riding style; preserve unknowns. Men's and Women's browsing filters each include Unisex and Unspecified items.
4. Use `lib/catalog-sizes.ts` for filter sizes. Merge equivalent alphabetic labels and tire dimensions. Combined alphabetic sizes match each component (M/L matches M and L). Keep numeric ranges and distinct wheel standards separate; never guess a missing wheel diameter. Retain retailer-specific fit, length, size and color details in results and CSV, with readable punctuation.
5. Show and export only in-stock listings with public product links. Keep newest feed order as the default. Reference-price discounts remain distinct from sourced, current market savings; reviews do not add prestige points to savings.
6. Run `npm run check:catalog` before daily collection and on every code validation. A failed check blocks automated publication. Run the CSV export after collection so it receives the same rules. Type checking and the production build also run on code changes.

When adding a cleanup rule, change the shared module rather than patching individual snapshot rows. Add a representative regression case to the relevant test, update this document if behavior changes, regenerate the CSV, and run checks plus the build before pushing. Keep unsupported or ambiguous details intact until evidence supports a rule. No fresh feed fetch is needed to test formatting rules.

Inventory runs daily at midnight America/Los_Angeles; market offers run Sunday at midnight in the same time zone. This follows PST/PDT. Cleanup runs with the inventory update, with no additional schedule or paid service.

Explicit youth, junior, kids, children, boys and girls clothing belongs to Youth, taking precedence over gender labels. Youth has its own filter and is excluded from Men's and Women's results; All fits still includes it. Unknown clothing is not assumed to be youth.

Combined glove Color/Size fields supply a filter size only when they end in a recognized size. Keep the complete combined detail visible. Youth-prefixed sizes stay distinct. When structured sizes are missing, use explicit tire dimensions, helmet size labels, terminal alphabetic clothing sizes or terminal shoe sizes (30–50) from titles. Structured sizes take precedence. Do not turn model numbers into sizes or assume one-size fit. Mountain tire dimensions retain inches; 650B and 650C remain distinct. Rapha XLG maps to XL for filtering; ASSOS XLG remains brand-specific. WMNS is an explicit women's label.

Specific jacket and saddle-bag names override conflicting category tags. Model-specific classification references, checked September 9, 2026:
- [SILCA EOLO IV](https://silca.cc/collections/frame-pumps-mini-pumps/products/eolo-iv-co2-regulator-only) is a CO2 inflator, not a bag.
- [Garmin Edge 850](https://www.garmin.com/en-US/p/pn/010-03023-00/) is a cycling computer.
- [Rapha clothing sizes](https://www.rapha.cc/us/en/shop/mens-road-riding) use XL and XXL; mapping the retailer's XLG spelling to XL is our normalization convention, not a change to the original label.
