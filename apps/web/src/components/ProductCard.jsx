import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {useStore} from '../context/StoreContext';
import {colorValue} from '../lib/api';
import {ProductImage} from './UI';

export default function ProductCard({product,index=0}) {
  const {money}=useStore();
  const colors=[...new Set(product.variants.map(v=>v.color))],options=[...new Set(product.variants.map(v=>v.size))],stock=product.variants.reduce((sum,v)=>sum+v.stock,0);
  return <article className="product-card" style={{animationDelay:`${Math.min(index,5)*45}ms`}}><Link to={`/products/${product.id}`} className="product-photo"><ProductImage src={product.images[0]} alt={product.name} loading="lazy" width="1000" height="1000"/><span className={`product-tag ${product.showcase?'preview-tag':''}`}>{product.showcase?'Catalogue preview':!stock?'Out of stock':product.featured?'SAM SELECTS':'IN STOCK'}</span><span className="product-photo-action">Explore this product <ArrowUpRight size={15}/></span></Link><div className="product-info"><div className="product-meta"><span>{product.category}</span><div className="swatches" aria-label={`${colors.length} colour options`}>{colors.slice(0,4).map(c=><span key={c} title={c} style={{background:colorValue(c)}}/>)}</div></div><Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link><span className="sam-card-options">{options.slice(0,3).join(' / ')}</span><div className="sam-card-bottom"><span className={`product-price ${product.showcase?'enquiry-price':''}`}>{product.showcase?'Price on enquiry':money(product.price)}</span><Link to={`/products/${product.id}`} aria-label={`View ${product.name}`} className="sam-card-arrow"><ArrowUpRight size={19}/></Link></div></div></article>;
}
