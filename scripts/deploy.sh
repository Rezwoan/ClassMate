#!/usr/bin/env bash
# ============================================================
# ClassMate — Deploy script
# Run by the self-hosted GitHub Actions runner on every push to main.
# Manual:  ssh reezz@blackbox.local 'bash /var/www/classmate/scripts/deploy.sh'
#
# The live dir is a git checkout of main. We hard-reset to the pushed commit,
# rebuild both apps, run migrations, then restart the systemd services.
# Gitignored files (.env, database/, node_modules/, .next/, dist/) survive.
# ============================================================
set -euo pipefail

APP_DIR="/var/www/classmate"
BACKEND_PORT=3111
FRONTEND_PORT=3110

echo "[deploy] $(date) — starting"

# Ensure pnpm (v10, Node-20 compatible) is available.
corepack prepare pnpm@10 --activate >/dev/null 2>&1 || true

# ── 1. Pull latest ────────────────────────────────────────
echo "[1/6] Fetching latest main..."
git -C "$APP_DIR" fetch origin main
git -C "$APP_DIR" reset --hard origin/main

# ── 2. Backend deps + migrations + build ──────────────────
echo "[2/6] Backend: install + migrate + build..."
cd "$APP_DIR/backend"
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run build

# ── 3. Frontend deps + build ──────────────────────────────
echo "[3/6] Frontend: install + build..."
cd "$APP_DIR/frontend"
pnpm install --frozen-lockfile
pnpm run build

# ── 4. Restart services ───────────────────────────────────
echo "[4/6] Restarting services..."
sudo systemctl restart classmate-backend.service
sudo systemctl restart classmate-frontend.service

# ── 5. Health check ───────────────────────────────────────
echo "[5/6] Health check..."
sleep 6
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}/api/health" 2>/dev/null || echo 000)
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${FRONTEND_PORT}" 2>/dev/null || echo 000)
echo "  backend  :${BACKEND_PORT}/api/health -> HTTP $BACKEND"
echo "  frontend :${FRONTEND_PORT}            -> HTTP $FRONTEND"

if [[ "$BACKEND" != "200" ]]; then
  echo "[deploy] ✗ backend health failed ($BACKEND)"
  sudo journalctl -u classmate-backend.service -n 40 --no-pager
  exit 1
fi
if [[ "$FRONTEND" != "200" && "$FRONTEND" != "307" && "$FRONTEND" != "302" ]]; then
  echo "[deploy] ✗ frontend health failed ($FRONTEND)"
  sudo journalctl -u classmate-frontend.service -n 40 --no-pager
  exit 1
fi

# ── 6. Done ───────────────────────────────────────────────
echo "[6/6] [deploy] ✓ success — $(date)"
