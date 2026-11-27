# DayTech no-deploy CI verification

## Exclusion and provider evidence

The candidate `vercel.json` contains:

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

The rule preserves Vercel's unmatched-branch behaviour for `main`. The existing routing, static exclusions, headers and build settings remain intact. The local policy test verifies the exact Increment 6 branch, nested branches and the unaffected production branch. Vercel documents this setting for disabling automatic Git deployments. [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)

Authenticated Vercel CLI inspection confirmed the GitHub link to `futurestands/daytech`, production branch `main`, zero listed project deploy hooks, and no configured Ignored Build Step. The GitHub deployment-event and repository-dispatch flags are disabled. The project previously recorded a Git deployment of Increment 5, so those flags cannot establish that branch builds are disabled. The branch-filtered command `vercel list daytech --scope futurestands-projects --meta githubCommitRef=codex/daytech-increment-6` returned no deployments. The repository also has no remote Increment 6 branch. These facts establish that this candidate has not deployed. They cannot prove how Vercel would handle its first push. The checked-in GitHub workflow contains verification steps only. External callers with deployment credentials were not independently ruled out.

**Blocked at the provider gate.** The inspected project exposes no active independent branch deny. No documented non-deploying preflight was found that evaluates an unpublished commit on the linked project. Hold the first push until the owner or Vercel can confirm an enforceable provider-side denial. If Vercel requires a project-level setting, seek separate approval for a branch-only deny matching the five rules above, preserving the default for `main`. Do not substitute a repository disconnect or an all-deployments pause. A conditional Ignored Build Step can cancel builds, but Vercel can still register a canceled deployment. It is insufficient for the current no-initiation gate. [Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step) · [Deploy Hooks](https://vercel.com/docs/deploy-hooks)

## Verification workflow and cost

GitHub reports `futurestands/daytech` as public. Standard GitHub-hosted Linux runner usage is free for public repositories. The workflow uses `ubuntu-latest`, limits the job to 15 minutes, cancels superseded runs per source repository and branch, and stores no CI artifacts or caches. The SBOM and installed-manifest licence check run in the job and the output remains on the runner. To retain review evidence without hosted artifact storage, generate a local copy using `bun scripts/generate-sbom.ts <output>`. No workflow step deploys, accesses production credentials, or needs a paid runner. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

The workflow supports pull requests, Increment 6 pushes, existing main pushes and manual dispatch. GitHub requires the manual-dispatch workflow definition to be present on the default branch before dispatch is available. With the remote gate open, the proposed review is a draft PR from `codex/daytech-increment-6` into `codex/daytech-increment-5`. Confirm the exact GitHub run SHA and the absence of a matching Vercel deployment after any authorised push. [GitHub workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

## Environment separation

Project inspection identified `VITE_FEATURE_FIREBASE`, `VITE_FEATURE_PAYMENTS`, `VITE_FEATURE_GOOGLE_CALENDAR`, `VITE_FEATURE_WHATSAPP`, `DEFAULT_CURRENCY` and `DEFAULT_TIMEZONE` as shared between Preview and Production, with no specific branch scope. No values are recorded here.

| Environment | Expected configuration |
| --- | --- |
| Local development | Use `config/environments/local.env.example`. Explicit local mode disables Cloud Firestore configuration. |
| CI | The workflow sets local mode, disables Firebase on the browser build, and explicitly disables optional integrations. |
| Emulator | Use the loopback fixture harness and project `demo-daytech-milestone` with synthetic records. Keep cloud credentials out of the test environment. |
| Future preview | Use `config/environments/preview.env.example` with the reviewed preview project and separate limited identity. The build rejects an incomplete or wrong Web configuration. The API and direct storage fail closed before privileged operations when the runtime configuration is invalid. |
| Future commercial production | Use `config/environments/production.env.example` as an inventory only. Preserve the existing production configuration until separately approved. |

No cloud credentials or production settings were changed. Commercial launch remains subject to owner-confirmed hosting, protected live acceptance, the actual cloud bundle licence review and separate production approval.
