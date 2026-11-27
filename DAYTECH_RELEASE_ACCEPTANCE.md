# DayTech release candidate acceptance

## Source and review

Baseline `1a9fb2b3eac08f05de5d7767ffe6a7a1960bca96` on `codex/daytech-increment-5` passed [GitHub Actions run 46005548446](https://github.com/futurestands/daytech/actions/runs/46005548446). Increment 6 is a local worktree on `codex/daytech-increment-6`. The candidate preserves [quotation PR #2](https://github.com/futurestands/daytech/pull/2), [integration PR #3](https://github.com/futurestands/daytech/pull/3), [design consolidation PR #4](https://github.com/futurestands/daytech/pull/4), and the two separate motion branches. The quotation persistence module matches the remote quotation branch. The candidate retains the trusted API routes, ownership checks, Firestore rules and acceptance coverage from the integrated release.

## Mobile lab findings

Playwright used Chrome DevTools Protocol with seven cold-cache runs per build for each transport, 390×844 viewport, 150 ms simulated latency, 1.6 Mbit/s download, and 4× CPU slowdown. The two localhost releases were served through the same Express harness. The gzip comparison added compressed delivery for each build. External traffic was blocked, including fonts. The only console error observed per run was a blocked resource. No exception, Firebase chunk on the homepage or horizontal overflow was recorded.

| Metric | Increment 4, identity | Increment 5, identity | Increment 4, gzip | Increment 5, gzip |
| --- | ---: | ---: | ---: | ---: |
| Median LCP | 5.46 s | 4.93 s | 4.17 s | 3.76 s |
| Median observed blocking | 521 ms | 365 ms | 612 ms | 733 ms |
| Initial JS transfer | 408,775 B | 409,923 B | 124,666 B | 124,987 B |
| Median CLS | 0 | 0 | 0 | 0 |
| Local requests | 7 | 6 | 7 | 6 |

The LCP element was the WebP hero image in every baseline run and the headline in every candidate run. The baseline image painted a median 1.56 s after its reported load under identity transport. Identity-transport candidate medians for layout and script time were about 1.30 s and 577 ms, down from 1.47 s and 712 ms. The illustration is ordinary React and CSS with small inline icon SVGs. The measurements do not isolate its rendering cost, and they did not reproduce the earlier LCP regression. The higher gzip blocking median and variation across runs warrant retesting on a real mid-range phone. The homepage performs post-mount requests for config and release status. The traces do not attribute the long tasks to a specific React component.

Leave the interface intact. The candidate main entry remains 400.53 kB minified. Verify actual Brotli or gzip, hashed asset cache headers, origin latency, and remote font impact in the approved preview. The current render-blocking Google Fonts stylesheet was blocked during these runs, so the figures cannot quantify its impact or establish a live 2.5 s LCP.

## Retention and compliance

The local dry run reported seven synthetic records and zero writes. It separated aged leads, aged partner applications, quota expiry, eligible tagged metadata, legal holds, opt-out suppression and unclassified audit metadata. Its versioned digest is audit evidence for a bounded scan. A future apply operation needs separate approval, hold checks and per-record update-time preconditions. See [retention operations](DAYTECH_RETENTION_PROCEDURE.md).

Published runtime notices now include the outstanding pinned data-uri-to-buffer MIT text and the three Google Fonts OFL notices. The browser build graph distinguishes emitted runtime modules from Lightning CSS and caniuse-lite tooling. See [the third-party inventory](THIRD_PARTY_INVENTORY.md) for upstream evidence, licensing limitations, and the photo exclusions. Verify the actual cloud function bundle and asset rights before commercial distribution.

## Release sequence

1. Approve and run the [controlled preview plan](DAYTECH_PREVIEW_ACCEPTANCE.md). Record the real protected origin, exact project targets, budgets and reviewer access. Complete the live acceptance matrix using synthetic accounts and records.
2. Review the preview evidence, dependency audit, retention status, commercial notices, and all production feature flags. Verify the production account, IAM, Firebase rules and indexes, and deployment-trigger policy independently.
3. Review the already-incorporated quotation work in PR #2. Review the integration in PR #3, then PR #4 and the Increment 6 delta in stack order. A later approved merge must avoid replaying the quotation changes. Keep PR #2 open until its reconciliation is explicitly signed off.
4. Obtain separate owner approval for production rollout, the exact deployment commit and targets, spend limits, rollback operator and the monitored launch window.

Live acceptance, the actual Vercel Git settings, policy activation and production approval are pending. No remote resource or deployment was created for Increment 6.
