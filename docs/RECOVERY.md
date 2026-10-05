# Bike Closet Remixed recovery guide — October 2, 2026

Michael explicitly requested publication of this source guide on October 5, 2026. The guide itself does not authorize a future restoration, DNS change or new refresh schedule.

## Source and data

Source repository: `Iu1yota7h/bike-closet-remixed`. Keep credentials and private provider configuration outside this public repository. The isolated rebuild used main revision `0324afea54b52ba222c5bfdf2e4d26d6299dd404`, confirmed as the Cloudflare production revision during the October 2 review. Git contains code, catalog/research/status inputs and compact dated data history; generated browse data and sitemap can rebuild. No extra content repository is needed.

The checked catalog snapshot was collected October2,2026 at6:52AM Pacific:481products and1,980in-stock options. It is a historical snapshot, not a promise of stock availability at restore time. Restore and verify it before resuming refreshes.

## Local rebuild

1. Clone the chosen approved revision into a new directory. Use Node22.23.3, matching the production Node22 family. `npm ci` installs the locked dependencies.
2. Run `npm run check:catalog`, `node scripts/test-discovery.mjs` and `npx --no-install tsc --noEmit`.
3. Set the safe public configuration `SITE_URL=https://bcremixed.ispithotfire.com` and the approved public analytics token from current configuration. Run `npm run build`.
4. Output directory is `dist/client`. Run `node scripts/test-quality.mjs`; inspect catalog/review parity, the preferred homepage URL and one-URL sitemap, main heading, browse fallback, metadata, cache paths and payload budgets.
5. The October2 rebuild passed on Node22. Its earlier Windows Node24 attempt generated files then exited with a native handle-closing assertion; that result is a failure, not a successful build. Do not accept output from a nonzero exit or silently switch the production runtime.

## Hosting and refresh recovery

Cloudflare Pages production branch: main; build command: `npm run build`; output: `dist/client`. Reconcile the approved production revision and current provider integration before restoring domains/build variables. Domain/DNS/analytics configuration belongs in a separate safe provider recovery record. The static site has no required live contact or AI service backend in this checked configuration.

The existing daily catalog refresh is defined by `.github/workflows/refresh.yml`, using America/Los_Angeles at00:17. Preserve that existing authorization; do not add a second job. Validate the restored snapshot and workflow permissions before resuming it. A daily refresh success is not proof of site uptime, stock accuracy or complete independent recovery.

A successful local rebuild does not prove provider restoration. Reconcile hosting configuration before any separately authorized restore. The October 5 publication request supersedes the earlier instruction to wait for a code batch. Future restoration or hosting changes still require their own authorization.
