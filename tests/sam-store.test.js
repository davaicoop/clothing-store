import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

process.env.NODE_ENV='test';
process.env.USE_EMBEDDED_DB='true';
process.env.EMBEDDED_DB_PATH='memory://';
process.env.SEED_DEMO_ORDERS='false';
process.env.ADMIN_EMAIL='admin@sam.test';
process.env.ADMIN_PASSWORD='TestAdmin!2026';
const {query,execute,closeDatabase}=await import('../apps/api/src/db.js');
const {migrate}=await import('../apps/api/scripts/migrate.js');
const {seed}=await import('../apps/api/scripts/seed.js');
const {placeOrder,getOrder}=await import('../apps/api/src/services/orders.js');
const {getProducts,getSettings}=await import('../apps/api/src/services/catalog.js');
const {app}=await import('../apps/api/src/app.js');
let legacyProduct,legacyVariant,legacyOrder,server,base,cookie;
const checkout=id=>({customer:{name:'Device shopper',phone:'0711223344'},fulfilment:'Pickup',paymentMethod:'Pay on Pickup',items:[{variantId:id,quantity:1}]});
async function request(path,method='GET',body,extra={}) {
  const response=await fetch(`${base}/api${path}`,{method,headers:{'Content-Type':'application/json','X-Requested-With':'clothing-store',...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json(),response};
}
before(async()=>{
  // Simulate the actual pre-conversion database, including a reserved clothing order.
  for(const version of ['001_initial.sql','002_payment_instructions.sql']) {
    await execute(await readFile(new URL(`../apps/api/migrations/${version}`,import.meta.url),'utf8'));
    await query('INSERT INTO schema_migrations(version) VALUES($1)',[version]);
  }
  const category=(await query("INSERT INTO categories(name,slug) VALUES('Shirts','shirts') RETURNING id")).rows[0].id;
  legacyProduct=(await query("INSERT INTO products(name,category_id,price,images) VALUES('Original shirt',$1,2500,'[]') RETURNING id",[category])).rows[0].id;
  legacyVariant=(await query("INSERT INTO product_variants(product_id,size,color,sku,stock) VALUES($1,'M','Black','FRM-LEGACY-M',5) RETURNING id",[legacyProduct])).rows[0].id;
  await query("UPDATE business_settings SET phone='254711223344',whatsapp='254711223344',delivery_fee=400 WHERE id=1");
  // Create the old order using the old schema, before the new application migration.
  const customer=(await query("INSERT INTO customers(name,phone) VALUES('Legacy shopper','254711223344') RETURNING id")).rows[0].id;
  const orderId=randomUUID();
  await query(`INSERT INTO orders(id,order_number,customer_id,customer_name,customer_phone,subtotal,total,payment_method,fulfilment,request_key,request_hash,lookup_hash)
    VALUES($1,'CS-LEGACY-ORDER',$2,'Legacy shopper','254711223344',2500,2500,'Pay on Pickup','Pickup',$3,'legacy-request','legacy-access')`,[orderId,customer,randomUUID()]);
  await query(`INSERT INTO order_items(order_id,product_id,variant_id,product_name,category_name,size,color,sku,quantity,unit_price)
    VALUES($1,$2,$3,'Original shirt','Shirts','M','Black','FRM-LEGACY-M',1,2500)`,[orderId,legacyProduct,legacyVariant]);
  await query('UPDATE product_variants SET stock=4 WHERE id=$1',[legacyVariant]);
  legacyOrder={id:orderId};
  await migrate();await seed();
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}`;
  const login=await request('/auth/login','POST',{email:'admin@sam.test',password:'TestAdmin!2026'});
  cookie=login.response.headers.get('set-cookie').split(';')[0];
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await closeDatabase();});

test('store conversion archives clothing while preserving orders and owner contact settings',async()=>{
  const settings=await getSettings();
  assert.equal(settings.shopName,'Sam Store');
  assert.equal(settings.phone,'254711223344');assert.equal(settings.deliveryFee,400);
  assert.ok(!(await getProducts()).some(p=>p.id===legacyProduct));
  assert.ok((await getProducts({includeArchived:true})).some(p=>p.id===legacyProduct&&!p.active));
  const order=await getOrder(legacyOrder.id);
  assert.equal(order.items[0].name,'Original shirt');assert.equal(order.items[0].size,'M');assert.equal(order.total,2500);
  assert.equal((await query('SELECT stock FROM product_variants WHERE id=$1',[legacyVariant])).rows[0].stock,4);
  assert.equal((await request('/admin/products')).status,200);
  assert.deepEqual((await request('/admin/dashboard')).data.lowStock,[],'Unconfirmed showcase products are not real low-stock inventory.');
  assert.ok((await request('/admin/inventory')).data.every(v=>v.showcase&&!v.lowStock),'Preview inventory is identified without triggering low-stock warnings.');
  assert.ok((await getProducts()).some(p=>p.category==='iPhone'&&p.variants.some(v=>v.size==='256GB')));
});

test('starter showcase listings reject checkout even when a stock count is added accidentally',async()=>{
  const product=(await getProducts()).find(p=>p.category==='iPhone');
  assert.ok(product,'An iPhone starter listing should be visible');
  assert.equal(product.showcase,true);
  assert.ok(product.variants.every(v=>v.stock===0));
  const variant=product.variants[0];await query('UPDATE product_variants SET stock=3 WHERE id=$1',[variant.id]);
  await assert.rejects(()=>placeOrder(checkout(variant.id),randomUUID()),error=>error.status===409&&/confirm|showcase|preview/i.test(error.message));
  assert.equal((await query('SELECT stock FROM product_variants WHERE id=$1',[variant.id])).rows[0].stock,3);
});

test('admin can verify a device listing, sell its storage variant, and safely restart seeds',async()=>{
  const category=(await getProducts())[0].categoryId;
  const payload={name:'Verified iPhone',categoryId:category,description:'Actual shop listing',price:80000,showcase:true,images:['/products/iphone-16.png'],variants:[{size:'256GB',color:'Black',sku:'TEST-IPHONE-256',stock:4}]};
  const created=await request('/admin/products','POST',payload);assert.equal(created.status,201);
  let product=(await request('/admin/products')).data.find(p=>p.id===created.data.id);
  assert.equal(product.showcase,true);
  const variant=product.variants[0];
  assert.equal((await request('/orders','POST',checkout(variant.id),{'Idempotency-Key':randomUUID()})).status,409);
  assert.equal((await request(`/admin/products/${product.id}`,'PUT',{...payload,showcase:false,price:85000,variants:[{...variant,stock:4,expectedStock:4}]})).status,200);
  const placed=await request('/orders','POST',checkout(variant.id),{'Idempotency-Key':randomUUID()});
  assert.equal(placed.status,201);assert.equal(placed.data.order.total,85000);assert.equal(placed.data.order.items[0].size,'256GB');
  const count=(await getProducts()).length;
  await migrate();await seed();
  assert.equal((await getProducts()).length,count);
  product=(await getProducts()).find(p=>p.id===created.data.id);
  assert.equal(product.showcase,false);assert.equal(product.price,85000);assert.equal(product.variants[0].stock,3);
  assert.equal((await getOrder(legacyOrder.id)).items[0].name,'Original shirt');
});
