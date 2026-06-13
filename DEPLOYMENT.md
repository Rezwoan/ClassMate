# ClassMate — Deployment Guide

> **Live URL:** https://classmate.rezwoan.me
> **Server:** Raspberry Pi 5 — `blackbox.local` (user `reezz`), app at `/var/www/classmate`
> **CI/CD:** GitHub Actions → dedicated self-hosted runner on the Pi (label `classmate`)
> **Repo:** https://github.com/Rezwoan/ClassMate

The Pi also hosts other projects (RepRush, a portfolio, AdGuard, RaspAP, Webmin).
ClassMate is scoped to its own ports/services and never touches them.

---

## Architecture

```
Internet
  └── Cloudflare (DNS + TLS)
        └── Cloudflare Tunnel (cloudflared, systemd — no port forwarding)
              └── classmate.rezwoan.me → http://localhost:80
                    └── nginx vhost (server_name classmate.rezwoan.me)
                          ├── /api/  → NestJS backend  (127.0.0.1:3111)
                          └── /      → Next.js frontend (127.0.0.1:3110)
```

- **Process manager:** systemd (`classmate-backend.service`, `classmate-frontend.service`)
- **Package manager:** pnpm 10 via corepack (Node 20 on the Pi)
- **Ports:** frontend **3110**, backend **3111**
  (22/53/80/3000/3005/3100/3101/8000/8080/10000 belong to other apps)
- **Database:** SQLite at `/var/www/classmate/backend/database/classmate.db`
  (gitignored; survives deploys; migrations applied with `prisma migrate deploy`)

---

## First-time setup (run once)

```bash
ssh reezz@blackbox.local
curl -fsSL https://raw.githubusercontent.com/Rezwoan/ClassMate/main/scripts/pi-setup.sh -o /tmp/cm-setup.sh
RESEND_API_KEY='re_xxx' MAIL_FROM='ClassMate <noreply@rezwoan.me>' bash /tmp/cm-setup.sh
```

`scripts/pi-setup.sh` is idempotent and will: clone to `/var/www/classmate`, create
`backend/.env` (fresh JWT + VAPID keys) and `frontend/.env.local` **only if missing**,
build both apps, run migrations, and install + enable the two systemd services and the
nginx vhost. Secrets are passed via env at run time and never committed.

### Cloudflare Tunnel (one-time)

```bash
cloudflared tunnel route dns 27a45beb-cb35-4793-ae4c-3ec398928907 classmate.rezwoan.me
# Add to /etc/cloudflared/config.yml BEFORE the `- service: http_status:404` line:
#   - hostname: classmate.rezwoan.me
#     service: http://localhost:80
sudo systemctl restart cloudflared
```

### CI/CD — self-hosted runner (one-time)

The Pi has no public inbound access, so a dedicated runner **polls** GitHub:

```bash
mkdir -p ~/actions-runner-classmate && cd ~/actions-runner-classmate
curl -O -L https://github.com/actions/runner/releases/download/v2.334.0/actions-runner-linux-arm64-2.334.0.tar.gz
tar xzf actions-runner-linux-arm64-2.334.0.tar.gz
./config.sh --url https://github.com/Rezwoan/ClassMate \
  --token <REG_TOKEN> --name blackbox-classmate --labels classmate --unattended
sudo ./svc.sh install reezz && sudo ./svc.sh start
```

After this, every push to `main` runs `.github/workflows/deploy.yml` →
`scripts/deploy.sh` (pull → install → migrate → build both → restart → health check).

---

## Environment variables (Pi only — gitignored)

### Backend — `/var/www/classmate/backend/.env`
| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3111` |
| `FRONTEND_URL` | `https://classmate.rezwoan.me` |
| `DATABASE_URL` | `file:../database/classmate.db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | auto-generated on the Pi |
| `RESEND_API_KEY` | Resend key (passed at setup) |
| `MAIL_FROM` | `ClassMate <noreply@rezwoan.me>` (verified domain) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | auto-generated on the Pi |

### Frontend — `/var/www/classmate/frontend/.env.local`
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://classmate.rezwoan.me` (baked into the build) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | same public VAPID key as the backend |

---

## Operations

```bash
# Status / logs
systemctl status classmate-backend classmate-frontend
tail -f /var/log/classmate/backend.log
sudo journalctl -u classmate-backend -f

# Restart
sudo systemctl restart classmate-backend classmate-frontend

# Manual deploy (same as CI)
bash /var/www/classmate/scripts/deploy.sh

# Health
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3111/api/health   # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3110              # 200

# DB backup
cp /var/www/classmate/backend/database/classmate.db ~/classmate-backup-$(date +%Y%m%d).db
```

---

## Troubleshooting

```bash
# Site down
systemctl status classmate-backend classmate-frontend
sudo nginx -t && sudo systemctl status nginx
systemctl status cloudflared

# Ports must stay on 3110/3111
sudo ss -tlnp | grep -E ':3110|:3111'

# Deploy/build failed — inspect on the Pi
sudo journalctl -u classmate-backend -n 100
tail -n 100 /var/log/classmate/frontend-error.log
```
