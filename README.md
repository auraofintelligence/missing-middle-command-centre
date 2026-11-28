# Missing Middle Command Centre

A private project workspace for taking a postcode opportunity through to a documented site brief. [Open the command centre](https://missing-middle-command-centre.auraofintelligence.workers.dev/) · [Explore the fictional demo](https://missing-middle-command-centre-demo.auraofintelligence.workers.dev/).

The workspace presents nine illustrated desks, with a project selector, a portfolio, 16 working registers, linked records, calendar and signed revisions. Search by project name, record title, locality or postcode. The separate view-only demo contains fictional projects and records across the desks.

Later releases extend the application to manage the full journey from postcode discovery and candidate location through funding, installation, commissioning and accepted local co-op management. Media and community participation develop alongside delivery.

[National Coverage](https://missing-middle-command-centre.auraofintelligence.workers.dev/coverage) maps the 2021 ABS population baseline and lets the Webmaster compare and save postcode catchments before selecting project sites. [Read the data and planning method](docs/NATIONAL-COVERAGE.md).

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

This repository can remain public while it contains general planning and application source. Revisit visibility before adding confidential implementation material. Keep credentials, contacts, commercial agreements and real project records outside Git.

The deployed workspace requires a workspace password. Use [Set up your password](https://missing-middle-command-centre.auraofintelligence.workers.dev/account/setup) once to verify the owner’s Cloudflare account and choose a password. Routine sign-in uses the workspace password. The signed-out redirect is verified, and the owner confirmed they signed in. The live portfolio begins with records created by the team. See [deployment and acceptance](docs/DEPLOYMENT.md).

Run `node --test` with Node 24 or later for the source checks. See [build status](docs/BUILD-STATUS.md) for the current release and outstanding work.

## Connections

[Company source](https://github.com/auraofintelligence/missing-middle-infrastructure)  
[ready SET Co-op](https://ready-setco.auraofintelligence.workers.dev/index.html)  
[Co-op formation and governance hub](https://github.com/auraofintelligence/ready-set-co-op-trust-hub)  
[Cultural Intelligence Node](https://github.com/auraofintelligence/ready-set-co-op-cultural-intelligence-node)  
[Joyful Responsible Abundance](https://auraofintelligence.github.io/joyful-responsible-abundance/index.html)

The co-op hub has its own active development. This repository defines an integration contract without modifying that hub.

Hosting target: the owner's Cloudflare account. No ChatGPT Sites.

Updated 28 November 2026. Original programme by Luke Nathan Hayes / Strange But True / Aura of Intelligence. See [LICENCE.md](LICENCE.md).
