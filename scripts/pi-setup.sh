#!/usr/bin/env bash
# ============================================================
# ClassMate — Raspberry Pi first-time setup (idempotent)
#
# Mirrors the BlackBox Pi pattern (shared with other projects):
#   - process manager: systemd        (NOT pm2 / docker)
#   - reverse proxy:    nginx          (vhost per hostname; cloudflared -> :80)
#   - package manager:  pnpm via corepack (pinned to v10 for Node 20)
#   - ports 22/53/80/3000/3005/3100/3101/8000/8080/10000 are taken by other apps
#       -> ClassMate uses 3110 (frontend) and 3111 (backend)
#   - app in /var/www/classmate, logs in /var/log/classmate
#
# Safe to re-run. Never overwrites existing secrets or touches other projects.
# Secrets are passed via env at run time (NOT committed):
#   RESEND_API_KEY=... MAIL_FROM='ClassMate <noreply@rezwoan.me>' bash pi-setup.sh
# ============================================================
set -euo pipefail

REPO_URL="https://github.com/Rezwoan/ClassMate.git"
APP_DIR="/var/www/classmate"
LOG_DIR="/var/log/classmate"
DOMAIN="classmate.rezwoan.me"
BACKEND_PORT=3111
FRONTEND_PORT=3110
USER_NAME="$(whoami)"
PNPM_VER="${PNPM_VER:-10}"

# Secrets (placeholders unless provided via env at run time)
RESEND_API_KEY="${RESEND_API_KEY:-re_REPLACE_ME}"
MAIL_FROM="${MAIL_FROM:-ClassMate <noreply@rezwoan.me>}"
VAPID_SUBJECT="${VAPID_SUBJECT:-mailto:frezwoan@gmail.com}"

echo "=== ClassMate Pi setup ==="
command -v node >/dev/null || { echo "Node.js is required"; exit 1; }
command -v corepack >/dev/null || { echo "corepack is required"; exit 1; }
corepack prepare "pnpm@${PNPM_VER}" --activate >/dev/null 2>&1 || true
echo "node $(node -v), pnpm $(pnpm -v)"

# ── 1. Repo ───────────────────────────────────────────────
echo "[1/9] Repo at $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown -R "$USER_NAME:$USER_NAME" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
fi

# ── 2. Log dir ────────────────────────────────────────────
echo "[2/9] Logs at $LOG_DIR"
sudo mkdir -p "$LOG_DIR"
sudo chown -R "$USER_NAME:$USER_NAME" "$LOG_DIR"

# ── 3. Backend deps (needed for VAPID generation + build) ─
echo "[3/9] Installing backend deps"
cd "$APP_DIR/backend"
pnpm install --frozen-lockfile

# ── 4. Env files (created only if missing — never overwrite secrets) ──
echo "[4/9] Environment files"
if [ ! -f "$APP_DIR/backend/.env" ]; then
  JWT_ACCESS_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  JWT_REFRESH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  VAPID="$(node -e "const k=require('web-push').generateVAPIDKeys();console.log(k.publicKey+' '+k.privateKey)")"
  VAPID_PUBLIC_KEY="${VAPID%% *}"
  VAPID_PRIVATE_KEY="${VAPID##* }"
  cat > "$APP_DIR/backend/.env" <<EOF
NODE_ENV=production
PORT=$BACKEND_PORT
FRONTEND_URL=https://$DOMAIN
DATABASE_URL="file:../database/classmate.db"
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_REFRESH_TTL=7d
RESEND_API_KEY=$RESEND_API_KEY
MAIL_FROM=$MAIL_FROM
VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
VAPID_SUBJECT=$VAPID_SUBJECT
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
EOF
  echo "  created backend/.env (fresh JWT + VAPID keys)"
else
  echo "  backend/.env exists — left untouched"
fi

if [ ! -f "$APP_DIR/frontend/.env.local" ]; then
  VPUB="$(grep '^VAPID_PUBLIC_KEY=' "$APP_DIR/backend/.env" | cut -d= -f2-)"
  cat > "$APP_DIR/frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN
NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VPUB
EOF
  echo "  created frontend/.env.local"
else
  echo "  frontend/.env.local exists — left untouched"
fi

# ── 5. Backend build + database ───────────────────────────
echo "[5/9] Building backend + applying migrations"
cd "$APP_DIR/backend"
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run build

# ── 6. Frontend build ─────────────────────────────────────
echo "[6/9] Building frontend"
cd "$APP_DIR/frontend"
pnpm install --frozen-lockfile
pnpm run build

# ── 7. systemd services ───────────────────────────────────
echo "[7/9] systemd services"
sudo tee /etc/systemd/system/classmate-backend.service >/dev/null <<EOF
[Unit]
Description=ClassMate — NestJS API
After=network.target

[Service]
User=$USER_NAME
Group=$USER_NAME
WorkingDirectory=$APP_DIR/backend
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5s
StandardOutput=append:$LOG_DIR/backend.log
StandardError=append:$LOG_DIR/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/classmate-frontend.service >/dev/null <<EOF
[Unit]
Description=ClassMate — Next.js Frontend
After=network.target classmate-backend.service

[Service]
User=$USER_NAME
Group=$USER_NAME
WorkingDirectory=$APP_DIR/frontend
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT
ExecStart=/usr/bin/node node_modules/.bin/next start -p $FRONTEND_PORT
Restart=on-failure
RestartSec=5s
StandardOutput=append:$LOG_DIR/frontend.log
StandardError=append:$LOG_DIR/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable classmate-backend.service classmate-frontend.service
sudo systemctl restart classmate-backend.service
sudo systemctl restart classmate-frontend.service

# ── 8. nginx vhost ────────────────────────────────────────
echo "[8/9] nginx vhost for $DOMAIN"
sudo tee /etc/nginx/sites-available/classmate >/dev/null <<EOF
# ClassMate — $DOMAIN  (cloudflared tunnel -> nginx :80 -> here)
server {
    listen 80;
    server_name $DOMAIN;

    # Real client IP from Cloudflare
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    client_max_body_size 12M;

    # Backend API (NestJS global prefix is /api)
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
    }

    # Next.js immutable assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker must never be cached (so updates roll out)
    location = /sw.js {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        add_header Cache-Control "no-cache";
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/classmate /etc/nginx/sites-enabled/classmate
sudo nginx -t && sudo systemctl reload nginx

# ── 9. Status ─────────────────────────────────────────────
echo "[9/9] Service status"
systemctl --no-pager --no-legend status classmate-backend.service  | head -3 || true
systemctl --no-pager --no-legend status classmate-frontend.service | head -3 || true

cat <<EOF

Remaining one-time steps (automated by the deploy operator, documented here):
  A) Cloudflare Tunnel:
       cloudflared tunnel route dns 27a45beb-cb35-4793-ae4c-3ec398928907 $DOMAIN
     Add to /etc/cloudflared/config.yml BEFORE the http_status:404 line:
       - hostname: $DOMAIN
         service: http://localhost:80
     sudo systemctl restart cloudflared
  B) Dedicated GitHub Actions runner (labels: classmate) for auto-deploy.

Done. Local: http://localhost:$FRONTEND_PORT  |  Public: https://$DOMAIN
EOF
