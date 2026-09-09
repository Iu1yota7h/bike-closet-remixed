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
