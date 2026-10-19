import React, { useEffect, useRef, useState } from 'react';
import { sellerImageUrl } from '../../../services/sellerApi';

export default function ProductPhotos({ imageIds, files, onImages, onFiles, onError, disabled }) {
  const input=useRef(null);
  const [previews,setPreviews]=useState([]);
  const [dragging,setDragging]=useState(false);
  useEffect(()=>{
    const urls=files.map(file=>({file,url:URL.createObjectURL(file)}));setPreviews(urls);
    return()=>urls.forEach(item=>URL.revokeObjectURL(item.url));
  },[files]);
  function add(selected){
    if(disabled)return;
    const additions=Array.from(selected);
    if(additions.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type))){onError('Use JPEG, PNG or WebP images.');return;}
    if(additions.some(f=>f.size>5*1024*1024)){onError('Each image must be 5 MB or smaller.');return;}
    if(imageIds.length+files.length+additions.length>4){onError('You can add up to four photos. Remove one before adding another.');return;}
    onFiles([...files,...additions]);onError('');
  }
  const count=imageIds.length+files.length;
  return <section className="product-photo-editor"><div className="photo-heading"><h3>Product photography</h3><span>{count}/4 photos</span></div><p>Show the front, back, fabric detail and fit. The first photo is your product’s cover.</p>
    <div className={'photo-dropzone '+(dragging?'dragging':'')} onDragOver={e=>{e.preventDefault();if(!disabled)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);add(e.dataTransfer.files);}}>
      <span aria-hidden="true">↥</span><strong>Drop your clothing photos here</strong><p>JPEG, PNG or WebP · up to 5 MB each</p><button type="button" disabled={disabled||count>=4} onClick={()=>input.current.click()}>Choose photos</button>
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled} onChange={e=>{add(e.target.files);e.target.value='';}} />
    </div>
    <div className="photo-preview-grid">{imageIds.map((id,i)=><figure key={id}><img src={sellerImageUrl(id)} alt={'Saved product view '+(i+1)}/><figcaption>{i===0?'Cover photo':'Saved photo'}</figcaption><button disabled={disabled} type="button" onClick={()=>onImages(imageIds.filter(x=>x!==id))}>Remove</button></figure>)}{previews.map((p,i)=><figure key={p.url}><img src={p.url} alt={'New product view '+(i+1)}/><figcaption>{imageIds.length+i===0?'Cover photo':p.file.name}</figcaption><button disabled={disabled} type="button" onClick={()=>onFiles(files.filter((_,n)=>n!==i))}>Remove</button></figure>)}</div>
  </section>;
}
