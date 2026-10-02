import { Link } from 'react-router-dom';
import { Minus,Plus,Trash2,LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Empty,ErrorMessage,ProductImage } from '../../components/UI';

export default function Cart() {
  const {items,count,money,subtotal,settings,updateQuantity,removeItem,changeVariant}=useStore();
  const [fulfilment,setFulfilment]=useState('Delivery');
  if(!items.length)return <div className="page-container"><Empty title="Your bag is waiting." description="Find the pieces you'll wear on repeat."/></div>;
  const delivery=fulfilment==='Delivery'?settings.deliveryFee:0,valid=items.every(i=>i.available);
  return <div className="page-container cart-page"><div className="page-heading"><span className="eyebrow">YOUR NEXT FAVOURITES</span><h1>In your bag<span className="heading-count">{count}</span></h1></div>
    <div className="checkout-layout"><section className="cart-items">{!valid&&<ErrorMessage>Some quantities or variants are no longer available. Update your bag before checkout.</ErrorMessage>}
      {items.map(i=><article className="cart-item" key={i.variantId}><Link className="cart-item-image" to={`/products/${i.productId}`}><ProductImage src={i.image} alt={i.name}/></Link><div className="cart-item-content"><div className="cart-item-top"><Link to={`/products/${i.productId}`}><h2>{i.name}</h2></Link><button className="icon-button" onClick={()=>removeItem(i.variantId)} aria-label={`Remove ${i.name}`}><Trash2 size={18}/></button></div>
        <label className="cart-variant-label"><span>Size / Colour</span><select aria-label={`Variant for ${i.name}`} value={i.variantId} onChange={e=>changeVariant(i.variantId,e.target.value)}>{!i.variant&&<option value={i.variantId}>{i.size} / {i.color} — unavailable</option>}{i.product?.variants.map(v=><option key={v.id} value={v.id} disabled={!v.stock}>{v.size} / {v.color} {v.stock?'':'— sold out'}</option>)}</select></label>
        <div className="cart-item-bottom"><div className="quantity-control"><button onClick={()=>updateQuantity(i.variantId,i.quantity-1)} disabled={i.quantity<=1} aria-label={`Decrease ${i.name} quantity`}><Minus size={15}/></button><input aria-label={`Quantity of ${i.name}`} type="number" min="1" max={Math.min(99,i.stock)} value={i.quantity} onChange={e=>updateQuantity(i.variantId,Number(e.target.value))}/><button onClick={()=>updateQuantity(i.variantId,i.quantity+1)} disabled={i.quantity>=Math.min(99,i.stock)} aria-label={`Increase ${i.name} quantity`}><Plus size={15}/></button></div><strong>{money(i.price*i.quantity)}</strong></div>
        {!i.available&&<p className="inline-error">{i.variant?`${i.stock} available. Lower the quantity.`:'This variant is no longer available.'}</p>}</div></article>)}<Link className="text-link" to="/shop">Keep exploring</Link></section>
      <aside className="order-summary"><span className="eyebrow">THE FINAL EDIT</span><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><fieldset className="delivery-choice"><legend>How would you like your order?</legend><label><input type="radio" name="fulfilment" checked={fulfilment==='Delivery'} onChange={()=>setFulfilment('Delivery')}/> Delivery <span>{money(settings.deliveryFee)}</span></label><label><input type="radio" name="fulfilment" checked={fulfilment==='Pickup'} onChange={()=>setFulfilment('Pickup')}/> Shop pickup <span>Free</span></label></fieldset><div className="summary-line"><span>Delivery</span><span>{delivery?money(delivery):'Free'}</span></div><div className="summary-line summary-total"><span>Total</span><span>{money(subtotal+delivery)}</span></div>
        {valid?<Link className="button full-width" to={`/checkout?fulfilment=${fulfilment}`}>Continue to checkout</Link>:<button className="button full-width" disabled>Update your bag to continue</button>}<p className="secure-note"><LockKeyhole size={15}/> Guest checkout. No account needed.</p><p className="small-note">Stock is checked again when you place your order.</p></aside>
    </div></div>;
}
