import { useEffect,useState } from 'react';
import { Link,useParams,useSearchParams } from 'react-router-dom';
import { api,readStorage,formatDate } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import { ErrorMessage,Field,Loading } from '../../components/UI';
import OrderView from '../../components/OrderView';

export function OrderTracking() {
  const {id}=useParams(),[params]=useSearchParams(),[order,setOrder]=useState(null),[error,setError]=useState('');
  const saved=readStorage('clothing-orders-v1',[]);
  const token=params.get('token')||(Array.isArray(saved)?saved.find(o=>o.id===id)?.token:'');
  async function load(){try{if(!token)throw new Error('Use your order number and phone on the tracking page.');setOrder(await api(`/orders/${id}?token=${encodeURIComponent(token)}`));setError('');}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[id,token]);
  return <div className="page-container tracking-page">{error?<><ErrorMessage>{error}</ErrorMessage><Link className="button" to="/orders">Track an order</Link></>:order?<OrderView order={order} placed={params.get('placed')==='1'} onRefresh={load}/>:<Loading label="Finding your order…"/>}</div>;
}
export default function Orders() {
  const [number,setNumber]=useState(''),[phone,setPhone]=useState(''),[order,setOrder]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const {money}=useStore(),saved=readStorage('clothing-orders-v1',[]);
  async function find(e){e?.preventDefault();setBusy(true);setError('');try{setOrder(await api('/orders/lookup',{method:'POST',body:{orderNumber:number,phone}}));}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="page-container orders-page"><div className="page-heading"><span className="eyebrow">FROM OUR SHOP TO YOUR WARDROBE</span><h1>Your orders.</h1><p>Track your pieces, from confirmed to collected.</p></div>
    <form className="tracking-form" onSubmit={find}><Field label="Order number"><input required value={number} onChange={e=>setNumber(e.target.value)} placeholder="CS-…" maxLength={60}/></Field><Field label="Phone used at checkout"><input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XX XXX XXX" maxLength={25}/></Field><button className="button" disabled={busy}>{busy?'Finding order…':'Find my order'}</button></form><ErrorMessage>{error}</ErrorMessage>
    {order?<OrderView order={order} onRefresh={find}/>:Array.isArray(saved)&&saved.length>0?<section className="saved-orders"><h2>Orders on this device</h2>{saved.filter(o=>o?.id&&o?.token).map(o=><Link key={o.id} to={`/orders/${o.id}?token=${o.token}`}><div><strong>{o.orderNumber}</strong><span>{formatDate(o.createdAt)}</span></div><strong>{money(o.total)}</strong><span>View order</span></Link>)}</section>:<div className="tracking-help"><p>Your order number appears after checkout. Enter it with your phone number to see the latest updates.</p><Link className="text-link" to="/shop">Discover the collection</Link></div>}
  </div>;
}
