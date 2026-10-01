# LevelUp AI website

The Level Up AI marketing site (levelupia.agency): websites, AI photo and video
shoots, and digital creation for small businesses. French and English, built
with Next.js.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000/fr (or `/en`).

## Checks

```bash
npx tsc --noEmit
npm test
npm run build
```

## Where things are

- Texts in both languages: `src/i18n/dictionaries/fr.json` and `en.json`
- Colours and gradient: `src/styles/tokens.css`, section styles in `src/app/globals.css`
- Page sections (hero, packs, services, about, FAQ, contact): `src/components/sections/`
- Hero videos and how each one was made: `public/videos/hero/` and its README

## Settings

`NEXT_PUBLIC_PLATFORM_URL` is where "Ajouter au panier" sends visitors. It
defaults to https://levelupia.app, so nothing needs to be set for the normal
setup. The chat assistant runs inside the site and needs no API key.

## Deploying

Server setup (Nginx, PM2, HTTPS) is in `docs/DEPLOIEMENT.md` (French) and
`deploy/README.md`. On Vercel the project builds as Next.js (`vercel.json`).
