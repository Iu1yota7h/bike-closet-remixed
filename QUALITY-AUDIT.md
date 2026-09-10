# Website quality audit

Audit date: September 9, 2026 Pacific. Production baseline: 7cda896. Scope: public site, static build, data pipeline, browser UI and hosted configuration. This is a measured engineering audit, not a Lighthouse certification.

## Overall assessment

Suitable for a small, low-cost public catalog. Fixes in this audit improve download sizes, caching, accessibility and ongoing regression checks. Search indexing, real-user performance, analytics ingestion and cross-engine device coverage remain separate verification gaps; they are not marked passed.

| Area | Result and evidence |
| --- | --- |
| Availability / HTTPS | pages.dev returns 200. Public Google DNS returns the intended bcremixed CNAME to Pages. Custom domain returns 200 with certificate validation when connecting to that public address. This computer's normal resolver instead reached a WordPress certificate; likely stale local DNS. No DNS or certificate settings changed. |
| SEO / metadata | Title, description, English language, Open Graph/Twitter metadata and canonical present. Canonical points to the custom domain, including filtered views. Added one H1 using the existing brand text and an explicit favicon. No unnecessary product-rating schema or fabricated offers. Social preview image intentionally absent from this image-free site. |
| Sitemaps / robots | Public robots allows crawling and points to sitemap.xml. Sitemap has home, /catalog and /about; filtered combinations are excluded. Readable catalog includes all 500 in-stock parent products. Missing URL returns 404. Prior Google/Bing submissions are recorded in task history; current Search Console/Bing indexing and processing were not independently rechecked. |
| LLM discovery | Complete readable HTML catalog, source links, CSV and JSON are available without executing the filter app. Added a small llms.txt navigation guide, generated from the site origin. This is a convenience file, not a guarantee that any model will read or cite the site. robots currently permits both search and training crawlers; no new exclusion policy was added. |
| Speed / caching | Brotli observed on live responses. Found an ineffective /assets/* immutable rule: actual assets are under /_next/static/*. Corrected it. Mutable data continues to revalidate. Removed the separate GitHub status request so data and check date come from the same deployment. |
| Payload sizes | Review data and CSS materially reduced; see table below. No product images, web fonts, runtime AI calls or backend database. Total generated JavaScript gzip is about 195 KB; a remaining framework cost, not evidence that all chunks load immediately. |
| Accessibility | Fixed secondary text contrast, added keyboard skip link and one H1, retained explicit filter names and visible focus. Keyboard skip moves focus to results; sort menu opens with keyboard and closes with Escape. Empty results recover with Clear filters. Not a full WCAG/screen-reader certification. |
| Resolution behavior | Checked widths 320, 375, 390, 768, 820, 900, 901, 1024, 1440, 1920 and 720 CSS pixels. No page-wide overflow. Cards through 900px; table above that, with contained horizontal scrolling when needed. 720px is equivalent reflow width for a 1440px window at 200% zoom, not an actual browser-zoom measurement. |
| Browser coverage | Passed the available Chromium-based in-app browser checks: rendering, filters, sort menu, keyboard navigation and recovery. No browser console errors in the checked preview. Physical iPhone/iPad Safari, Firefox and Android Chrome were not available; do not claim those tested. |
| Analytics | Cloudflare Pages Web Analytics configured, with the beacon present in served HTML. Dashboard ingestion, visitor totals and real-user Web Vitals were not verified. This is basic traffic/performance analytics, not click/conversion tracking. No second analytics service added. |
| Security | npm audit reported zero known vulnerabilities across production and development dependency trees on audit date. Static-only export, escaped retailer text and validated retailer links remain. Added anti-framing, object/base restrictions, MIME-sniff protection and disabled unused camera/microphone/geolocation permissions. CSP is deliberately a baseline; it is not a strict script policy. |
| Data reliability | Existing collector tests pass for pagination, duplicate IDs, currency/prices, incomplete feeds and shrink detection. Failures preserve the previous snapshot. Stock-only filtering, exact sizes, and review source/date records preserved. |
| Updates | Daily midnight America/Los_Angeles schedule is configured. Most recent inspected refresh was a successful manual run. An actual unattended midnight cycle has not yet been verified in this audit. GitHub schedules may be delayed or disabled after inactivity. |
| Maintenance | Existing TypeScript, catalog, discovery and hosted-build checks retained. Added offline file-size and output-integrity checks to CI. No paid tools, new dependency, worker, database or monitoring service added. |

## File-size measurements

Bytes below use decimal KB. Raw sizes are file bytes; gzip is an offline comparison, not the exact Brotli transfer size each visitor will receive.

| File | Before raw | After raw | Before gzip | After gzip |
| --- | ---: | ---: | ---: | ---: |
| Browser review data | 580.9 KB | 66.8 KB | 54.3 KB | 12.4 KB |
| Main CSS | 189.8 KB | 39.8 KB | 29.2 KB | 8.3 KB |
| In-stock catalog JSON | 963.2 KB | 963.2 KB | 74.2 KB | 74.2 KB |

The browser now downloads only the 127 published reviews and displayed fields. The full saved research remains available for source history and reuse. CSS now scans only the app and used UI components instead of the entire scaffold. Review download falls 88.5% raw / 77.2% gzip; CSS falls 79.0% raw / 71.5% gzip.

New gzip budgets: catalog 150 KB, reviews 25 KB, all CSS 15 KB, all generated JavaScript 300 KB. These leave room for reasonable growth while catching large regressions. All current budgets pass.

## Performance measurements not available

No valid LCP, INP, CLS, TBT, Speed Index or Lighthouse score was collected. Chrome DevTools tracing is not connected; the browser's read-only inspection surface does not expose Performance APIs. A single unauthenticated PageSpeed API request returned HTTP 429 / quota unavailable. No API key, quota purchase or paid fallback was used. Request latency alone is not a page-performance score.

Use Cloudflare's real-user metrics once enough traffic is present, plus a mobile Lighthouse/PageSpeed run when the free service is available. Current good Core Web Vitals thresholds are LCP <=2.5s, INP <=200ms and CLS <=0.1, assessed at the 75th percentile; these are targets, not measured results for this site. [Web Vitals reference](https://web.dev/articles/vitals)

## Long-term cost and upkeep

Expected incremental hosting cost remains $0/month for this static design under current free-plan terms. Static Pages requests are free and unlimited; the free plan allows 500 builds/month. One daily build is roughly 30–31/month, plus development pushes and builds for other projects. We did not inspect the account's total monthly usage or invoices. Domain renewal and optional agent/review work remain separate. [Cloudflare static pricing](https://developers.cloudflare.com/pages/functions/pricing/) · [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

The repository is public and uses standard GitHub Ubuntu runners, whose execution is free for public repositories. Existing cache/artifact allowances still apply; no larger runners were added. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

Main upkeep risks are retailer feed changes, the beta vinext build chain, Git history growth and unattended refresh failures. The local Windows Node 24 build generates the export but exits with a libuv shutdown assertion; the supported hosted Node 22 build is the release gate. Do not hide that exit error. Use Node 22 locally where possible; a framework migration is not justified by this audit alone.

Suggested human upkeep (estimate, not a service commitment): 15–30 minutes monthly to inspect refresh failures, dependency advisories, free build usage and analytics; quarterly review history growth and spot-check source links. Feed or toolchain breakage can take longer. No new recurring automation was created.

## Remaining checks

1. Confirm the first unattended midnight refresh succeeds and reaches Cloudflare.
2. Confirm Search Console and Bing see the custom-domain sitemap and indexed pages.
3. Verify analytics reports actual visits, then assess real-user performance when sample size permits.
4. Run a real mobile Lighthouse audit and spot-check Safari, Firefox and Android; test actual 200% zoom and a screen reader.
5. Recheck normal custom-domain resolution after the local DNS cache expires. Public DNS plus direct validated HTTPS already work.

## Reproduction and references

Run `npx tsc --noEmit`, `npm run check:catalog`, `node scripts/test-discovery.mjs`, `npm run build`, then `node scripts/test-quality.mjs`. Build tests need no retailer calls or paid API. Verify live headers after deployment because local tests cannot prove CDN configuration was applied.

- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Cloudflare Web Analytics](https://developers.cloudflare.com/pages/how-to/web-analytics/)
- [OpenAI crawler controls](https://developers.openai.com/api/docs/bots)
- [Tailwind source scanning](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
