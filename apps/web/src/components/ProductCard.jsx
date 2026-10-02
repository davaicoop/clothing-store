import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { colorValue } from '../lib/api';
import { ProductImage } from './UI';

export default function ProductCard({product,index=0}) {
  const {money}=useStore();
  const colors=[...new Set(product.variants.map(v=>v.color))],stock=product.variants.reduce((sum,v)=>sum+v.stock,0);
  return <article className="product-card" style={{animationDelay:`${Math.min(index,5)*45}ms`}}><Link to={`/products/${product.id}`} className="product-photo">
    <ProductImage src={product.images[0]} alt={product.name} loading="lazy"/>
    <span className="product-tag">{!stock?'Sold out':product.featured?'THE EDIT':product.audience}</span><span className="product-photo-action">Choose your size</span>
  </Link><div className="product-info"><div className="product-meta"><span>{product.category}</span><div className="swatches">{colors.slice(0,4).map(c=><span key={c} title={c} style={{background:colorValue(c)}}/>)}</div></div>
    <Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link><span className="product-price">{money(product.price)}</span></div></article>;
}
