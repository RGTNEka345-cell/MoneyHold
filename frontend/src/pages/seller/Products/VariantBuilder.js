import React, { useState } from 'react';

const groups={Clothing:['XS','S','M','L','XL','XXL'],Trousers:['28','30','32','34','36','38'],Footwear:['36','37','38','39','40','41','42','43','44'],Accessories:['ONE SIZE']};
export default function VariantBuilder({ variants,onChange,onError }) {
  const [group,setGroup]=useState('Clothing');
  const [sizes,setSizes]=useState([]);
  const [colours,setColours]=useState('Black, White');
  const [stock,setStock]=useState('0');
  function generate(){
    const names=[...new Set(colours.split(',').map(c=>c.trim()).filter(Boolean))];
    if(!sizes.length||!names.length){onError('Select sizes and enter at least one colour.');return;}
    if(names.some(n=>n.length>40)||!/^\d+$/.test(stock)||Number(stock)>1000000000){onError('Enter valid colours and a whole, non-negative stock quantity.');return;}
    const existing=new Set(variants.map(v=>JSON.stringify([v.size.toUpperCase(),v.colour.toLowerCase()])));
    const added=[];
    for(const size of sizes)for(const colour of names){const key=JSON.stringify([size,colour.toLowerCase()]);if(!existing.has(key)){added.push({size,colour,stock:Number(stock)});existing.add(key);}}
    if(variants.length+added.length>100){onError('A product can have at most 100 variants.');return;}
    onChange([...variants,...added]);onError('');
  }
  return <section className="variant-builder"><h3>Build your size & colour range</h3><p>Select sizes, enter colours and create the combinations together. Existing combinations stay unchanged.</p><label>Size range<select value={group} onChange={e=>{setGroup(e.target.value);setSizes([]);}}>{Object.keys(groups).map(g=><option key={g}>{g}</option>)}</select></label><div className="size-options">{groups[group].map(s=><button type="button" key={s} aria-pressed={sizes.includes(s)} onClick={()=>setSizes(sizes.includes(s)?sizes.filter(x=>x!==s):[...sizes,s])}>{s}</button>)}</div><div className="catalog-fields"><label>Colours (separate with commas)<input value={colours} onChange={e=>setColours(e.target.value)} placeholder="Black, White, Navy" /></label><label>Starting stock per new combination<input type="number" min="0" step="1" value={stock} onChange={e=>setStock(e.target.value)} /></label></div><button type="button" onClick={generate}>Generate variants</button></section>;
}
