# Sam Store

An iPhone and Apple products storefront with a separate protected admin workspace. The existing clothing shop has been converted in place, using Sam Store's supplied black-and-gold logo.

Live store: https://clothing-store-axbn.onrender.com/

Admin: https://clothing-store-axbn.onrender.com/admin/login

## Storefront

- iPhone, MacBook, iPad, Apple Watch, AirPods and accessories.
- Mobile navigation, product search, category/colour/storage/availability filters and sorting.
- Model reference photography, product descriptions and configurable storage or other device options.
- Variant-aware shopping bag, guest delivery or pickup checkout and private order tracking.
- M-Pesa manual verification, cash on delivery and pay on pickup.
- WhatsApp enquiries and phone/email links when configured by the owner.

## Complete the shop setup

The 12 starter Apple listings are **catalogue previews**. Public pages show **Price on enquiry**. Opening stock is zero. Preview products cannot be ordered, even if stock is subsequently added. The setup prices in admin are illustrative values, not confirmed sale prices.

1. Sign in with the existing admin account. Credentials were preserved.
2. Open **Settings** and add the verified phone, WhatsApp number, email, location, delivery fee and M-Pesa instructions.
3. Open **Products**, choose a listing and replace its setup price with the actual selling price. Confirm the description, device condition, exact RAM/storage/connectivity configuration and package contents. Use photographs of the actual stock where appropriate.
4. Set stock for each storage/colour or other configuration. For a different price, create a separate listing; the current price is per product, shared by its variants.
5. Clear **Preview listing (enquiries only)** and save to enable checkout.

The variant field named `size` in the existing database/API is retained for compatibility; it now holds storage, watch case size or another configuration. Storefront and admin labels reflect the device options. Refer to the description for device condition and exact specifications.

## Data conversion

Migration `003_sam_store.sql` changes the store name, adds preview/seed state and archives the former clothing catalogue once. It retains products, variants, stock quantities, customers, sessions, credentials, order snapshots, payments and inventory history. The Apple catalogue is seeded once. Restarts and later deploys do not reset the owner's prices, availability or stock.

The original React + Vite + React Router + Lucide frontend, Express API and PostgreSQL architecture is preserved. One Render Node web service serves the frontend and `/api`. The existing Render service and database are reused; the public hostname remains unchanged.

## Development

Node.js 22+ is required.

```bash
npm ci --include=dev
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev:api
```

In another terminal, run `npm run dev`. Frontend: http://localhost:5173. Backend: http://localhost:5000/api/health.

The example environment uses PGlite, real PostgreSQL running in-process for local development. Production requires managed PostgreSQL via `DATABASE_URL` and rejects embedded mode. Keep `.env` and credentials out of git.

Local development admin: `admin@clothing.local` / `ChangeMe!2026`. These are development credentials only. Live credentials remain unchanged. Existing passwords are never reset by seed configuration.

`SEED_DEMO_ORDERS=true` explicitly enables example orders and stocked listings outside production. It is ignored in production; public production starter listings are previews.

## Verification

```bash
npm run check
npm test
npm run build
```

The PostgreSQL-backed HTTP integration suite covers authentication, authoritative checkout totals, retries, concurrent stock reservations, refunds/cancellations, pickup fulfilment, product editing, inventory history, reports and settings. Conversion coverage tests legacy order/contact preservation, preview checkout protection, owned product-photo URLs, admin verification and repeated migration/seed execution. Tests use independent in-memory databases and never modify production data.

## Deployment

The existing Render service deploys `main` automatically:

- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Health: `/api/health`
- Migrations and one-time Apple catalogue seed run at startup.

`render.yaml` retains the existing service/database names so that applying a Blueprint does not introduce a second shop stack. Use a feature branch, verify, integrate through `develop`, and promote to `main` without force-pushing.

See [image sources](docs/IMAGE_SOURCES.md) and [operations](docs/OPERATIONS.md). Product photography and specifications are model references; Sam Store is an independent retailer.
