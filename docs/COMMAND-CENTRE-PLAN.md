# Missing Middle private command centre plan

Planning edition, 27 November 2026. This document specifies a proposed private application. It does not claim that authentication, databases, accounts, workflows or integrations are already operational.

Source repository visibility at preparation: public. These are public-safe architecture notes containing no operational records or credentials. Repository visibility and runtime privacy are separate controls; the deployed application must enforce authentication and permissions before accepting real data.

## 1. Purpose and operating boundary

The command centre will help the proposed Missing Middle delivery company take a community installation from a possible location to an operating service under agreed local management. It combines project delivery, postcode outreach, funding, supplier coordination, co-op readiness, handover and a private editorial workspace.

The company organises delivery and contracts specialist work. A ready SET Co-op entity may provide agreed employment, training, administration and management services once it is established and able to accept them. Management should begin at commissioning where possible, or soon afterwards through a documented interim arrangement. Asset ownership can transfer on a different timetable.

The first release must be useful to the owner in private before broader public intake or substantial new public features depend on it. Use the user's own Cloudflare account, separate from ChatGPT Sites. Keep the public company site and this private service independently deployable.

Working names do not establish a registered company, cooperative, partnership or contract. Record the actual legal party and evidence for each commitment.

## 2. Three tracks progressing together

A project has three connected tracks. Display their stages separately so one apparent completion percentage cannot hide a missing operator or unfunded operating budget.

| Track | Stages | Main owner |
| --- | --- | --- |
| Site delivery | Lead, host discussion, feasibility, scoped proposal, funding committed, procurement, installation, commissioning, operating | Project manager |
| Local management | People interested, formation underway, legal entity evidenced, operating capacity, agreement review, management accepted, active management | Co-op liaison |
| Participation and media | Research, permission to contact, conversation, agreed contribution, local activity, approved story, published update, review | Outreach or media lead |

Postcodes organise discovery and reporting. They are not security tenants, legal boundaries or proof that a project represents all residents. One campaign may cover several postcodes; one co-op may manage several sites; a host, asset owner, installer and manager may all be different entities.

Each project overview shows its actual stage, next action, responsible person, due date, blocked reason, funding position, operator and target management date. Keep declined, paused and withdrawn projects with their history. Reopening or moving backwards records a reason and the new evidence.

### Delivery decisions

| Decision | Evidence needed before the stage is recorded |
| --- | --- |
| Pursue a location | Host contact or research source, location precision, use case, owner of the next action |
| Complete feasibility | Site access, demand/workloads, power, cooling, connectivity, physical constraints, cost assumptions and responsible assessment |
| Commit delivery | Named contracting entity, agreed scope, funding evidence, delivery budget, ongoing operating provision and decision authority |
| Begin installation | Approved work packages, relevant site permissions, qualified responsible suppliers, schedule, dependencies and access plan |
| Commission | Asset register, applicable test and completion evidence, defects, support contacts, recovery arrangements and accountable acceptance |
| Start local management | Receiving entity, accepted scope, competent people, access/custody plan, operating budget, agreement and effective date |
| Transfer ownership | Separate asset/title schedule, agreed price or other basis, liabilities, required approvals and effective date |

A status records a decision supported by evidence. It does not itself confer permission or certify engineering, legal or financial compliance.

If co-op readiness lags commissioning, require a named interim operator, paid/resourced duties, service limits, support contacts, review date and intended handover date. Preserve continuing company obligations after local management begins.

## 3. Familiar desks and navigation

Use one private home with a desk switcher, global search, current project selector and clearly visible signed-in identity. Keep each desk's title and short description visible; collapse lengthy guides and optional controls below them. Every tool has a reliable Return to desk action that restores project, filters and scroll position.

| Desk | Main work |
| --- | --- |
| Programme | Portfolio, milestones, blocked work, decisions and upcoming commitments |
| Places and outreach | Postcode campaigns, host leads, contacts, conversations and next actions |
| Sites and delivery | Feasibility, project scope, work packages, schedule, commissioning and defects |
| Funding and finance | Opportunities, applications, commitments, project budgets, purchase/invoice references and reporting dates |
| Co-ops and handover | Formation links, readiness, service agreements, training, management acceptance and ownership schedules |
| Media and CMS | Public page drafts, stories, assets, calendar, review, publication and corrections |
| Records and decisions | Controlled files, meeting/decision references, approvals, history and exports |
| Operations | Current operators, access reviews, maintenance, support, incidents and renewal actions |
| Webmaster | Accounts, scoped grants, configuration status, role previews, backups and audit |

