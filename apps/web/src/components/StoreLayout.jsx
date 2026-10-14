import {useEffect,useState} from 'react';
import {Link,NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {Search,ShoppingBag,UserRound,Menu,X,House,Grid2X2,Package,MapPin,ArrowUpRight} from 'lucide-react';
import {useStore} from '../context/StoreContext';
import {ErrorMessage,Loading} from './UI';
import BrandLogo from './BrandLogo';

const nav=[['iPhone','/shop?category=iPhone'],['MacBook','/shop?category=MacBook'],['iPad','/shop?category=iPad'],['Apple Watch','/shop?category=Apple%20Watch'],['AirPods','/shop?category=AirPods'],['Accessories','/shop?category=Accessories']];
export default function StoreLayout() {
  const {settings,count,loading,error,refresh}=useStore();
  const [menu,setMenu]=useState(false),[search,setSearch]=useState('');
  const navigate=useNavigate(),location=useLocation();
  useEffect(()=>{setMenu(false);window.scrollTo(0,0);},[location.pathname,location.search]);
  useEffect(()=>{if(!menu)return;const close=e=>{if(e.key==='Escape')setMenu(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[menu]);
  function submit(e){e.preventDefault();navigate(`/shop?q=${encodeURIComponent(search)}`);setMenu(false);}
  return <div className="store-shell">
    <a className="skip-link" href="#store-content">Skip to content</a>
    <div className="announcement">Welcome to Sam Store <span>iPhone. Mac. iPad. Your Apple essentials.</span></div>
    <header className="store-header"><div className="header-inner">
      <button className="icon-button mobile-menu" aria-label={menu?'Close menu':'Open menu'} aria-expanded={menu} aria-controls="store-menu" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
      <Link className="sam-brand-link" to="/" aria-label="Sam Store home"><BrandLogo/></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{nav.map(([label,to])=><Link key={label} to={to}>{label}</Link>)}</nav>
      <div className="header-actions"><Link className="icon-button" to="/shop?search=1" aria-label="Search products"><Search size={21}/></Link><Link className="icon-button account-link" to="/orders" aria-label="My orders"><UserRound size={21}/></Link><Link className="icon-button bag-link" to="/cart" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={21}/>{count>0&&<span className="cart-count">{count}</span>}</Link></div>
    </div></header>
    {menu&&<nav id="store-menu" aria-label="Mobile collections" className="mobile-menu-panel"><form className="search-input" onSubmit={submit}><Search size={19}/><input aria-label="Search Apple products" placeholder="Search iPhone, MacBook…" value={search} onChange={e=>setSearch(e.target.value)}/><button>Search</button></form><Link to="/shop">All products</Link>{nav.map(([label,to])=><Link key={label} to={to}>{label}<ArrowUpRight size={17}/></Link>)}<Link to="/orders">Track your order</Link></nav>}
    <main id="store-content" className="store-main">{loading?<Loading label="Opening Sam Store…"/>:error?<div className="page-container"><ErrorMessage>{error}</ErrorMessage><button className="button" onClick={refresh}>Try again</button></div>:<Outlet/>}</main>
    <footer className="store-footer"><div className="footer-grid"><div><Link className="sam-brand-link" to="/" aria-label="Sam Store home"><BrandLogo/></Link><p>iPhone, Mac, iPad and the Apple<br/>essentials for your everyday.</p><span className="sam-footer-established">SINCE 2026</span></div><div><h3>Explore the store</h3>{nav.map(([label,to])=><Link key={label} to={to}>{label}</Link>)}</div><div><h3>Here to help</h3><Link to="/orders">Track an order</Link><Link to="/contact">Delivery & contact</Link><Link to="/shop">Browse all products</Link><Link to="/admin">Store administration</Link>{settings.email&&<a href={`mailto:${settings.email}`}>{settings.email}</a>}</div><div><h3>Visit Sam Store</h3><p><MapPin size={16}/> {settings.location}</p>{settings.phone&&<a href={`tel:+${settings.phone}`}>+{settings.phone}</a>}<p>Choose delivery or shop pickup.<br/>M-Pesa, cash & pay on pickup.</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.shopName}. All rights reserved.</span><span>Independent retailer · Apple product names belong to Apple Inc.</span></div></footer>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><NavLink end to="/"><House size={21}/><span>Home</span></NavLink><NavLink to="/shop"><Grid2X2 size={21}/><span>Shop</span></NavLink><NavLink to="/cart"><ShoppingBag size={21}/><span>Bag {count>0&&`(${count})`}</span></NavLink><NavLink to="/orders"><Package size={21}/><span>Orders</span></NavLink></nav>
  </div>;
}
