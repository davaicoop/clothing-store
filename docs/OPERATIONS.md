# Shop operations

## First launch

1. Sign in at `/admin/login` using the deployment-specific admin email/password.
2. Change the initial admin password in Settings.
3. Set the shop name, phone, WhatsApp, email, physical pickup location and delivery fee.
4. Add accurate M-Pesa till/paybill instructions. Do not enter unverified payment details.
5. Replace sample products and their illustrative photo URLs, selling prices, sizes, colours and opening stock. Archive unused samples.
6. Confirm database retention and backup arrangements before receiving real orders.
7. Place one controlled pickup order and one delivery order, verify the actual payment and complete fulfilment.

## Daily workflow

- Review New orders, confirm customer/delivery details and move accepted orders to Confirmed.
- Review Pending payments. Only record Paid after checking actual receipt. M-Pesa requires the verified transaction reference.
- Prepare the order and mark Ready. For delivery mark Out for Delivery; for pickup wait for collection.
- Record payment and mark Delivered/Collected when complete.
- Review low-stock variants. Record restocks, damage and stock counts through Inventory with a reason.
- Cancel abandoned/rejected orders to release reservations. MVP reservations do not expire automatically.
- An actual full refund must happen before it is recorded. Record the reference and reason. Refund then cancel an eligible paid order to restock; future delivered returns/exchanges need their own workflow.

## Database care

- Use a dedicated clothing-store database. Never run its migrations in another project's database.
- Export using `pg_dump` and test restores; managed backup availability depends on your hosting plan.
- The initial Render free database is time-limited. Its exact expiry appears in the deployment report and Render Dashboard. Upgrade or migrate before expiry.
- Do not delete/recreate resources or reapply the Blueprint as another stack to fix a deployment problem. Inspect the existing clothing-store service first.
- Changing `SESSION_SECRET` invalidates existing private order links, but order-number/phone tracking still works. Keep the secret stable.
- Updating `ADMIN_PASSWORD` in environment variables does not reset an existing account; use the admin password-change flow or a deliberate recovery procedure.

## MVP limits

Manual payment verification, full refunds only, one shop/owner, one flat delivery fee, image URLs rather than file uploads, no carrier tracking, no automatically expiring reservations, and no background notifications. Catalog/admin order lists suit a small shop; admin orders currently return the latest 1,000. Customer accounts, returns/exchanges and downloadable receipts/reports are future phases.
