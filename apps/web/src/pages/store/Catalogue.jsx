import { useMemo,useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search,SlidersHorizontal,X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard';
import { Empty,Field } from '../../components/UI';

export default function Catalogue() {
  const {products,categories}=useStore(),[params,setParams]=useSearchParams(),[filtersOpen,setFiltersOpen]=useState(false);
  const get=(key)=>params.get(key)||'';
  function update(key,value){setParams(old=>{const next=new URLSearchParams(old);value?next.set(key,value):next.delete(key);return next;});}
  const sizes=[...new Set(products.flatMap(p=>p.variants.map(v=>v.size)))],colors=[...new Set(products.flatMap(p=>p.variants.map(v=>v.color)))].sort();
  const results=useMemo(()=>{
    const list=products.filter(p=>{
      const cat=get('category'),needle=get('q').toLowerCase();
      if(cat && p.category!==cat)return false;
      if(needle && !`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(needle))return false;
      if(p.showcase && (get('min')||get('max')))return false;
      if(get('min') && p.price<Number(get('min')))return false;
      if(get('max') && p.price>Number(get('max')))return false;
      if(!p.variants.some(v=>(!get('size') || v.size===get('size')) && (!get('color') || v.color===get('color')) &&
        (!get('availability') || (get('availability')==='in'?!p.showcase&&v.stock>0:p.showcase||v.stock===0))))return false;
      return true;
    });
    const sort=get('sort');
    return list.sort((a,b)=>{if(sort==='price-low'||sort==='price-high'){if(a.showcase!==b.showcase)return a.showcase?1:-1;return a.showcase?0:sort==='price-low'?a.price-b.price:b.price-a.price;}return sort==='popular'?b.popularity-a.popularity:new Date(b.createdAt)-new Date(a.createdAt);});
  },[products,params]);
  const activeFilters=['category','min','max','size','color','availability'].filter(key=>get(key));
  const filters=<><div className="filter-title"><h2>Find your device</h2><button className="icon-button mobile-only" onClick={()=>setFiltersOpen(false)} aria-label="Close filters"><X/></button></div>
    <Field label="Category"><select value={get('category')} onChange={e=>update('category',e.target.value)}><option value="">All products</option>{categories.map(c=><option key={c.id}>{c.name}</option>)}</select></Field>
    <div className="field-pair"><Field label="Min price (KSh)"><input type="number" min="0" placeholder="0" value={get('min')} onChange={e=>update('min',e.target.value)}/></Field><Field label="Max price (KSh)"><input type="number" min="0" placeholder="Any" value={get('max')} onChange={e=>update('max',e.target.value)}/></Field></div>
    <Field label="Storage / option"><select value={get('size')} onChange={e=>update('size',e.target.value)}><option value="">All options</option>{sizes.map(s=><option key={s}>{s}</option>)}</select></Field>
    <Field label="Colour"><select value={get('color')} onChange={e=>update('color',e.target.value)}><option value="">All colours</option>{colors.map(c=><option key={c}>{c}</option>)}</select></Field>
    <Field label="Availability"><select value={get('availability')} onChange={e=>update('availability',e.target.value)}><option value="">Any availability</option><option value="in">In stock</option><option value="out">Availability to confirm</option></select></Field>
    <button className="text-link" onClick={()=>setParams({})}>Clear all filters</button><button className="button mobile-only" onClick={()=>setFiltersOpen(false)}>Show {results.length} products</button></>;
  return <div className="page-container catalogue-page"><div className="catalogue-heading"><span className="eyebrow">THE SAM STORE CATALOGUE</span><h1>{get('category')||'Find your next upgrade.'}</h1></div>
    <form className="catalogue-search search-input" onSubmit={e=>e.preventDefault()}><Search size={21}/><input autoFocus={get('search')==='1'} aria-label="Search products" placeholder="Search iPhone, MacBook, iPad…" value={get('q')} onChange={e=>update('q',e.target.value)}/>{get('q')&&<button className="icon-button" aria-label="Clear search" onClick={()=>update('q','')}><X size={18}/></button>}</form>
    <div className="collection-tabs">{['','iPhone','MacBook','iPad','Apple Watch','AirPods','Accessories'].map(c=><button key={c} className={get('category')===c?'active':''} onClick={()=>update('category',c)}>{c||'All products'}</button>)}</div>
    <div className="catalogue-layout"><aside className={`filter-sidebar ${filtersOpen?'is-open':''}`}>{filters}</aside>
      <section className="catalogue-results"><div className="catalogue-toolbar"><span>{results.length} {results.length===1?'product':'products'}</span><div><button className="filter-toggle" onClick={()=>setFiltersOpen(true)}><SlidersHorizontal size={18}/> Filters {activeFilters.length>0&&`(${activeFilters.length})`}</button><select aria-label="Sort products" value={get('sort')||'newest'} onChange={e=>update('sort',e.target.value)}><option value="newest">Newest first</option><option value="popular">Most popular</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div></div>
      {activeFilters.length>0&&<div className="active-filters">{activeFilters.map(k=><button key={k} onClick={()=>update(k,'')}>{k==='availability'?(get(k)==='in'?'In stock':'Confirm availability'):`${k}: ${get(k)}`}<X size={14}/></button>)}</div>}
      {results.length?<div className="product-grid">{results.map((p,i)=><ProductCard product={p} index={i} key={p.id}/>)}</div>:<Empty title="No matching products." description="Try a different storage option, colour or category." action="View all products"/>}</section></div>
    {filtersOpen&&<div className="filter-overlay" onClick={()=>setFiltersOpen(false)}/>}
  </div>;
}