Keep common labels, status chips, saved-draft feedback, revision history and calendar controls consistent with PLFC and P4A. Public-facing copy should describe Missing Middle's own purpose and services, without describing the site as a repurposed club or campaign.

Do not recreate every earlier tool indiscriminately. Establish the complete delivery workflow, then add deeper scheduling and operational views around the same records.

## 4. Accounts, roles and scope

Create an explicitly authorised owner/Webmaster role with access to all operational areas and access administration. The owner's role is not restricted to technical metadata. Technical access still does not invent authority to bind a company, cooperative or host.

| Role | Permitted work, subject to assigned scope |
| --- | --- |
| Owner/Webmaster | All desks, configuration, operational records, access grants, exports and audit |
| Programme manager | Assigned portfolio, project decisions, delivery coordination and management readiness |
| Project manager | Assigned projects, suppliers, schedules, site evidence and commissioning preparation |
| Finance/funding officer | Assigned budgets, applications, commitments, purchasing references and reports |
| Outreach/co-op coordinator | Assigned campaigns, contacts, participation and co-op readiness |
| Editor/media producer | Assigned drafts, consented assets and calendar preparation |
| Publisher/reviewer | Review and explicitly release approved public versions |
| Local co-op manager | Accepted or delegated sites and agreed management records |
| Supplier/installer | Assigned work packages, necessary site information and their own submissions |
| Auditor/viewer | Read-only access to specifically granted records and exports |

Store permissions against stable authenticated identity and explicit organisation, portfolio, project, site or work-package grants. Do not infer office, authority or access from a person's name, email prefix, postcode, page selection or a client-supplied role.

Owner view-as is a server-enforced read-only projection of an assigned role and scope. It retains the owner's real identity in audit records, clearly displays preview mode and rejects every mutation even if someone calls the API directly. Returning to owner mode is explicit.

Provide a separate Webmaster demo using synthetic projects, people, budgets and stories. Its Worker has no production D1 or R2 binding, no production account/session reuse, and accepts only read operations. Demo controls can explain unavailable actions without saving anything. A separate Access application may protect the demonstration. Never populate it from a redacted production export.

## 5. Data model

Use normal relational D1 tables with versioned migrations, foreign keys, indexes, bounded queries and integer minor currency units. Keep current records and append-only revisions together transactionally. Do not place the programme in one global JSON snapshot.

| Record group | Conceptual tables and essential relationships |
| --- | --- |
| Identity | accounts; role_definitions; scoped_role_grants with subject, scope, permissions, start, expiry, revocation and authorising actor |
| Organisations | legal_entities and entity_relationships; actual names, entity type, jurisdiction, status evidence and effective dates |
| Places | localities, postcodes, sites and site_postcodes; host, exact/private coordinates, approved public precision and location evidence |
| Campaigns | outreach_campaigns, campaign_places, contacts, contact_permissions and interactions; purpose, source, channel, next action and refusal/withdrawal |
| Projects | projects, project_sites, project_entities, milestones, tasks and dependencies; responsibilities and versioned decisions |
| Readiness | feasibility_assessments, workloads and readiness_items; evidence, assumptions, reviewer, validity/review date |
| Funding | funding_opportunities, applications, commitments, restrictions, receipts and cost_allocations; applicant entity, eligible scope, deadline, evidence and reporting obligations |
| Commercial | budgets, budget_lines, supplier_agreements, work_packages, purchase_orders and invoice_references; estimated, approved, committed and actual amounts kept distinct |
| Equipment | assets, asset_locations and asset_relationships; legal owner, custodian, serial/reference, warranty and lifecycle responsibility |
| Completion | commissioning_records, defects and acceptance_decisions; scope, evidence, signatories and unresolved conditions |
| Management | operating_agreements, handover_packages and handover_items; sending/receiving entities, accepted services, dates and continuing duties |
| Ownership | ownership_transfer_records and transfer_assets; title/rights, consideration, approval and effective date independent of management |
| Content | cms_entries, content_versions, media_assets, consent_records, editorial_decisions, calendar_items and publication_records |
| Controlled files | file_objects and record_file_links; private object key, type, size, checksum, classification, access scope and retention basis |
| History | audit_events, record_revisions, integration_packages and import_receipts; actor, action, version, time, reason and related evidence |

Join tables preserve many-to-many relationships. Legal identity, ownership, custody, employment and service authority are separate fields or relationships. Source references are evidence, not automatic validation.

Use bounded JSON only for genuinely variable ancillary details with a documented schema. Important permissions, statuses, amounts, relationships and dates remain queryable columns. Record revisions preserve prior values without allowing old records to be silently relabelled to a new operator.

