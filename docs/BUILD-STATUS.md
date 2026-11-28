# Build status

28 November 2026.

| Item | Status |
| --- | --- |
| Private Cloudflare workspace | Worker deployed. A signed-out request to the project creation page redirected to the password form. Preview URLs are disabled. |
| Owner/Webmaster | One owner account and exact email allow rule provisioned. Cloudflare account sign-in protects first password setup only. The owner confirmed sign-in. |
| Password rules | 1–128 Unicode characters with spaces retained. Eye control on every password field. D1 reserves one of three attempts per account for 15 minutes across sign-in and confirmation. Successful verification clears the active window. GitHub checks and a Cloudflare hashing check passed. |
| Projects | D1 migration applied. The workspace supports candidate host and postcode research, site briefs, next actions, independent delivery, funding and co-op stages, and signed revisions. Local SQLite tests passed. |
| Desks | Nine illustrated desks with 16 structured tools, project filtering, linked records, status controls and signed history. See [desk guide](DESKS.md). |
| Project scope | Project manager and auditor grants enforced by the Worker. The Webmaster can preview either role for a selected project with writes blocked. Grant administration UI and additional user enrolment are pending. |
| Fictional demo | Isolated view-only Worker with two projects, 18 worked records and a populated September 2027 media calendar. |
| Next workflow | Use Places to add the first real organisation, opportunity and consented contact, then link a candidate site in Sites and delivery. |
| Later releases | Payment and procurement integrations, private file storage, advanced editorial and calendar automation, account grant administration, co-op transfer acknowledgement and Ready SETCO integration remain planned. |
| Deployment automation | Both Workers deployed through the Cloudflare API. Automatic deployment from this repository has yet to be configured. |

The GitHub repository is public by owner direction. Revisit its visibility before storing confidential implementation material. The workspace's sign-in and permission checks apply independently. Credentials and real operating data belong outside Git.

See [deployment and acceptance](DEPLOYMENT.md) and the [command-centre plan](COMMAND-CENTRE-PLAN.md).
