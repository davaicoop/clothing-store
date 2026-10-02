import { Router } from 'express';
import { z } from 'zod';
import { query,transaction } from '../db.js';
import { productSchema,uuid,text } from '../lib/validation.js';
import { assert } from '../lib/errors.js';
import { getProducts } from '../services/catalog.js';

export const productsRouter=Router();
productsRouter.get('/products',async(_req,res)=>res.json(await getProducts({includeArchived:true})));
async function saveProduct(body,id,adminId) {
  const p=productSchema.parse(body);
  return transaction(async client=>{
    assert((await client.query('SELECT id FROM categories WHERE id=$1',[p.categoryId])).rows[0],400,'Choose an existing category.');
    let productId=id;
    if(id) {
      assert((await client.query('SELECT id FROM products WHERE id=$1 FOR UPDATE',[id])).rows[0],404,'Product not found.');
      await client.query(`UPDATE products SET name=$1,description=$2,category_id=$3,audience=$4,price=$5,cost_price=$6,images=$7,active=$8,featured=$9 WHERE id=$10`,
        [p.name,p.description,p.categoryId,p.audience,p.price,p.costPrice??null,JSON.stringify(p.images),p.active,p.featured,id]);
    } else {
      productId=(await client.query(`INSERT INTO products(name,description,category_id,audience,price,cost_price,images,active,featured)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [p.name,p.description,p.categoryId,p.audience,p.price,p.costPrice??null,JSON.stringify(p.images),p.active,p.featured])).rows[0].id;
    }
    const old=(await client.query('SELECT * FROM product_variants WHERE product_id=$1 ORDER BY id FOR UPDATE',[productId])).rows;
    // Preserve referenced variants so existing order history remains valid.
    await client.query('UPDATE product_variants SET active=false WHERE product_id=$1',[productId]);
    for(const v of p.variants) {
      let variantId=v.id, previous=0;
      if(v.id) {
        const existing=old.find(o=>o.id===v.id);
        assert(existing,400,'Variant does not belong to this product.');
        assert(v.expectedStock===existing.stock,409,'Stock changed while you were editing. Reopen this product to load current stock.');
        previous=existing.stock;
        await client.query('UPDATE product_variants SET size=$1,color=$2,sku=$3,stock=$4,active=true WHERE id=$5',
          [v.size,v.color,v.sku,v.stock,v.id]);
      } else {
        assert(!old.some(o=>o.size.toLowerCase()===v.size.toLowerCase() && o.color.toLowerCase()===v.color.toLowerCase()),409,'This combination already exists. Restore its existing variant instead.');
        variantId=(await client.query('INSERT INTO product_variants(product_id,size,color,sku,stock) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [productId,v.size,v.color,v.sku,v.stock])).rows[0].id;
      }
      if(v.stock!==previous) await client.query('INSERT INTO inventory_movements(variant_id,quantity,stock_after,reason,admin_id) VALUES($1,$2,$3,$4,$5)',
        [variantId,v.stock-previous,v.stock,id?'Product stock adjustment':'Opening stock',adminId]);
    }
    return productId;
  });
}
productsRouter.post('/products',async(req,res)=>{
  const id=await saveProduct(req.body,null,req.admin.id); res.status(201).json({id});
});
productsRouter.put('/products/:id',async(req,res)=>{
  uuid.parse(req.params.id);
  await saveProduct(req.body,req.params.id,req.admin.id); res.json({id:req.params.id});
});
productsRouter.delete('/products/:id',async(req,res)=>{
  uuid.parse(req.params.id);
  const {rows}=await query('UPDATE products SET active=false WHERE id=$1 RETURNING id',[req.params.id]);
  assert(rows[0],404,'Product not found.'); res.json({ok:true});
});
productsRouter.post('/categories',async(req,res)=>{
  const name=text(60).parse(req.body.name);
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  assert(slug,400,'Use a category name with letters or numbers.');
  res.status(201).json((await query('INSERT INTO categories(name,slug) VALUES($1,$2) RETURNING id,name,slug',[name,slug])).rows[0]);
});
productsRouter.put('/categories/:id',async(req,res)=>{
  uuid.parse(req.params.id); const name=text(60).parse(req.body.name);
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  assert(slug,400,'Use a category name with letters or numbers.');
  const {rows}=await query('UPDATE categories SET name=$1,slug=$2 WHERE id=$3 RETURNING id,name,slug',[name,slug,req.params.id]);
  assert(rows[0],404,'Category not found.'); res.json(rows[0]);
});
