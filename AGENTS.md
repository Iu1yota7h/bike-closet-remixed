# Contributor instructions

This is a public catalog application. Never add private preferences, personal bike records, credentials, copied retailer HTML, images or review articles. Store normalized facts and original sourced summaries only.

Use public read-only product feeds; do not add API keys or paid AI calls to the updater. Never weaken completeness, identity-match or freshness checks to make a job pass. Keep each source and its observation date explicit.

Validate collector changes with synthetic fixtures, type-check the UI, and build the static export. Preserve in-stock-only filtering and exact retailer sizes. Inventory updates run daily at midnight America/Los_Angeles, following PST/PDT. The owner retired automated competitor-price research: price comparison is a visitor-initiated Google Shopping link, with no background searches or paid search API.

<!-- BEGIN CLOUDFLARE RELEASE BATCHING -->
## Cloudflare release batching

Owner decision, September 9, 2026: apply this process to all of the owner's Cloudflare sites, including Bike Closet Remixed, Speak to Win, ISpitHotFire when deployed there, and future Cloudflare sites.

- Batch related code, design and copy changes on a non-production branch, normally `codex/<short-description>`. Identify the configured production branch; do not assume every site uses main.
- Iterate locally and run the repository's required checks before pushing a coherent preview batch. Preview builds also consume build allowance; do not push each small edit merely to inspect it.
- Review the completed batch through local or branch previews, with appropriate mobile/desktop, accessibility and functional checks. Report checks that could not be verified. Preserve existing private-preview and content-publication boundaries.
- Publish the validated batch once, by merging/releasing to the production branch under the owner's applicable release authorization. Existing explicit authorization for that batch is sufficient; do not repeatedly ask. Approval of this batching process alone is not approval to publish unfinished content or unrelated work.
- Do not push intermediate edits directly to the production branch or manually trigger production deployments to review work. A local production build used for validation is fine; building locally is not publishing.
- Previously authorized scheduled stock/data refreshes may remain automatic after their validation passes. Do not bundle code changes into a data-only exception. Explicitly authorized urgent fixes may ship separately after focused checks.
- Keep documentation-only process edits for the next appropriate batch rather than triggering a production build solely to save the rule. Preserve unrelated working-tree changes. This instruction does not itself change branch protection, Cloudflare settings, DNS, credentials or deployment access.
<!-- END CLOUDFLARE RELEASE BATCHING -->
