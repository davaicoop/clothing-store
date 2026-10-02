import { useEffect,useState } from 'react';
import { Link,NavLink,Outlet,useLocation,useNavigate } from 'react-router-dom';
import { Search,ShoppingBag,UserRound,Menu,X,House,Grid2X2,Package,MapPin } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ErrorMessage,Loading } from './UI';

export default function StoreLayout() {
  const {settings,count,loading,error,refresh}=useStore();
  const [menu,setMenu]=useState(false),[search,setSearch]=useState('');
  const navigate=useNavigate(),location=useLocation();
  useEffect(()=>{setMenu(false);window.scrollTo(0,0);},[location.pathname]);
  function submit(e){e.preventDefault();navigate(`/shop?q=${encodeURIComponent(search)}`);setMenu(false);}
  const nav=[['New arrivals','/shop?sort=newest'],['Women','/shop?category=Women'],['Men','/shop?category=Men'],['Shoes','/shop?category=Shoes'],['Accessories','/shop?category=Accessories']];
  return <div className="store-shell">
    <div className="announcement">Good pieces. Everyday prices. <span>Delivery across Kenya · Shop pickup available</span></div>
    <header className="store-header"><div className="header-inner">
      <button className="icon-button mobile-menu" aria-label={menu?'Close menu':'Open menu'} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
      <Link className="wordmark" to="/">{settings.shopName}<span className="brand-dot">.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{nav.map(([label,to])=><Link key={label} to={to}>{label}</Link>)}</nav>
      <div className="header-actions"><Link className="icon-button" to="/shop?search=1" aria-label="Search products"><Search size={21}/></Link>
        <Link className="icon-button account-link" to="/orders" aria-label="My orders"><UserRound size={21}/></Link>
        <Link className="icon-button bag-link" to="/cart" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={21}/>{count>0&&<span className="cart-count">{count}</span>}</Link></div>
    </div></header>
    {menu&&<div className="mobile-menu-panel"><form className="search-input" onSubmit={submit}><Search size={19}/><input aria-label="Search clothing" placeholder="What are you looking for?" value={search} onChange={e=>setSearch(e.target.value)}/><button>Search</button></form>
      {nav.map(([label,to])=><Link key={label} to={to}>{label}</Link>)}<Link to="/orders">Track your order</Link></div>}
    <main className="store-main">{loading?<Loading label="Opening the collection…"/>:error?<div className="page-container"><ErrorMessage>{error}</ErrorMessage><button className="button" onClick={refresh}>Try again</button></div>:<Outlet/>}</main>
    <footer className="store-footer"><div className="footer-grid"><div><Link className="wordmark" to="/">{settings.shopName}.</Link><p>Considered essentials.<br/>Made for your everyday.</p></div>
      <div><h3>The collection</h3><Link to="/shop">Shop all</Link><Link to="/shop?category=Women">Women</Link><Link to="/shop?category=Men">Men</Link><Link to="/shop?category=Shoes">Shoes & accessories</Link></div>
      <div><h3>Here to help</h3><Link to="/orders">Track an order</Link><Link to="/contact">Delivery & contact</Link><Link to="/admin">Shop administration</Link>{settings.email&&<a href={`mailto:${settings.email}`}>{settings.email}</a>}</div>
      <div><h3>Visit the shop</h3><p><MapPin size={16}/> {settings.location}</p>{settings.phone&&<a href={`tel:+${settings.phone}`}>+{settings.phone}</a>}<p>Delivery or pickup.<br/>The choice is yours.</p></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.shopName}</span><span>KENYA / {settings.currency} · M-Pesa, cash & pickup</span></div></footer>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><NavLink end to="/"><House size={21}/><span>Home</span></NavLink><NavLink to="/shop"><Grid2X2 size={21}/><span>Shop</span></NavLink><NavLink to="/cart"><ShoppingBag size={21}/><span>Bag {count>0&&`(${count})`}</span></NavLink><NavLink to="/orders"><Package size={21}/><span>Orders</span></NavLink></nav>
  </div>;
}
