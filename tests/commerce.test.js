import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

process.env.NODE_ENV='test';
process.env.USE_EMBEDDED_DB='true';
process.env.EMBEDDED_DB_PATH='memory://';
process.env.SEED_DEMO_ORDERS='false';
process.env.ADMIN_EMAIL='admin@clothing.local';
process.env.ADMIN_PASSWORD='ChangeMe!2026';
const {app}=await import('../apps/api/src/app.js');
const {migrate}=await import('../apps/api/scripts/migrate.js');
const {seed}=await import('../apps/api/scripts/seed.js');
const {query,closeDatabase}=await import('../apps/api/src/db.js');
let server,base,cookie='',products,adminId;
async function request(path,method='GET',body,extra={}) {
  const res=await fetch(`${base}/api${path}`,{method,headers:{'Content-Type':'application/json','X-Requested-With':'clothing-store',...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
  const data=await res.json();return {status:res.status,data,res};
}
const checkout=(variantId,quantity=1,phone='0712345678')=>({customer:{name:'Test Shopper',phone,email:'shopper@example.com'},fulfilment:'Delivery',town:'Nairobi',address:'Westlands test address',instructions:'Call on arrival',paymentMethod:'M-Pesa',items:[{variantId,quantity}]});
before(async()=>{
  await migrate();await seed();
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  products=(await request('/products')).data;
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await closeDatabase();});

test('public catalog, database health and protected admin sessions',async()=>{
  assert.equal((await request('/health')).status,200);
  assert.ok(products.length>=10);assert.ok(products.every(p=>p.variants.length>0));
  assert.ok(products.every(p=>p.costPrice===undefined));
  assert.equal((await request('/admin/products')).status,401);
  assert.equal((await request('/auth/login','POST',{email:'admin@clothing.local',password:'wrong'})).status,401);
  const login=await request('/auth/login','POST',{email:'admin@clothing.local',password:'ChangeMe!2026'});
  assert.equal(login.status,200);cookie=login.res.headers.get('set-cookie').split(';')[0];adminId=login.data.admin.id;
  assert.match(login.res.headers.get('set-cookie'),/HttpOnly/);assert.match(login.res.headers.get('set-cookie'),/SameSite=Strict/);
  assert.equal((await request('/admin/products')).status,200);
  assert.equal((await request('/admin/settings','PUT',{}, {'X-Requested-With':''})).status,403);
  assert.equal((await request('/admin/settings','PUT',{}, {Origin:'https://elsewhere.example'})).status,403);
});
test('guest checkout recomputes totals, reserves variant stock, and is idempotent',async()=>{
  const v=products[0].variants[0],beforeStock=(await query('SELECT stock FROM product_variants WHERE id=$1',[v.id])).rows[0].stock;
  const payload={...checkout(v.id,2),total:1,deliveryFee:0},key=randomUUID();
  const first=await request('/orders','POST',payload,{'Idempotency-Key':key});
  assert.equal(first.status,201,JSON.stringify(first.data));
  assert.equal(first.data.order.total,products[0].price*2+300);
  assert.equal(first.data.order.paymentStatus,'Pending');assert.equal(first.data.order.status,'New');
  assert.equal((await query('SELECT stock FROM product_variants WHERE id=$1',[v.id])).rows[0].stock,beforeStock-2);
  const again=await request('/orders','POST',payload,{'Idempotency-Key':key});
  assert.equal(again.status,200);assert.equal(again.data.order.id,first.data.order.id);
  assert.equal((await query('SELECT stock FROM product_variants WHERE id=$1',[v.id])).rows[0].stock,beforeStock-2);
  assert.equal((await request('/orders','POST',checkout(v.id,1),{'Idempotency-Key':key})).status,409);
  const denied=await request(`/orders/${first.data.order.id}?token=${'a'.repeat(64)}`);assert.equal(denied.status,404);
  const valid=await request(`/orders/${first.data.order.id}?token=${first.data.token}`);assert.equal(valid.status,200);
  assert.ok(valid.data.payments.every(p=>p.note===undefined));
  const lookup=await request('/orders/lookup','POST',{orderNumber:first.data.order.orderNumber,phone:'0712345678'});assert.equal(lookup.status,200);
  assert.equal((await request('/orders/lookup','POST',{orderNumber:first.data.order.orderNumber,phone:'0712345679'})).status,404);
});
test('concurrent checkouts cannot oversell the last units',async()=>{
  const v=products[1].variants[0];await query('UPDATE product_variants SET stock=3 WHERE id=$1',[v.id]);
  const results=await Promise.all([request('/orders','POST',checkout(v.id,2,'0722345671'),{'Idempotency-Key':randomUUID()}),request('/orders','POST',checkout(v.id,2,'0722345672'),{'Idempotency-Key':randomUUID()})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  assert.equal((await query('SELECT stock FROM product_variants WHERE id=$1',[v.id])).rows[0].stock,1);
});
test('order lifecycle, verified M-Pesa payment, refund and cancellation preserve stock',async()=>{
  const v=products[2].variants[0],beforeStock=(await query('SELECT stock FROM product_variants WHERE id=$1',[v.id])).rows[0].stock;
  const placed=await request('/orders','POST',checkout(v.id),{'Idempotency-Key':randomUUID()}),id=placed.data.order.id;
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Delivered'})).status,409);
  assert.equal((await request(`/admin/orders/${id}/payment`,'PATCH',{status:'Paid'})).status,400);
  assert.equal((await request(`/admin/orders/${id}/payment`,'PATCH',{status:'Paid',reference:'TEST-VERIFIED',note:'Test payment'})).status,200);
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Cancelled'})).status,409);
  assert.equal((await request(`/admin/orders/${id}/payment`,'PATCH',{status:'Refunded',reference:'TEST-REFUND',note:'Customer cancelled'})).status,200);
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Cancelled'})).status,200);
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Cancelled'})).status,200);
  assert.equal((await query('SELECT stock FROM product_variants WHERE id=$1',[v.id])).rows[0].stock,beforeStock);
  assert.equal((await query("SELECT COUNT(*)::int AS n FROM inventory_movements WHERE order_id=$1 AND quantity>0",[id])).rows[0].n,1);
  assert.equal((await request(`/admin/orders/${id}/payment`,'PATCH',{status:'Paid',reference:'FAIL'})).status,409);
});
test('product create/edit/archive and auditable inventory adjustments work',async()=>{
  const category=products[0].categoryId;
  const payload={name:'Test Linen Shirt',categoryId:category,description:'Test item',price:2300,costPrice:900,
    images:['https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d'],variants:[{size:'M',color:'White',sku:'TEST-LINEN-M',stock:5}]};
  const created=await request('/admin/products','POST',payload);assert.equal(created.status,201,JSON.stringify(created.data));
  let product=(await request('/admin/products')).data.find(p=>p.id===created.data.id),v=product.variants[0];
  assert.equal((await request(`/admin/inventory/${v.id}/adjust`,'POST',{quantity:3,reason:'Test delivery'})).status,200);
  assert.equal((await request(`/admin/inventory/${v.id}/adjust`,'POST',{quantity:-99,reason:'Invalid removal'})).status,409);
  assert.equal((await request(`/admin/products/${product.id}`,'PUT',{...payload,variants:[{...v,stock:7,expectedStock:5}]})).status,409);
  const update=await request(`/admin/products/${product.id}`,'PUT',{...payload,name:'Updated Linen Shirt',variants:[{...v,stock:7,expectedStock:8}]});assert.equal(update.status,200,JSON.stringify(update.data));
  const history=await request(`/admin/inventory/history?variantId=${v.id}`);assert.ok(history.data.some(m=>m.quantity===3));
  assert.equal((await request(`/admin/products/${product.id}`,'DELETE')).status,200);
  assert.equal((await request(`/products/${product.id}`)).status,404);
  assert.ok((await request('/admin/products')).data.some(p=>p.id===product.id&&!p.active));
});
test('pickup fulfilment, sales reports, customers and settings are functional',async()=>{
  const v=products[3].variants[0];
  const payload={...checkout(v.id,1,'0732345678'),fulfilment:'Pickup',paymentMethod:'Pay on Pickup',address:'',town:''};
  const placed=await request('/orders','POST',payload,{'Idempotency-Key':randomUUID()}),id=placed.data.order.id;
  assert.equal(placed.data.order.deliveryFee,0);
  for(const status of ['Confirmed','Preparing','Ready'])assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status})).status,200);
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Out for Delivery'})).status,400);
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Delivered'})).status,409);
  assert.equal((await request(`/admin/orders/${id}/payment`,'PATCH',{status:'Paid',note:'Test cash received'})).status,200);
  assert.equal((await request(`/admin/orders/${id}/status`,'PATCH',{status:'Delivered'})).status,200);
  const analytics=await request('/admin/analytics');assert.equal(analytics.status,200,JSON.stringify(analytics.data));
  assert.equal(analytics.data.revenue,placed.data.order.total);assert.equal(analytics.data.paidCount,1);
  assert.equal(analytics.data.topProducts[0].quantity,1);assert.ok(analytics.data.salesByDate.length);
  assert.equal((await request('/admin/dashboard')).status,200);
  assert.ok((await request('/admin/customers')).data.some(c=>c.phone==='254732345678'&&c.totalSpend===placed.data.order.total));
  const settings=(await request('/settings')).data;
  assert.equal((await request('/admin/settings','PUT',{...settings,shopName:'Test Clothing Shop',phone:'0712345000',whatsapp:'0712345000',email:'shop@example.com',deliveryFee:200})).status,200);
  assert.equal((await request('/settings')).data.shopName,'Test Clothing Shop');
  const category=await request('/admin/categories','POST',{name:'Outerwear'});assert.equal(category.status,201);
  assert.equal((await request(`/admin/categories/${category.data.id}`,'PUT',{name:'Jackets'})).status,200);
  assert.equal((await request('/auth/logout','POST')).status,200);
  assert.equal((await request('/admin/orders')).status,401);
});