The finance desk records project commitments and accounting references. Reconcile with the chosen accounting system; do not build payroll, tax interpretation or banking into this release. Keep paid work, voluntary C-Hours, investment and outcomes separate. No cash conversion of C-Hours is assumed.

## 6. Specialist supplier boundary

Create a dedicated UPS installation work package when a supplier is actually engaged. Its scope is UPS installation only, with the accepted quote, deliverables, exclusions, required site access, nominated contact, completion evidence, invoice reference and acceptance owner.

The supplier is not automatically a founder, network operator, investor, general project partner or administrator. Design, cooling, networking, continuing maintenance and other services remain outside that package unless separately agreed. Overall site commissioning remains a separate accountable decision.

Supplier accounts see only the package and necessary site documents. Grants expire at a recorded end date and can be revoked earlier. Completion must trigger an access review. Renewed maintenance access requires its own scope and term.

## 7. Cloudflare architecture and privacy

Deploy three distinct surfaces: public company Worker, private command-centre Worker, and isolated demonstration Worker. The private service receives its own D1 database and private R2 bucket. Preview/staging resources also remain separate from production.

Protect the whole private origin with Cloudflare Access, then independently validate the Access JWT in the Worker: signature against trusted keys, issuer, audience, validity period and expected identity claims. Fail closed when configuration is missing or validation fails. Do not trust an email header alone.

Run the private Worker before static assets so a direct HTML, JavaScript, export or attachment request cannot bypass the same protection. Apply application permissions to every API route, query, export and download, including nested record relationships. A known ID is not permission. Denied cross-project reads return no identifying metadata.

R2 objects remain private. File retrieval passes through authenticated, scoped endpoints, or narrowly bounded short-lived delivery only after the same permission check. Do not enable a public bucket URL. Validate file type/size and safely serve untrusted uploads without executable inline behaviour.

Use same-origin mutation checks, appropriate anti-CSRF protection, bounded request bodies, rate limits for public intake, prepared SQL, safe rendering and explicit field allowlists. Mark private responses no-store. Keep secrets in Cloudflare configuration and exclude credentials, private data and logs from Git and public build outputs.

New public enquiries, if introduced, write to a narrow intake boundary with minimal fields and explicit contact permission. They do not create users, grant membership, publish a location or enter a private participant directory automatically.

Changes use idempotency keys and expected versions. A repeated request returns the original result; a stale edit returns a conflict without overwriting another person's work. Record the real signed-in actor, timestamp, action and relevant scope for saves, approvals, publications, exports, access changes and handovers.

Backups must include relational data, revisions, permissions and referenced objects. Rehearse restoration into separate resources before relying on recovery. The deployment runbook names the active version, migrations, access configuration, rollback conditions and responsible operator.

## 8. Private CMS and positive media

The CMS turns evidenced progress into useful public stories: a community conversation, confirmed site, funding decision, installation milestone, training session, accepted management arrangement or measured service outcome. A proposed site and completed installation must have visibly different descriptions.

The workflow is draft, submitted, reviewed, approved, scheduled, published, corrected or withdrawn. Store the exact approved content and asset versions, intended destinations, publication/expiry time, reviewer, source evidence and permission basis. Editing approved material creates a new revision and requires fresh approval.

Produce public output from a positive field allowlist. It can include approved title, summary, public locality, evidence-backed stage, publishable media, captions, credits and approved links. Private contacts, precise restricted locations, contracts, budgets, internal comments, access details and unpublished assets are excluded by construction.

Destinations are explicitly selected. Missing destination data means publish nowhere. The public site consumes only approved publication snapshots; it never queries private tables or relies on a hide/private flag over an otherwise exposed dataset.

The calendar supports day, week, month and annual event views; saved pattern layers; per-day/per-category targets; school/public-holiday annotations; lead-in tasks; and one reviewed monthly batch action. Include portrait and landscape media requirements, captions and video-first planning. A useful daily plan may contain preparation or community activity without implying an automatic public post.

Every day and item shows who prepared, changed, reviewed and released it, with revision history. Annual events inform monthly suggestions while allowing ad hoc local opportunities. Restoring a previous plan creates a new version.

Drafting, scheduling and publication are separate permissions. No email, invitation, social-platform post or other person-directed message is sent autonomously. External delivery requires an authorised action through a supported connector or an explicit manual handoff, with the resulting receipt recorded.

## 9. Connection to the cooperative and wider purpose

Use the separate [co-op integration contract](COOP-INTEGRATION-CONTRACT.md). Initially exchange a reviewed versioned handover package. Do not copy another system's sessions, membership register, consent or approvals.

