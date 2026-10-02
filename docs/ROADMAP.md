# Clothing Store roadmap

## Delivered MVP

Mobile storefront, catalogue/search/filters, product variants, persistent bag, guest checkout, delivery/pickup, manual M-Pesa/cash payment tracking, customer order tracking, secure single-owner admin, product/variant management, inventory movements, order lifecycle, customers, analytics, business settings, migrations/seeds, deployment configuration and focused integration tests.

## Phase 1 — Prepare the real shop

Replace illustrative products/photos/stock; set the real brand, contact details and pickup location; configure delivery and verified M-Pesa instructions. Use durable backed-up PostgreSQL, a custom domain and professional email. Test with a small set of real shop staff and controlled customer orders. Add configurable delivery zones and business-confirmed return/exchange terms.

## Phase 2 — Payments & customer communication

Real Daraja STK Push, reconciliation, payment intents and reservation expiry; then card payments through an approved provider. Add WhatsApp order notifications through an approved API, SMS updates, receipts and delivery tracking. Keep provider callbacks idempotent and verify amounts/provider transaction IDs independently.

## Phase 3 — Customer experience

Customer accounts without removing guest checkout, wishlists, discount codes, loyalty points and consent-based abandoned-cart reminders. Consider AI recommendations once enough actual product and sales data exists; use customer controls and an appropriate privacy policy.

## Phase 4 — Retail operations

Multiple staff accounts with roles and audit trails, suppliers, purchase orders, barcode scanning, returns/exchanges, downloadable sales reports and configurable receipt generation. Add stock reconciliation tools before expanding channels.

## Phase 5 — Multiple branches

Introduce `branches`, per-branch variant inventory, staff membership, transfers and branch-specific pickup/delivery. Keep the current product/variant/order snapshots, but move stock into a branch inventory relation. Add central reporting and source-of-truth reconciliation.

## Architectural boundaries

- Add customer authentication separately from owner/admin sessions.
- Provider-specific code belongs in payment/communication adapters, not route handlers or React forms.
- Preserve stock movement and immutable order item snapshots.
- Use database constraints, transaction locks and idempotency for writes that affect money/stock.
- Keep integration credentials in service environment variables.
- Introduce pagination and server-side catalogue filtering as the collection grows beyond small-shop scale.
