import { Link } from 'react-router-dom';
import { Banknote,Package,Boxes,Shirt,Clock,CalendarDays,Plus } from 'lucide-react';
import useApiData from '../../hooks/useApiData';
import { useStore } from '../../context/StoreContext';
import { AdminHeading,Metric,Panel,OrdersTable,SalesChart,Breakdown,DataState } from '../../components/AdminUI';

export default function Dashboard() {
  const state=useApiData('/admin/dashboard'),analytics=useApiData('/admin/analytics'),{money}=useStore(),d=state.data;
  if(!d)return <DataState {...state}/>;
  return <><AdminHeading title="A good day to grow." description="Your sales, orders and stock — in one place."><Link className="button button-small" to="/admin/products/new"><Plus size={17}/> Add product</Link></AdminHeading>
    <div className="metrics-grid"><Metric label="Sales today" value={money(d.salesToday)} note="Verified paid orders" Icon={Banknote}/><Metric label="Sales this month" value={money(d.salesMonth)} note="Net of full refunds" Icon={CalendarDays}/><Metric label="Orders today" value={d.ordersToday} note="Includes new orders" Icon={Package}/><Metric label="Pending orders" value={d.pendingOrders} note="Awaiting fulfilment" Icon={Clock}/><Metric label="Low-stock variants" value={d.lowStock.length} note={d.lowStock.length>=12?'Showing first 12 alerts':'Ready for a restock'} Icon={Boxes}/><Metric label="Active products" value={d.totalProducts} note="In your collection" Icon={Shirt}/></div>
    <div className="admin-two-col"><Panel title="Sales over time" action={<Link to="/admin/analytics">View analytics</Link>}>{analytics.data?<SalesChart data={analytics.data.salesByDate}/>:<DataState {...analytics}/>}</Panel><Panel title="Best-selling pieces">{analytics.data?<Breakdown rows={analytics.data.topProducts.slice(0,4)} quantity/>:<DataState {...analytics}/>}</Panel></div>
    <Panel title="Recent orders" action={<Link to="/admin/orders">View all orders</Link>}><OrdersTable orders={d.recentOrders}/></Panel>
    <Panel title="Stock that needs a little attention" action={<Link to="/admin/inventory">Manage inventory</Link>}><div className="low-stock-list">{d.lowStock.length?d.lowStock.map(v=><Link key={v.id} to="/admin/inventory"><div><strong>{v.name}</strong><span>{v.color} / {v.size}</span></div><span className={v.stock===0?'stock-warning out':'stock-warning'}>{v.stock===0?'Out of stock':`${v.stock} left`}</span></Link>):<p className="muted">All active variants are above your low-stock threshold.</p>}</div></Panel>
  </>;
}
