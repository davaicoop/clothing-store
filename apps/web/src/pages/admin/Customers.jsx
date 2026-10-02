import { useState } from 'react';
import { Search,MessageCircle,Phone } from 'lucide-react';
import { formatDate,whatsappLink } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import useApiData from '../../hooks/useApiData';
import { AdminHeading,Panel,DataState } from '../../components/AdminUI';

export default function Customers() {
  const state=useApiData('/admin/customers'),{money}=useStore(),[search,setSearch]=useState('');
  if(!state.data)return <DataState {...state}/>;
  const customers=state.data.filter(c=>`${c.name} ${c.phone} ${c.email||''}`.toLowerCase().includes(search.toLowerCase()));
  return <><AdminHeading title="The people behind every order." description="A simple view of your customers and their shopping history."/><Panel title={`${customers.length} customers`}><div className="admin-toolbar"><div className="search-input"><Search size={18}/><input aria-label="Search customers" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone or email…"/></div></div><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Paid spend</th><th>Last order</th><th>Connect</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td><div className="customer-name"><span>{c.name.charAt(0)}</span><strong>{c.name}</strong></div></td><td>+{c.phone}<small>{c.email||'No email provided'}</small></td><td>{c.orderCount}</td><td className="nowrap">{money(c.totalSpend)}</td><td>{formatDate(c.lastOrder)}</td><td><div className="table-actions"><a className="icon-button" href={`tel:+${c.phone}`} aria-label={`Call ${c.name}`}><Phone size={17}/></a><a className="icon-button" target="_blank" rel="noreferrer" href={whatsappLink(c.phone,`Hello ${c.name}!`)} aria-label={`WhatsApp ${c.name}`}><MessageCircle size={17}/></a></div></td></tr>)}</tbody></table>{!customers.length&&<p className="table-empty">Customer records appear automatically after checkout.</p>}</div></Panel></>;
}
