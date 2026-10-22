# Deploying MyGyaan CMO on Hostinger — step by step

**Goal:** run the Abacus build (`legacy/abacus-export/app`) on a Hostinger KVM VPS in India, test it on a
staging hostname, then move `cmo.mygyaan.ai` from Abacus to Hostinger with no downtime.

Do the phases in order. Each phase ends with a check; don't go on until it passes.
Commands marked `server$` run on the VPS over SSH; `laptop$` run on your own machine.

---

## Phase 0 — Decide before you buy (10 min)

| Decision | Choice |
| --- | --- |
| Hostinger product | **KVM VPS** (not Web/Cloud hosting: no root, MySQL only) |
| Size | **KVM 2** (2 vCPU, 8 GB RAM, 100 GB NVMe). KVM 1 (4 GB) can run it but `yarn build` may run out of memory. |
| Data centre | **India** — choose it on the order page; it cannot be changed afterwards |
| OS | **Ubuntu 24.04 LTS** (plain, not a "with panel" image) |
| Staging hostname | `cmo-new.mygyaan.ai` — used to test before the real switch |
| Final hostname | `cmo.mygyaan.ai` |

Have ready: your domain's DNS panel login, the private copy of `database/full_dump.sql`
(not in GitHub), and an `ABACUSAI_API_KEY` if you want AI to keep working during transition.

---

## Phase 1 — Create the VPS in hPanel (15 min)

1. Buy the KVM plan → **Setup** → OS **Ubuntu 24.04** → set a strong **root password** → finish.
2. VPS → **Settings → SSH keys** → add your laptop's public key
   (`laptop$ cat ~/.ssh/id_ed25519.pub`; create one with `ssh-keygen -t ed25519` if missing).
3. VPS → **Overview**: note the **IPv4 address** → call it `200.141.14.250` below.
4. VPS → **Security → Firewall** → create a rule set → allow **22, 80, 443** (TCP, any source) → apply.

**Check:** `laptop$ ssh root@200.141.14.250` logs in without asking for a password.

---

## Phase 1b — Existing server: `srv2072914.hstgr.cloud` (KVM 8, 200.141.14.250)

Phases 0–1 are already done: the VPS exists, Ubuntu 24.04, 8 vCPU / 32 GB, 400 GB disk.
It already uses 40 GB and has 4 firewall rules, so **something else is probably running on it**.
Before installing anything, find out what, so the CMO app is added beside it, not on top of it:

```bash
server$ ss -tlnp | grep -E ':80 |:443 |:3000 |:5432 '     # who owns the web, app and Postgres ports
server$ ls /etc/nginx/sites-enabled/ 2>/dev/null           # existing Nginx sites
server$ systemctl is-active nginx postgresql apache2 docker 2>/dev/null
server$ pm2 ls 2>/dev/null; docker ps 2>/dev/null
server$ df -h / && du -sh /var/www /opt /home 2>/dev/null
```

**Findings (22-Oct-2026):** the server already runs another product as a Docker Compose stack
(`app-caddy-1`, `app-app-1`, `app-worker-1`, `app-converter-1`, `app-db-1` on pgvector/pg16, `app-backup-1`).
Host Nginx, Apache and PostgreSQL are **inactive**; **Caddy (in Docker) owns ports 80 and 443**.

So for the CMO app:
- **No Nginx, no certbot.** Caddy is the web server; we add one site block to its Caddyfile and it
  issues the SSL certificate itself.
- The app runs on the host under PM2 in **`/opt/cmomygyaanai`** on **port 3100** (3000 is used inside Docker).
- **Host PostgreSQL** gets installed (port 5432 is free on the host; the Docker Postgres is private to
  the other stack). Keeps the two products' data fully separate.
- Do not touch the `app-*` containers.

---

## Phase 2 — Harden the base system (10 min)

