import { Router } from 'express';
import { z } from 'zod';
import { query,transaction } from '../db.js';
import { uuid,text } from '../lib/validation.js';
import { assert } from '../lib/errors.js';

export const inventoryRouter=Router();
inventoryRouter.get('/inventory',async(_req,res)=>{
  const {rows}=await query(`SELECT v.id,p.name,p.images,v.product_id AS "productId",v.size,v.color,v.sku,v.stock,v.active,
    (v.stock<=s.low_stock_threshold) AS "lowStock" FROM product_variants v JOIN products p ON p.id=v.product_id
    CROSS JOIN business_settings s WHERE p.active=true AND v.active=true ORDER BY v.stock,p.name,v.color,v.size`);
  res.json(rows);
});
inventoryRouter.get('/inventory/history',async(req,res)=>{
  const id=req.query.variantId ? uuid.parse(req.query.variantId) : null;
  const {rows}=await query(`SELECT m.id,p.name,v.size,v.color,v.sku,m.quantity,m.stock_after AS "stockAfter",m.reason,
    m.created_at AS "createdAt",o.order_number AS "orderNumber",a.name AS "adminName"
    FROM inventory_movements m JOIN product_variants v ON v.id=m.variant_id JOIN products p ON p.id=v.product_id
    LEFT JOIN orders o ON o.id=m.order_id LEFT JOIN admins a ON a.id=m.admin_id
    ${id?'WHERE m.variant_id=$1':''} ORDER BY m.created_at DESC LIMIT 150`,id?[id]:[]);
  res.json(rows);
});
inventoryRouter.post('/inventory/:id/adjust',async(req,res)=>{
  uuid.parse(req.params.id);
  const {quantity,reason}=z.object({quantity:z.number().int().min(-1000000).max(1000000).refine(n=>n!==0),reason:text(300)}).parse(req.body);
  const result=await transaction(async client=>{
    const v=(await client.query('SELECT * FROM product_variants WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
    assert(v,404,'Variant not found.');
    const stock=v.stock+quantity;
    assert(stock>=0 && stock<=1000000,409,'The adjustment must leave stock between 0 and 1,000,000.');
    await client.query('UPDATE product_variants SET stock=$1 WHERE id=$2',[stock,v.id]);
    await client.query('INSERT INTO inventory_movements(variant_id,quantity,stock_after,reason,admin_id) VALUES($1,$2,$3,$4,$5)',
      [v.id,quantity,stock,reason,req.admin.id]);
    return {stock};
  }); res.json(result);
});