The active co-op hub is being developed separately. Treat observed implementation details as a snapshot and agree a stable contract before integration. Link to its formation guidance now; add narrowly scoped service API exchange later.

The [Cultural Intelligence Node](https://auraofintelligence.github.io/ready-set-co-op-cultural-intelligence-node/) informs local workloads, permissions, equipment custody and learning. [Joyful Responsible Abundance](https://auraofintelligence.github.io/joyful-responsible-abundance/capacity.html) provides purpose and ownership context. Neither is a source of automatic participation, cultural authority or operational permissions.

## 10. Implementation releases and acceptance checks

| Release | Deliverable | Acceptance before relying on it |
| --- | --- | --- |
| A. Private foundation | Worker, Access, D1/R2, owner account, scoped grants, common shell, separate synthetic demo | Signed-out direct assets/API/files fail; wrong audience/expired identity fails; cross-scope reads and writes fail; owner can use every desk; view-as and demo reject writes |
| B. Programme records | Places, campaigns, contacts, projects, milestones and history | Save survives reload; repeated create is safe; stale saves conflict; filters survive return navigation; actual actor appears in history; no contact is sent |
| C. Delivery and funding | Feasibility, budgets, funding, suppliers, work packages, assets and commissioning | Unsupported stage changes identify missing evidence; totals distinguish estimates/commitments/actuals; UPS supplier cannot see other packages; expired grant fails |
| D. Co-op management | Parallel readiness, interim operation, service acceptance, handover package and separate ownership schedule | Commissioned project always has an operator; management and title dates can differ; export preserves evidence; receiving acknowledgement is required |
| E. CMS and media | Versioned content, assets, calendar, review and public projection | Private marker never appears in output; unselected destination receives nothing; edits invalidate approval; correction/withdrawal works; day signatures and batch history persist |
| F. Operational readiness | Restore rehearsal, access review, reports, maintenance and controlled integration | Restore verifies records and objects; revoked user cannot retrieve old links; export/import resolves duplicates; end-to-end synthetic project reaches handover with complete history |

These are implementation gates, not claims of completed tests. Do not accept or import real personal, commercial or operational records until Release A passes against the deployed service. Use realistic synthetic records for the end-to-end rehearsal and keep them separate from operating data. Recheck changed security boundaries and actual deployment behaviour; do not substitute screenshots or client-side hidden buttons for server checks.

## 11. Evidence and adaptation notes

- [PLFC access and workflow source](https://github.com/auraofintelligence/PLFC-members-club/blob/main/worker/index.mjs), [showcase](https://github.com/auraofintelligence/PLFC-members-club/blob/main/worker/showcase.mjs), [social planner](https://github.com/auraofintelligence/PLFC-members-club/blob/main/worker/social-planner.mjs) and [handoffs](https://github.com/auraofintelligence/PLFC-members-club/blob/main/worker/handoffs.mjs): adapt desk conventions, signed activity, review and isolated demonstrations; add explicit multi-organisation/site scope.
- [P4A scoped access](https://github.com/auraofintelligence/p4a-membership/blob/onboarding-governance-gate-a/src/scoped-access.mjs), [server projection](https://github.com/auraofintelligence/p4a-membership/blob/onboarding-governance-gate-a/src/scoped-projection.mjs) and [navigation](https://github.com/auraofintelligence/p4a-membership/blob/onboarding-governance-gate-a/public/workspace-navigation.mjs): relevant code was observed on the named development branch, not evidence of production deployment. Adapt permission concepts; do not copy its pilot whole-state JSON store.
- [Outreach CMS](https://github.com/auraofintelligence/outreach-cms/blob/main/README.md): adapt evidence, next-action and public/private publishing boundaries. Its browser draft tools are not an existing private backend.
- [Noticeboard public feed](https://github.com/auraofintelligence/straddie-noticeboard-cloudflare/blob/main/public/pilot-feed.js): adapt approved output fields, expiry and correction handling; use explicit destination selection.
- [Co-op governance API](https://github.com/auraofintelligence/ready-set-co-op-trust-hub/blob/main/docs/GOVERNANCE-API.md), [handover guide](https://github.com/auraofintelligence/ready-set-co-op-trust-hub/blob/main/docs/SBT-TO-SETCO-HANDOVER.md) and [network model](https://github.com/auraofintelligence/ready-set-co-op-trust-hub/blob/main/cooperative-network.html): align identifiers, evidence, revision and authority conventions while preserving separate custody.

The next build should implement Release A and the usable project record flow together, then extend through the remaining releases against this plan.
