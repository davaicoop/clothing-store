import { useEffect,useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { Minus,Plus,ShoppingBag,MessageCircle,Truck,Store,Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { colorValue,whatsappLink } from '../../lib/api';
import { Empty,ProductImage } from '../../components/UI';
import ProductCard from '../../components/ProductCard';

export default function Product() {
  const {id}=useParams(),{products,money,settings,addToCart}=useStore();
  const product=products.find(p=>p.id===id);
  const initial=product?.variants.find(v=>v.stock>0)||product?.variants[0];
  const [color,setColor]=useState(initial?.color||''),[size,setSize]=useState(initial?.size||''),[quantity,setQuantity]=useState(1),[imageIndex,setImageIndex]=useState(0),[added,setAdded]=useState(false);
  useEffect(()=>{setColor(initial?.color||'');setSize(initial?.size||'');setQuantity(1);setImageIndex(0);setAdded(false);},[id]);
  useEffect(()=>{setQuantity(1);setAdded(false);},[color,size]);
  if(!product)return <Empty title="This piece isn't available." description="Discover something else from the collection."/>;
  const colors=[...new Set(product.variants.map(v=>v.color))];
  const rank=['XS','S','M','L','XL','XXL'];
  const sizes=[...new Set(product.variants.map(v=>v.size))].sort((a,b)=>rank.includes(a)&&rank.includes(b)?rank.indexOf(a)-rank.indexOf(b):a.localeCompare(b,undefined,{numeric:true}));
  const variant=product.variants.find(v=>v.color===color && v.size===size);
  const related=products.filter(p=>p.id!==id && (p.category===product.category || p.audience===product.audience)).slice(0,4);
  const whatsapp=whatsappLink(settings.whatsapp,`Hello ${settings.shopName}, I have a question about ${product.name} (${color} / ${size}).`);
  function selectColor(c) {setColor(c);if(!product.variants.some(v=>v.color===c && v.size===size && v.stock>0))setSize(product.variants.find(v=>v.color===c && v.stock>0)?.size||'');}
  function add(){if(variant&&addToCart(product,variant,quantity))setAdded(true);}
  return <div className="page-container product-page"><div className="breadcrumbs"><Link to="/shop">The collection</Link><span>/</span><Link to={`/shop?category=${product.category}`}>{product.category}</Link><span>/</span><span>{product.name}</span></div>
    <div className="product-detail-layout"><div className="product-gallery"><div className="product-main-image"><ProductImage src={product.images[imageIndex]} alt={`${product.name} product photograph`}/><span className="product-tag">THE EVERYDAY EDIT</span></div>{product.images.length>1&&<div className="gallery-thumbnails">{product.images.map((src,i)=><button key={src+i} className={i===imageIndex?'selected':''} onClick={()=>setImageIndex(i)} aria-label={`View image ${i+1}`}><ProductImage src={src} alt={`${product.name} view ${i+1}`}/></button>)}</div>}</div>
    <section className="product-detail"><span className="eyebrow">{product.category.toUpperCase()} / {product.audience.toUpperCase()}</span><h1>{product.name}</h1><p className="detail-price">{money(product.price)}</p><p className="detail-intro">A new favourite for your everyday rotation.</p>
      <div className="variant-section"><div className="variant-label">Colour <strong>{color||'Choose a colour'}</strong></div><div className="color-options">{colors.map(c=><button key={c} aria-label={`Colour ${c}`} aria-pressed={c===color} className={c===color?'selected':''} onClick={()=>selectColor(c)}><span style={{background:colorValue(c)}}/>{c}</button>)}</div></div>
      <div className="variant-section"><div className="variant-label">Size <strong>{size||'Choose a size'}</strong></div><div className="size-options">{sizes.map(s=>{const v=product.variants.find(v=>v.color===color && v.size===s);return <button key={s} className={size===s?'selected':''} disabled={!v?.stock} onClick={()=>setSize(s)} aria-pressed={size===s}>{s}</button>;})}</div></div>
      <p className={`stock-label ${!variant?.stock?'out':''}`}>{variant?.stock?<><span/> {variant.stock<=5?`Only ${variant.stock} left in ${color} / ${size}`:`${variant.stock} available in ${color} / ${size}`}</>:'This combination is currently sold out.'}</p>
      <div className="add-to-bag-row"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={()=>setQuantity(Math.max(1,quantity-1))} disabled={quantity<=1}><Minus size={16}/></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={()=>setQuantity(quantity+1)} disabled={quantity>=Math.min(99,variant?.stock||0)}><Plus size={16}/></button></div><button className="button" disabled={!variant?.stock} onClick={add}>{added?<Check size={19}/>:<ShoppingBag size={19}/>} {added?'Added to bag':'Add to bag'}</button></div>
      {added&&<Link className="text-link view-bag-link" to="/cart">View your bag & checkout</Link>}
      <div className="product-delivery"><span><Truck size={19}/> Delivery {money(settings.deliveryFee)}</span><span><Store size={19}/> Free shop pickup</span></div>
      <details open className="product-accordion"><summary>About this piece</summary><p>{product.description}</p></details>
      <details className="product-accordion"><summary>Delivery & payment</summary><p>Choose delivery or pickup at checkout. Pay with M-Pesa, cash on delivery, or pay at pickup. M-Pesa payments are confirmed by the shop after verification.</p><Link to="/contact">Delivery & contact details</Link></details>
      {whatsapp?<a className="whatsapp-link" target="_blank" rel="noreferrer" href={whatsapp}><MessageCircle size={18}/> Ask us about this piece</a>:<Link className="whatsapp-link" to="/contact"><MessageCircle size={18}/> Questions? Contact the shop</Link>}
    </section></div>
    {related.length>0&&<section className="collection-section"><div className="section-heading"><div><span className="eyebrow">COMPLETE YOUR ROTATION</span><h2>You might also like.</h2></div></div><div className="product-grid">{related.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
  </div>;
}
