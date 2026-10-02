import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { query } from '../db.js';
import { getProducts,getSettings } from '../services/catalog.js';
import { placeOrder,getOrder } from '../services/orders.js';
import { assert } from '../lib/errors.js';
import { hash } from '../middleware/auth.js';
import { phone,uuid,text } from '../lib/validation.js';

export const storeRouter=Router();
storeRouter.get('/settings',async (_req,res)=>res.json(await getSettings()));
storeRouter.get('/categories',async (_req,res)=>res.json((await query('SELECT id,name,slug FROM categories ORDER BY name')).rows));
storeRouter.get('/products',async (_req,res)=>res.json(await getProducts()));
storeRouter.get('/products/:id',async(req,res)=>{
  uuid.parse(req.params.id);
  const p=(await getProducts()).find(p=>p.id===req.params.id);
  assert(p,404,'This product is no longer available.'); res.json(p);
});
const checkoutLimit=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Please wait before placing more orders.'}});
storeRouter.post('/orders',checkoutLimit,async(req,res)=>{
  const result=await placeOrder(req.body,req.get('Idempotency-Key'));
  res.status(result.replayed?200:201).json(result);
});
storeRouter.get('/orders/:id',checkoutLimit,async(req,res)=>{
  uuid.parse(req.params.id);
  const token=z.string().length(64).parse(req.query.token);
  const o=(await query('SELECT id FROM orders WHERE id=$1 AND lookup_hash=$2',[req.params.id,hash(token)])).rows[0];
  assert(o,404,'Order not found. Check your order link.');
  const order=await getOrder(o.id);
  // Payment notes are internal accounting notes, not part of customer tracking.
  order.payments=order.payments.map(({note,...payment})=>payment);
  res.json(order);
});
storeRouter.post('/orders/lookup',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false}),async(req,res)=>{
  const body=z.object({orderNumber:text(60),phone}).parse(req.body);
  const o=(await query('SELECT id FROM orders WHERE order_number=$1 AND customer_phone=$2',[body.orderNumber.toUpperCase(),body.phone])).rows[0];
  assert(o,404,'No matching order. Check the order number and phone used at checkout.');
  const order=await getOrder(o.id);
  order.payments=order.payments.map(({note,...payment})=>payment);
  res.json(order);
});
