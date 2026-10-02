import { useState } from 'react';
import { Link,useNavigate,useSearchParams } from 'react-router-dom';
import { Smartphone,Truck,Store,Check,LockKeyhole } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api,readStorage,writeStorage } from '../../lib/api';
import { Empty,ErrorMessage,Field,ProductImage } from '../../components/UI';

export default function Checkout() {
  const {items,subtotal,money,settings,clearCart,refresh}=useStore(),[params]=useSearchParams(),navigate=useNavigate();
  const [form,setForm]=useState({name:'',phone:'',email:'',town:'',address:'',instructions:'',fulfilment:params.get('fulfilment')==='Pickup'?'Pickup':'Delivery',paymentMethod:'M-Pesa'});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  if(!items.length)return <Empty title="Add something you love first." description="Your collection is just a few taps away."/>;
  const delivery=form.fulfilment==='Delivery'?settings.deliveryFee:0,valid=items.every(i=>i.available);
  function changeFulfilment(value){setForm(prev=>({...prev,fulfilment:value,paymentMethod:prev.paymentMethod==='M-Pesa'?'M-Pesa':value==='Delivery'?'Cash on Delivery':'Pay on Pickup'}));}
  async function submit(e) {
    e.preventDefault();if(busy||!valid)return;setBusy(true);setError('');
    const payload={customer:{name:form.name,phone:form.phone,email:form.email},fulfilment:form.fulfilment,
      town:form.fulfilment==='Delivery'?form.town:'',address:form.fulfilment==='Delivery'?form.address:'',instructions:form.instructions,
      paymentMethod:form.paymentMethod,items:items.map(i=>({variantId:i.variantId,quantity:i.quantity})).sort((a,b)=>a.variantId.localeCompare(b.variantId))};
    try {
      // Reuse a key after a network failure or refresh; never reserve stock twice.
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
      const fingerprint=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
      let saved;try{saved=JSON.parse(sessionStorage.getItem('clothing-checkout-attempt'));}catch{/* optional */}
      const key=saved?.fingerprint===fingerprint?saved.key:crypto.randomUUID();
      try{sessionStorage.setItem('clothing-checkout-attempt',JSON.stringify({fingerprint,key}));}catch{/* optional */}
      const result=await api('/orders',{method:'POST',headers:{'Idempotency-Key':key},body:payload});
      const previous=readStorage('clothing-orders-v1',[]);
      writeStorage('clothing-orders-v1',[{id:result.order.id,token:result.token,orderNumber:result.order.orderNumber,createdAt:result.order.createdAt,total:result.order.total},...(Array.isArray(previous)?previous:[]).filter(o=>o.id!==result.order.id)].slice(0,30));
      clearCart();await refresh();navigate(`/orders/${result.order.id}?token=${result.token}&placed=1`,{replace:true});
    }catch(e){setError(e.message);await refresh();}finally{setBusy(false);}
  }
  return <div className="page-container checkout-page"><Link className="text-link" to="/cart">Back to your bag</Link><div className="page-heading"><span className="eyebrow">ALMOST YOURS</span><h1>Checkout.</h1><p>No account needed. Just your details.</p></div>
    <form className="checkout-layout" onSubmit={submit}><div className="checkout-form"><ErrorMessage>{error}</ErrorMessage>{!valid&&<ErrorMessage>Stock has changed. <Link to="/cart">Update your bag</Link> before placing the order.</ErrorMessage>}
      <section className="checkout-section"><h2><span>01</span> Your details</h2><Field label="Full name"><input required autoComplete="name" value={form.name} onChange={e=>update('name',e.target.value)} maxLength={120}/></Field><div className="field-pair"><Field label="Phone number"><input required type="tel" autoComplete="tel" placeholder="07XX XXX XXX" value={form.phone} onChange={e=>update('phone',e.target.value)} maxLength={25}/></Field><Field label="Email (optional)"><input type="email" autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)} maxLength={200}/></Field></div></section>
      <section className="checkout-section"><h2><span>02</span> Delivery or pickup</h2><div className="option-cards"><label className={form.fulfilment==='Delivery'?'selected':''}><input type="radio" name="checkoutFulfilment" checked={form.fulfilment==='Delivery'} onChange={()=>changeFulfilment('Delivery')}/><Truck/><strong>Delivery</strong><span>{money(settings.deliveryFee)}</span></label><label className={form.fulfilment==='Pickup'?'selected':''}><input type="radio" name="checkoutFulfilment" checked={form.fulfilment==='Pickup'} onChange={()=>changeFulfilment('Pickup')}/><Store/><strong>Shop pickup</strong><span>Free</span></label></div>
        {form.fulfilment==='Delivery'?<><Field label="County / town"><input required autoComplete="address-level2" placeholder="e.g. Nairobi, Westlands" value={form.town} onChange={e=>update('town',e.target.value)} maxLength={120}/></Field><Field label="Delivery address"><textarea required autoComplete="street-address" placeholder="Building, street, apartment or a nearby landmark" value={form.address} onChange={e=>update('address',e.target.value)} maxLength={500}/></Field></>:<div className="pickup-note"><MapPinText location={settings.location}/><p>The shop will contact you when your order is ready for collection.</p></div>}
        <Field label="Delivery / pickup instructions (optional)"><textarea placeholder="Anything we should know?" value={form.instructions} onChange={e=>update('instructions',e.target.value)} maxLength={1000}/></Field></section>
      <section className="checkout-section"><h2><span>03</span> Payment</h2><div className="payment-options">{['M-Pesa',form.fulfilment==='Delivery'?'Cash on Delivery':'Pay on Pickup'].map(method=><label key={method} className={form.paymentMethod===method?'selected':''}><input type="radio" name="payment" checked={form.paymentMethod===method} onChange={()=>update('paymentMethod',method)}/>{method==='M-Pesa'?<Smartphone size={21}/>:<Store size={21}/>}<strong>{method}</strong>{form.paymentMethod===method&&<Check size={18}/>}</label>)}</div>
        <p className="payment-explanation">{form.paymentMethod==='M-Pesa'?'Place your order first. The confirmation page will show the shop’s M-Pesa instructions. Payment stays pending until the shop verifies it. No automatic payment prompt is sent.':form.paymentMethod==='Cash on Delivery'?'Pay when your order arrives. The shop will confirm delivery arrangements with you.':'Pay when you collect your order from the shop.'}</p></section></div>
      <aside className="order-summary"><span className="eyebrow">YOUR EDIT</span><h2>{items.reduce((n,i)=>n+i.quantity,0)} pieces, all you.</h2><div className="checkout-item-list">{items.map(i=><div className="checkout-summary-item" key={i.variantId}><ProductImage src={i.image} alt={i.name}/><div><strong>{i.name}</strong><span>{i.size} / {i.color} · Qty {i.quantity}</span><span>{money(i.price*i.quantity)}</span></div></div>)}</div><div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>{delivery?money(delivery):'Free pickup'}</span></div><div className="summary-line summary-total"><span>Total</span><span>{money(subtotal+delivery)}</span></div><button type="submit" className="button full-width" disabled={busy||!valid}>{busy?'Placing your order…':'Place order'}</button><p className="secure-note"><LockKeyhole size={15}/> Your order details are private.</p><p className="small-note">Your contact details are used to arrange your order and delivery.</p></aside>
    </form></div>;
}
function MapPinText({location}) {return <strong>Collect from {location}</strong>;}
