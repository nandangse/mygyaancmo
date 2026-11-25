# Go-live checklist — cmo.mygyaan.ai on Hostinger

Server: `srv2072914.hstgr.cloud` · IP `200.141.14.250` · KVM 8 · Ubuntu 24.04. Another product already runs on it
in Docker behind **Caddy** (ports 80/443), so the CMO app runs beside it on port **3100** with its own PostgreSQL.
Code: GitHub `nandangse/mygyaancmo`, branch `claude/adoring-hamilton-pher13`, folder `cmomygyaanai/`.

Tick in order. `root$` = logged in as root, `deploy$` = as the deploy user, `laptop$` = your own machine.

## Part 1 — Server (one-time, ~45 min)

- [ ] **1.1 Log in as root**: `laptop$ ssh root@200.141.14.250`
- [ ] **1.2 Base setup, deploy user, firewall, swap** — paste as one block:
  ```bash
  apt update && apt -y upgrade
  timedatectl set-timezone Asia/Kolkata
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
  echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy
  mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh
  ufw allow OpenSSH && ufw allow 80 && ufw allow 443
  ufw allow from 172.16.0.0/12 to any port 3100
  ufw --force enable
  apt -y install fail2ban && systemctl enable --now fail2ban
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```
  Check: `laptop$ ssh deploy@200.141.14.250` logs in. Use `deploy` from here on.
- [ ] **1.3 Runtime** (as deploy):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt -y install nodejs postgresql postgresql-contrib git build-essential
  sudo corepack enable
  sudo npm install -g pm2
  node -v && corepack yarn -v && psql --version
  ```
  Check: Node v20, yarn 4, psql 16.
- [ ] **1.4 Deploy key** (lets the server pull the code):
  ```bash
  ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 && cat ~/.ssh/id_ed25519.pub
  ```
  Copy the printed line → GitHub → `nandangse/mygyaancmo` → Settings → Deploy keys → Add → read-only.
- [ ] **1.5 Database user and registry DB** (the user needs CREATEDB because the app creates one DB per tenant):
  ```bash
  DBPASS=$(openssl rand -hex 24); echo "DB password: $DBPASS"      # SAVE THIS
  sudo -u postgres psql -c "CREATE USER mygyaan WITH PASSWORD '$DBPASS' CREATEDB;"
  sudo -u postgres psql -c "CREATE DATABASE cmo_registry OWNER mygyaan;"
  ```
- [ ] **1.6 Send me two outputs** (needed for the Caddy block in 2.5):
  ```bash
  sudo docker inspect app-caddy-1 --format '{{json .Mounts}}'
  sudo docker inspect app-caddy-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
  ```

## Part 2 — App (~30 min)

- [ ] **2.1 DNS**: in your domain panel add an **A record** `cmo-new` → `200.141.14.250`, TTL 300.
- [ ] **2.2 Code**:
  ```bash
  sudo mkdir -p /opt/cmomygyaanai && sudo chown deploy:deploy /opt/cmomygyaanai
  git clone git@github.com:nandangse/mygyaancmo.git /opt/mygyaan-src
  cd /opt/mygyaan-src && git checkout claude/adoring-hamilton-pher13
  cp -r /opt/mygyaan-src/cmomygyaanai/. /opt/cmomygyaanai/ && cd /opt/cmomygyaanai
  sed -i "s/allowedDevOrigins: \[.*\]/allowedDevOrigins: ['127.0.0.1']/" next.config.js
  ```
- [ ] **2.3 Secrets** — `cp .env.example .env && nano .env` and fill:
  ```
  DATABASE_URL="postgresql://mygyaan:<DBPASS>@localhost:5432/cmo_registry?schema=public"
  TENANT_DB_ADMIN_URL="postgresql://mygyaan:<DBPASS>@localhost:5432/postgres"
  TENANT_DB_KEY="<openssl rand -base64 32>"        # BACK THIS UP — it encrypts every tenant's DB link
  NEXTAUTH_SECRET="<openssl rand -base64 32>"
  AUTH_SECRET="<openssl rand -base64 32>"
  NEXTAUTH_URL="https://cmo-new.mygyaan.ai"        # changed to cmo.mygyaan.ai at cutover
  ADMIN_EMAIL="<your admin login email>"
  ADMIN_PASSWORD="<12+ characters>"
  ADMIN_NAME="Dr Raghu"
  AUTOMATION_TICK_KEY="<openssl rand -hex 24>"
  ABACUSAI_API_KEY="<your Abacus key, or blank>"   # keeps AI working until you switch model provider
  ```
  Then `chmod 600 .env`. Keep DBPASS, TENANT_DB_KEY and ADMIN_PASSWORD in your password manager.
- [ ] **2.4 Install, registry, admin, build, run**:
  ```bash
  yarn install && yarn prisma generate
  yarn prisma db push
  yarn bootstrap                       # ends with "Bootstrap complete"
  yarn build
  pm2 start "yarn start -p 3100" --name cmomygyaanai --cwd /opt/cmomygyaanai
  pm2 save && pm2 startup              # run the one command it prints
  curl -I http://127.0.0.1:3100        # expect HTTP/1.1 200
  ```
- [ ] **2.5 Caddy site block** — I send you the exact lines after 1.6. It adds `cmo-new.mygyaan.ai { reverse_proxy <gateway>:3100 }`
  to the Caddyfile and reloads Caddy; Caddy issues the SSL certificate itself.
  Check: `https://cmo-new.mygyaan.ai` opens with a padlock.