```bash
server$ apt update && apt -y upgrade
server$ timedatectl set-timezone Asia/Kolkata
server$ adduser --disabled-password --gecos "" deploy
server$ usermod -aG sudo deploy
server$ echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy
server$ mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh
server$ ufw allow OpenSSH && ufw allow 80 && ufw allow 443
server$ ufw allow from 172.16.0.0/12 to any port 3100   # lets Caddy (in Docker) reach the app
server$ ufw --force enable
server$ apt -y install fail2ban && systemctl enable --now fail2ban
```

Add 2 GB swap so builds never die on memory:

```bash
server$ fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
server$ echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**Check:** `laptop$ ssh deploy@200.141.14.250` works. From now on log in as `deploy` and use `sudo`.

---

## Phase 3 — Install the runtime (10 min)

No Nginx or certbot: Caddy already handles web traffic and SSL (Phase 1b).

```bash
server$ curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
server$ sudo apt -y install nodejs postgresql postgresql-contrib git build-essential
server$ sudo corepack enable            # yarn 4 — the project's lockfile needs it, not classic yarn 1
server$ sudo npm install -g pm2
server$ node -v && corepack yarn -v && psql --version
```

**Check:** Node `v20.x`, yarn `4.x`, psql `16.x`.

---

## Phase 4 — Create the database (5 min)

```bash
server$ DBPASS=$(openssl rand -hex 24); echo "DB password: $DBPASS"   # save it in your password manager
server$ sudo -u postgres psql -c "CREATE USER mygyaan WITH PASSWORD '$DBPASS';"
server$ sudo -u postgres psql -c "CREATE DATABASE mygyaan_cmo OWNER mygyaan;"
```

**Check:** `psql "postgresql://mygyaan:$DBPASS@localhost:5432/mygyaan_cmo" -c 'select 1'` prints `1`.

---

## Phase 5 — Put the code on the server (10 min)

Clone the GitHub repo (it holds the archived app) with a read-only deploy key:

```bash
server$ ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 && cat ~/.ssh/id_ed25519.pub
```

GitHub → `nandangse/mygyaancmo` → **Settings → Deploy keys → Add** → paste → read-only → save.

```bash
server$ sudo mkdir -p /opt/cmomygyaanai && sudo chown deploy:deploy /opt/cmomygyaanai
server$ git clone git@github.com:nandangse/mygyaancmo.git /opt/mygyaan-src
server$ cp -r /opt/mygyaan-src/legacy/abacus-export/app/. /opt/cmomygyaanai/
server$ cd /opt/cmomygyaanai
```

Remove the two Abacus-only settings:

```bash
server$ sed -i '/globalFolder:/d; /nmMode:/d' .yarnrc.yml
server$ sed -i "s/allowedDevOrigins: \[.*\]/allowedDevOrigins: ['127.0.0.1']/" next.config.js
```

**Check:** `cat .yarnrc.yml` shows no `/opt/hostedapp` line.

---

## Phase 6 — Environment file (10 min)

```bash
server$ cp .env.example .env && nano .env
```

Fill these (leave the rest blank for now):

```
DATABASE_URL="postgresql://mygyaan:<DBPASS>@localhost:5432/mygyaan_cmo?schema=public"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
AUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="https://cmo-new.mygyaan.ai"        # staging now; changed at cutover
SEED_ADMIN_PASSWORD="<strong>"                   # only used if you seed (Option B)
SEED_NANDAN_PASSWORD="<strong>"
SEED_TEST_PASSWORD="<strong>"
ABACUSAI_API_KEY="<your key, or blank>"          # keeps AI + notification emails working during transition
```

```bash
server$ chmod 600 .env
```

---

## Phase 7 — Install dependencies and load the database (15 min)

```bash
server$ cd /opt/cmomygyaanai && yarn install
server$ yarn prisma generate
```

**Option A — restore the real data (recommended):** copy your private dump up and load it.

```bash
laptop$ scp /path/to/full_dump.sql deploy@200.141.14.250:/tmp/
server$ set -a && . ./.env && set +a
server$ psql "$DATABASE_URL" -f /tmp/full_dump.sql && rm /tmp/full_dump.sql
```

**Option B — empty database with seed data:**

```bash
server$ yarn prisma db push && yarn prisma db seed
```

**Check:** `psql "$DATABASE_URL" -c 'select slug from "Company"'` lists `nandan` (and the others).

---

## Phase 8 — Build and run under PM2 (10 min)

```bash
server$ cd /opt/cmomygyaanai && yarn build
server$ pm2 start "yarn start -p 3100" --name cmomygyaanai --cwd /opt/cmomygyaanai
server$ pm2 save && pm2 startup   # run the one command it prints
```

**Check:** `curl -I http://127.0.0.1:3100` returns `HTTP/1.1 200`. Logs: `pm2 logs cmomygyaanai`.

