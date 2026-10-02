import { query } from '../db.js';

export async function getProducts({ includeArchived = false, client } = {}) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(`SELECT p.*,c.name AS category,
    COALESCE((SELECT SUM(i.quantity) FROM order_items i JOIN orders o ON o.id=i.order_id
      WHERE i.product_id=p.id AND o.status<>'Cancelled'),0)::int AS popularity
    FROM products p JOIN categories c ON c.id=p.category_id
    ${includeArchived ? '' : 'WHERE p.active=true'} ORDER BY p.created_at DESC,p.name`);
  const { rows: variants } = await run(`SELECT v.* FROM product_variants v JOIN products p ON p.id=v.product_id
    ${includeArchived ? '' : 'WHERE p.active=true AND v.active=true'} ORDER BY v.color,v.size`);
  return rows.map(p => ({
    id:p.id, name:p.name, description:p.description, category:p.category, categoryId:p.category_id,
    audience:p.audience, price:Number(p.price), ...(includeArchived ? { costPrice:p.cost_price === null ? null : Number(p.cost_price) } : {}),
    images:p.images, active:p.active, featured:p.featured, createdAt:p.created_at, popularity:p.popularity,
    variants:variants.filter(v=>v.product_id===p.id).map(v=>({ id:v.id,size:v.size,color:v.color,sku:v.sku,stock:v.stock,active:v.active })),
  }));
}
export async function getSettings(client) {
  const { rows } = await (client ? client.query.bind(client) : query)('SELECT * FROM business_settings WHERE id=1');
  const s=rows[0];
  return { shopName:s.shop_name,phone:s.phone,whatsapp:s.whatsapp,email:s.email,location:s.location,
    deliveryFee:Number(s.delivery_fee),currency:s.currency,currencySymbol:s.currency_symbol,
    lowStockThreshold:s.low_stock_threshold,mpesaInstructions:s.mpesa_instructions };
}
