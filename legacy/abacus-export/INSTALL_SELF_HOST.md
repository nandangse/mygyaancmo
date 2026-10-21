# MyGyaan CMO Portal — Self-Hosting & Installation Guide

**Target:** run this application on your own server in **India**, independent of the Abacus.AI platform.
**Generated:** 20-Oct-2026
**Read first:** `CONSOLIDATED_HISTORY.md` (what the product is and how it is built).

This guide takes you from a bare India VPS/Cloud server to a running, production CMO portal, and then explains how to (7) replace the Abacus-provided services for full India residency and (8) implement the database-per-tenant architecture.

---

## 0. What you are deploying

- A **Next.js 16** application (React 19, TypeScript) — server-rendered, runs under Node.js.
- A **PostgreSQL** database accessed via **Prisma ORM**.
- Authentication via **NextAuth v5** (email + password).
- Optional external services (AI, file storage, email) — see Section 7.

> **Shared hosting will NOT work.** This is a Node.js server application and needs a VPS or Cloud server where you control Node, Nginx and PostgreSQL. A Hostinger **VPS / Cloud** plan (Mumbai region) is suitable; a Hostinger **shared/web-hosting** plan is not.

---

## 1. Server prerequisites

Provision an **India-region** Linux server (Ubuntu 22.04/24.04 recommended). On it install:

```bash
# Node.js 20 LTS (project requires >=20.9)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Yarn (this project uses yarn, not npm)
sudo corepack enable && corepack prepare yarn@stable --activate
# (or: npm install -g yarn)

# PostgreSQL 15/16/17 (an India-region instance)
sudo apt-get install -y postgresql postgresql-contrib

# Nginx (reverse proxy + SSL) and certbot
sudo apt-get install -y nginx
sudo apt-get install -y certbot python3-certbot-nginx

# Build essentials
sudo apt-get install -y git build-essential
```

Verify: `node -v` (v20+), `yarn -v`, `psql --version` (15+).

---

## 2. Create the database

Create a PostgreSQL database and user **in your India region**:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER mygyaan WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE mygyaan_cmo OWNER mygyaan;
GRANT ALL PRIVILEGES ON DATABASE mygyaan_cmo TO mygyaan;
SQL
```

Your `DATABASE_URL` will be:
```
postgresql://mygyaan:choose-a-strong-password@localhost:5432/mygyaan_cmo?schema=public
```

---

## 3. Load the application code & configure environment

```bash
# Put the code where you want it to live
cd /opt   # or /home/youruser
# copy the `app/` folder from this bundle here, e.g. as `mygyaan-cmo`
cp -r /path/to/bundle/app /opt/mygyaan-cmo
cd /opt/mygyaan-cmo

# Create your real .env from the template
cp .env.example .env
nano .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, AUTH_SECRET, NEXTAUTH_URL, seed passwords
```

Generate the two auth secrets:
```bash
openssl rand -base64 32   # paste as NEXTAUTH_SECRET
openssl rand -base64 32   # paste as AUTH_SECRET
```

Set `NEXTAUTH_URL` to the public URL you will serve from, e.g. `https://cmo.yourdomain.com`.

---

## 4. Install dependencies & load the database

```bash
cd /opt/mygyaan-cmo

# Install packages (uses the included yarn.lock)
yarn install

# Generate the Prisma client
yarn prisma generate
```

Now load the database. **Choose ONE of the two options:**

### Option A — Restore the exact export (recommended: keeps all current data)
Loads the schema and all existing rows (tenants, users, 22 books, seed data) from the dump:
```bash
psql "$DATABASE_URL" -f /path/to/bundle/database/full_dump.sql
```

### Option B — Fresh schema from Prisma, then seed
Start with an empty, clean database:
```bash
yarn prisma db push        # creates all tables from schema.prisma
yarn prisma db seed        # runs scripts/safe-seed.ts (uses SEED_* passwords from .env)
```

> After Option A, you do **not** need to seed. After Option B you get a fresh seed set. Either way, **change the admin/tenant passwords after first login.**

---

## 5. Build & run

```bash
cd /opt/mygyaan-cmo
yarn build        # production build
yarn start        # starts Next.js on port 3000
```

