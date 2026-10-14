import {Link} from 'react-router-dom';
import {ArrowUpRight,ArrowRight,Smartphone,Laptop,Tablet,Watch,Headphones,Cable,Truck,Store,MessageCircle} from 'lucide-react';
import {useStore} from '../../context/StoreContext';
import {whatsappLink} from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import {ProductImage} from '../../components/UI';

const ranges=[
  {name:'iPhone',caption:'Find your iPhone',Icon:Smartphone},
  {name:'MacBook',caption:'Work. Create. Go.',Icon:Laptop},
  {name:'iPad',caption:'Room for your ideas',Icon:Tablet},
  {name:'Apple Watch',caption:'On your wrist',Icon:Watch},
  {name:'AirPods',caption:'Your everyday sound',Icon:Headphones},
  {name:'Accessories',caption:'The little essentials',Icon:Cable},
];
const faqs=[
  ['How do I choose the right iPhone?','Start with the model, then choose your storage and colour. Ask us to confirm the condition, battery health where relevant, SIM configuration and package contents for the exact device.'],
  ['Why do some products say “Price on enquiry”?','These are catalogue previews. Sam Store will confirm the selling price and available stock before the listing is opened for checkout.'],
  ['Can I pay with M-Pesa?','Available products can be ordered with M-Pesa. The store verifies your payment and updates your order status. Cash on delivery and pay on pickup are also available for their respective order types.'],
  ['How does delivery or pickup work?','Choose delivery or shop pickup at checkout. Enter your location for delivery. For pickup, wait for the store to confirm that your order is ready. You can follow updates on the order tracking page.'],
];
export default function Home() {
  const {products,settings}=useStore();
  const featured=products.filter(p=>p.featured).slice(0,4);
  const phones=products.filter(p=>p.category==='iPhone').slice(2,6);
  const chat=whatsappLink(settings.whatsapp,`Hello Sam Store, I'd like help choosing an Apple device.`);
  return <>
    <section className="sam-hero">
      <div className="sam-hero-copy"><span className="eyebrow gold-eyebrow"><span className="gold-dot"/> SAM STORE / SINCE 2026</span>
        <h1>Your next<br/><span>iPhone.</span><br/>Right here.</h1>
        <p>Discover iPhone, Mac, iPad and the Apple essentials that fit your day.</p>
        <div className="sam-hero-buttons"><Link className="button" to="/shop?category=iPhone">Explore iPhones <ArrowRight size={18}/></Link><Link className="sam-quiet-link" to="/shop">Shop all products <ArrowUpRight size={17}/></Link></div>
        <div className="sam-hero-foot"><span>YOUR MODEL. YOUR COLOUR. YOUR STORAGE.</span><span>01 / THE IPHONE COLLECTION</span></div>
      </div>
      <div className="sam-hero-visual"><span className="sam-visual-label">A CLOSER LOOK AT PRO</span><ProductImage src="/products/iphone-pro-hero.jpg" alt="iPhone 16 Pro in Desert Titanium, shown from the front and back" fetchPriority="high" width="600" height="600"/>
        <Link className="sam-hero-product" to="/shop?category=iPhone"><div><span>iPhone 16 Pro</span><small>Titanium design. A18 Pro chip.</small></div><ArrowUpRight size={25}/></Link>
      </div>
    </section>
    <div className="sam-service-strip"><span><Smartphone size={19}/> Apple products, your way</span><span><Truck size={19}/> Delivery & shop pickup</span><span><MessageCircle size={19}/> Help choosing your device</span></div>
    <section className="sam-range-section page-container"><div className="sam-section-heading"><div><span className="eyebrow">EXPLORE SAM STORE</span><h2>All your favourites. One store.</h2></div><Link className="text-link" to="/shop">View all <ArrowUpRight size={17}/></Link></div>
      <div className="sam-range-grid">{ranges.map(({name,caption,Icon})=><Link className="sam-range" key={name} to={`/shop?category=${encodeURIComponent(name)}`}><Icon size={30} strokeWidth={1.35}/><strong>{name}</strong><span>{caption}</span><ArrowUpRight className="sam-range-arrow" size={15}/></Link>)}</div>
    </section>
    <section className="sam-products-section page-container"><div className="sam-section-heading"><div><span className="eyebrow">THE SAM STORE SELECTION</span><h2>Find your next upgrade.</h2></div><Link className="text-link" to="/shop">Explore the catalogue <ArrowUpRight size={17}/></Link></div>
      {products.some(p=>p.showcase)&&<p className="sam-preview-note"><span/> Preview listings show the range. Confirm price and availability with Sam Store.</p>}
      <div className="product-grid">{featured.map((p,i)=><ProductCard product={p} index={i} key={p.id}/>)}</div>
    </section>
    <section className="sam-bento page-container"><Link to="/shop?category=MacBook" className="sam-feature-tile sam-mac-tile"><div><span className="eyebrow">MACBOOK</span><h2>A little less weight.<br/>A lot more possibility.</h2><p>Meet your next work and study companion.</p><span className="text-link">Explore MacBook <ArrowUpRight size={17}/></span></div><ProductImage src="/products/macbook-air.png" alt="MacBook Air with M3 chip" loading="lazy"/></Link>
      <Link to="/shop?category=AirPods" className="sam-feature-tile sam-audio-tile"><div><span className="eyebrow">AIRPODS</span><h2>Put your day<br/>on play.</h2><span className="text-link">Explore AirPods <ArrowUpRight size={17}/></span></div><ProductImage src="/products/airpods.png" alt="AirPods Pro 2 with charging case" loading="lazy"/></Link>
    </section>
    <section className="sam-products-section page-container"><div className="sam-section-heading"><div><span className="eyebrow">PICK YOUR IPHONE</span><h2>Which one feels like you?</h2></div><Link className="text-link" to="/shop?category=iPhone">All iPhones <ArrowUpRight size={17}/></Link></div><div className="product-grid">{phones.map((p,i)=><ProductCard product={p} index={i} key={p.id}/>)}</div></section>
    <section className="sam-help-section page-container"><div><span className="eyebrow">BEFORE YOU CHOOSE</span><h2>A few things<br/>you might ask.</h2><p>Choose your device with the details that matter to you.</p><Link className="text-link" to="/contact">Talk to Sam Store <ArrowUpRight size={17}/></Link></div><div className="sam-faqs">{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <section className="sam-closing"><div><span className="eyebrow">FROM SAM STORE, WITH CARE</span><h2>Your Apple world<br/>starts here.</h2><p>Find a device for the way you live, work and create.</p><div className="button-row"><Link className="button" to="/shop">Browse products <ArrowRight size={18}/></Link>{chat?<a className="button button-outline" href={chat} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Ask Sam Store</a>:<Link className="button button-outline" to="/contact">Contact the store <ArrowUpRight size={18}/></Link>}</div></div><div className="sam-closing-signature"><Store size={34} strokeWidth={1}/><span>SAM STORE</span><small>SINCE 2026</small></div></section>
  </>;
}
