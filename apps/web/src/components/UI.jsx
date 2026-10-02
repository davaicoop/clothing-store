import { ShoppingBag,LoaderCircle,ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function Loading({label='Loading…'}) {return <div className="loading"><LoaderCircle className="spin" size={24}/><span>{label}</span></div>;}
export function Empty({title,description,action='Explore the collection',to='/shop'}) {return <div className="empty-state"><ShoppingBag size={38} strokeWidth={1}/><h2>{title}</h2><p>{description}</p>{to&&<Link className="button" to={to}>{action}</Link>}</div>;}
export function ErrorMessage({children}) {return children?<div className="error-message" role="alert">{children}</div>:null;}
export function ProductImage({src,alt,...props}) {
  const [failed,setFailed]=useState(false);
  return failed||!src?<div className="image-fallback" role="img" aria-label={alt}><ImageOff size={30}/><span>{alt}</span></div>:<img src={src} alt={alt} onError={()=>setFailed(true)} {...props}/>;
}
export function Badge({children}) {return <span className={`badge status-${String(children).toLowerCase().replaceAll(' ','-')}`}>{children}</span>;}
export function Field({label,children,hint}) {return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function Modal({title,children,onClose}) {
  return <div className="modal-backdrop" onClick={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button></div>{children}
  </section></div>;
}
