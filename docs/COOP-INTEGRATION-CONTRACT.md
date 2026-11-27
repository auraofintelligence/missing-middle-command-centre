# Co-op integration contract

Proposed interface, edition 1, 27 November 2026. This is a public-safe planning contract for private services, not an executed service agreement or a claim that an API already exists. It contains no operational records, credentials or actual agreements.

## Purpose

Connect the Missing Middle delivery company with an independently governed ready SET Co-op entity so local management can begin at commissioning or through a documented subsequent handover. Preserve each party's decisions, legal responsibilities, records and ability to change systems.

The co-op hub is under active development by another agent. Do not modify it as part of this repository. Agree the interface against its actual released capabilities when implementation begins.

## Separate authorities

The company owns delivery records and its supplier agreements. The host controls its venue commitments. The receiving co-op controls its membership, appointments and acceptance of services. Asset owners retain their rights until a distinct ownership agreement takes effect.

A postcode is a discovery/reporting label. It is not a tenant or an authority boundary. One co-op may manage several sites and one site may involve several legal parties.

Management commencement, asset transfer, employment changes and data/hosting migration are separate events with their own evidence and dates. Company support can continue after handover under a stated scope.

## Shared identifiers and vocabulary

| Item | Contract |
| --- | --- |
| Package | Globally unique package ID, schema version, package revision, created time and originating deployment |
| Parties | Stable entity IDs, legal names, jurisdiction and verified/proposed status with evidence references |
| Sites | Company project/site IDs, receiving-system mappings, locality and permitted location precision |
| Service | Scope, exclusions, assets involved, responsibilities, service levels and continuing company duties |
| Authority | Approval references, authorised people, permission basis and exact accepted package version |
| Timing | Intended date, acceptance date, effective management date and next review |
| Custody | Record classes, receiving custodian, permitted uses, retention and export/exit arrangements |
| Integrity | File manifest with size, media type and checksum; record counts and predecessor package reference |

Each system retains its own identifiers. Store explicit mappings; never match people or legal entities automatically by similar names. UUIDs help prevent collisions but do not confer access.

## Version 1: reviewed handover package

Start with an authorised private export and explicit receiving acknowledgement. Do not connect databases or share browser sessions.

The package contains a human-readable brief and machine-readable manifest covering:

1. Parties, authority and agreed management scope.
2. Project/site identity, operational state and relevant equipment.
3. Commissioning evidence, unresolved defects and responsible parties.
4. Trained people, support contacts, maintenance and recovery procedures.
5. Operating budget and agreed fees or accounting references.
6. Relevant service agreements, permissions and continuing obligations.
7. Data custody, access changes, backup/restore evidence and review dates.
8. Separate ownership schedule where an asset transfer is actually proposed.

Include only necessary authorised records and files. Exclude unrelated contacts, other sites, supplier confidential pricing outside the receiving scope, private cultural material and production credentials. Access secrets are provisioned separately.

### Exchange and acknowledgement

The company prepares a draft. Its authorised reviewer checks scope, evidence and sharing permission. Approval freezes a numbered package revision and its manifest. A changed attachment or material field creates a new revision and invalidates earlier acceptance for that changed scope.

The receiving co-op imports into a review area, checks schema, identifiers, checksums and required evidence, and sees proposed mappings before accepting. Re-importing the same package revision is idempotent. Conflicting IDs or altered content are rejected or quarantined rather than silently overwritten.

The receiving decision records accepted scope, exceptions, authorised actor, evidence reference and effective date. It returns an acknowledgement referencing the exact package ID, revision and manifest checksum. The company verifies and records that acknowledgement before marking management accepted. Each side retains its own audit record.

If the co-op is not ready, the project retains its interim operator and review date. An export alone is never acceptance.

## Later: narrow service API

After the reviewed exchange works, introduce a versioned API limited initially to package submission/status, requested clarification and acceptance acknowledgement. Publish an explicit field schema, validation rules and error contract.

Use separate service identities with narrowly scoped permissions, short-lived credentials where supported, expiry and revocation. Bind each request to the permitted receiving entity and project. A service credential is not a human officer and cannot invent a board decision.

Require idempotency keys, expected revision checks, bounded payloads, replay protection and audit on both sides. Authenticate any callbacks and retain failed deliveries in a visible retry queue. Never return success until persistence is confirmed.

Do not synchronise complete member directories, role tables, private Auras or unrestricted files. Each system applies its own permissions on every read, download, import and export.

## Correction, withdrawal and exit

Before acceptance, withdrawal closes the package and notifies the other system through the agreed authorised process. After acceptance, a correction or scope change becomes a new decision/version. Historical facts remain attributable to the actual operator at the time.

A contractual dispute, data correction and user-access revocation are separate actions. Revocation blocks future access immediately; record what copies were already transferred and apply the agreed retention/correction process. Do not promise technical deletion of every previously exported copy.

Exit exports preserve stable IDs, relationships, permitted evidence and history. Rehearse restoration and reconcile the final cutover. Retain a rollback and continuity plan consistent with the parties' agreed responsibilities.

## Acceptance checks

Demonstrate one synthetic site through export, review, duplicate import, correction, acknowledgement and management commencement. Verify missing authority/evidence blocks acceptance, mismatched package checksums fail, another co-op cannot retrieve the package, and a revoked identity cannot use a previous download route. Ownership must remain unchanged unless its separate agreement is recorded.

Reference conventions: [co-op governance API](https://github.com/auraofintelligence/ready-set-co-op-trust-hub/blob/main/docs/GOVERNANCE-API.md), [service handover guide](https://github.com/auraofintelligence/ready-set-co-op-trust-hub/blob/main/docs/SBT-TO-SETCO-HANDOVER.md), and [local/shared authority model](https://github.com/auraofintelligence/ready-set-co-op-trust-hub/blob/main/cooperative-network.html).
