import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { query, transaction } from '../db.js';
import { config } from '../config.js';
import { hash } from '../middleware/auth.js';
import { assert } from '../lib/errors.js';
import { checkoutSchema, uuid } from '../lib/validation.js';
import { getSettings } from './catalog.js';

const accessToken = id => createHmac('sha256',config.secret).update(`order:${id}`).digest('hex');
const cents = amount => Math.round(Number(amount)*100);
export const orderTransitions = {
  New:['Confirmed','Cancelled'], Confirmed:['Preparing','Cancelled'],
  Preparing:['Ready','Cancelled'], Ready:['Out for Delivery','Delivered','Cancelled'],
  'Out for Delivery':['Delivered'], Delivered:[], Cancelled:[],
};
export function orderSummary(o) {
  return { id:o.id,orderNumber:o.order_number,customer:{ name:o.customer_name,phone:o.customer_phone,email:o.customer_email },
    subtotal:Number(o.subtotal),deliveryFee:Number(o.delivery_fee),total:Number(o.total),currency:o.currency,
    paymentMethod:o.payment_method,paymentStatus:o.payment_status,status:o.status,fulfilment:o.fulfilment,
    town:o.town,address:o.address,instructions:o.instructions,createdAt:o.created_at,updatedAt:o.updated_at };
}
export async function getOrder(id, client) {
  const run=client ? client.query.bind(client) : query;
  const { rows }=await run('SELECT * FROM orders WHERE id=$1',[id]);
  assert(rows[0],404,'Order not found.');
  const items=(await run('SELECT * FROM order_items WHERE order_id=$1 ORDER BY product_name',[id])).rows;
  const events=(await run('SELECT type,message,created_at FROM order_events WHERE order_id=$1 ORDER BY created_at',[id])).rows;
  const payments=(await run('SELECT id,method,status,amount,reference,note,created_at FROM payments WHERE order_id=$1 ORDER BY created_at',[id])).rows;
  return { ...orderSummary(rows[0]),items:items.map(i=>({ id:i.id,productId:i.product_id,variantId:i.variant_id,name:i.product_name,
    size:i.size,color:i.color,sku:i.sku,image:i.image,quantity:i.quantity,unitPrice:Number(i.unit_price) })),
    events:events.map(e=>({type:e.type,message:e.message,createdAt:e.created_at})),
    payments:payments.map(p=>({...p,amount:Number(p.amount)})) };
}
export async function placeOrder(body, requestKey) {
  const data=checkoutSchema.parse(body);
  uuid.parse(requestKey);
  // Canonical order of lines ensures a retry with the same cart compares identically.
  data.items.sort((a,b)=>a.variantId.localeCompare(b.variantId));
  const requestHash=hash(JSON.stringify(data));
  let result;
  try {
    result=await transaction(async client => {
      const existing=(await client.query('SELECT * FROM orders WHERE request_key=$1',[requestKey])).rows[0];
      if (existing) {
        assert(existing.request_hash===requestHash,409,'This checkout attempt has changed. Please try a new checkout.');
        return {id:existing.id,replayed:true};
      }
      const settings=await getSettings(client);
      const variants=(await client.query(`SELECT v.*,p.name,p.price,p.images,c.name AS category
        FROM product_variants v JOIN products p ON p.id=v.product_id JOIN categories c ON c.id=p.category_id
        WHERE v.id=ANY($1::uuid[]) AND v.active=true AND p.active=true ORDER BY v.id FOR UPDATE OF v`,
        [data.items.map(i=>i.variantId)])).rows;
      assert(variants.length===data.items.length,409,'An item is no longer available. Refresh your bag.');
      let subtotalCents=0;
      for (const line of data.items) {
        const v=variants.find(v=>v.id===line.variantId);
        assert(v.stock>=line.quantity,409,`${v.name} (${v.color} / ${v.size}) has ${v.stock} available. Please update your bag.`);
        subtotalCents+=cents(v.price)*line.quantity;
      }
      const customer=(await client.query(`INSERT INTO customers(name,phone,email) VALUES($1,$2,$3)
        ON CONFLICT(phone) DO UPDATE SET name=excluded.name,email=COALESCE(excluded.email,customers.email) RETURNING id`,
        [data.customer.name,data.customer.phone,data.customer.email||null])).rows[0];
      const id=randomUUID();
      const deliveryCents=data.fulfilment==='Delivery' ? cents(settings.deliveryFee) : 0;
      const orderNumber=`CS-${new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Nairobi'}).replaceAll('-','')}-${randomBytes(4).toString('hex').toUpperCase()}`;
      await client.query(`INSERT INTO orders(id,order_number,customer_id,customer_name,customer_phone,customer_email,
        subtotal,delivery_fee,total,currency,payment_method,fulfilment,town,address,instructions,request_key,request_hash,lookup_hash)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [id,orderNumber,customer.id,data.customer.name,data.customer.phone,data.customer.email||null,
          subtotalCents/100,deliveryCents/100,(subtotalCents+deliveryCents)/100,settings.currency,data.paymentMethod,
          data.fulfilment,data.town,data.address,data.instructions,requestKey,requestHash,hash(accessToken(id))]);
      for (const line of data.items) {
        const v=variants.find(v=>v.id===line.variantId);
        const after=v.stock-line.quantity;
        await client.query('UPDATE product_variants SET stock=$1 WHERE id=$2',[after,v.id]);
        await client.query(`INSERT INTO order_items(order_id,product_id,variant_id,product_name,category_name,size,color,sku,image,quantity,unit_price)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[id,v.product_id,v.id,v.name,v.category,v.size,v.color,v.sku,v.images[0],line.quantity,v.price]);
        await client.query('INSERT INTO inventory_movements(variant_id,quantity,stock_after,reason,order_id) VALUES($1,$2,$3,$4,$5)',
          [v.id,-line.quantity,after,'Reserved for order',id]);
      }
      await client.query('INSERT INTO payments(order_id,method,status,amount,note) VALUES($1,$2,$3,$4,$5)',
        [id,data.paymentMethod,'Pending',(subtotalCents+deliveryCents)/100,'Awaiting payment verification']);
      await client.query('INSERT INTO order_events(order_id,type,message) VALUES($1,$2,$3)',[id,'status','Order received']);
      return {id,replayed:false};
    });
  } catch (error) {
    // The unique key also covers concurrent identical requests on separate DB connections.
    if (error.code!=='23505') throw error;
    const existing=(await query('SELECT * FROM orders WHERE request_key=$1',[requestKey])).rows[0];
    if (!existing) throw error;
    assert(existing.request_hash===requestHash,409,'Use a new checkout attempt for changed details.');
    result={id:existing.id,replayed:true};
  }
  const order=await getOrder(result.id);
  order.payments=order.payments.map(({note,...payment})=>payment);
  return {order,token:accessToken(result.id),replayed:result.replayed};
}
export async function updateOrderStatus(id,status,adminId) {
  await transaction(async client=>{
    const o=(await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];
    assert(o,404,'Order not found.');
    if(o.status===status) return;
    assert(orderTransitions[o.status].includes(status),409,`Cannot move an order from ${o.status} to ${status}.`);
    assert(!(o.fulfilment==='Pickup' && status==='Out for Delivery'),400,'Pickup orders go from Ready to Delivered.');
    assert(!(o.fulfilment==='Delivery' && o.status==='Ready' && status==='Delivered'),400,'Delivery orders must go Out for Delivery first.');
    if(status==='Delivered') assert(o.payment_status==='Paid',409,'Record the verified payment before marking this order delivered or collected.');
    if(status==='Cancelled') {
      assert(o.payment_status!=='Paid',409,'Refund the paid order before cancellation.');
      const items=(await client.query('SELECT variant_id,quantity FROM order_items WHERE order_id=$1 ORDER BY variant_id',[id])).rows;
      for(const item of items) {
        const v=(await client.query('UPDATE product_variants SET stock=stock+$1 WHERE id=$2 RETURNING stock',[item.quantity,item.variant_id])).rows[0];
        await client.query('INSERT INTO inventory_movements(variant_id,quantity,stock_after,reason,order_id,admin_id) VALUES($1,$2,$3,$4,$5,$6)',
          [item.variant_id,item.quantity,v.stock,'Order cancelled; reservation released',id,adminId]);
      }
    }
    await client.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2',[status,id]);
    await client.query('INSERT INTO order_events(order_id,type,message,admin_id) VALUES($1,$2,$3,$4)',[id,'status',status,adminId]);
  });
  return getOrder(id);
}
export async function updatePayment(id,status,reference,note,adminId) {
  await transaction(async client=>{
    const o=(await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];
    assert(o,404,'Order not found.');
    if(o.payment_status===status) return;
    const allowed={Pending:['Paid'],Paid:['Refunded'],Refunded:[]};
    assert(allowed[o.payment_status].includes(status),409,`Cannot change ${o.payment_status} to ${status}.`);
    assert(!(status==='Paid' && o.status==='Cancelled'),409,'Cancelled orders cannot be paid.');
    if(status==='Paid' && o.payment_method==='M-Pesa') assert(reference.trim(),400,'Enter the verified M-Pesa transaction reference.');
    if(status==='Refunded') assert(reference.trim() && note.trim(),400,'Enter a refund reference and reason.');
    await client.query('UPDATE orders SET payment_status=$1,updated_at=now() WHERE id=$2',[status,id]);
    await client.query('INSERT INTO payments(order_id,method,status,amount,reference,note,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [id,o.payment_method,status,o.total,reference||null,note,adminId]);
    await client.query('INSERT INTO order_events(order_id,type,message,admin_id) VALUES($1,$2,$3,$4)',[id,'payment',`Payment ${status.toLowerCase()}`,adminId]);
  });
  return getOrder(id);
}
