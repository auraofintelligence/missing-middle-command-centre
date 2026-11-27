# Missing Middle Command Centre

Architecture and build plan for a private company CMS and project workspace.

This repository currently contains planning documents. It does not provide a deployed login service, database, project application, live accounts, supplier access or publication endpoint.

The intended application manages the full journey from postcode discovery and candidate location through funding, installation, commissioning and accepted local co-op management. Media and community participation develop alongside delivery.

## Read the plan

- [Command-centre plan](docs/COMMAND-CENTRE-PLAN.md): project lifecycle, familiar desks, roles, data model, privacy boundary, CMS and implementation releases.
- [Co-op integration contract](docs/COOP-INTEGRATION-CONTRACT.md): linked identifiers, management acceptance, permissioned exports, receiving acknowledgement and later narrow APIs.
- [Cloudflare architecture](docs/CLOUDFLARE-ARCHITECTURE.md): deployment resources, identity checks and release evidence.
- [Current build status](docs/BUILD-STATUS.md): what exists and what is still planned.

## Key decisions

- Company delivery, funding and local co-op readiness proceed in parallel.
- Aim for management handover at commissioning or soon afterwards. Record an accountable interim operator until the receiving entity accepts.
- Keep installation completion, management commencement, asset ownership, data custody and software hosting as distinct events.
- UPS contractors receive installation-only work packages, with limited site access and an agreed end.
- Reuse familiar desks, return navigation, visible summaries, revisions, signatures and monthly media planning from the reference systems.
- Owner/Webmaster permissions cover all operational areas. Role preview is read-only and preserves the actual actor. Demonstrations use separate fictional data.
- Project data uses scoped server-side permissions, relational D1 records and private R2 files.
- Public media is an approved, versioned projection of selected fields and permissioned evidence.

## Source visibility and runtime privacy

Repository visibility and application access are separate. These planning documents contain general architecture only. No contacts, actual agreements, commercial records, credentials or live project data belong in Git history.

The intended application must deny unauthorised access to pages, API routes, files and exports, including alternate hostnames and previews. Real project data must wait until that boundary is implemented and verified. Do not infer deployed privacy from the repository name or from a hidden menu.

## Connections

[Company source](https://github.com/auraofintelligence/missing-middle-infrastructure)  
[ready SET Co-op](https://ready-setco.auraofintelligence.workers.dev/index.html)  
[Co-op formation and governance hub](https://github.com/auraofintelligence/ready-set-co-op-trust-hub)  
[Cultural Intelligence Node](https://github.com/auraofintelligence/ready-set-co-op-cultural-intelligence-node)  
[Joyful Responsible Abundance](https://auraofintelligence.github.io/joyful-responsible-abundance/index.html)

The co-op hub has its own active development. This repository defines an integration contract without modifying that hub.

Hosting target: the owner's Cloudflare account. No ChatGPT Sites.

Prepared 27 November 2026. Original programme by Luke Nathan Hayes / Strange But True / Aura of Intelligence. See [LICENCE.md](LICENCE.md).
