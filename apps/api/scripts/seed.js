import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { query,transaction,closeDatabase } from '../src/db.js';
import { config } from '../src/config.js';

import { collection } from '../src/data/apple-catalog.js';
export { collection };

export async function seed() {
  if(config.adminEmail && config.adminPassword) {
    if(config.production && config.adminPassword==='ChangeMe!2026') throw new Error('Set a unique production ADMIN_PASSWORD.');
    const exists=(await query('SELECT id FROM admins WHERE email=$1',[config.adminEmail.toLowerCase()])).rows[0];
    if(!exists) await query('INSERT INTO admins(email,password_hash) VALUES($1,$2)',[config.adminEmail.toLowerCase(),await bcrypt.hash(config.adminPassword,12)]);
  }
  if(process.env.SEED_CATALOG==='false') return;
  const seeded=(await query('SELECT sam_catalog_seeded FROM business_settings WHERE id=1')).rows[0].sam_catalog_seeded;
  if(seeded) return; // Owner edits and stock survive every restart.
  const demoOrders=!config.production && process.env.SEED_DEMO_ORDERS==='true';
  await transaction(async client=>{
    for(const name of ['iPhone','MacBook','iPad','Apple Watch','AirPods','Accessories']) {
      await client.query('INSERT INTO categories(name,slug) VALUES($1,$2) ON CONFLICT DO NOTHING',[name,name.toLowerCase().replaceAll(' ','-')]);
    }
    const categories=(await client.query('SELECT * FROM categories')).rows;
    for(let index=0;index<collection.length;index++) {
      const p=collection[index];
      const id=(await client.query(`INSERT INTO products(name,description,category_id,audience,price,images,featured,showcase,created_at)
        VALUES($1,$2,$3,'Unisex',$4,$5,$6,$7,now()-($8::int * interval '1 day')) RETURNING id`,
        [p.name,p.description,categories.find(c=>c.name===p.category).id,p.price,JSON.stringify([p.image]),p.featured,!demoOrders,index])).rows[0].id;
      let combination=0;
      for(const color of p.colors) for(const size of p.sizes) {
        const stock=demoOrders?8:0;
        const v=(await client.query('INSERT INTO product_variants(product_id,size,color,sku,stock) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [id,size,color,`SAM-${String(index+1).padStart(3,'0')}-${++combination}`,stock])).rows[0];
        if(stock) await client.query('INSERT INTO inventory_movements(variant_id,quantity,stock_after,reason) VALUES($1,$2,$3,$4)',[v.id,stock,stock,'Local demo opening stock']);
      }
    }
    await client.query('UPDATE business_settings SET sam_catalog_seeded=true WHERE id=1');
  });
  if(!config.production && process.env.SEED_DEMO_ORDERS==='true') await seedExampleOrders();
  console.log('Seeded Sam Store Apple catalogue. Preview listings require owner confirmation before sale.');
}
async function seedExampleOrders() {
  const {placeOrder,updatePayment,updateOrderStatus}=await import('../src/services/orders.js');
  const variants=(await query(`SELECT v.id FROM product_variants v JOIN products p ON p.id=v.product_id
    WHERE v.stock>=8 ORDER BY p.name LIMIT 8`)).rows;
  const customers=[['Amani Wanjiru','0712000001'],['Brian Otieno','0722000002'],['Nia Kamau','0733000003']];
  const admin=(await query('SELECT id FROM admins LIMIT 1')).rows[0];
  for(let i=0;i<7;i++) {
    const [name,phone]=customers[i%3];
    const {order}=await placeOrder({customer:{name,phone},fulfilment:i%2?'Delivery':'Pickup',town:'Nairobi',address:'Development example address',
      instructions:'Development example order',paymentMethod:i%2?'Cash on Delivery':'Pay on Pickup',items:[{variantId:variants[i%variants.length].id,quantity:1}]},randomUUID());
    if(i<5) {
      await updatePayment(order.id,'Paid','DEMO','Development example only',admin.id);
      for(const status of ['Confirmed','Preparing','Ready']) await updateOrderStatus(order.id,status,admin.id);
      if(order.fulfilment==='Delivery') await updateOrderStatus(order.id,'Out for Delivery',admin.id);
      await updateOrderStatus(order.id,'Delivered',admin.id);
    }
    await query("UPDATE orders SET created_at=now()-($1::int * interval '1 day') WHERE id=$2",[i,order.id]);
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {await seed();await closeDatabase();}
