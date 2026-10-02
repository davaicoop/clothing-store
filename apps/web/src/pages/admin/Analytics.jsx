import { useState } from 'react';
import { Banknote,Package,ChartNoAxesCombined,CheckCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import useApiData from '../../hooks/useApiData';
import { AdminHeading,Metric,Panel,SalesChart,Breakdown,DataState } from '../../components/AdminUI';
import { Field } from '../../components/UI';

const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Nairobi'});
const monthStart=()=>`${today().slice(0,7)}-01`;
export default function Analytics() {
  const [from,setFrom]=useState(monthStart()),[to,setTo]=useState(today());
  const state=useApiData(`/admin/analytics?from=${from}&to=${to}`),{money}=useStore(),d=state.data;
  return <><AdminHeading title="Know what moves your shop." description="Revenue reflects verified paid orders. Cancelled and fully refunded orders are excluded."/><div className="analytics-date-range"><Field label="From"><input type="date" value={from} max={to} onChange={e=>e.target.value&&setFrom(e.target.value)}/></Field><Field label="To"><input type="date" value={to} min={from} onChange={e=>e.target.value&&setTo(e.target.value)}/></Field><button className="text-link" onClick={()=>{setFrom('2000-01-01');setTo(today());}}>All time</button></div>
    {!d?<DataState {...state}/>:<><div className="metrics-grid metrics-four"><Metric label="Total revenue" value={money(d.revenue)} note="Includes delivery charges" Icon={Banknote}/><Metric label="Order count" value={d.orderCount} note="Non-cancelled orders" Icon={Package}/><Metric label="Average paid order" value={money(d.averageOrderValue)} note="Verified payments only" Icon={ChartNoAxesCombined}/><Metric label="Paid orders" value={d.paidCount} note="In the selected period" Icon={CheckCheck}/></div><Panel title="Sales by date"><SalesChart data={d.salesByDate}/></Panel><div className="admin-two-col"><Panel title="Sales by category"><Breakdown rows={d.categories}/><p className="small-note">Product sales, excluding delivery charges.</p></Panel><Panel title="Payment methods"><Breakdown rows={d.paymentMethods}/></Panel></div><Panel title="Top products"><Breakdown rows={d.topProducts} quantity/></Panel></>}
  </>;
}
