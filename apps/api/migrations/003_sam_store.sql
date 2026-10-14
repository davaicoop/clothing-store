-- Convert the existing shop once; retain customers, credentials and all order history.
ALTER TABLE products ADD COLUMN showcase boolean NOT NULL DEFAULT false;
ALTER TABLE business_settings ADD COLUMN sam_catalog_seeded boolean NOT NULL DEFAULT false;
ALTER TABLE business_settings ALTER COLUMN shop_name SET DEFAULT 'Sam Store';
UPDATE business_settings SET shop_name='Sam Store' WHERE id=1;

-- Archive the former catalogue without deleting records referenced by orders.
UPDATE products SET active=false;
UPDATE product_variants SET active=false;
