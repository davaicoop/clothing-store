# Clothing Store

A working mobile-first clothing retail MVP: editorial storefront, variant-aware shopping bag, guest checkout, order tracking and a separate protected shop workspace. The default sample shop name is **FORME**; change it in **Admin → Settings**.

Live store: https://clothing-store-axbn.onrender.com/. Current hosting details and verification are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Implemented

- Home, new arrivals, best sellers, Men/Women/Shoes/Accessories collections and featured pieces.
- Search; category, price, size, colour and availability filters; newest, price and popularity sorting.
- Product photography, stock per size/colour, quantity selection and related pieces.
- Local persistent cart, variant changes, delivery fees and pickup totals.
- Guest delivery/pickup checkout, private tracking links and order-number/phone lookup.
- M-Pesa **manual verification**, cash on delivery and pay on pickup. No fake STK prompt or fabricated real payment success.
- Secure admin sessions, hashed passwords, login throttling, protected API/routes and password changes.
- Product creation/editing/archiving, editable categories, variants and image URLs.
- Atomic stock reservations, stock adjustments/history, cancellation restocking and order/payment history.
- Customer records, paid-sales dashboard, sales charts, category/product/payment analytics.
- Configurable shop/contact/location/delivery/M-Pesa instructions; ordinary WhatsApp and phone links.

## Architecture

React + Vite + React Router + Lucide render the storefront and admin workspace. Express exposes `/api`. PostgreSQL stores all business data. A single Node service serves the compiled frontend **and** the API, avoiding duplicate frontend/API services and cross-origin cookie configuration. It still has separate frontend and backend source directories.

Prices, delivery fees and stock are checked on the server. Checkout locks selected variants inside one transaction, records stock movements and uses an idempotency key to prevent duplicate orders. Product prices/names/category/variants are snapshotted on order items. Products and variants are archived so old orders remain valid. Cancellation releases the reservation once. Product edits reject stale stock snapshots. Sessions use randomly generated, hashed tokens in HttpOnly, SameSite=Strict cookies; production cookies are Secure.

## Folder structure

```text
apps/
  api/
    migrations/          Versioned PostgreSQL schema
    scripts/             Migration and seed entrypoints
    src/
      lib/               Validation and HTTP errors
      middleware/        Authentication and mutation protection
      routes/            Store, authentication and modular admin APIs
      services/          Catalog and transactional order logic
      app.js             Express middleware and routes
      config.js          Validated runtime configuration
      db.js              PostgreSQL pool / local embedded PostgreSQL
      server.js          Startup and graceful shutdown
  web/
    public/
    src/
      components/        Reusable storefront/admin controls
      context/           Live catalog, settings and persistent cart
      hooks/
      lib/
      pages/store/
      pages/admin/
      styles/            Base, storefront and administration CSS
docs/
  ROADMAP.md
  OPERATIONS.md
  IMAGE_SOURCES.md
  DEPLOYMENT.md
tests/commerce.test.js   Focused API integration coverage
scripts/check.mjs
render.yaml
```

## Local setup

Install **Node.js 22 or later**, then:

```bash
git clone https://github.com/davaicoop/clothing-store.git
cd clothing-store
git switch feature/clothing-store-mvp
npm ci --include=dev
```

Copy `.env.example` to `.env` (`cp .env.example .env` on macOS/Linux, `Copy-Item .env.example .env` in PowerShell).

### Fast local PostgreSQL option

The example environment enables **PGlite**, actual PostgreSQL running locally in-process with data persisted at `.local/postgres`. This makes the MVP usable locally without a native database installation. It is exclusively a development/test option; production rejects it.

```bash
npm run db:migrate
npm run db:seed
npm run dev:api
```

In a second terminal:

```bash
npm run dev
```

Frontend: `http://localhost:5173`. Backend: `http://localhost:5000/api/health`. Use only one API process against the same embedded data directory.

### Native PostgreSQL

Create a dedicated database with PostgreSQL 14+:

```sql
CREATE DATABASE clothing_store;
```

Set `USE_EMBEDDED_DB=false` and `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/clothing_store` in `.env`. Set `DATABASE_SSL=false` for a local database, run the migration/seed commands above and start both applications. PostgreSQL UUID generation is built in; an additional extension is unnecessary.

### Development administrator

- URL: `http://localhost:5173/admin/login`
- Email: `admin@clothing.local`
- Password: `ChangeMe!2026`

These are **development credentials only**. Production requires a distinct admin password and a random session secret. Seed creates the admin only if that email does not already exist; changing the environment variable later does not reset an existing password. Change a password in **Admin → Settings**.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | Express port; default 5000, automatically supplied by Render |
| `DATABASE_URL` | Dedicated PostgreSQL connection string; required in production |
| `DATABASE_SSL` | `true` for external TLS connections; `false` on Render's private network |
| `USE_EMBEDDED_DB` | Development/test only; production must use `false` |
| `EMBEDDED_DB_PATH` | Local PostgreSQL storage path; `memory://` for isolated tests |
| `SESSION_SECRET` | At least 32 random characters; protects private order links |
| `ADMIN_EMAIL` | Admin email to create on first startup |
| `ADMIN_PASSWORD` | Initial admin password, stored as a bcrypt hash |
| `AUTO_MIGRATE` | Apply versioned migrations at startup; default true |
| `SEED_CATALOG` | Seed sample products only into an empty catalog |
| `SEED_DEMO_ORDERS` | Local example orders only; ignored in production |
| `APP_ORIGIN` | Exact frontend origin for mutation verification |
| `RENDER_EXTERNAL_URL` | Render-provided fallback for the canonical origin |