---

## Phase 9 — Staging hostname via Caddy (15 min)

1. DNS panel: add **A record** `cmo-new` → `200.141.14.250`, TTL 300. Wait until `dig +short cmo-new.mygyaan.ai` shows the IP.
2. Find the Caddyfile and the Docker network gateway (the address Caddy uses to reach the host):

```bash
server$ CADDYFILE=$(sudo docker inspect app-caddy-1 --format '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}'); echo "$CADDYFILE"
server$ NET=$(sudo docker inspect app-caddy-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
server$ GW=$(sudo docker network inspect "$NET" --format '{{(index .IPAM.Config 0).Gateway}}'); echo "$GW"
```

   If `$CADDYFILE` is empty, the config is baked into the container or lives elsewhere — stop and send me
   `sudo docker inspect app-caddy-1 --format '{{json .Mounts}}'` and `{{json .Config.Cmd}}`.

3. Add the site block (Caddy issues and renews the certificate automatically):

```bash
server$ sudo cp "$CADDYFILE" "$CADDYFILE.bak-$(date +%F)"
server$ sudo tee -a "$CADDYFILE" >/dev/null <<EOF

cmo-new.mygyaan.ai {
    reverse_proxy $GW:3100
    request_body {
        max_size 100MB
    }
}
EOF
server$ sudo docker exec -w /etc/caddy app-caddy-1 caddy validate --config /etc/caddy/Caddyfile
server$ sudo docker exec -w /etc/caddy app-caddy-1 caddy reload --config /etc/caddy/Caddyfile
server$ sudo docker exec app-caddy-1 wget -qO- http://$GW:3100 | head -c 200   # Caddy can reach the app
```

**Check:** open `https://cmo-new.mygyaan.ai` in a browser: padlock, homepage loads. If the padlock is
missing after 2 minutes: `sudo docker logs app-caddy-1 --tail 50`.

---

## Phase 10 — Test on staging (30 min, you + Vishnu)

Tick every line before cutover:

- [ ] `https://cmo-new.mygyaan.ai` homepage, `/books`, `/partner`, `/testimonials`
- [ ] Login as `admin@mygyaan.ai` → `/admin` → companies list shows Nandan
- [ ] Login as Nandan user → `/nandan` → sidebar, header logo, KPIs, Knowledge Base list
- [ ] Create a test contact, then delete it
- [ ] Email Campaigns and Workflows pages open without 500s
- [ ] AI feature (ICP generate) works if `ABACUSAI_API_KEY` is set; shows a clean error if not
- [ ] `pm2 logs cmomygyaanai --lines 200` has no repeated errors
- [ ] Reboot test: `sudo reboot`, wait 1 min, site comes back on its own

Fix anything that fails here, on staging, before touching the live subdomain.

---

## Phase 11 — Cutover `cmo.mygyaan.ai` from Abacus to Hostinger (1 hour, low-traffic time)

**T-24 h**
1. DNS panel: lower the TTL on the `cmo` A/CNAME record to **300**.
2. Tell users: no edits on the portal between the freeze time and the all-clear.

**T-0 (freeze)**
3. Take a **fresh dump from Abacus** so no data created after 20-Oct is lost
   (Abacus console → database → export; or `pg_dump "$ABACUS_DATABASE_URL" > fresh.sql` if you have the URL).
