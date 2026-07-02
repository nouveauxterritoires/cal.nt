> [!IMPORTANT]
> **Cal.nt is an independent fork and is _not_ affiliated with, endorsed by, or sponsored by Cal.com, Inc.**
> "Cal.com" and "Cal.diy" are names and trademarks of their respective owners. This repository is maintained
> by [Nouveaux Territoires](https://nouveauxterritoires.fr) for our own needs and shared with the community.
> For the official, commercially supported product, go to [cal.com](https://cal.com).

<p align="center">
  <h3 align="center">Cal.nt</h3>
  <p align="center">
    An open-source scheduling platform — our fork of Cal.com / Cal.diy.
    <br />
    <a href="https://github.com/nouveauxterritoires/cal.nt"><strong>GitHub</strong></a>
    &middot;
    <a href="https://github.com/nouveauxterritoires/cal.nt/issues">Issues</a>
    &middot;
    <a href="./CONTRIBUTING.md">Contributing</a>
  </p>
</p>

<p align="center">
  <a href="https://opensource.org/license/mit"><img src="https://img.shields.io/badge/license-MIT-purple" alt="License"></a>
  <img src="https://img.shields.io/badge/fork%20of-Cal.com%20%2F%20Cal.diy-blue" alt="Fork of Cal.com / Cal.diy">
  <img src="https://img.shields.io/badge/self--hosted-yes-green" alt="Self-hosted">
</p>

## About Cal.nt

**Cal.nt** is a fork of [Cal.com](https://cal.com) (via its open-source community edition, Cal.diy),
maintained by **Nouveaux Territoires**. It powers our own scheduling infrastructure.

We are **not** the Cal.com company, and this project is **not** an official Cal product. We simply love
what Cal.com built, and we love open source — so instead of running an untracked private patchset, we keep
our changes here in the open.

### Why this fork exists

- **To maintain the app _we_ need.** We track the features and integrations our organisation depends on, on
  our own release cadence, without waiting on upstream priorities or an enterprise licence.
- **To give back.** Everything here is MIT-licensed. If you love open source and Cal, you're welcome to use,
  read, and learn from it — the same way we benefit from the upstream project.

> This is a self-hosted project. There is no hosted/managed "Cal.nt" service. You run it on your own
> infrastructure. Our own instance runs at [cal.nvt.one](https://cal.nvt.one).

### Versioning

Cal.nt uses its **own independent versioning**, starting at `v1.0.0`, separate from upstream Cal.com/Cal.diy
version numbers. The current version is shown in the app footer.

## What we maintain on top of upstream

These capabilities are implemented **clean-room** in the AGPL/MIT core of this fork — they do **not** reuse any
Cal.com "Enterprise Edition" (`/ee`) code:

| Feature | Notes | Docs |
| --- | --- | --- |
| **Teams** | Team create/list, membership, invitations, event-type host assignment, public team booking pages. Gated by `TEAMS_ENABLED`. | [Local testing guide](./docs/teams-restore/LOCAL-TESTING.md) |
| **SSO — Keycloak (OIDC)** | Opt-in Keycloak login via NextAuth. Enabled with `SSO_KEYCLOAK_ENABLED=true` + `KEYCLOAK_*` env vars. | [Local testing guide](./docs/teams-restore/LOCAL-TESTING.md) |
| **Workflows via n8n** | Reminders, follow-ups and no-show flows are delegated to [n8n](https://n8n.io) through Cal's native, HMAC-signed booking webhooks — no in-app workflow engine. | [Workflows / n8n guide](./docs/workflows-n8n/README.md) |

### Relationship to upstream

- Cal.nt periodically **rebases on / pulls from** the upstream open-source codebase to stay current.
- Contributions to this repo do **not** flow back to Cal.com's platform. If you want a change in the official
  product, contribute upstream at [cal.com](https://cal.com).

### Built With

- [Next.js](https://nextjs.org/)
- [tRPC](https://trpc.io/)
- [React.js](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma.io](https://prisma.io/)
- [Daily.co](https://daily.co/)

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- Node.js (Version: >=18.x)
- PostgreSQL (Version: >=13.x)
- Yarn _(recommended)_

> If you want to enable any of the available integrations, you may want to obtain additional credentials for
> each one. More details can be found below under the [integrations section](#integrations).

### Setup

1. Clone the repo

   ```sh
   git clone https://github.com/nouveauxterritoires/cal.nt.git
   ```

   > If you are on Windows, run the following command in Git Bash with admin privileges:
   > `git clone -c core.symlinks=true https://github.com/nouveauxterritoires/cal.nt.git`

2. Go to the project folder

   ```sh
   cd cal.nt
   ```

3. Install packages with yarn

   ```sh
   yarn
   ```

4. Set up your `.env` file

   - Duplicate `.env.example` to `.env`
   - Use `openssl rand -base64 32` to generate a key and add it under `NEXTAUTH_SECRET` in the `.env` file.
   - Use `openssl rand -base64 24` to generate a key and add it under `CALENDSO_ENCRYPTION_KEY` in the `.env` file.

   > **Windows users:** Replace the `packages/prisma/.env` symlink with a real copy to avoid a Prisma error
   > (`unexpected character / in variable name`):
   >
   > ```sh
   > # Git Bash / WSL
   > rm packages/prisma/.env && cp .env packages/prisma/.env
   > ```

5. Set up Node

   If your Node version does not meet the project's requirements, [nvm](https://github.com/nvm-sh/nvm) lets you
   use the version required by the project:

   ```sh
   nvm install && nvm use
   ```

### Quick start with `yarn dx`

> - **Requires Docker and Docker Compose to be installed**
> - Starts a local Postgres instance with a few test users — the credentials will be logged in the console

```sh
yarn dx
```

**Default credentials created:**

| Email | Password | Role |
|-------|----------|------|
| `free@example.com` | `free` | Free user |
| `pro@example.com` | `pro` | Pro user |
| `trial@example.com` | `trial` | Trial user |
| `admin@example.com` | `ADMINadmin2022!` | Admin user |
| `onboarding@example.com` | `onboarding` | Onboarding incomplete |

Sign in with any of these at [http://localhost:3000](http://localhost:3000).

> **Tip**: To view the full list of seeded users, run `yarn db-studio` and visit
> [http://localhost:5555](http://localhost:5555).

### Development tips

1. Add `export NODE_OPTIONS="--max-old-space-size=16384"` to your shell to increase the memory limit for the
   node process (replace `16384` with the amount of RAM to allocate).

2. Add `NEXT_PUBLIC_LOGGER_LEVEL={level}` to your `.env` file to control logging verbosity for all tRPC queries
   and mutations. `{level}` enables that level **and higher**:

   `0` silly · `1` trace · `2` debug · `3` info · `4` warn · `5` error · `6` fatal

   ```sh
   echo 'NEXT_PUBLIC_LOGGER_LEVEL=3' >> .env
   ```

### Manual setup

1. Configure `DATABASE_URL` in `.env`. Replace `<user>`, `<pass>`, `<db-host>` and `<db-port>` with your values:

   ```
   DATABASE_URL='postgresql://<user>:<pass>@<db-host>:<db-port>'
   ```

   <details>
   <summary>Quick local Postgres DB</summary>

   1. [Download](https://www.postgresql.org/download/) and install PostgreSQL locally.
   2. Create a local db: `createDB <DB name>`
   3. Open a psql shell: `psql -h localhost -U postgres -d <DB name>`
   4. Inside psql run `\conninfo` to get connection details.
   5. Build your URL, e.g. `postgresql://postgres:postgres@localhost:5432/Your-DB-Name`.

   </details>

   If you don't want a local DB, you can use a managed Postgres provider (Railway, Northflank, Render, etc.).

2. Copy your `DATABASE_URL` from `.env` to `.env.appStore`.

3. Set up the database using the Prisma schema (`packages/prisma/schema.prisma`):

   ```sh
   # development
   yarn workspace @calcom/prisma db-migrate
   # production
   yarn workspace @calcom/prisma db-deploy
   ```

4. Run [MailHog](https://github.com/mailhog/MailHog) to view emails sent during development (required when
   `E2E_TEST_MAILHOG_ENABLED` is `"1"`):

   ```sh
   docker run -d -p 8025:8025 -p 1025:1025 mailhog/mailhog
   ```

5. Run in development mode:

   ```sh
   yarn dev
   ```

### Setting up your first user

Seed the local db with dummy users:

```sh
cd packages/prisma
yarn db-seed
```

Or add a user manually via [Prisma Studio](https://prisma.io/studio) (`yarn db-studio`): open the `User`
model, add a record with `email`, `username`, a [BCrypt](https://bcrypt-generator.com/)-hashed `password`, and
set `metadata` to `{}`.

### E2E testing

Make sure `NEXTAUTH_URL` is set correctly (locally: `http://localhost:3000`).

```sh
# run the suite
yarn test-e2e

# open the last HTML report
yarn playwright show-report test-results/reports/playwright-html-report
```

If browsers are missing, install them: `npx playwright install`.

### Upgrading your local checkout

```sh
git pull
yarn                                            # sync dependencies
yarn workspace @calcom/prisma db-migrate        # apply migrations (dev)  — or db-deploy in prod
yarn predev                                     # check for new .env variables
yarn dev                                         # or: yarn build && yarn start
```

## Deployment

Cal.nt is a standard Next.js monorepo and can be self-hosted anywhere you can run Node.js + PostgreSQL, either
directly or via Docker. We do **not** publish prebuilt images — you build from source.

### Build from source with Docker

1. Clone the repository and change into it:

   ```bash
   git clone https://github.com/nouveauxterritoires/cal.nt.git
   cd cal.nt
   ```

2. Prepare your configuration — copy `.env.example` to `.env` and edit it:

   ```bash
   cp .env.example .env
   ```

   **Required secret keys** — generate secure values before starting (do not ship the `secret` placeholder to
   production):

   ```bash
   # NEXTAUTH_SECRET (cookie encryption key)
   openssl rand -base64 32
   # CALENDSO_ENCRYPTION_KEY (must be 32 bytes for AES256)
   openssl rand -base64 24
   ```

   ```env
   NEXTAUTH_SECRET=<your_generated_secret>
   CALENDSO_ENCRYPTION_KEY=<your_generated_key>
   ```

   **Push notifications (VAPID keys)** — if you see `Error: No key set vapidDetails.publicKey`, generate keys
   with `npx web-push generate-vapid-keys` and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

   > Never commit real keys to `.env.example` — only placeholders.

3. A database is required at build time. If you don't have one, start a local one:

   ```bash
   docker compose up -d database
   ```

4. Build and start the web app:

   ```bash
   docker compose build calcom
   docker compose up -d            # full stack, or: docker compose up -d calcom
   ```

5. Open [http://localhost:3000](http://localhost:3000) (or your `NEXT_PUBLIC_WEBAPP_URL`). On first run, a setup
   wizard initialises your first user.

   > If the "Connect your Calendar" step appears required, you can skip it by navigating to
   > `<NEXT_PUBLIC_WEBAPP_URL>/event-types`. Calendar integrations can be added later from Settings.

### Configuration

#### Important run-time variables

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `DATABASE_URL` | Database URL with credentials — if using a connection pooler, point here | required | `postgresql://unicorn_user:magical_password@database:5432/calendso` |
| `NEXT_PUBLIC_WEBAPP_URL` | Base URL of the site. If it differs from the build-time value, there's a short delay on container start to update static files. | optional | `http://localhost:3000` |
| `NEXTAUTH_URL` | Location of the auth server | optional | `{NEXT_PUBLIC_WEBAPP_URL}/api/auth` |
| `NEXTAUTH_SECRET` | Cookie encryption key. Must match build variable. `openssl rand -base64 32` | required | `secret` |
| `CALENDSO_ENCRYPTION_KEY` | Encryption key (32 bytes for AES256). Must match build variable. `openssl rand -base64 24` | required | `secret` |

#### Build-time variables

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `DATABASE_URL` | Database URL with credentials | required | `postgresql://unicorn_user:magical_password@database:5432/calendso` |
| `MAX_OLD_SPACE_SIZE` | Node.js build memory | required | `4096` |
| `NEXTAUTH_SECRET` | Cookie encryption key | required | `secret` |
| `CALENDSO_ENCRYPTION_KEY` | Encryption key | required | `secret` |
| `NEXT_PUBLIC_WEBAPP_URL` | Base URL injected into static files | optional | `http://localhost:3000` |
| `NEXT_PUBLIC_WEBSITE_TERMS_URL` | Custom terms & conditions URL | optional | |
| `NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL` | Custom privacy policy URL | optional | |
| `CALCOM_TELEMETRY_DISABLED` | Set to `1` to disable anonymous usage data | optional | |

#### Feature flags added by this fork

| Variable | Description | Default |
| --- | --- | --- |
| `TEAMS_ENABLED` | Enables the Teams feature (router + UI). Set to `"false"` to disable. | on |
| `SSO_KEYCLOAK_ENABLED` | Enables Keycloak OIDC login (requires `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`). | off |
| `SSO_KEYCLOAK_DISABLE_PASSWORD_LOGIN` | Disable local email/password login when SSO is active. | off |
| `CAL_WEBHOOK_SECRET` | Shared HMAC secret between Cal.nt webhooks and n8n. See the [n8n guide](./docs/workflows-n8n/README.md). | — |

### Troubleshooting

**SSL edge termination** — behind a load balancer that handles SSL, you may need
`NODE_TLS_REJECT_UNAUTHORIZED=0`. Only do this if you trust the services directing traffic to you.

**`Invalid prisma.user.create()`** — some versions fail to create a user when `metadata` is empty; use `{}` as
the value. The `id` field autoincrements, so you can leave it empty.

**`CLIENT_FETCH_ERROR`** — the auth callback uses `WEBAPP_URL` as its base URL, and the container may not
resolve the same DNS as your machine. Set `NEXTAUTH_URL=http://localhost:3000/api/auth` so the backend can loop
back to itself.

## Enabling Content Security Policy

Set `CSP_POLICY="non-strict"` to enable [Strict CSP](https://web.dev/strict-csp/) except for `unsafe-inline` in
`style-src`. Custom changes may need code adjustments to stay CSP-compatible. Strict CSP is currently enabled on
the login page; other SSR pages run it in report-only mode. SSG pages are not yet supported.

## Integrations

### Obtaining the Google API credentials

1. Open [Google API Console](https://console.cloud.google.com/apis/dashboard). Create a project if needed, then
   under the Dashboard select **Enable APIs and Services**.
2. Search for **Google Calendar API** and enable it.
3. Go to the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent), select the app
   type (Internal or External), and fill in the basic app details.
4. In **Scopes**, add `.../auth/calendar.events` and `.../auth/calendar.readonly`.
5. In **Test Users**, add the Google account(s) you'll use.
6. Go to [Credentials](https://console.cloud.google.com/apis/credentials) → **Create Credentials** → **OAuth
   Client ID**, and choose **Web Application**.
7. Under **Authorized redirect URIs**, add `<Cal.nt URL>/api/integrations/googlecalendar/callback` and
   `<Cal.nt URL>/api/auth/callback/google`, replacing `<Cal.nt URL>` with your deployment URL.
8. Download the JSON, then paste its entire contents into `.env` as the value of `GOOGLE_API_CREDENTIALS`.

#### Adding Google Calendar to the App Store

After adding Google credentials, repopulate the App Store:

```sh
cd packages/prisma
yarn seed-app-store
```

Then add the extra redirect URL `<Cal.nt URL>/api/auth/callback/google` and, under the OAuth consent screen,
click **PUBLISH APP**.

### Obtaining Microsoft Graph client ID and secret

1. Open [Azure App Registration](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)
   and select **New registration**.
2. Name your application.
3. Set **Who can use this application** to **Accounts in any organizational directory (Multitenant)**.
4. Set the **Web** redirect URI to `<Cal.nt URL>/api/integrations/office365calendar/callback`.
5. Use the **Application (client) ID** as `MS_GRAPH_CLIENT_ID` in `.env`.
6. Under **Certificates & secrets**, create a client secret and use it as `MS_GRAPH_CLIENT_SECRET`.

### Obtaining Zoom client ID and secret

1. Open [Zoom Marketplace](https://marketplace.zoom.us/), sign in, then **Develop → Build App**.
2. Select **General App** → **Create**, name it, and choose **User-managed app**.
3. Copy the Client ID and Client Secret into `.env` as `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET`.
4. Set the **OAuth Redirect URL** to `<Cal.nt URL>/api/integrations/zoomvideo/callback`, add it as an allow-list
   URL, and enable **Subdomain check**.
5. Under **Scopes**, add `meeting:write:meeting` and `user:read:settings`, then **Done**.

### Obtaining Daily API credentials

1. Create an account at [Daily.co](https://daily.co/).
2. In the [developers](https://dashboard.daily.co/developers) tab, copy your API key into `.env` as
   `DAILY_API_KEY`.
3. If you have the [Daily Scale Plan](https://daily.co/pricing), set `DAILY_SCALE_PLAN=true` to enable features
   like recording.

### Obtaining Basecamp client ID and secret

1. Visit the [37signals Integrations Dashboard](https://launchpad.37signals.com/integrations) and sign in.
2. Register a new application, fill in your company details, and select **Basecamp 4**.
3. Set the OAuth redirect URL to `<Cal.nt URL>/api/integrations/basecamp3/callback`.
4. Copy the Client ID and secret into `BASECAMP3_CLIENT_ID` and `BASECAMP3_CLIENT_SECRET`.
5. Set `BASECAMP3_CLIENT_SECRET` env value to `{your_domain} ({support_email})`.

### Obtaining HubSpot client ID and secret

1. Open [HubSpot Developer](https://developer.hubspot.com/), sign in, and go to **Manage apps**.
2. **Create legacy app** → public app, fill in the **App info** tab.
3. Under **Auth**, copy the Client ID and Client Secret into `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET`.
4. Set the OAuth redirect URL to `<Cal.nt URL>/api/integrations/hubspot/callback`.
5. Under **Scopes**, grant read/write for `crm.objects.contacts` and `crm.lists`, then **Save**.

### Other CRM & calendar integrations

- **Webex** — [see the Webex readme](./packages/app-store/webex/)
- **ZohoCRM** — set `ZOHOCRM_CLIENT_ID` / `ZOHOCRM_CLIENT_SECRET`, redirect `<Cal.nt URL>/api/integrations/zohocrm/callback`
- **Zoho Calendar** — [follow these steps](./packages/app-store/zohocalendar/)
- **Zoho Bigin** — [follow these steps](./packages/app-store/zoho-bigin/)
- **Pipedrive** — [follow these steps](./packages/app-store/pipedrive-crm/)

### Rate limiting with Unkey (optional)

Cal.nt can use [Unkey](https://unkey.com) for rate limiting. It is optional and not required for self-hosting.

1. Sign up at [unkey.com](https://unkey.com).
2. Create a Root key with the `ratelimit.create_namespace` and `ratelimit.limit` permissions.
3. Copy it into `.env` as `UNKEY_ROOT_KEY`.

Without Unkey configured, Cal.nt works normally with rate limiting disabled.

## Contributing

Contributions to Cal.nt are welcome — bug fixes, docs, or new features our fork needs.

> Contributions here do **not** flow to Cal.com's platform. To contribute to the official product, go to
> [cal.com](https://cal.com). See [CONTRIBUTING.md](./CONTRIBUTING.md) for our workflow and coding standards.

## License

Cal.nt is distributed under the [MIT License](https://opensource.org/license/mit).

The upstream codebase this fork is based on is MIT-licensed and © Cal.com, Inc.; that copyright notice is
retained in [`LICENSE`](./LICENSE) as required. Our modifications are likewise released under MIT.

## Acknowledgements

Cal.nt stands entirely on the work of [Cal.com](https://cal.com) and its community edition Cal.diy, and the many
contributors to those projects. Enormous thanks to them for building and open-sourcing a scheduling platform
this good. Thanks also to:

- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [Day.js](https://day.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://prisma.io/)