Keep it running with a process manager (PM2):
```bash
sudo npm install -g pm2
pm2 start "yarn start" --name mygyaan-cmo
pm2 save
pm2 startup       # follow the printed command so it restarts on reboot
```

---

## 6. Nginx reverse proxy + SSL

Create `/etc/nginx/sites-available/mygyaan-cmo`:

```nginx
server {
    server_name cmo.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    client_max_body_size 50M;   # allow Knowledge-Base file uploads
}
```

Enable and secure it:
```bash
sudo ln -s /etc/nginx/sites-available/mygyaan-cmo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d cmo.yourdomain.com   # issues + auto-renews Let's Encrypt SSL
```

Point your domain's DNS A-record at the server's IP first, then run certbot.

Your portal is now live at `https://cmo.yourdomain.com`.

---

## 7. Replacing Abacus-provided services (for FULL India residency)

The app currently uses five Abacus.AI managed services. They keep working if you supply `ABACUSAI_API_KEY`, **but those requests leave India**. For full India data residency, replace each with an India-hosted (or self-controlled) provider. Each is isolated in `lib/`, so swaps are localised.

| Service | Used for | Where in code | India-residency replacement |
|---|---|---|---|
| **LLM / AI** | Text + image generation (drafts, ICP, strategy, workflows, scoring) | `lib/` LLM client (OpenAI-compatible calls) | Point the client's base URL + key at an India-hosted OpenAI-compatible model, or a provider with an India region. Keep the same request shape. |
| **Cloud storage (S3)** | KB uploads, logos, book covers | `lib/s3.ts` | Any S3-compatible bucket in `ap-south-1` (AWS Mumbai) or an India MinIO. Set `AWS_*` in `.env`. |
| **Email notifications** | Owner alerts (SEO report, projection leads, partner apps) | `sendNotificationEmail()` helper in `lib/` | Replace with SMTP or **Mailer Cloud** (already integrated for campaigns) and remove the `NOTIF_ID_*` envs. |
| **HTML→PDF** | Report/invoice PDFs | PDF helper in `lib/` | Install Playwright/Puppeteer on the server and render locally, or any India PDF API. |
| **FFmpeg** | Any video/audio processing | FFmpeg helper in `lib/` | Install `ffmpeg` on the server (`sudo apt-get install ffmpeg`) and call it locally. |

> **Email campaigns** already go through a provider-agnostic sender (`lib/email.ts`) that reads the tenant's active integration — configure **Mailer Cloud / SendGrid / SES** per tenant at `/[tenant]/integrations`. No code change needed for campaign sending.

If you leave `ABACUSAI_API_KEY` set, AI and the notification emails keep working during the transition; swap them when ready.

---

## 8. Database-per-tenant & movable per-country instances (the key architecture requirement)

This is the headline requirement from Dr Raghu (see `CONSOLIDATED_HISTORY.md` §4.1–4.2). The app today uses **one shared database with `companyId` on every row**. To meet **(a) data residency per tenant** and **(b) a separate database per tenant**, implement the following. The current code is structured to make this a localised change because every DB call goes through one Prisma client module.

### 8.1 Target model

```
            +-------------------------+
            |   Tenant Registry DB    |   <- small catalog DB (hosted in India)
            |  slug -> { dbUrl,       |
            |            region }     |
            +-----------+-------------+
                        |
   per request: resolve tenant slug -> look up its dbUrl+region
                        |
   +--------------------+--------------------+-----------------+
   |                    |                    |                 |
+--v---+            +---v---+            +---v---+         +---v---+
|Nandan|            | Fabro |            |Tenant3|   ...   |TenantN|
| DB   |            |  DB   |            |  DB   |         |  DB   |
|(India)|           |(India)|           | (EU)  |         |(India)|
+------+            +-------+            +-------+         +-------+
```

- **One shared application** (hosted in India) + **one database per tenant**, each pinned to that customer's required region (India by default; EU/other for overseas customers). This is exactly the "movable to different countries" requirement: an individual tenant's DB can sit in a different country without moving the app.

### 8.2 Implementation steps

