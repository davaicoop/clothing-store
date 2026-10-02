import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter,Routes,Route,Link } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import StoreLayout from './components/StoreLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/store/Home';
import Catalogue from './pages/store/Catalogue';
import Product from './pages/store/Product';
import Cart from './pages/store/Cart';
import Checkout from './pages/store/Checkout';
import Orders,{OrderTracking} from './pages/store/Orders';
import Contact from './pages/store/Contact';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductEditor from './pages/admin/ProductEditor';
import Inventory from './pages/admin/Inventory';
import AdminOrders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import { Empty } from './components/UI';
import './styles/base.css';
import './styles/store.css';
import './styles/admin.css';

class ErrorBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error){console.error('Page error',error);}
  render(){return this.state.failed?<div className="empty-state"><h1>Let's try that again.</h1><p>This page couldn't load. Your saved bag is still on this device.</p><button className="button" onClick={()=>window.location.assign('/')}>Open the shop</button></div>:this.props.children;}
}
function App() {
  return <ErrorBoundary><BrowserRouter><StoreProvider><Routes>
    <Route element={<StoreLayout/>}>
      <Route index element={<Home/>}/><Route path="shop" element={<Catalogue/>}/><Route path="products/:id" element={<Product/>}/>
      <Route path="cart" element={<Cart/>}/><Route path="checkout" element={<Checkout/>}/><Route path="orders" element={<Orders/>}/>
      <Route path="orders/:id" element={<OrderTracking/>}/><Route path="contact" element={<Contact/>}/>
      <Route path="*" element={<Empty title="A little off the runway." description="This page doesn't exist. Let's get you back to the collection."/>}/>
    </Route>
    <Route path="admin/login" element={<Login/>}/><Route path="admin" element={<AdminLayout/>}>
      <Route index element={<Dashboard/>}/><Route path="products" element={<Products/>}/><Route path="products/new" element={<ProductEditor/>}/>
      <Route path="products/:id" element={<ProductEditor/>}/><Route path="inventory" element={<Inventory/>}/>
      <Route path="orders" element={<AdminOrders/>}/><Route path="orders/:id" element={<AdminOrders/>}/>
      <Route path="customers" element={<Customers/>}/><Route path="analytics" element={<Analytics/>}/><Route path="settings" element={<Settings/>}/>
      <Route path="*" element={<div className="empty-state"><h2>Page not found.</h2><Link className="button" to="/admin">Open dashboard</Link></div>}/>
    </Route>
  </Routes></StoreProvider></BrowserRouter></ErrorBoundary>;
}
createRoot(document.getElementById('root')).render(<App/>);
