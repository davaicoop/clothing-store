import { useEffect,useState } from 'react';
import { Link,NavLink,Navigate,Outlet,useLocation,useNavigate } from 'react-router-dom';
import { LayoutDashboard,Shirt,Boxes,Package,Users,ChartNoAxesCombined,Settings,LogOut,PanelLeft,ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { ErrorMessage,Loading } from './UI';

const links=[['Dashboard','/admin',LayoutDashboard],['Products','/admin/products',Shirt],['Inventory','/admin/inventory',Boxes],['Orders','/admin/orders',Package],['Customers','/admin/customers',Users],['Analytics','/admin/analytics',ChartNoAxesCombined],['Settings','/admin/settings',Settings]];
export default function AdminLayout() {
  const {settings}=useStore(),location=useLocation(),navigate=useNavigate();
  const [admin,setAdmin]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[open,setOpen]=useState(false);
  useEffect(()=>{api('/auth/me').then(r=>setAdmin(r.admin)).catch(e=>{if(e.status!==401)setError(e.message);}).finally(()=>setLoading(false));},[]);
  useEffect(()=>{setOpen(false);window.scrollTo(0,0);},[location.pathname]);
  async function logout(){try{await api('/auth/logout',{method:'POST'});setAdmin(null);navigate('/admin/login');}catch(e){setError(e.message);}}
  if(loading)return <Loading label="Opening your shop workspace…"/>;
  if(error&&!admin)return <div className="page-container"><ErrorMessage>{error}</ErrorMessage><button className="button" onClick={()=>window.location.reload()}>Retry</button></div>;
  if(!admin)return <Navigate to="/admin/login" replace state={{from:location.pathname}}/>;
  const title=links.find(([,path])=>path==='/admin'?location.pathname===path:location.pathname.startsWith(path))?.[0]||'Workspace';
  return <div className="admin-shell"><aside className={`admin-sidebar ${open?'open':''}`}><Link className="wordmark" to="/admin">{settings.shopName||'FORME'}<span>.</span></Link><span className="sidebar-caption">SHOP WORKSPACE</span><nav aria-label="Administration">{links.map(([label,to,Icon])=><NavLink key={label} to={to} end={to==='/admin'}><Icon size={19}/>{label}</NavLink>)}</nav><div className="sidebar-bottom"><Link to="/" target="_blank"><ExternalLink size={18}/> View storefront</Link><button onClick={logout}><LogOut size={18}/> Sign out</button><div className="admin-profile"><span>{admin.name[0]}</span><div><strong>{admin.name}</strong><small>{admin.email}</small></div></div></div></aside>
    {open&&<div className="admin-nav-overlay" onClick={()=>setOpen(false)}/>}
    <div className="admin-content"><header className="admin-header"><div><button className="icon-button admin-menu-button" onClick={()=>setOpen(!open)} aria-label="Toggle admin navigation"><PanelLeft size={22}/></button><span className="admin-breadcrumb">Workspace <span>/</span> <strong>{title}</strong></span></div><div className="admin-header-right"><span>KENYA · KES</span><Link className="button button-outline button-small" to="/" target="_blank">View shop <ExternalLink size={14}/></Link></div></header>
      <main className="admin-main">{settings.demoMode&&<div className="demo-notice">Local development · Example orders and payments are displayed.</div>}<ErrorMessage>{error}</ErrorMessage><Outlet context={{admin,logout}}/></main></div></div>;
}
