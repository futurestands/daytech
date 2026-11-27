# DayTech engineering instructions

- Extend the existing React, Express, Firebase and Vercel application. Preserve DayTech branding, the catalogue and existing customer workflows.
- Use UGX and Africa/Kampala as defaults. Use Bun and the committed lockfile for dependency installation.
- Branch from current main for each milestone. Keep changes reviewable and run type checks, the build and applicable tests before requesting review.
- Treat Firebase Auth UIDs as customer ownership keys. Enforce active accounts and role permissions at both the API and Firestore boundaries. Keep browser-created profiles at the client role.
- Use isolated Firebase projects or emulators for testing. Obtain approval before changing production Firebase data or rules, deploying, or enabling a billable service.
- Keep server secrets out of the repository, client bundles and logs. Use an independent quotation signing secret.
- Report commands actually executed, results, manual setup and blockers. Require review before merging into main.
- Use the applicable DayTech project skills under `.agents/skills` for security, architecture, commercial readiness, licensing and quality assurance. When working from another directory, open the relevant repository `SKILL.md` directly.