1. **Tenant registry.** Create a small catalog database (in India) with a `tenants` table: `slug`, `dbUrl` (connection string, stored encrypted), `region`, `status`. This replaces hard-coding one `DATABASE_URL`.
2. **Per-request DB routing.** Change the Prisma client module (`lib/db.ts`) from a single global client to a **per-tenant client factory** keyed by slug: resolve the slug (already available from the `/[tenant]/…` route), look up its `dbUrl`, and return/cache a `PrismaClient` for that URL. Cache clients (LRU) to respect the connection limits.
3. **Onboarding provisioning.** Add an onboarding step that, for each new tenant, **creates a fresh database in the chosen region**, runs `prisma migrate deploy` against it, seeds the per-tenant defaults, and writes the row into the registry. Automate via your cloud provider's API (AWS RDS / managed Postgres in the chosen region).
4. **Migration fan-out.** On every release, run `prisma migrate deploy` against **every** tenant DB (iterate the registry). Add a small script for this; make it idempotent.
5. **Region tagging.** Add a `region` field to the tenant record + an onboarding selector, so residency is a first-class choice at onboarding (per Decision 4.1).
6. **Drop the `companyId` requirement gradually.** With physical separation, cross-tenant leakage is impossible by construction; `companyId` scoping can remain as defence-in-depth but is no longer the only guard.

### 8.3 Migrating existing data into per-tenant DBs
For each existing tenant, export its rows from the shared dump filtered by `companyId` into that tenant's new database. Start with Nandan (the live tenant). The current shared dump in `database/full_dump.sql` is the source.

> **Do not rebuild the data layer speculatively beyond this plan.** Build the registry + routing first, validate with Nandan + one test tenant, then onboard the rest.

---

## 9. Operational notes

- **Backups:** schedule `pg_dump` daily per database, store backups **in India**, keep 30-day retention, and test a restore before loading real customer data.
- **Connection limits:** PostgreSQL default is ~100 connections; with per-tenant clients, cache and cap them (e.g. PgBouncer in front).
- **Uploads:** `client_max_body_size` in Nginx must allow your largest KB file; the app checks file size client-side (≤100MB single-part, larger = multipart) when using S3.
- **NEXTAUTH_URL:** must match the public domain exactly, or logins will fail.
- **Logs:** `pm2 logs mygyaan-cmo`.
- **Updates/versioning:** the app has an admin versioning flow — push updates to a tenant only after their agreement (customer-agreement rule).

---

## 10. Quick start (condensed)

```bash
# 1. prerequisites: Node 20, yarn, PostgreSQL, Nginx, certbot (Section 1)
# 2. create DB (Section 2)
# 3. code + env
cp -r bundle/app /opt/mygyaan-cmo && cd /opt/mygyaan-cmo
cp .env.example .env && nano .env        # DATABASE_URL, secrets, NEXTAUTH_URL, SEED_*
# 4. install + load data
yarn install && yarn prisma generate
psql "$DATABASE_URL" -f bundle/database/full_dump.sql   # Option A (keep data)
# 5. build + run
yarn build && pm2 start "yarn start" --name mygyaan-cmo && pm2 save
# 6. nginx + ssl (Section 6)
```

---

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| `Environment variable not found: DATABASE_URL` in a script | Only Prisma CLI auto-loads `.env`. For ad-hoc scripts: `yarn tsx --require dotenv/config <script>` or `set -a && . ./.env && set +a && node …` |
| Login returns blank / callback error | `NEXTAUTH_URL` must equal the public domain; `NEXTAUTH_SECRET` + `AUTH_SECRET` must be set. |
| Prisma client errors after pulling code | Re-run `yarn prisma generate`. |
| File uploads fail | Check `AWS_*` env, bucket CORS (allow your origin, PUT/POST/GET/HEAD), and Nginx `client_max_body_size`. |
| AI features return errors | `ABACUSAI_API_KEY` empty and not yet replaced — set a key or point the LLM client at your India model (Section 7). |
| Build fails on `webpack` key | This project uses Turbopack; never add a `webpack` key to `next.config.js`. |

---

*End of install guide. For the full story and sources, see `CONSOLIDATED_HISTORY.md`.*
