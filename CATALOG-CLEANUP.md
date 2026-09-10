# Catalog cleanup process

## One-time product research

The September 9, 2026 full-catalog pass is recorded in `data/research-coverage.json` and `data/research-audit.json`: 500 in-stock parent products, including eight preserved prior records. A completed pass does not mean every product has an independent review. Distinguish `review`, `specifications`, and `listing` (limited evidence), retain fit/compatibility unknowns, and display model/variant caveats. The With reviews view includes only sourced reviews, not inconclusive searches.

Record the query, candidate links, adopted sources and outcome without copying articles or retailer HTML. A source candidate is not an endorsement. Do not transfer reviews across tube/tubeless tires, saddle rails, helmet versions, shoe widths, men's/women's/youth cuts, pads or uncertain generations. Explicitly matched repeated model listings may reuse a record via `reusedFromProductId`; this is an editorial source reuse, not a merger of retailer IDs or inventory. Review opinions about historical value must not become current market-savings claims. Research dates must never be displayed as market-price check dates.

Conflicting retailer metadata needs a visible note, not silent reconciliation: for example, product 1632843 has a DUB title but Shimano description, and 1722447 has a 60 mm valve title but a 42 mm weight example. Keep both unknowns out of compatibility or value guarantees.

Review research, product quality/tier context, size charts and fit guidance are researched once per parent product ID and reused across every size and color. Include sizing in the initial research pass; retain the source, date and any size-specific caveats. Do not commission separate research when a size/color is added, restocked, discounted or selected by a visitor. Ordinary feed size parsing continues on every inventory update.

A documented review/fit search with no reliable evidence counts as completed review/fit research only. It does not establish completed market-price research. Preserve unknowns; missing evidence is not a reason to repeat the search weekly. Existing research records are grandfathered as completed, without claiming that previously unrecorded sizing was verified. Store completion in public/research.json and retain the completed-product ledger in data/research-queue.json. The queue excludes products recorded in either source.

Revisit a completed product only on an explicit owner request or a documented material factual correction. A genuinely different model/generation may receive its own research; a suspected duplicate under a new retailer ID must be checked against existing records before researching. Do not merge distinct models by name alone.

Daily inventory and Bike Closet price refreshes continue. Competitor-price research and scheduled market searches were retired by owner decision on September 9, 2026.

## Structured attributes and human-readable views

- Use `lib/catalog-attributes.ts` for brand and listing facts in both the website and CSV. Recognize brands only from the maintained prefix dictionary, with explicit aliases such as i9 → Industry Nine; unknown brands remain blank and filterable as Unspecified brand. Never guess a brand from the first word.
- Keep condition, packaging and sale terms separate. Extract Open box, OEM and Final sale only when explicitly stated in the title. Blank means unstated, not new, retail-packaged or returnable. These facts may coexist. Display explicit facts next to the product and allow filtering without changing the official title or market-match evidence.
- Preserve one row per retailer variant ID and the parent product ID. Do not merge similarly named models, generations, colors or variants. Product counts use parent IDs; option counts use variant IDs.
- CSV fields `brand`, `condition`, `packaging` and `saleTerms` are derived labels. `sizeFilterKeys` lists every applicable website size key, including both halves of combined sizes. Multi-value fields use ` | ` between values. Retain `officialSize`, `variant`, identifiers, prices and observation dates alongside the derived fields. Consumers should identify columns by header rather than position.
- Search normalizes apostrophes, accents, dashes and dimension multiplication symbols for matching only. Display names retain their spelling and punctuation. Include brand and normalized size labels in searchable text.
- Brand and listing filters persist in copied URLs and are cleared by Reset. Their selections also constrain the size choices. Existing clothing and stock rules still apply.
- Add regression cases when extending these rules. `npm run check:catalog` verifies them before scheduled updates and code publication; routine parsing requires no AI calls.

These rules apply to every update, including new products. Use deterministic shared code; routine cleanup does not need AI or paid APIs.

