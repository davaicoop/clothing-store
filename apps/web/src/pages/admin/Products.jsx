import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus,Search,Archive,Pencil } from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import useApiData from '../../hooks/useApiData';
import { AdminHeading,Panel,DataState } from '../../components/AdminUI';
import { Badge,Empty,ErrorMessage,Modal,ProductImage } from '../../components/UI';

export default function Products() {
  const state=useApiData('/admin/products'),{money,refresh}=useStore();
  const [search,setSearch]=useState(''),[filter,setFilter]=useState('active'),[archive,setArchive]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  if(!state.data)return <DataState {...state}/>;
  const products=state.data.filter(p=>(filter==='all'||(filter==='active'?p.active:!p.active))&&`${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()));
  async function confirm(){setBusy(true);try{await api(`/admin/products/${archive.id}`,{method:'DELETE'});setArchive(null);await state.reload();await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <><AdminHeading title="Your collection." description="Keep every piece, price and variant in order."><Link className="button button-small" to="/admin/products/new"><Plus size={17}/> Add product</Link></AdminHeading><ErrorMessage>{error}</ErrorMessage>
    <Panel title={`${products.length} products`}><div className="admin-toolbar"><div className="search-input"><Search size={18}/><input aria-label="Search products" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your collection…"/></div><select aria-label="Product status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="active">Active products</option><option value="archived">Archived products</option><option value="all">All products</option></select></div>
      {products.length?<div className="table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Variants</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="table-product"><ProductImage src={p.images[0]} alt={p.name}/><div><Link className="table-link" to={`/admin/products/${p.id}`}>{p.name}</Link><small>{p.category} · {p.audience}</small></div></div></td><td className="nowrap">{money(p.price)}{p.costPrice!==null&&<small>Cost {money(p.costPrice)}</small>}</td><td>{p.variants.filter(v=>v.active).length}</td><td>{p.variants.filter(v=>v.active).reduce((n,v)=>n+v.stock,0)}</td><td><Badge>{p.active?'Active':'Archived'}</Badge></td><td><div className="table-actions"><Link className="icon-button" aria-label={`Edit ${p.name}`} to={`/admin/products/${p.id}`}><Pencil size={17}/></Link>{p.active&&<button className="icon-button" onClick={()=>{setError('');setArchive(p);}} aria-label={`Archive ${p.name}`}><Archive size={17}/></button>}</div></td></tr>)}</tbody></table></div>:<Empty title="No products in this view." description="Add a new piece or try a different search." action="Add product" to="/admin/products/new"/>}</Panel>
    {archive&&<Modal title="Archive this product?" onClose={()=>setArchive(null)}><p>{archive.name} will be hidden from the storefront. Existing order and stock history will be preserved.</p><div className="modal-actions"><button className="button button-outline" onClick={()=>setArchive(null)}>Keep product</button><button className="button" disabled={busy} onClick={confirm}>{busy?'Archiving…':'Archive product'}</button></div></Modal>}
  </>;
}
