# Deploying levelup-ai to levelupia.agency

The server already runs **platfomelevelup** on port 3000 behind
`levelupia.app`. This app takes **port 3001** behind `levelupia.agency`.
Nothing here touches the existing site.

## 1. DNS (Cloudflare)

The zone currently has only MX/TXT records — **no A record**, so the domain
does not resolve to the server yet. Add:

| Type | Name  | Content            | Proxy |
|------|-------|--------------------|-------|
| A    | `@`   | `<SERVER_PUBLIC_IP>` | DNS only (grey) |
| A    | `www` | `<SERVER_PUBLIC_IP>` | DNS only (grey) |

Keep it **DNS only** until certbot has issued the certificate, otherwise the
ACME HTTP challenge is intercepted by Cloudflare's proxy. Switch to proxied
afterwards if you want.

## 2. Environment

`.env.local` is gitignored, so `git clone` did **not** bring it. Create it:

```bash
cd /root/app/web/levelup-ai
cat > .env.local <<'ENV'
ANTHROPIC_API_KEY=sk-ant-...        # a FRESH key from console.anthropic.com
ENV
chmod 600 .env.local
```

Without it the site works but `/api/chat` returns 503.

## 3. Build and start

```bash
cd /root/app/web/levelup-ai
npm ci                 # or: npm i
npm run build
pm2 start deploy/ecosystem.config.js
pm2 save
curl -I http://127.0.0.1:3001/en     # expect 200
```

## 4. Nginx

```bash
cp deploy/nginx-levelupia.agency.conf /etc/nginx/sites-available/levelupia.agency
ln -s /etc/nginx/sites-available/levelupia.agency /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 5. HTTPS

```bash
certbot --nginx -d levelupia.agency -d www.levelupia.agency
```

Certbot rewrites the file in place, adding the 443 block and the redirect —
same as it did for levelupia.app.

## Redeploying later

```bash
cd /root/app/web/levelup-ai
git pull
npm ci && npm run build
pm2 restart levelup-ai
```
