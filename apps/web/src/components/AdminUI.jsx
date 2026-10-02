import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatDate } from '../lib/api';
import { Badge,Empty,ErrorMessage,Loading } from './UI';

export function AdminHeading({eyebrow,title,description,children}) {return <div className="admin-page-heading"><div><span className="eyebrow">{eyebrow||'YOUR SHOP, AT A GLANCE'}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{children&&<div>{children}</div>}</div>;}
export function DataState({loading,error,reload}) {return loading?<Loading/>:error?<><ErrorMessage>{error}</ErrorMessage>{reload&&<button className="button" onClick={reload}>Retry</button>}</>:null;}
export function Metric({label,value,note,Icon}) {return <div className="metric"><div><span>{label}</span>{Icon&&<Icon size={19}/>}</div><strong>{value}</strong><small>{note}</small></div>;}
export function OrdersTable({orders}) {
  const {money}=useStore();
  if(!orders.length)return <Empty title="Your first order starts here." description="Share the storefront with your customers." action="Open storefront" to="/"/>;
  return <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Date</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><Link className="table-link" to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link><small>{o.fulfilment}</small></td><td><strong>{o.customer.name}</strong><small>+{o.customer.phone}</small></td><td className="nowrap">{money(o.total)}</td><td><Badge>{o.paymentStatus}</Badge></td><td><Badge>{o.status}</Badge></td><td className="nowrap">{formatDate(o.createdAt)}</td></tr>)}</tbody></table></div>;
}
export function Panel({title,action,children,className=''}) {return <section className={`admin-panel ${className}`}><div className="panel-heading"><h2>{title}</h2>{action}</div>{children}</section>;}
export function SalesChart({data}) {
  const {money}=useStore();
  if(!data.length)return <div className="chart-empty">Sales will appear here once a payment is recorded.</div>;
  const max=Math.max(...data.map(d=>d.total),1),w=640,h=180;
  const points=data.map((d,i)=>`${data.length===1?w/2:35+i*(w-70)/(data.length-1)},${h-25-d.total/max*(h-50)}`).join(' ');
  const shape=`35,${h} ${points} ${w-35},${h}`;
  return <div className="sales-chart"><div className="chart-axis"><span>{money(max)}</span><span>{money(0)}</span></div><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Sales over ${data.length} selling days. ${data.map(d=>`${d.date}: ${money(d.total)}`).join('; ')}`}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1748e7" stopOpacity=".17"/><stop offset="100%" stopColor="#1748e7" stopOpacity="0"/></linearGradient></defs>{[30,80,130,175].map(y=><line key={y} x1="0" y1={y} x2={w} y2={y} stroke="#edf0f5"/>)}<polygon points={shape} fill="url(#salesFill)"/><polyline points={points} fill="none" stroke="#1748e7" strokeWidth="3" strokeLinejoin="round"/>{data.map((d,i)=><circle key={d.date} cx={data.length===1?w/2:35+i*(w-70)/(data.length-1)} cy={h-25-d.total/max*(h-50)} r="4" fill="#1748e7"><title>{d.date}: {money(d.total)}</title></circle>)}</svg><div className="chart-dates"><span>{formatDate(data[0].date)}</span><span>{formatDate(data[data.length-1].date)}</span></div></div>;
}
export function Breakdown({rows,quantity=false}) {
  const {money}=useStore(),max=Math.max(...rows.map(r=>quantity?r.quantity:r.total),1);
  return rows.length?<div className="breakdown-list">{rows.map((r,i)=><div key={r.id||r.name}><div><span><small>{String(i+1).padStart(2,'0')}</small> {r.name}</span><strong>{quantity?`${r.quantity} sold`:money(r.total)}</strong></div><div className="bar-track"><span style={{width:`${(quantity?r.quantity:r.total)/max*100}%`}}/></div></div>)}</div>:<div className="chart-empty">No paid sales in this period yet.</div>;
}
