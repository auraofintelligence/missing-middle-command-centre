# Build status

Prepared 27 November 2026.

| Item | Status |
| --- | --- |
| Backend architecture and project lifecycle | Planned and documented |
| Co-op integration contract | Version 1 proposed interface documented |
| Familiar desks and navigation | Specified, not built |
| Owner/Webmaster and other accounts | Roles specified, no live accounts created |
| Read-only role preview and separate demo | Specified, not built |
| Private Cloudflare Worker | Not deployed |
| Cloudflare Access policy | Not configured or verified here |
| D1 database and migrations | Data model specified, not provisioned |
| Private R2 file storage | Specified, not provisioned |
| Supplier project access | Scoped design only, no grants issued |
| CMS, calendar and external publication | Workflow specified, not built |
| Co-op handover API | Proposed later interface, not connected |
| Runtime security and restore tests | Acceptance criteria written, not run |
| Real project data | None added by this work |

## Next implementation

Build Release A and the usable Release B project-record flow from [the plan](COMMAND-CENTRE-PLAN.md): real identity, scope enforcement, common shell, history, persistent projects and separate synthetic demo. Verify the deployed private boundary before entering actual records. Then implement funding/delivery, co-op acceptance, media and operations in the specified sequence.

No outreach, invitation, appointment, purchase, agreement or media release has been executed as part of this planning work.

## Source visibility

Source visibility was public when these documents were prepared. They contain general architecture only. Check the repository's current GitHub setting independently. The intended application is private regardless of source visibility, and must enforce its own authentication and permission boundary.