1. Validate the complete feed before saving it. Preserve IDs, URLs, price/stock history and observation dates. Missing listings are not evidence of a stock-out.
2. Decode numeric and supported named HTML entities in names, categories, size, color and variant text using `lib/catalog-text.ts`. Decode as plain text, never injected HTML. The collector, page and CSV use the same function, so older snapshots are readable too.
3. Use `lib/catalog-groups.ts` for product types and clothing classification. Only explicit evidence establishes gender or riding style; preserve unknowns. Men's and Women's browsing filters each include Unisex and Unspecified items.
4. Use `lib/catalog-sizes.ts` for filter sizes. Merge equivalent alphabetic labels and tire dimensions. Combined alphabetic sizes match each component (M/L matches M and L). Keep numeric ranges and distinct wheel standards separate; never guess a missing wheel diameter. Retain retailer-specific fit, length, size and color details in results and CSV, with readable punctuation.
5. Show and export only in-stock listings with public product links. Keep newest feed order as the default. Reference-price discounts remain distinct from sourced, current market savings; reviews do not add prestige points to savings.
6. Run `npm run check:catalog` before daily collection and on every code validation. A failed check blocks automated publication. Run the CSV export after collection so it receives the same rules. Type checking and the production build also run on code changes.

When adding a cleanup rule, change the shared module rather than patching individual snapshot rows. Add a representative regression case to the relevant test, update this document if behavior changes, regenerate the CSV, and run checks plus the build before pushing. Keep unsupported or ambiguous details intact until evidence supports a rule. No fresh feed fetch is needed to test formatting rules.

Inventory runs daily at midnight America/Los_Angeles. This follows PST/PDT. Cleanup runs with the inventory update, with no additional schedule or paid service.

Explicit youth, junior, kids, children, boys and girls clothing belongs to Youth, taking precedence over gender labels. Youth has its own filter and is excluded from Men's and Women's results; All fits still includes it. Unknown clothing is not assumed to be youth.

Combined glove Color/Size fields supply a filter size only when they end in a recognized size. Keep the complete combined detail visible. Youth-prefixed sizes stay distinct. When structured sizes are missing, use explicit tire dimensions, helmet size labels, terminal alphabetic clothing sizes or terminal shoe sizes (30–50) from titles. Structured sizes take precedence. Do not turn model numbers into sizes or assume one-size fit. Mountain tire dimensions retain inches; 650B and 650C remain distinct. Rapha XLG maps to XL for filtering; ASSOS XLG remains brand-specific. WMNS is an explicit women's label.

Specific jacket and saddle-bag names override conflicting category tags. Model-specific classification references, checked September 9, 2026:
- [SILCA EOLO IV](https://silca.cc/collections/frame-pumps-mini-pumps/products/eolo-iv-co2-regulator-only) is a CO2 inflator, not a bag.
- [Garmin Edge 850](https://www.garmin.com/en-US/p/pn/010-03023-00/) is a cycling computer.
- [Rapha clothing sizes](https://www.rapha.cc/us/en/shop/mens-road-riding) use XL and XXL; mapping the retailer's XLG spelling to XL is our normalization convention, not a change to the original label.

## External price-search links

Owner decision, September 9, 2026: replace automated price searches and scoring with visitor-initiated Google Shopping links. Do not run scheduled competitor-price searches or add search APIs. Construct links locally using `lib/price-search.ts`, preserving model, exact retailer size and color. Only the visitor click initiates a search. Search results are not verified comparisons. Keep Bike Closet reference discounts clearly distinct from independently verified market savings. Retain saved product review/fit research without repeating it.

Product title presentation: remove a trailing clothing, helmet or cycling-shoe size only when it normalizes to the exact size shown in the size column. Keep original names for source data, CSV and price-search queries. Preserve conflicting sizes, model numbers, component dimensions and sale annotations. Apply the shared displayProductName rule to both the filter UI and static catalog; never delete the original size detail.
