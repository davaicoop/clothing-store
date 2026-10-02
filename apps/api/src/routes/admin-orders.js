import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { uuid } from '../lib/validation.js';
import { orderSummary,getOrder,updateOrderStatus,updatePayment,orderTransitions } from '../services/orders.js';

export const ordersRouter=Router();
ordersRouter.get('/orders',async(_req,res)=>res.json((await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000')).rows.map(orderSummary)));
ordersRouter.get('/orders/:id',async(req,res)=>{uuid.parse(req.params.id);res.json(await getOrder(req.params.id));});
ordersRouter.patch('/orders/:id/status',async(req,res)=>{
  uuid.parse(req.params.id);
  const status=z.enum(Object.keys(orderTransitions)).parse(req.body.status);
  res.json(await updateOrderStatus(req.params.id,status,req.admin.id));
});
ordersRouter.patch('/orders/:id/payment',async(req,res)=>{
  uuid.parse(req.params.id);
  const p=z.object({status:z.enum(['Pending','Paid','Refunded']),reference:z.string().trim().max(100).default(''),note:z.string().trim().max(500).default('')}).parse(req.body);
  res.json(await updatePayment(req.params.id,p.status,p.reference,p.note,req.admin.id));
});
ordersRouter.get('/customers',async(_req,res)=>{
  const {rows}=await query(`SELECT c.id,c.name,c.phone,c.email,COUNT(o.id)::int AS "orderCount",
    COALESCE(SUM(o.total) FILTER(WHERE o.payment_status='Paid' AND o.status<>'Cancelled'),0) AS "totalSpend",
    MAX(o.created_at) AS "lastOrder" FROM customers c LEFT JOIN orders o ON o.customer_id=c.id
    GROUP BY c.id ORDER BY MAX(o.created_at) DESC NULLS LAST`);
  res.json(rows.map(c=>({...c,totalSpend:Number(c.totalSpend)})));
});
