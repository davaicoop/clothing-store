import { Link } from 'react-router-dom';
import { Truck,Store,Smartphone,MoveUpRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard';
import { ProductImage } from '../../components/UI';

const image=(id,w=1600)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export default function Home() {
  const {products}=useStore();
  const categories=[
    {name:'Women',caption:'Your everyday, reimagined.',photo:image('photo-1654468087954-b6da0c45f9a8',700)},
    {name:'Men',caption:'A better kind of essential.',photo:image('photo-1591047139829-d91aecb6caea',700)},
    {name:'Shoes',caption:'Find your next favourite pair.',photo:image('photo-1560769629-975ec94e6a86',700)},
    {name:'Accessories',caption:'The finishing touch.',photo:image('photo-1663573690125-d326a87a2535',700)},
  ];
  const best=[...products].sort((a,b)=>b.popularity-a.popularity).slice(0,4);
  return <>
    <section className="fashion-hero"><div className="hero-copy"><span className="eyebrow"><span/>THE EVERYDAY EDIT / 01</span><h1>Good style.<br/>Your way<span>.</span></h1><p>Easy essentials. Fresh finds.<br/>A wardrobe that feels like you.</p><div className="hero-buttons"><Link className="button" to="/shop">Explore the collection</Link><Link className="text-link" to="/shop?sort=newest">Discover new arrivals</Link></div><div className="hero-index"><span>LESS EFFORT. MORE YOU.</span><span>01 — 03</span></div></div>
      <div className="hero-image"><ProductImage src={image('photo-1652184513381-9755426e7fd2')} alt="Fashion portrait from the everyday collection" fetchPriority="high"/><div className="hero-image-label"><span>OFF-DUTY.<br/>ON POINT.</span><Link to="/shop?category=Women">Shop the look <MoveUpRight size={21}/></Link></div><div className="image-corner">THE NEW ROTATION</div></div></section>
    <div className="benefit-strip"><span><Truck size={21}/> Delivery across Kenya</span><span><Smartphone size={21}/> M-Pesa & cash options</span><span><Store size={21}/> Easy shop pickup</span></div>
    <section className="collection-section page-container"><div className="section-heading"><div><span className="eyebrow">JUST LANDED</span><h2>New in. All you.</h2></div><Link className="text-link" to="/shop?sort=newest">Shop new arrivals</Link></div><div className="product-grid">{products.slice(0,4).map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div></section>
    <section className="category-section page-container"><div className="section-heading"><div><span className="eyebrow">FIND YOUR ROTATION</span><h2>Go your own way.</h2></div><Link className="text-link" to="/shop">Shop all</Link></div><div className="category-grid">{categories.map(c=><Link className="category-tile" to={`/shop?category=${c.name}`} key={c.name}><ProductImage src={c.photo} alt={`${c.name} collection`} loading="lazy"/><div><h3>{c.name}</h3><span>{c.caption}</span></div><MoveUpRight className="category-icon" size={25}/></Link>)}</div></section>
    <section className="editorial-banner"><div className="editorial-image"><ProductImage src={image('photo-1654468087954-b6da0c45f9a8',1200)} alt="Denim layers worn in warm evening light" loading="lazy"/></div><div className="editorial-copy"><span className="eyebrow">THE WEEKEND UNIFORM</span><h2>Wear it.<br/>Live in it.<br/>Repeat.</h2><p>The pieces you reach for again and again.<br/>Discover easy layers for whatever comes next.</p><Link className="button button-white" to="/shop?category=Shirts">Find your layers</Link><span className="editorial-note">EVERYDAY, ELEVATED.</span></div></section>
    <section className="collection-section page-container"><div className="section-heading"><div><span className="eyebrow">IN GOOD COMPANY</span><h2>The most-loved edit.</h2></div><Link className="text-link" to="/shop?sort=popular">Shop best sellers</Link></div><div className="product-grid">{best.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div></section>
    <section className="closing-band"><span>LOOK GOOD. FEEL LIKE YOU.</span><h2>Your next favourite<br/>is waiting.</h2><Link className="button" to="/shop">Shop the collection</Link></section>
  </>;
}
