import { useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { Search,MessageCircle,Phone } from 'lucide-react';
import { api,whatsappLink,formatDate } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import useApiData from '../../hooks/useApiData';
import { AdminHeading,Panel,DataState,OrdersTable } from '../../components/AdminUI';
import { ErrorMessage,Field,Badge } from '../../components/UI';
import OrderView from '../../components/OrderView';

export default function Orders() {
  const {id}=useParams();
  return id?<OrderDetails key={id} id={id}/>:<OrderList/>;
}
function OrderList() {
  const state=useApiData('/admin/orders'),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[payment,setPayment]=useState('');
  if(!state.data)return <DataState {...state}/>;
  const orders=state.data.filter(o=>`${o.orderNumber} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(search.toLowerCase())&&(!status||o.status===status)&&(!payment||o.paymentStatus===payment));
  return <><AdminHeading title="From placed to delivered." description="Confirm orders, record verified payments and keep customers updated."/><Panel title={`${orders.length} orders`}><div className="admin-toolbar"><div className="search-input"><Search size={18}/><input aria-label="Search orders" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Order number, customer or phone…"/></div><select aria-label="Filter fulfilment status" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All fulfilment states</option>{['New','Confirmed','Preparing','Ready','Out for Delivery','Delivered','Cancelled'].map(s=><option key={s}>{s}</option>)}</select><select aria-label="Filter payment status" value={payment} onChange={e=>setPayment(e.target.value)}><option value="">All payment states</option>{['Pending','Paid','Refunded'].map(s=><option key={s}>{s}</option>)}</select></div><OrdersTable orders={orders}/></Panel></>;
}
function OrderDetails({id}) {
  const state=useApiData(`/admin/orders/${id}`),{refresh,money,notify}=useStore();
  const [nextStatus,setNextStatus]=useState(''),[reference,setReference]=useState(''),[note,setNote]=useState(''),[verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  if(!state.data)return <DataState {...state}/>;
  const order=state.data;
  const transitions={New:['Confirmed','Cancelled'],Confirmed:['Preparing','Cancelled'],Preparing:['Ready','Cancelled'],Ready:[order.fulfilment==='Pickup'?'Delivered':'Out for Delivery','Cancelled'],'Out for Delivery':['Delivered'],Delivered:[],Cancelled:[]};
  const next=transitions[order.status]||[];
  const whatsapp=whatsappLink(order.customer.phone,`Hello ${order.customer.name}, this is an update about your order ${order.orderNumber}.`);
  async function updateStatus(e){e.preventDefault();setBusy(true);setError('');try{state.setData(await api(`/admin/orders/${id}/status`,{method:'PATCH',body:{status:nextStatus||next[0]}}));setNextStatus('');await refresh();notify('Order status updated');}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function payment(e){e.preventDefault();setBusy(true);setError('');try{state.setData(await api(`/admin/orders/${id}/payment`,{method:'PATCH',body:{status:order.paymentStatus==='Pending'?'Paid':'Refunded',reference,note}}));setReference('');setNote('');setVerified(false);notify('Payment record updated');}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <><Link className="text-link" to="/admin/orders">Back to orders</Link><AdminHeading title="A little care, at every step." description={`Manage ${order.orderNumber}`}><div className="button-row"><a className="button button-outline button-small" href={`tel:+${order.customer.phone}`}><Phone size={16}/> Call customer</a><a className="button button-outline button-small" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp</a></div></AdminHeading><ErrorMessage>{error}</ErrorMessage>
    <div className="admin-two-col"><Panel title="Fulfilment status">{next.length?<form onSubmit={updateStatus}><Field label="Move order to"><select value={nextStatus||next[0]} onChange={e=>setNextStatus(e.target.value)}>{next.map(s=><option key={s}>{s}</option>)}</select></Field><p className="small-note">Cancellation restores the reserved stock once. A paid order needs a recorded refund before cancellation.</p><button className="button button-small" disabled={busy}>Update status</button></form>:<p className="muted">This order is {order.status.toLowerCase()}. Its fulfilment is complete.</p>}</Panel>
      <Panel title="Payment verification">{order.paymentStatus==='Refunded'||order.status==='Cancelled'&&order.paymentStatus!=='Paid'?<p className="muted">No further payment action is available.</p>:<form onSubmit={payment}><p><Badge>{order.paymentStatus}</Badge> {order.paymentMethod} · {money(order.total)}</p><Field label={order.paymentStatus==='Pending'?'Transaction / receipt reference':'Refund reference'}><input maxLength={100} required={order.paymentStatus==='Paid'||order.paymentMethod==='M-Pesa'} value={reference} onChange={e=>setReference(e.target.value)} placeholder={order.paymentMethod==='M-Pesa'?'Verified M-Pesa transaction code':'Cash receipt or bank reference'}/></Field><Field label={order.paymentStatus==='Paid'?'Refund reason':'Internal note (optional)'}><input maxLength={500} required={order.paymentStatus==='Paid'} value={note} onChange={e=>setNote(e.target.value)}/></Field><label className="checkbox-row"><input required type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>{order.paymentStatus==='Pending'?'I have verified receipt of the full payment.':'I have completed the full refund.'}</label><button className="button button-small" disabled={busy||!verified}>{order.paymentStatus==='Pending'?'Record verified payment':'Record refund'}</button></form>}</Panel></div>
    <OrderView order={order} admin onRefresh={state.reload}/><Panel title="Payment history"><div className="table-scroll"><table><thead><tr><th>Recorded</th><th>Status</th><th>Amount</th><th>Reference</th><th>Internal note</th></tr></thead><tbody>{order.payments.map(p=><tr key={p.id}><td>{formatDate(p.created_at,true)}</td><td><Badge>{p.status}</Badge></td><td>{money(p.amount)}</td><td>{p.reference||'—'}</td><td>{p.note||'—'}</td></tr>)}</tbody></table></div></Panel>
  </>;
}
