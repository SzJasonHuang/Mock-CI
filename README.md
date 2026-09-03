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

## Notes

- Session secret and SQLite file live under `data/` (gitignored) and are regenerated locally; nothing here is meant to be deployed as-is.
- To re-seed/update the product catalog manually: `npm run seed`.