Never commit `.env` or production credentials. The storefront keeps its cart and up to 30 private order links on the customer's device. Order links should be treated as private. Lookup needs the random order number and checkout phone; lookup and checkout are throttled.

## Database

Tables: `admins`, `admin_sessions`, `products`, `product_variants`, `categories`, `customers`, `orders`, `order_items`, `payments`, `inventory_movements`, `order_events`, `business_settings`, `schema_migrations`.

Seed data contains 12 sample clothing/accessory products, sizes, colours, unique SKUs and initial inventory. Photography is illustrative and can be replaced through product image URLs. Sample customer orders/payment records are seeded **only** when `SEED_DEMO_ORDERS=true` outside production; the admin displays a development banner. Live revenue starts at zero.

## Orders and accounting

Delivery: `New → Confirmed → Preparing → Ready → Out for Delivery → Delivered`.

Pickup: `New → Confirmed → Preparing → Ready → Delivered` (shown as Collected on customer tracking).

Orders can be cancelled before dispatch. A paid order requires a full refund to be recorded before cancellation. Cancellation restores reserved stock once; a refund alone does not restore stock. Mark an order delivered/collected after recording the verified payment. Payment lifecycle: `Pending → Paid → Refunded`.

Sales revenue is the total of paid, non-cancelled orders, including delivery. Full refunds are excluded from the original order date's revenue. Category/product revenue excludes delivery. Average order value uses paid orders. Popularity on the storefront counts quantities in non-cancelled orders. Business dates use `Africa/Nairobi`. Manual payment records are an audit of what the shop verified, not automatic confirmation from a payment provider.

## Deployment on Render

`render.yaml` describes exactly **one free web service** and **one free PostgreSQL instance** in Frankfurt. The same web URL serves storefront and `/api`. Do not deploy a second stack if these clothing-store resources already exist.

For a new deployment, open:

`https://dashboard.render.com/blueprint/new?repo=https://github.com/davaicoop/clothing-store`

Select DAVAI, deploy `main`, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD`. The Blueprint generates `SESSION_SECRET` and wires the internal database URL. `RENDER_EXTERNAL_URL` supplies the frontend origin; set `APP_ORIGIN` to the custom domain if you add one later.

For direct creation or updating an existing clothing-store service:

- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Health: `/api/health`
- Environment: `NODE_ENV=production`, `USE_EMBEDDED_DB=false`, `DATABASE_SSL=false`, `SEED_DEMO_ORDERS=false`, dedicated `DATABASE_URL`, random `SESSION_SECRET`, initial admin email/password.
- Keep the app and database in the same region/workspace and use the internal database URL.
- Express serves React Router fallback routes, including direct product/admin/tracking links.
- Migrations and safe initial catalog/admin seeds run at startup. They never overwrite existing products, stock or passwords.

Render's free PostgreSQL instances expire after 30 days and do not include managed backups. Plan a supported database upgrade and exports before taking real customer orders. Free web services may sleep when idle. See `docs/OPERATIONS.md` for first-launch tasks.

## Verification

```bash
npm run check
npm test
npm run build
```

Six focused PostgreSQL-backed HTTP integration tests cover protected admin sessions, guest checkout and authoritative totals, retries, concurrent stock reservations, private order access, M-Pesa manual verification, refunds/cancellation, pickup completion, product editing/archiving, stale-stock protection, inventory history, reports, settings and categories. Each run uses a new in-memory PostgreSQL database and never touches production data. Browser visual/mobile checks are separate from these API tests.

## Future M-Pesa / Daraja integration

The current order/payment schema and `services/orders.js` provide the integration boundary: place the order with Pending payment, create an external payment intent, and append a verified payment record only after independently validating the provider result.

Add an M-Pesa provider module with Daraja OAuth/token handling, STK Push initiation, callback persistence, idempotent reconciliation and status-query verification. Add `payment_intents` with provider IDs and unique transaction references, then a separate provider callback route with provider-specific request verification. Do not route callbacks through admin sessions or trust a client-reported successful payment. Handle duplicate callbacks, wrong amounts/order IDs, timeouts and expired stock reservations.

Credentials required later: Safaricom Daraja app consumer key/secret, business shortcode, passkey, environment and public callback URL. M-Pesa till/paybill instructions for **manual** payment can be configured now in Settings without API credentials. Card, SMS, notifications and storage integrations belong to later roadmap phases.

## Git workflow

`feature/clothing-store-mvp` contains initial development. Test changes there, promote to `develop`, then fast-forward or cleanly merge the verified integration into `main`. `main` is the live branch. Never force-push. GitHub Actions repeats syntax, focused API tests and the frontend production build.
