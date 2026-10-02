import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { getSettings } from '../services/catalog.js';
import { settingsSchema } from '../lib/validation.js';
import { orderSummary } from '../services/orders.js';

export const reportsRouter=Router();
const tz="(created_at AT TIME ZONE 'Africa/Nairobi')::date";
reportsRouter.get('/dashboard',async(_req,res)=>{
  const {rows:[row]}=await query(`SELECT
    COALESCE(SUM(total) FILTER(WHERE payment_status='Paid' AND status<>'Cancelled' AND ${tz}=(now() AT TIME ZONE 'Africa/Nairobi')::date),0) AS "salesToday",
    COALESCE(SUM(total) FILTER(WHERE payment_status='Paid' AND status<>'Cancelled' AND date_trunc('month',created_at AT TIME ZONE 'Africa/Nairobi')=date_trunc('month',now() AT TIME ZONE 'Africa/Nairobi')),0) AS "salesMonth",
    COUNT(*) FILTER(WHERE ${tz}=(now() AT TIME ZONE 'Africa/Nairobi')::date)::int AS "ordersToday",
    COUNT(*) FILTER(WHERE status NOT IN ('Delivered','Cancelled'))::int AS "pendingOrders" FROM orders`);
  const lowStock=(await query(`SELECT v.id,p.name,v.size,v.color,v.stock FROM product_variants v JOIN products p ON p.id=v.product_id
    CROSS JOIN business_settings s WHERE v.active=true AND p.active=true AND v.stock<=s.low_stock_threshold ORDER BY stock,p.name LIMIT 12`)).rows;
  const products=(await query('SELECT COUNT(*)::int AS count FROM products WHERE active=true')).rows[0].count;
  const recent=(await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6')).rows.map(orderSummary);
  res.json({...row,salesToday:Number(row.salesToday),salesMonth:Number(row.salesMonth),totalProducts:products,lowStock,recentOrders:recent});
});
reportsRouter.get('/analytics',async(req,res)=>{
  const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!Number.isNaN(Date.parse(s)), 'Use a valid date.');
  const from=req.query.from ? date.parse(req.query.from) : '2000-01-01';
  const to=req.query.to ? date.parse(req.query.to) : '2100-01-01';
  const filter=`${tz}>=$1::date AND ${tz}<=$2::date`;
  const paid=`payment_status='Paid' AND status<>'Cancelled'`;
  const summary=(await query(`SELECT COALESCE(SUM(total) FILTER(WHERE ${paid}),0) AS revenue,
    COUNT(*) FILTER(WHERE status<>'Cancelled')::int AS "orderCount",COUNT(*) FILTER(WHERE ${paid})::int AS "paidCount",
    COALESCE(AVG(total) FILTER(WHERE ${paid}),0) AS "averageOrderValue"
    FROM orders WHERE ${filter}`,[from,to])).rows[0];
  const salesByDate=(await query(`SELECT ${tz}::text AS date,SUM(total) AS total FROM orders WHERE ${paid} AND ${filter}
    GROUP BY ${tz} ORDER BY ${tz}`,[from,to])).rows;
  const paymentMethods=(await query(`SELECT payment_method AS name,SUM(total) AS total,COUNT(*)::int AS count
    FROM orders WHERE ${paid} AND ${filter} GROUP BY payment_method ORDER BY total DESC`,[from,to])).rows;
  const itemFilter="(o.created_at AT TIME ZONE 'Africa/Nairobi')::date BETWEEN $1::date AND $2::date AND o.payment_status='Paid' AND o.status<>'Cancelled'";
  const categories=(await query(`SELECT i.category_name AS name,SUM(i.quantity*i.unit_price) AS total
    FROM order_items i JOIN orders o ON o.id=i.order_id WHERE ${itemFilter} GROUP BY i.category_name ORDER BY total DESC`,[from,to])).rows;
  const topProducts=(await query(`SELECT i.product_id AS id,MAX(i.product_name) AS name,SUM(i.quantity)::int AS quantity,
    SUM(i.quantity*i.unit_price) AS total FROM order_items i JOIN orders o ON o.id=i.order_id WHERE ${itemFilter}
    GROUP BY i.product_id ORDER BY quantity DESC,total DESC LIMIT 8`,[from,to])).rows;
  const numericRows=rows=>rows.map(r=>({...r,total:Number(r.total)}));
  res.json({...summary,revenue:Number(summary.revenue),averageOrderValue:Number(summary.averageOrderValue),
    salesByDate:numericRows(salesByDate),paymentMethods:numericRows(paymentMethods),categories:numericRows(categories),topProducts:numericRows(topProducts)});
});
reportsRouter.put('/settings',async(req,res)=>{
  const s=settingsSchema.parse(req.body);
  await query(`UPDATE business_settings SET shop_name=$1,phone=$2,whatsapp=$3,email=$4,location=$5,delivery_fee=$6,currency=$7,
    currency_symbol=$8,low_stock_threshold=$9,mpesa_instructions=$10 WHERE id=1`,
    [s.shopName,s.phone,s.whatsapp,s.email,s.location,s.deliveryFee,s.currency,s.currencySymbol,s.lowStockThreshold,s.mpesaInstructions]);
  res.json(await getSettings());
});
