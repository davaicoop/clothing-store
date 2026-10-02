import { createContext,useContext,useEffect,useMemo,useState } from 'react';
import { api,readStorage,writeStorage } from '../lib/api';

const StoreContext=createContext(null);
export function StoreProvider({children}) {
  const [products,setProducts]=useState([]);
  const [categories,setCategories]=useState([]);
  const [settings,setSettings]=useState({shopName:'FORME',currency:'KES',currencySymbol:'KSh',deliveryFee:300});
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [cart,setCart]=useState(()=>{
    const saved=readStorage('clothing-cart-v1',[]);
    return Array.isArray(saved)?saved.filter(i=>i && typeof i.variantId==='string' && typeof i.productId==='string' && Number.isInteger(i.quantity) && i.quantity>0 && i.quantity<=99):[];
  });
  async function refresh() {
    try {
      const [p,c,s]=await Promise.all([api('/products'),api('/categories'),api('/settings')]);
      setProducts(p);setCategories(c);setSettings(s);setError('');
    }catch(e){setError(e.message);}finally{setLoading(false);}
  }
  useEffect(()=>{refresh();const focus=()=>refresh();window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[]);
  useEffect(()=>{writeStorage('clothing-cart-v1',cart);},[cart]);
  useEffect(()=>{document.title=`${settings.shopName} · Everyday, elevated`;},[settings.shopName]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
  const money=amount=>`${settings.currencySymbol} ${Number(amount||0).toLocaleString('en-KE',{maximumFractionDigits:2})}`;
  const items=useMemo(()=>cart.map(line=>{
    const product=products.find(p=>p.id===line.productId);
    const variant=product?.variants.find(v=>v.id===line.variantId);
    return {...line,product,variant,price:product?.price||0,stock:variant?.stock||0,
      available:!!variant && variant.stock>=line.quantity};
  }),[products,cart]);
  const subtotal=items.reduce((sum,line)=>sum+line.price*line.quantity,0);
  const count=cart.reduce((sum,line)=>sum+line.quantity,0);
  function addToCart(product,variant,quantity=1) {
    const current=cart.find(i=>i.variantId===variant.id)?.quantity||0;
    if(current+quantity>variant.stock || current+quantity>99){setNotice('There is not enough stock for that quantity.');return false;}
    setCart(previous=>{
      const exists=previous.find(i=>i.variantId===variant.id);
      if(exists)return previous.map(i=>i.variantId===variant.id?{...i,quantity:i.quantity+quantity}:i);
      return [...previous,{productId:product.id,variantId:variant.id,quantity,name:product.name,image:product.images[0],size:variant.size,color:variant.color}];
    });setNotice('Added to your bag');return true;
  }
  function updateQuantity(variantId,quantity) {
    const item=items.find(i=>i.variantId===variantId);
    if(!item)return;
    if(quantity<1 || quantity>Math.min(99,item.stock))return;
    setCart(previous=>previous.map(i=>i.variantId===variantId?{...i,quantity}:i));
  }
  function changeVariant(oldId,newId) {
    const line=cart.find(i=>i.variantId===oldId),product=products.find(p=>p.id===line?.productId),v=product?.variants.find(v=>v.id===newId);
    if(!v || oldId===newId)return;
    const other=cart.find(i=>i.variantId===newId);
    if(line.quantity+(other?.quantity||0)>Math.min(99,v.stock)){setNotice('Not enough stock in that size and colour.');return;}
    setCart(previous=>{
      const rest=previous.filter(i=>i.variantId!==oldId);
      if(other)return rest.map(i=>i.variantId===newId?{...i,quantity:i.quantity+line.quantity}:i);
      return [...rest,{...line,variantId:newId,size:v.size,color:v.color}];
    });
  }
  const value={products,categories,settings,loading,error,refresh,money,cart,items,count,subtotal,addToCart,updateQuantity,changeVariant,
    removeItem:id=>setCart(previous=>previous.filter(i=>i.variantId!==id)),clearCart:()=>setCart([]),notify:setNotice};
  return <StoreContext.Provider value={value}>{children}{notice&&<div className="toast" role="status">{notice}</div>}</StoreContext.Provider>;
}
export const useStore=()=>useContext(StoreContext);
