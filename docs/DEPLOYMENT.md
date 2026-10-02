# MVP deployment

Deployed on 2 October 2026 from the `main` branch of `davaicoop/clothing-store`.

| Resource | Location / identifier |
| --- | --- |
| Storefront | https://clothing-store-axbn.onrender.com/ |
| REST API | https://clothing-store-axbn.onrender.com/api |
| Database health | https://clothing-store-axbn.onrender.com/api/health |
| Admin sign-in | https://clothing-store-axbn.onrender.com/admin/login |
| Render workspace | DAVAI |
| Node web service | `clothing-store` / `srv-davntfh42hec73dgtbj0` |
| PostgreSQL database | `clothing-store-db` / `dpg-davng4bncjis73f2i5qg-a` |
| Region | Frankfurt, for both resources |

One free Node web service serves the compiled React app and Express API. Auto-deploy follows `main`. The service uses `/api/health` for database-aware health checks. PostgreSQL 18 uses a private internal connection; external database traffic is blocked. Migrations run during startup and the initial catalog is seeded only when the product table is empty. Existing products, stock and admins are preserved during redeployment.

Runtime configuration is held in Render, including a unique production admin password and session secret. Production admin email is `davai.coop@gmail.com`; obtain the initial password from the private project handover or the service's `ADMIN_PASSWORD` setting. No live credentials are stored in this repository. Use Settings to change the initial password; changing the environment variable does not reset an existing admin.

## Verification

- Frontend production build and backend syntax checks pass.
- Six focused PostgreSQL/HTTP integration tests cover authentication, checkout, idempotency, concurrent stock reservations, fulfilment/payment/refund rules, products, inventory, customers and reports.
- Render completed a clean `npm ci --include=dev` installation and production build.
- Live health reports `postgresql` and `ok`.
- Browser verification covered the catalogue, size/colour availability, add-to-cart, quantity changes, persistence after refresh, delivery/pickup totals and guest checkout.
- Live admin API verification covered secure login, product create/edit/archive, inventory movements, customer/report endpoints and order status updates.
- The clearly labelled deployment verification order was cancelled after testing, and its stock was restored. No real payment was simulated. An inactive verification product remains archived for audit history.

## Before commercial launch

The free PostgreSQL database expires on **1 November 2026**. Upgrade this existing database or migrate its data before expiry. Free web service sleep can delay the first request after inactivity. A durable database with backups and an always-on web service are the recommended production upgrade; no paid plan has been purchased automatically.

Set real business contact details, pickup address and M-Pesa payment instructions in Admin → Settings. Replace illustrative sample photos/products and confirm opening stock. See [OPERATIONS.md](OPERATIONS.md) for launch and daily shop procedures, and [ROADMAP.md](ROADMAP.md) for future phases. Do not apply `render.yaml` as a duplicate stack: the resources above already exist.
