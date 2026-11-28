# Build status

28 November 2026.

| Item | Status |
| --- | --- |
| Private Cloudflare workspace | Worker deployed. A signed-out request to the project creation page redirected to the password form. Preview URLs are disabled. |
| Owner/Webmaster | One owner account and exact email allow rule provisioned. Cloudflare account sign-in protects first password setup only. Owner enrolment and a signed-in project save remain to be verified live. |
| Password rules | 1–128 Unicode characters with spaces retained. Eye control on every password field. D1 reserves one of three attempts per account for 15 minutes across sign-in and confirmation. Successful verification clears the active window. GitHub checks and a Cloudflare hashing check passed. |
| Projects | D1 migration applied. The workspace supports candidate host and postcode research, site briefs, next actions, independent delivery, funding and co-op stages, and signed revisions. Local SQLite tests passed. |
| Desks | Nine desk links share the portfolio and project history. Specialised tools for later releases are pending. |
| Project scope | Project manager and auditor grants enforced by the Worker. The Webmaster can preview either role for a selected project with writes blocked. Grant administration UI and additional user enrolment are pending. |
| Fictional demo | Separate Worker with no bindings to the private environment. Cloudflare Browser Rendering verified the aquatic centre detail page and three fictional revisions. |
| Next workflow | Complete a live owner sign-in and a fictional project save, then build linked organisations, sites, postcode opportunities and consented contacts. |
| Later releases | Funding, procurement, commissioning, co-op handover, media, operations, private files, backups and Ready SETCO education integration remain planned. |
| Deployment automation | Both Workers deployed through the Cloudflare API. Automatic deployment from this repository has yet to be configured. |

The GitHub repository is public by owner direction. Revisit its visibility before storing confidential implementation material. The workspace's sign-in and permission checks apply independently. Credentials and real operating data belong outside Git.

See [deployment and acceptance](DEPLOYMENT.md) and the [command-centre plan](COMMAND-CENTRE-PLAN.md).
