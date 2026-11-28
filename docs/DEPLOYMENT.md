# Command centre deployment and acceptance

| Surface | URL | Cloudflare version |
| --- | --- | --- |
| Private workspace | [Open command centre](https://missing-middle-command-centre.auraofintelligence.workers.dev/) | `bc4a8b25-8090-4b05-b24f-1c68ce52f7d8` |
| Fictional demo | [Open demo](https://missing-middle-command-centre-demo.auraofintelligence.workers.dev/) | `8504234f-d3d0-4b64-8247-a9234bbc57bd` |

The private Worker runs `src/worker.mjs` with the dedicated `DB` binding, `nodejs_compat` and `PASSWORD_AUTH=enabled`. Cloudflare Access protects `/account/setup` using the Cloudflare account identity provider and a rule for the owner's email. The Worker independently validates the Access token before enrolling the existing authorised account. The hosted sign-in form and other private routes use application sessions. Both Workers have preview URLs disabled.

## Password rules

A password must contain 1 to 128 Unicode code points. Spaces can appear anywhere. Case, composition and old password age do not restrict selection. The inline eye button reveals or conceals each password field without changing its contents. Passkeys and recovery codes are not required for enrolment.

D1 reserves an attempt before verification, so an abandoned submission that reached the verifier counts. The first start opens a 15-minute window shared by sign-in, password confirmation and password changes. Three starts are allowed. Blocked retries do not change the expiry. Successful verification clears its window. Passwords use salted scrypt. The database stores session token hashes, and changing a password invalidates prior sessions.

## First use

1. Open [Set up your password](https://missing-middle-command-centre.auraofintelligence.workers.dev/account/setup). Confirm your Cloudflare account identity and choose the workspace password. This is the one-time enrolment route for the provisioned owner.
2. Use [Sign in](https://missing-middle-command-centre.auraofintelligence.workers.dev/account/login) for future sessions. Open **Account** to confirm, change your password or sign out.
3. Before adding operational records, create and edit a fictional project and confirm that it survives reloads and shows the signed revision.

GitHub Actions exercised password validation, attempt-window behaviour, confirmation and session lifecycle. Cloudflare ran the actual password hashing code. A signed-out request for the live project creation route redirected to the password form and showed the eye control. Cloudflare Browser Rendering reproduced the original native form rejection and verified that the same-origin referrer policy lets the form reach password verification. The Worker still requires a matching Origin on form POSTs. The owner confirmed live sign-in. GitHub checks exercised the new project links, saved records, revision history and permission scope. The live fictional Places desk was checked in a cloud browser, including the sprite assets.

## Updating or rolling back

All three D1 migrations are applied. Keep Cloudflare Access and its audience for enrolment. To roll back to Cloudflare-only sign-in, restore the full-hostname Access scope first, then restore the previous Worker version. Leave the database intact.

## Brand artwork

The shared header and browser icon use the command centre artwork in `assets/brand-master.png`. To regenerate the embedded ICO and PNG assets, install Pillow and run `python3 tools/build_brand.py`. The favicon and logo are served on both Worker hostnames before sign-in.
