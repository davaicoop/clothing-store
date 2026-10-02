import { useEffect,useState } from 'react';
import { Link,useNavigate,useParams } from 'react-router-dom';
import { Plus,Trash2,Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import useApiData from '../../hooks/useApiData';
import { AdminHeading,Panel,DataState } from '../../components/AdminUI';
import { ErrorMessage,Field,Empty } from '../../components/UI';

const blankVariant=()=>({size:'M',color:'Black',sku:`SKU-${crypto.randomUUID().slice(0,8).toUpperCase()}`,stock:0});
export default function ProductEditor() {
  const {id}=useParams(),navigate=useNavigate(),{categories,refresh,notify}=useStore(),state=useApiData('/admin/products');
  const [form,setForm]=useState({name:'',description:'',categoryId:'',audience:'Unisex',price:'',costPrice:'',imageText:'',active:true,featured:false,variants:[blankVariant()]}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const product=state.data?.find(p=>p.id===id);
  useEffect(()=>{if(!id&&categories.length)setForm(prev=>prev.categoryId?prev:{...prev,categoryId:categories[0].id});},[id,categories]);
  useEffect(()=>{if(product)setForm({...product,costPrice:product.costPrice??'',imageText:product.images.join('\n'),variants:product.variants.filter(v=>v.active).map(v=>({...v,expectedStock:v.stock}))});},[product]);
  const change=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  function variant(index,key,value){setForm(prev=>({...prev,variants:prev.variants.map((v,i)=>i===index?{...v,[key]:value}:v)}));}
  async function save(e){e.preventDefault();setBusy(true);setError('');try{
    const payload={...form,price:Number(form.price),costPrice:form.costPrice===''?null:Number(form.costPrice),images:form.imageText.split('\n').map(s=>s.trim()).filter(Boolean),variants:form.variants.map(v=>({...v,stock:Number(v.stock)}))};
    await api(`/admin/products${id?`/${id}`:''}`,{method:id?'PUT':'POST',body:payload});await refresh();notify(id?'Product updated':'Product created');navigate('/admin/products');
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  if(id&&!state.data)return <DataState {...state}/>;
  if(id&&!product)return <Empty title="Product not found." description="Return to the collection to choose a product." to="/admin/products" action="View products"/>;
  const archived=product?.variants.filter(v=>!v.active&&!form.variants.some(f=>f.id===v.id))||[];
  return <><Link className="text-link" to="/admin/products">Back to products</Link><AdminHeading title={id?'Refine this piece.':'Add a new favourite.'} description="Start with the details, then give each size and colour its own stock."/><ErrorMessage>{error}</ErrorMessage>
    <form className="product-editor" onSubmit={save}><div><Panel title="Product details"><Field label="Product name"><input required maxLength={150} value={form.name} onChange={e=>change('name',e.target.value)}/></Field><Field label="Description"><textarea rows={5} maxLength={5000} value={form.description} onChange={e=>change('description',e.target.value)}/></Field><div className="field-pair"><Field label="Category"><select required value={form.categoryId} onChange={e=>change('categoryId',e.target.value)}><option value="">Choose a category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Collection"><select value={form.audience} onChange={e=>change('audience',e.target.value)}>{['Unisex','Men','Women'].map(a=><option key={a}>{a}</option>)}</select></Field></div><div className="field-pair"><Field label="Selling price (KSh)"><input required type="number" min="0.01" max="10000000" step="0.01" value={form.price} onChange={e=>change('price',e.target.value)}/></Field><Field label="Cost price (optional)"><input type="number" min="0" max="10000000" step="0.01" value={form.costPrice} onChange={e=>change('costPrice',e.target.value)}/></Field></div></Panel>
      <Panel title="Sizes, colours & stock" action={<button type="button" className="text-link" onClick={()=>change('variants',[...form.variants,blankVariant()])}><Plus size={16}/> Add variant</button>}><p className="small-note">Each combination needs a unique SKU. Removing a variant hides it; its order history stays intact.</p><div className="variant-editor-list">{form.variants.map((v,i)=><div className="variant-editor-row" key={v.id||i}><Field label="Size"><input required maxLength={30} value={v.size} onChange={e=>variant(i,'size',e.target.value)}/></Field><Field label="Colour"><input required maxLength={40} value={v.color} onChange={e=>variant(i,'color',e.target.value)}/></Field><Field label="SKU"><input required maxLength={80} value={v.sku} onChange={e=>variant(i,'sku',e.target.value)}/></Field><Field label="Stock"><input required type="number" min="0" max="1000000" value={v.stock} onChange={e=>variant(i,'stock',e.target.value)}/></Field><button type="button" className="icon-button" disabled={form.variants.length===1} onClick={()=>change('variants',form.variants.filter((_,j)=>j!==i))} aria-label={`Remove variant ${i+1}`}><Trash2 size={17}/></button></div>)}</div>
        {archived.length>0&&<details className="archived-variants"><summary>Restore an archived variant</summary>{archived.map(v=><button key={v.id} type="button" className="text-link" onClick={()=>change('variants',[...form.variants,{...v,expectedStock:v.stock}])}>{v.color} / {v.size} · {v.sku}</button>)}</details>}</Panel></div>
      <div><Panel title="Product photography"><Field label="Image URLs" hint="One HTTPS image URL per line. The first image is the main photo. Up to 12 images."><textarea rows={7} required value={form.imageText} onChange={e=>change('imageText',e.target.value)} placeholder="https://…"/></Field><p className="small-note">Use photos of the actual product so customers can choose with confidence.</p></Panel><Panel title="Storefront visibility"><label className="checkbox-row"><input type="checkbox" checked={form.active} onChange={e=>change('active',e.target.checked)}/> Active in the storefront</label><label className="checkbox-row"><input type="checkbox" checked={form.featured} onChange={e=>change('featured',e.target.checked)}/> Featured in the edit</label><button className="button full-width" disabled={busy}><Save size={17}/>{busy?'Saving…':id?'Save changes':'Create product'}</button></Panel></div>
    </form></>;
}
