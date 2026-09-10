# Bike Closet Remixed

An independent, image-free catalog of in-stock cycling products. Filter by category, normalized size and price; compare exact retailer details; expand sourced reviews. Not affiliated with Bike Closet.

## Run locally

Use Node.js 22 or newer:

```
npm ci
npm run dev -- --host 127.0.0.1
```

Open the localhost URL printed by the server. The included catalog is a dated snapshot, not live inventory. No API key is needed to browse, collect stock or refresh supported market offers.

## Update schedules

- Inventory: daily at **12 AM America/Los_Angeles**.
- Existing market offers: **Sunday at 12 AM America/Los_Angeles**, after that day's inventory collection.
- This follows PST/PDT. GitHub may delay scheduled jobs; last successful checks are shown separately.
- `Refresh catalog` can also be run manually, with an optional market refresh.
- GitHub may disable schedules after 60 days of repository inactivity. Successful checks normally create a status commit; monitor failed runs.

The collector reads the public WooCommerce Store API in batches of three requests, with timeouts and limited retries. It validates pagination totals, duplicates, currency, prices and unexpected catalog shrinkage before replacing data. A failed collection retains the previous catalog. Missing IDs are not inferred to be sold out. Product details and normalized CSV are published only when their content changes. Compact price/stock events live in `data/history.jsonl`; no copied descriptions or product images are archived.

Newest order follows the product feed's `orderby=date&order=desc`. The feed exposes no publication date; variants inherit their parent's rank. Unranked orphan variants sort after ranked parents. `firstSeen` means first observed by this project, not a retailer publication date.

## Research and cost controls

`public/research.json` stores reusable model-level summaries and dated source links. `public/market.json` stores exact-variant price evidence. The weekly script rechecks at most ten configured offers and writes at most five new model candidates to `data/research-queue.json`. New retailer adapters and editorial review require research; the script does not invent matches or summaries. The initial supported adapter is Outdoor Bros' public Shopify product feed. It checks model, variant and advertised condition before accepting prices. Failures disable the affected deal until a successful check.

Deals are sorted by percentage saved against an available checked offer, with dollar savings as the tiebreaker. Review ratings are displayed separately and do not add prestige points. Evidence older than seven days, failed checks, changed Bike Closet prices and nonmatching variants do not qualify. Prices are USD before tax/shipping; shipping varies and delivered totals are not estimated. No ZIP code is required. Only verified applicable shipping fees should be used in any future delivered-price comparison. Retailer reference prices remain separate from checked competitor offers. See RESEARCH.md for the original source audit; its experimental composite score is superseded by this savings comparison.

Personal preferences, bike records and private reports do not belong in this repository. AI research is optional and separately scheduled; no visitor triggers AI calls or paid APIs.

## Free static hosting

```
npm run build
```

Publish **dist/client** to Cloudflare Pages, with no Functions or Worker. It contains index.html and browser assets; never publish dist/server or environment files. Connect the GitHub repository using your own Cloudflare account. Set the build command to `npm run build`, output to `dist/client`, and use Node 22.

All repository changes currently trigger Cloudflare builds. Build caching is enabled; build watch exclusions have not been applied. The deployed site fetches the small status file from this repository; catalog/CSV/reviews remain static assets served by Cloudflare. Content-changing pushes rebuild the catalog. A free pages.dev address works without buying a domain.

Production is hosted at https://bcremixed.ispithotfire.com on Cloudflare Pages, project `bike-closet-remixed`, connected to this repository’s `main` branch. Build settings: `npm run build`, `dist/client`, Node 22, `SITE_URL=https://bcremixed.ispithotfire.com`. Cloudflare Web Analytics is enabled. WordPress manages DNS; the `bcremixed` CNAME points to `bike-closet-remixed.pages.dev`. The apex website and mail records remain managed separately.

### Speed and discovery process

Every preview/build runs `scripts/prepare-public.mjs`. It generates a smaller browsing payload containing only valid in-stock rows, a JavaScript-free `/catalog` page with every available product and sourced notes, and `/about` with the data methodology. These generated files are ignored by Git. The original catalog remains available for auditing. Re-run the preparation script after changing local data while a preview is already running.

Set `SITE_URL` to the final HTTPS origin (for example `https://bikes.example.com`, without paths) in the hosting build environment. This enables the homepage canonical and a sitemap containing only the homepage, catalog and methodology pages. Without it, no placeholder domain or sitemap is published. Filter URLs share the homepage canonical; filter combinations are excluded from the sitemap. Cloudflare Pages redirects `.html` links to its extensionless URLs. After launch, submit `/sitemap.xml` to Search Console. Readable HTML and linked JSON/CSV help discovery; they do not guarantee search rankings or AI citations.

Only hashed `/assets/*` files receive immutable browser caching. Changing catalog and research payloads revalidate. Search text is normalized once per catalog load, instead of per row on each keystroke. Keep stock, cleanup, evidence and date rules identical across the interactive and readable views; do not add invented review ratings or unverified product structured data.

## Contributing

Follow [CATALOG-CLEANUP.md](CATALOG-CLEANUP.md) for the shared cleanup rules and update process. Daily refreshes and code validation run `npm run check:catalog`; new listings automatically receive the same text, grouping and sizing rules as existing listings.

Submit focused pull requests with sources and observation dates. Keep sizes/colors, product generation, condition, packaging, currency and stock explicit. Do not infer compatibility from a similar model name. Add only derived facts and original summaries, not copied articles, screenshots, personal data or credentials. Tests use synthetic inputs and require no paid API calls.

```
node scripts/test-collector.mjs
node audit-deals.mjs
npx tsc --noEmit
npm run build
```

## Initial refresh audit

On September 9, 2026, the feed directly reported 585 products and 3,734 variants, versus 584 and 5,183 in the September 7 snapshot. The shrink guard stopped the first collection. After independently verifying the new header totals, a one-time `--accept-reviewed-shrink` run was used. The unattended workflow never sets that option. No missing IDs were labeled sold out.

Clothing filters distinguish explicit men's, women's and unisex labels; missing labels stay Unspecified. Riding styles can overlap. Only explicit road/gravel/mountain/trail cues are used, and color names such as Gravel Grey are excluded. Clothing fit and riding style are also exported in the CSV.

The Clothing fit picker offers All fits, Men's and Women's. Both gender selections include Unisex and Unspecified clothing without changing the original classification in rows or CSV. This is a browsing rule, not a claim about fit compatibility.

Combined alphabetic sizes (for example S/M, M/L and XL/2XL) appear under both individual size filters. Exact retailer sizes remain unchanged in rows and CSV. Numeric ranges and brand-specific sizing are not split. Older combined-size filter links normalize to the first individual size.
