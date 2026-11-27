# Cloudflare architecture

Design specification, 27 November 2026. No Cloudflare resources or deployed service are claimed by this document.

## Deployment surfaces

| Surface | Intended resources | Boundary |
| --- | --- | --- |
| Public company site | Separate Static Assets Worker | Only checked public publication files |
| Private command centre | Worker, private asset binding, dedicated D1 and private R2 | Access authentication plus application permissions on every route |
| View-only demonstration | Separate Worker and fictional fixtures | No production bindings or accounts; no mutation endpoints |
| Preview and restore rehearsal | Separate resources | Never point a preview or rehearsal at production data |

Use distinct names, audiences, cookie/session identifiers, bindings and secrets. Resource IDs are recorded only after actual provisioning. Do not copy infrastructure identifiers or secrets from PLFC, P4A, ready SET or the Noticeboard.

## Authentication before serving files

Protect the private origin through Cloudflare Access. For a Worker with Static Assets, configure `assets.run_worker_first: true` so the authentication code runs before matching files are served. The Worker must independently verify the Access JWT signature, issuer, audience and time claims against its configured trust boundary, then map the authenticated subject to an active provisioned account.

Cloudflare's current documentation notes that `ctx.access` is not passed through the internal Static Assets router to the user Worker. Do not rely on that property alone for this architecture. Do not accept a raw email header or a client-selected role as identity.

Missing configuration, failed verification, unknown accounts, revoked grants and unrecognised origins must fail closed. Grant checks apply to list/detail routes, mutations, file retrieval, exports and linked records. Keep private responses out of shared caches.

## Database and file storage

Use normal D1 tables, versioned migrations, prepared statements, explicit scopes and per-record version checks. Apply a change and its audit/revision entry as one consistent operation. Use idempotency keys for commands which may be retried.

Private R2 holds evidence, agreements, images and media originals. D1 stores object metadata, checksum, linked records, retention and scope. Authorise every delivery route; do not enable public bucket access. Approved media copies are separate public outputs with separate publication records.

## Deployment gate

Before real records are accepted, test signed-out requests, wrong audience/issuer, expired identity, unknown account, revoked permission, cross-site known IDs, direct assets, file URLs, exports, alternate hostnames and every enabled preview. Verify that owner access works, read-only view-as rejects writes and demo cannot reach production.

Disable unneeded alternate and preview URLs. Protect every enabled private hostname. A private repository, unlisted URL, robots.txt or collapsed menu is not a substitute.

Apply D1 migrations deliberately and record their version. Git deployment alone does not demonstrate that a migration was applied. Keep the ability to restore the database, files, relationships and access records into separate resources and verify the result before relying on recovery.

## Co-op integration

Use the reviewed [handover package contract](COOP-INTEGRATION-CONTRACT.md) first. Later service identities receive narrow package-specific operations. Company and co-op systems keep independent identity, data custody and authority.

## Primary references

Checked 27 November 2026:

- [Cloudflare Access for Workers, including Static Assets limitations](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Static Assets and run_worker_first](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

Consult the current D1/R2 and authentication documentation again during implementation. This document is the deployment design; passing runtime evidence will be recorded in BUILD-STATUS.md.
