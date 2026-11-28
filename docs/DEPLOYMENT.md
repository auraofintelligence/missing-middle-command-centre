# Command centre deployment and acceptance

| Surface | URL | Verified Cloudflare version on 28 November 2026 |
| --- | --- | --- |
| Private workspace | [Open command centre](https://missing-middle-command-centre.auraofintelligence.workers.dev/) | `a0fa846a-0b52-4de2-bb2f-3b8c5ed9261b` |
| Fictional demo | [Open demo](https://missing-middle-command-centre-demo.auraofintelligence.workers.dev/) | `65e76b17-eb44-4bd6-9759-c87592cd408f` |

The private Worker runs `src/worker.mjs` and uses a dedicated D1 database via the `DB` binding. The runtime configuration sets `APP_HOST`, `ACCESS_ISSUER` and `ACCESS_AUD` for that Worker and its Access application. The demo runs `src/demo.mjs` without database bindings. Both use the Cloudflare API deployment route and have preview URLs disabled.

The D1 migration at `migrations/0001_projects.sql` is already applied. For a future deployment, run `node --test`, apply any pending migration deliberately, and upload the relevant entry module and its imports. Use separate Worker scopes if enabling GitHub Actions deployment.

## First signed-in acceptance check

1. Open the private workspace and enter the email for the owner’s Cloudflare account. Use the one-time code Cloudflare sends to that address.
2. Create a fictional project with a postcode, locality, evidence reference, responsible role, next action and change note. Reload and reopen it from the portfolio.
3. Add a fictional host, workload and heat use assessment. Move delivery to **Site brief** and check the signed revision.
4. From **Webmaster**, open an Auditor preview for the same project. Confirm the project is visible and the editing control is absent, then return to Webmaster.

The signed-out boundary was checked against the live project creation route. Local tests passed for the application token, project scope, revisions and repeat saves. Record the first successful signed-in production save in [build status](BUILD-STATUS.md).
