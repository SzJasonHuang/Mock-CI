# GasGuard Demo Shop

A fake consumer storefront for gas detectors, built for local testing. Not a real business - no real payments are processed and no real products are sold.

## Features

- Product catalog (6 gas detector products) backed by SQLite (Node built-in `node:sqlite`, no native build step)
- Account registration / login / logout (bcrypt-hashed passwords, session-based auth)
- Cart (session-based)
- Mock checkout - any card number/expiry/CVC passes basic format validation, no real payment gateway is called
- Order history under "My Account"

## Setup

Requires Node.js 22.5+ (for the built-in `node:sqlite` module).

```
npm install
npm start
```

Then open http://localhost:3000. The product catalog seeds itself automatically on first run.

## Deploying to Vercel

The app can be deployed as a Vercel serverless function (`api/index.js` wraps the Express app; see `vercel.json`). Since this is a demo, persistence is intentionally kept simple:

- When `VERCEL` is set, the SQLite database runs **in-memory** instead of writing to disk (Vercel's filesystem is read-only). It reseeds itself on every cold start, so users/orders/cart contents don't survive across cold starts — that's expected for a demo, not a bug.
- Sessions use the default in-memory `express-session` store, so logins may not persist reliably across concurrent serverless instances. Fine for a demo; not suitable for anything real.
- Set a `SESSION_SECRET` environment variable in the Vercel project settings (falls back to an insecure default otherwise).

## Notes

- For local dev, the session secret and SQLite file live under `data/` (gitignored) and are regenerated locally.
- To re-seed/update the product catalog manually: `npm run seed`.
