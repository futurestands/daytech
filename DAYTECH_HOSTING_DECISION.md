# DayTech hosting approval decision

## Recommendation

Retain Vercel for the first protected acceptance preview if the owner confirms that the account can use Pro for this purpose and separately approves activation. First look for the trial offer in the authenticated account. If it is unavailable, use an existing approved Pro team or obtain a paid-plan decision. Render Starter is the lowest-change paid fallback. Cloudflare Workers is a contingency for a planned compatibility evaluation.

## Vercel account and trial

The authenticated team API reports `futurestands-projects` on active Hobby, with no active trial dates. It did not return remaining trial eligibility. Vercel documents one trial per **user account**, selected in the Create Team flow. Neither a Hobby plan nor an empty current-trial field establishes that the user has an unused trial or that the existing team can be converted in place. The owner can inspect the available offer in the dashboard without completing activation. Do not move or duplicate the existing project.

The published trial lasts up to 14 days and includes US$20 of usage credit. Published trial allocations include 1 TB Fast Data Transfer, 10 million Edge Requests and up to 200 build execution hours. It can pause or end when trial limits are reached. A payment method is needed to continue on paid Pro. If added, billing starts at the end of the trial. Without a payment method the trial reverts to Hobby, where commercial use is restricted. End or unpublish the commercial preview before trial expiry if ongoing paid hosting is not separately approved. Verify all terms shown for the actual account before activation. [Trial terms](https://vercel.com/docs/plans/pro-plan/trials) · [Hobby terms](https://vercel.com/legal/terms)

Paid Pro lists US$20/month base, one deploying seat, and a US$20 monthly usage credit. Additional deploying seats cost US$20/month each. Metered usage after the included allocations and credit, and applicable taxes, can increase the bill. Vercel Authentication with Standard Protection is available without a separate protection fee. Verify the exact aliases and generated URLs are covered. Spend alerts alone do not cap charges, and a new card or plan is outside current approval. [Vercel Pro pricing](https://vercel.com/docs/plans/pro-plan#pro-plan-pricing) · [Spend management](https://vercel.com/docs/spend-management) · [Deployment protection](https://vercel.com/docs/deployment-protection)

## Deployment exclusion and CI

The project is linked to `futurestands/daytech`, with `main` as production. A Git-sourced Increment 5 preview was previously recorded. The GitHub deployment-event toggle is not a substitute for a Vercel build exclusion.

The local Increment 6 candidate prepares the following exact `vercel.json` fragment while preserving existing rewrites and headers:

```json
{
  "git": {
    "deploymentEnabled": {
      "codex/**": false,
      "ci/**": false,
      "dev": false,
      "develop": false,
      "dev/**": false
    }
  }
}
```

There is no wildcard allow rule that can override an exclusion. An exact candidate match, nested CI and development branches, and unmatched `main` were verified locally against the documented glob semantics. The branch policy exists in the candidate only. It does not retroactively alter other worktrees or deployed project settings. Vercel execution has not been tested because the policy awaits approval and no push was made. Before the first approved push, check the pushed commit contains the exclusion and that no independently configured deploy hook or integration can deploy that branch. Maintain the existing production branch and control plane. The prepared GitHub workflow also triggers verification on an Increment 6 push without a deployment step. Inspect GitHub Actions and Vercel activity after the approved push. [Vercel Git rules](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled)

## Environment audit and isolation

The live project metadata returned these six unscoped-by-branch definitions. Values were excluded from inspection output.

| Name | Current scope |
| --- | --- |
| `VITE_FEATURE_FIREBASE` | Preview and Production |
| `VITE_FEATURE_PAYMENTS` | Preview and Production |
| `VITE_FEATURE_GOOGLE_CALENDAR` | Preview and Production |
| `VITE_FEATURE_WHATSAPP` | Preview and Production |
| `DEFAULT_CURRENCY` | Preview and Production |
| `DEFAULT_TIMEZONE` | Preview and Production |

`QUOTATION_LINK_SECRET` is a separate Production-only definition. No cloud values or definitions were changed.

- **Production** Preserve the approved production definitions and credentials. A future separation should keep each present production value intact and remove its shared Preview target only with explicit change approval.
- **Preview** Use the reviewed `config/environments/preview.env.example` names for the single protected acceptance environment. Use an independently created Web app in `daytech-acceptance-preview` and its `(default)` database. Confirm the project owns the actual API key and Auth Web app. Configure preview-only service account `daytech-preview-runtime` in that project with limited data access. Independently generate growth and quotation secrets. Keep the optional integration flags explicitly false. Enter values directly into the protected provider settings.
- **Local** Use the separate local template and dedicated loopback Emulator harness with synthetic records. The explicit local server mode disables Cloud Firestore configuration. Keep cloud service credentials out of the shell used for local tests.

The build rejects a missing or wrong preview Web configuration and enabled optional integrations. Preview Firebase resolution does not fall back to the bundled production configuration. Preview Express and direct Firestore operations reject missing or mismatched credentials, incomplete environment, invalid key, unapproved services or a wrong origin with no privileged operations started. Validate Vercel exposes its system markers at both build and runtime, and set `DAYTECH_ENV=preview` explicitly in the acceptance environment. The project ID is pinned in code. A different ID requires review and an update before provisioning. See [preview acceptance](DAYTECH_PREVIEW_ACCEPTANCE.md) for domain, test and rollback steps.

## Contingencies

| Option | Base price, USD | Compatibility and protection |
| --- | ---: | --- |
| Vercel Pro | $20/month after any approved trial | Current deployment adapter and routing. Use Vercel Authentication across the preview URLs. Lowest migration effort. |
| Render Starter Web Service | $7/month per instance, before usage or workspace extras | Existing Express server can run on Node with its Vite build. Replace Vercel-specific proxy and routing assumptions. A private service is unreachable from external browsers. A public acceptance service needs authentication at the origin or an identity proxy combined with origin enforcement, including the direct `onrender.com` URL. Preview instances and paid workspace features may add costs. |
| Cloudflare Workers | Free within 100,000 requests/day and 10 ms CPU/invocation, or $5/month minimum on Workers Paid before usage | Workers supports some Node and Express patterns with compatibility flags. Verify Express entry-point adaptation, Google auth and Firestore REST, request identity, and disabled local storage/WebSocket features. Cloudflare Access can protect the entire Worker, including alternate routes and generated URLs. Access, domain and Workers limits are separate. Highest migration and acceptance effort. |

Commercial hosting is subject to each provider's service terms and usage limits. Avoid putting the candidate on Vercel Hobby for commercial acceptance. Confirm Render and Cloudflare contract terms and the actual protection plan before procurement. No migration, subscription or trial was started. [Render pricing](https://render.com/pricing) · [Render terms](https://render.com/terms) · [Render private services](https://render.com/docs/private-services) · [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [Cloudflare Access](https://www.cloudflare.com/products/access/)

## Owner decisions and open live checks

Approve the branch exclusion before the first push. Separately confirm the account’s trial offer or approve an eligible hosting plan before any activation or deployment. Live acceptance remains open for Google onboarding and roles, account and quotation ownership, acquisition and publishing, quotation sharing and project conversion, audit/export, deployed IAM and indexes, URL protection, proxy/routing behaviour, and live browser performance. Actual additional expenditure is UGX 0.