4. Reload it on Hostinger:

```bash
laptop$ scp fresh.sql deploy@200.141.14.250:/tmp/
server$ cd /opt/cmomygyaanai && set -a && . ./.env && set +a
server$ sudo -u postgres psql -c 'DROP DATABASE mygyaan_cmo;' -c 'CREATE DATABASE mygyaan_cmo OWNER mygyaan;'
server$ psql "$DATABASE_URL" -f /tmp/fresh.sql && rm /tmp/fresh.sql
```

5. Switch the app to the real hostname:

```bash
server$ sed -i 's#NEXTAUTH_URL=.*#NEXTAUTH_URL="https://cmo.mygyaan.ai"#' .env
server$ pm2 restart cmomygyaanai
server$ sudo sed -i 's/^cmo-new.mygyaan.ai {/cmo.mygyaan.ai, cmo-new.mygyaan.ai {/' "$CADDYFILE"   # CADDYFILE from Phase 9
server$ sudo docker exec -w /etc/caddy app-caddy-1 caddy validate --config /etc/caddy/Caddyfile
```

6. DNS panel: change `cmo` → **A record → `200.141.14.250`** (delete the old CNAME to Abacus if that's what it was).
7. Wait until `dig +short cmo.mygyaan.ai` returns `200.141.14.250` (≤ 5 min with TTL 300), then reload
   Caddy; it fetches the certificate for `cmo.mygyaan.ai` within a minute:

```bash
server$ sudo docker exec -w /etc/caddy app-caddy-1 caddy reload --config /etc/caddy/Caddyfile
server$ sudo docker logs app-caddy-1 --tail 20   # look for "certificate obtained"
```

8. Open `https://cmo.mygyaan.ai`, log in, repeat the Phase 10 checklist quickly. Give the all-clear.

**Rollback (if anything is wrong):** point the `cmo` record back at Abacus; it recovers within 5 min.
Keep the Abacus deployment running, untouched, for **7 days**, then delete it.

---

## Phase 12 — Within the first week

1. **Backups** (daily, kept 30 days, stays in India):

```bash
server$ mkdir -p ~/backups && crontab -e
# add:
30 2 * * * cd /opt/cmomygyaanai && set -a && . ./.env && set +a && pg_dump "$DATABASE_URL" | gzip > ~/backups/cmo-$(date +\%F).sql.gz && find ~/backups -mtime +30 -delete
```

   Also switch on Hostinger's **weekly VPS snapshot** (VPS → Backups).
2. **Rotate passwords:** every seeded account, and the platform admin.
3. **Remove the Abacus script tag** in `app/layout.tsx` (line 24, `appllm-lib.js`) — rebuild.
4. **Replace Abacus services** one by one (see `README.md` table): LLM endpoint, notification email,
   S3 bucket in `ap-south-1`, book-cover images.
5. **Updates:** `cd /opt/mygyaan-src && git pull`, copy changes over, `yarn build`, `pm2 restart cmomygyaanai`.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `yarn install` says "This project's package.json defines packageManager / lockfile version" | Run `corepack enable` and use `yarn` 4, not `npm i -g yarn` |
| `yarn build` killed / "JavaScript heap out of memory" | Add swap (Phase 2) or `NODE_OPTIONS=--max-old-space-size=4096 yarn build` |
| Login loops or "callback error" | `NEXTAUTH_URL` must equal the hostname in the browser, including `https://` |
| 502 Bad Gateway | `pm2 status` — app crashed; `pm2 logs` shows why (usually `.env`). If PM2 is fine: `ufw status` must allow 172.16.0.0/12 → 3100 |
| `Environment variable not found: DATABASE_URL` | Run `set -a && . ./.env && set +a` first |
| Uploads fail | AWS_* not set yet (Phase 12 step 4), or the Caddy `max_size` |
| No certificate / Caddy log says "challenge failed" | DNS not propagated yet — `dig +short <host>` must show `200.141.14.250`; then `caddy reload` again |
