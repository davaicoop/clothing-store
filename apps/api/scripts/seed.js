import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { query,transaction,closeDatabase } from '../src/db.js';
import { config } from '../src/config.js';

const photo=(id,w=900)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export const collection=[
  {name:'The Everyday Tee',category:'T-Shirts',audience:'Unisex',price:1400,cost:650,image:photo('photo-1620799139507-2a76f79a2f4d'),colors:['White','Black'],sizes:['S','M','L','XL'],featured:true},
  {name:'Essential Cotton Hoodie',category:'Hoodies',audience:'Unisex',price:3200,cost:1650,image:photo('photo-1499972777470-6a932ea55420'),colors:['Black','White'],sizes:['S','M','L','XL'],featured:true},
  {name:'The Weekend Jacket',category:'Shirts',audience:'Men',price:4800,cost:2400,image:photo('photo-1591047139829-d91aecb6caea'),colors:['Olive','Black'],sizes:['M','L','XL'],featured:true},
  {name:'City Low-Top Sneakers',category:'Shoes',audience:'Unisex',price:4500,cost:2600,image:photo('photo-1560769629-975ec94e6a86'),colors:['White','Blue'],sizes:['38','39','40','41','42'],featured:true},
  {name:'Sunset Denim Jacket',category:'Shirts',audience:'Women',price:4200,cost:2200,image:photo('photo-1654468087954-b6da0c45f9a8'),colors:['Blue'],sizes:['S','M','L'],featured:true},
  {name:'The Evening Edit Dress',category:'Dresses',audience:'Women',price:3900,cost:1900,image:photo('photo-1564485377539-4af72d1f6a2f'),colors:['Rose','Black'],sizes:['S','M','L'],featured:true},
  {name:'Studio Relaxed Shirt',category:'Shirts',audience:'Men',price:2600,cost:1250,image:photo('photo-1652184513381-9755426e7fd2'),colors:['White','Black'],sizes:['M','L','XL'],featured:false},
  {name:'The Layering Tee',category:'T-Shirts',audience:'Women',price:1200,cost:550,image:photo('photo-1620799139507-2a76f79a2f4d'),colors:['White','Cream'],sizes:['S','M','L'],featured:false},
  {name:'Heavyweight Cotton Tee',category:'T-Shirts',audience:'Men',price:1800,cost:800,image:photo('photo-1562157873-818bc0726f68'),colors:['Navy','Black'],sizes:['M','L','XL'],featured:false},
  {name:'Everyday Canvas Trainers',category:'Shoes',audience:'Unisex',price:3500,cost:1800,image:photo('photo-1560769629-975ec94e6a86'),colors:['White','Blue'],sizes:['37','38','39','40'],featured:false},
  {name:'Straight-Leg Everyday Denim',category:'Trousers',audience:'Unisex',price:2900,cost:1400,image:photo('photo-1714729382668-7bc3bb261662'),colors:['Blue'],sizes:['28','30','32','34','36'],featured:false},
  {name:'The Everyday Canvas Tote',category:'Accessories',audience:'Unisex',price:950,cost:400,image:photo('photo-1663573690125-d326a87a2535'),colors:['Cream','Black'],sizes:['One Size'],featured:false},
];
export async function seed() {
  if(config.adminEmail && config.adminPassword) {
    if(config.production && config.adminPassword==='ChangeMe!2026') throw new Error('Set a unique production ADMIN_PASSWORD.');
    const exists=(await query('SELECT id FROM admins WHERE email=$1',[config.adminEmail.toLowerCase()])).rows[0];
    if(!exists) await query('INSERT INTO admins(email,password_hash) VALUES($1,$2)',[config.adminEmail.toLowerCase(),await bcrypt.hash(config.adminPassword,12)]);
  }
  if(process.env.SEED_CATALOG==='false') return;
  const count=(await query('SELECT COUNT(*)::int AS count FROM products')).rows[0].count;
  if(count) return; // Never overwrite a shop owner's product or stock changes.
  await transaction(async client=>{
    for(const name of ['Men','Women','T-Shirts','Shirts','Hoodies','Trousers','Dresses','Shoes','Accessories']) {
      await client.query('INSERT INTO categories(name,slug) VALUES($1,$2) ON CONFLICT DO NOTHING',[name,name.toLowerCase()]);
    }
    const categories=(await client.query('SELECT * FROM categories')).rows;
    for(let index=0;index<collection.length;index++) {
      const p=collection[index];
      const id=(await client.query(`INSERT INTO products(name,description,category_id,audience,price,cost_price,images,featured,created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()-($9::int * interval '1 day')) RETURNING id`,
        [p.name,'A considered addition to your everyday wardrobe. Comfortable, easy to style, and made for repeat wear. Select your preferred size and colour for current availability. Photography is illustrative; contact us for current product photos.',
          categories.find(c=>c.name===p.category).id,p.audience,p.price,p.cost,JSON.stringify([p.image]),p.featured,index])).rows[0].id;
      let combination=0;
      for(const color of p.colors) for(const size of p.sizes) {
        let stock=8+((index+combination)%8);
        if(index===1 && color==='Black' && size==='M') stock=5;
        if(index===1 && color==='Black' && size==='L') stock=2;
        if(index===1 && color==='White' && size==='M') stock=4;
        if(index===8 && size==='XL') stock=0;
        const v=(await client.query('INSERT INTO product_variants(product_id,size,color,sku,stock) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [id,size,color,`FRM-${String(index+1).padStart(3,'0')}-${color.slice(0,3).toUpperCase()}-${size}`,stock])).rows[0];
        await client.query('INSERT INTO inventory_movements(variant_id,quantity,stock_after,reason) VALUES($1,$2,$3,$4)',[v.id,stock,stock,'Sample catalog opening stock']);
        combination++;
      }
    }
  });
  if(!config.production && process.env.SEED_DEMO_ORDERS==='true') await seedExampleOrders();
  console.log('Seeded example clothing catalog.');
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
