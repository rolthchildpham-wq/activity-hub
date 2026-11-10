(() => {
  'use strict';
  const T=window.Topkey;
  T.U = {
    id(prefix='id'){ return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9); },
    now(){ return Date.now(); },
    clone(v){ return v == null ? v : JSON.parse(JSON.stringify(v)); },
    safe(v){ return String(v ?? ''); },
    money(v){ return new Intl.NumberFormat('vi-VN').format(Number(v)||0)+' VNĐ'; },
    dateTime(ts){ return ts ? new Date(ts).toLocaleString('vi-VN') : '—'; },
    debounce(fn,ms=150){ let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}; },
    download(name, blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); },
    csv(rows){
      if(!rows.length) return '';
      const keys=Object.keys(rows[0]);
      const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';
      return [keys.map(esc).join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n');
    },
    parseCsv(text){
      const rows=[]; let row=[], cell='', q=false;
      for(let i=0;i<text.length;i++){ const c=text[i], n=text[i+1]; if(q){ if(c==='"'&&n==='"'){cell+='"';i++;} else if(c==='"')q=false; else cell+=c; } else { if(c==='"')q=true; else if(c===','){row.push(cell);cell='';} else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';} else if(c!=='\r')cell+=c; } }
      if(cell||row.length){row.push(cell);rows.push(row)}; if(!rows.length)return[];
      const h=rows.shift().map(x=>x.trim()); return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])));
    },
    slug(s){ return String(s||'item').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'item'; },
    async compressReceipt(file){
      if(!file||!file.type?.startsWith('image/'))return file; if(file.size<350000)return file;
      const bmp=await createImageBitmap(file),max=1800,scale=Math.min(1,max/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*scale);c.height=Math.round(bmp.height*scale);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.78));return new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'});
    },
    async confirmDanger(title, detail, _phrase='XÁC NHẬN'){
      return new Promise(resolve=>{
        const modal=document.getElementById('confirm-modal');
        if(!modal){resolve(window.confirm((title?title+'\n\n':'')+(detail||'Bạn có chắc chắn?')));return;}
        document.querySelectorAll('.modal:not(#confirm-modal)').forEach(m=>m.classList.add('hidden'));
        const titleEl=document.getElementById('confirm-title');if(titleEl)titleEl.textContent=title||'Xác nhận';
        const detailEl=document.getElementById('confirm-detail');if(detailEl)detailEl.textContent=detail||'Bạn có chắc chắn thực hiện thao tác này?';
        const input=document.getElementById('confirm-input');if(input){input.value='';input.type='hidden';input.hidden=true;input.setAttribute('aria-hidden','true');}
        const ok=document.getElementById('confirm-ok'),cancel=document.getElementById('confirm-cancel');modal.classList.remove('hidden');
        const done=v=>{modal.classList.add('hidden');if(ok)ok.onclick=null;if(cancel)cancel.onclick=null;resolve(v)};
        if(cancel)cancel.onclick=()=>done(false);if(ok){ok.onclick=()=>done(true);setTimeout(()=>ok.focus(),0)}
      });
    },
    toast(msg,type='info'){
      const box=document.getElementById('toast-box'); const d=document.createElement('div'); d.className='toast '+type; d.textContent=msg; box.appendChild(d); setTimeout(()=>d.remove(),4200);
    },
    setText(id,txt){ const e=document.getElementById(id); if(e)e.textContent=txt; }
  };
})();