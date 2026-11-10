/* H116: optional user-edited per-sport PPTX stored in browser IndexedDB.
   Same profile used in Test Lab and Production on the same browser; never writes to Firebase. */
(()=>{'use strict';
const DB='topkey-h116-ppt-templates',STORE='templates',allowed=new Set(['badminton','football','volleyball','running','handmade','shuttle','cooking']);
const open=()=>new Promise((resolve,reject)=>{if(!indexedDB)return reject(Error('Trình duyệt không hỗ trợ IndexedDB'));const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE)};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
async function store(sport,blob){if(!allowed.has(sport))throw Error('Môn không hợp lệ');if(!blob||blob.size>15*1024*1024||blob.size<6000)throw Error('Mẫu PPTX phải từ 6 KB đến 15 MB');if(!window.JSZip)throw Error('Thiếu JSZip; vui lòng tải lại website');const z=await JSZip.loadAsync(blob);
 for(let i=1;i<=9;i++)if(!z.file(`ppt/slides/slide${i}.xml`))throw Error('Mẫu không đúng chuẩn TOPKEY 9 slide: thiếu slide '+i);
 const cover=await z.file('ppt/slides/slide1.xml').async('string'),awards=await z.file('ppt/slides/slide4.xml').async('string');
 if(!cover.includes('[Tên giải / Tên sự kiện]')||!awards.includes('[Số lượng]'))throw Error('Mẫu đã mất vị trí dữ liệu cần điền. Hãy giữ placeholder trên slide 1 và 4 rồi tải lại');
 const d=await open();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({blob,filename:blob.name||sport+'.pptx',time:Date.now()},sport);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});d.close();
}
async function load(sport){if(!allowed.has(sport))return null;let d;try{d=await open();return await new Promise((resolve,reject)=>{const q=d.transaction(STORE,'readonly').objectStore(STORE).get(sport);q.onsuccess=()=>resolve(q.result?.blob||null);q.onerror=()=>reject(q.error)})}catch(e){console.warn('H116 custom template',e);return null}finally{d?.close()}}
async function remove(sport){const d=await open();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(sport);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});d.close()}
function mount(sport){const modal=document.getElementById('tk79-modal');if(!modal||!allowed.has(sport))return;let root=document.getElementById('tk116-template-selector');if(root){if(root.dataset.sport===sport)return;root.remove()}
 root=document.createElement('div');root.id='tk116-template-selector';root.dataset.sport=sport;root.style.cssText='margin:12px 0;padding:12px;border:1px solid #326981;border-radius:9px;background:#0b2b3a;color:white';
 root.innerHTML=`<b>🎨 Mẫu PowerPoint riêng – ${sport.toUpperCase()}</b><div id="tk116-template-status" style="font-size:12px;margin:7px 0;color:#c8e7ef">Đang kiểm tra mẫu đã lưu...</div><label style="display:block;margin:9px 0">📁 Tải mẫu .pptx đã chỉnh sửa của môn này <input id="tk116-custom-file" type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" style="display:block;max-width:100%;margin-top:6px"></label><button type="button" id="tk116-template-reset" style="background:#163e54;color:white;border:1px solid #668aa0;border-radius:6px;padding:7px 10px">Dùng lại mẫu TOPKEY gốc</button><small style="display:block;color:#a2c2d1;margin-top:7px">Mẫu tùy chỉnh lưu trên trình duyệt này cho riêng môn; Test Lab và Production dùng cùng mẫu. Không tự tải ảnh/PPT lên Firebase.</small>`;
 const target=modal.querySelector('#tk79-prize-summary')?.parentNode||modal.querySelector('.tk79-panel')||modal;target.appendChild(root);const status=root.querySelector('#tk116-template-status');
 load(sport).then(v=>status.textContent=v?'Đang dùng: MẪU RIÊNG đã lưu '+sport.toUpperCase():'Đang dùng: mẫu TOPKEY gốc '+sport.toUpperCase());
 root.querySelector('#tk116-custom-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{status.textContent='Đang kiểm tra cấu trúc PPTX...';await store(sport,f);status.textContent='✓ Đã lưu mẫu '+f.name+' cho '+sport.toUpperCase()}catch(err){status.textContent='Không nhận mẫu: '+(err.message||err)}finally{e.target.value=''}};
 root.querySelector('#tk116-template-reset').onclick=async()=>{try{await remove(sport);status.textContent='Đã trở về mẫu TOPKEY gốc '+sport.toUpperCase()}catch(err){status.textContent='Lỗi: '+err.message}};
}
window.TopkeyCustomPptH116=Object.freeze({mount,load,store,remove});
})();