- [ ] **2.6 Create Nandan (tenant #1)**: log in with ADMIN_EMAIL / ADMIN_PASSWORD → `/admin/companies` → Create Company:
  name `Nandan GSE`, slug `nandan`, agency MyGyaan, region **India**, Database URL blank → Create.
  The app creates `cmo_t_nandan`, applies the schema and shows **DB: ready**. Then open `/nandan/dashboard`.
- [ ] **2.7 Users**: `/nandan/settings` → Users & Roles → add Vishnu (client_admin) and yourself; forward the set-password links.
- [ ] **2.8 Crons** (`crontab -e` as deploy; `mkdir -p ~/backups` first):
  ```
  */5 * * * * curl -s -X POST -H "x-tick-key: <AUTOMATION_TICK_KEY>" https://cmo-new.mygyaan.ai/api/webhooks/automation-tick > /dev/null
  30 2 * * * for db in $(psql -tA "postgresql://mygyaan:<DBPASS>@localhost:5432/postgres" -c "select datname from pg_database where datname like 'cmo_%'"); do pg_dump "postgresql://mygyaan:<DBPASS>@localhost:5432/$db" | gzip > ~/backups/$db-$(date +\%F).sql.gz; done; find ~/backups -mtime +30 -delete
  ```
  Also switch on Hostinger's weekly VPS snapshot.

## Part 3 — Connect the channels (each unlocks a feature)

| # | You provide | Where to put it | Unlocks |
| --- | --- | --- | --- |
| 3.1 | LLM key (Abacus for now, or an India-hosted model) | `.env` → `pm2 restart cmomygyaanai` | AI lead scoring, ICP sentence, email drafts |
| 3.2 | SPF, DKIM, DMARC records for `nandan.co.in` | Your DNS panel; verify at `/nandan/integrations` → Sending domains | Safe email sending (do not send before DKIM passes) |
| 3.3 | Mailer Cloud (or SendGrid / SES) API key + From address | `/nandan/integrations` → Email → Add → Set active | Live campaign and automation emails |
| 3.4 | Meta WhatsApp Cloud API: App ID, App Secret, permanent token, Phone Number ID, WABA ID | `/nandan/whatsapp` → provider | Live WhatsApp messages and automation steps |
| 3.5 | Apollo API key | `/nandan/integrations` → Enrichment | Rule of One audiences, enrichment |
| 3.6 | S3-compatible bucket in Mumbai (`AWS_*` values) | `.env` | Knowledge-base uploads, logos |
| 3.7 | Vapi key + Indian number (Exotel/Plivo) | `/nandan/integrations` → Voice | Speed-to-Lead voice agent |

## Part 4 — Decisions only you can make

- [ ] **4.1 ICP scoring weights** at `/nandan/icp` → Fit scoring. The defaults are too generous (13 of 14 demo contacts scored High). Set Nandan's real rules, then "Recalculate all".
- [ ] **4.2 The 1,188-contact FlashGro list** — looks like US IT consultancies, not GSE buyers. Discard, or import only after you confirm it is the right audience.
- [ ] **4.3 Tags**: `/nandan/tags` → import the manufacturing taxonomy, then rename/add to match how Nandan talks.
- [ ] **4.4 First automations**: `/nandan/automations` → New → start from "RFQ follow-up", edit the email text, Activate.
- [ ] **4.5 Cutover date** for `cmo.mygyaan.ai`: a low-traffic hour, with the DNS TTL lowered 24 h before.
- [ ] **4.6 Phase 3 go/no-go**: tracking script + Signals (needs the snippet on nandan.co.in and a reverse-IP provider), dynamic Segments, AI assistant with typed tools.

## Part 5 — Cutover of cmo.mygyaan.ai (1 hour, after Parts 1–3 are green)

- [ ] **5.1 T-24 h**: lower the TTL of the `cmo` record to 300; tell users about a 1-hour edit freeze.
- [ ] **5.2** Switch the app to the real hostname:
  ```bash
  cd /opt/cmomygyaanai
  sed -i 's#NEXTAUTH_URL=.*#NEXTAUTH_URL="https://cmo.mygyaan.ai"#' .env
  pm2 restart cmomygyaanai
  ```
  and in the Caddyfile change `cmo-new.mygyaan.ai {` to `cmo.mygyaan.ai, cmo-new.mygyaan.ai {` (exact command comes with 2.5).
- [ ] **5.3** DNS: change `cmo` → A record `200.141.14.250` (remove the old CNAME to Abacus).
- [ ] **5.4** When `dig +short cmo.mygyaan.ai` shows `200.141.14.250`: reload Caddy (`sudo docker exec -w /etc/caddy app-caddy-1 caddy reload --config /etc/caddy/Caddyfile`); the certificate arrives within a minute.
- [ ] **5.5** Log in at `https://cmo.mygyaan.ai`, check `/admin` and `/nandan`, update the cron URLs in 2.8 to `cmo.mygyaan.ai`.
- [ ] **5.6** Keep Abacus untouched for 7 days (rollback = point DNS back), then delete it.

## Done already (for the record)

Database-per-tenant with region; CRM (Contact/Account 360, tags, dashboard); automations engine + builder; ICP fit scoring;
integration readiness + sending-domain checks; ABM campaign audience; Apollo-aware CSV import; weekly CMO report;
Abacus widget removed; Next.js 16.4.6 (the older version refused to build); production build passes.
