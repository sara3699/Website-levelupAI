# Déploiement — site vitrine (levelupia.agency)

Le vitrine et la plateforme sont **deux applications Next.js distinctes**, sur
des domaines différents, qui communiquent par une seule API.

```
levelupia.agency  (ce projet, port 3001)  ──POST /api/cart──▶  levelupia.app (plateforme, port 3000)
```

## 1. Prérequis serveur

**Node.js 20 minimum** (Tailwind/Next l'exigent) :

```bash
node -v     # doit afficher v20.x ou plus
```

## 2. Installation

```bash
cd /root/app/Site-vitrine
npm install
```

## 3. Variables d'environnement

Créer `.env` (jamais versionné) :

```bash
NEXT_PUBLIC_PLATFORM_URL="https://levelupia.app"
```

> C'est la seule variable indispensable. Elle indique où envoyer le visiteur
> quand il clique « Ajouter au panier ».

## 4. Build et lancement

Ce projet tourne sur le **port 3001** pour ne pas entrer en conflit avec la
plateforme (port 3000) :

```bash
npm run build
PORT=3001 pm2 start npm --name vitrine -- run start
pm2 save
curl -I http://localhost:3001/fr     # doit répondre 200
```

## 5. Nginx

Créer `/etc/nginx/sites-available/levelupia.agency` :

```nginx
server {
    listen 80;
    server_name levelupia.agency www.levelupia.agency;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 300s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/levelupia.agency /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d levelupia.agency -d www.levelupia.agency
```

## 6. Côté plateforme — autoriser ce domaine

Dans le `.env` de la **plateforme** (`/root/app/platfomelevelup`) :

```bash
VITRINE_ORIGINS="https://levelupia.agency"
APP_URL="https://levelupia.app"
CART_TOKEN_SECRET="<32+ caractères aléatoires>"
```

Sans `VITRINE_ORIGINS`, la plateforme refuse les appels du vitrine (CORS) et
le bouton « Ajouter au panier » retombe sur le formulaire de contact.

## 7. Vérification finale

```bash
# le vitrine répond
curl -I https://levelupia.agency/fr

# la plateforme accepte le vitrine
curl -s -X POST https://levelupia.app/api/cart \
  -H "Content-Type: application/json" \
  -H "Origin: https://levelupia.agency" \
  -d '{"packCode":"PACK_LANCEMENT"}'
# → doit renvoyer un token et une signupUrl
```

Puis dans le navigateur : ouvrir `https://levelupia.agency/fr`, cliquer
« Ajouter au panier » sur un pack → arrivée sur
`https://levelupia.app/inscription?cart=…`.

## Les deux applications sur la même machine

| Application | Dossier | Port | Domaine |
|---|---|---|---|
| Site vitrine | `/root/app/Site-vitrine` | 3001 | levelupia.agency |
| Plateforme | `/root/app/platfomelevelup` | 3000 | levelupia.app |

Chaque application a son propre fichier Nginx et son propre processus PM2 :

```bash
pm2 list        # doit montrer « vitrine » et « levelup », tous deux online
pm2 startup     # démarrage automatique au reboot
```
