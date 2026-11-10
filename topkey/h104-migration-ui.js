/* H104 opt-in migration: admin-only, backup-first, append-only read model. */
(function(global){
'use strict';
const V=global.TopkeyV2, T=global.Topkey, H=global.TopkeyH104;if(!V||!T?.Data||!H)return;
const D=T.Data, $=id=>document.getElementById(id);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const SHA=async v=>{const bytes=new TextEncoder().encode(JSON.stringify(stable(v)));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')};
function isAdmin(){return T.Auth?.role?.()==='ADMIN'&&!!T.Auth?.user?.uid}
function download(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function setStatus(message){const x=$('h104-migration-status');if(x)x.textContent=message}
function batches(items,limit=75){const out=[];for(let i=0;i<items.length;i+=limit)out.push(items.slice(i,i+limit));return out}
function flatten(obj,prefix='',out=[]){for(const [key,value] of Object.entries(obj||{})){if(value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.id!=='string')flatten(value,prefix?prefix+'/'+key:key,out);else out.push([prefix?prefix+'/'+key:key,value])}return out}
function stageCanary(){return /^__testlab_/.test(String(D.tid||''))}
async function migrate(){
 if(!isAdmin())throw Error('Chỉ ADMIN được khởi tạo chỉ mục v2');
 if(!D.connected)throw Error('Cần kết nối Firebase trực tuyến');
 if(!stageCanary())throw Error('H104 chỉ cho phép chạy migration trên staging/testlab; hãy xác minh các bài thử trước khi chuyển production');
 if(!confirm('Tạo bản sao lưu JSON bắt buộc và chỉ mục v2 trên TESTLAB '+D.tid+'? Dữ liệu gốc không bị sửa.'))return;
 const original=await D.read('');if(!original||!original.teams||!original.matches)throw Error('Thiếu dữ liệu nguồn teams/matches');
 const backup={type:'TOPKEY_PRE_V2_FULL_BACKUP',root:T.ROOT,tid:D.tid,exportedAt:Date.now(),data:original};
 download(`TOPKEY_PRE_V2_${T.SPORT.key}_${D.tid}.json`,backup);
 const source={teams:original.teams,matches:original.matches,finance:original.finance};
 const model=V.createReadModel(source,T.ROOT),report=V.validateModel(source,model);
 if(!report.ok)throw Error('Không thể migration: '+report.errors.slice(0,5).join('; '));
 const sourceHash=await SHA(source);
 const previous=await D.read('_v2/meta');if(previous?.active)throw Error('V2 đang hoạt động; cần rollback/vô hiệu hóa trước khi khởi tạo lại');
 const base=D.path('_v2');
 setStatus('Đang tạo index v2 an toàn: '+JSON.stringify(report.counts));
 await D.db.ref(base+'/meta').set({schemaVersion:2,sourceHash,sourceRoot:T.ROOT,sourceTid:D.tid,active:false,complete:false,aggregatesTrusted:false,rankingsTrusted:false,startedAt:Date.now(),counts:report.counts});
 // Do not delete old v2 indexes except during controlled testlab migration. Rebuild
 // from a clean testlab namespace to prevent stale indices on renamed rows.
 for(const key of ['tables','aggregates'])await D.db.ref(base+'/'+key).remove();
 const pieces=batches(flatten(model.tables),75);
 for(let i=0;i<pieces.length;i++){
   const updates=Object.fromEntries(pieces[i].map(([path,val])=>[base+'/tables/'+path,val]));
   await D.db.ref().update(updates);
   setStatus(`Đang tạo chỉ mục: ${i+1}/${pieces.length} nhóm`);
 }
 await D.db.ref(base+'/aggregates').set(model.aggregates);
 const after={teams:await D.read('teams'),matches:await D.read('matches'),finance:await D.read('finance')};
 if(sourceHash!==await SHA(after))throw Error('Dữ liệu nguồn thay đổi trong lúc migration; V2 chưa được kích hoạt. Chạy lại sau khi dữ liệu ổn định.');
 const counts={teams:0,matches:0,finance:0};
 for(const [branch,path] of [['teams','teams/byName'],['matches','matches/byTime'],['finance','finance/byTime']]){
   const data=(await D.read('_v2/tables/'+path))||{};counts[branch]=Object.keys(data).length;
 }
 if(Object.keys(counts).some(k=>counts[k]!==report.counts[k]))throw Error('Index count mismatch '+JSON.stringify(counts));
 // Verify data as well as counts before publication.
 const test={tables:{teams:{byName:await D.read('_v2/tables/teams/byName')},matches:{byTime:await D.read('_v2/tables/matches/byTime')},finance:{byTime:await D.read('_v2/tables/finance/byTime')}},aggregates:await D.read('_v2/aggregates')};
 if(!V.validateModel(after,test).ok)throw Error('Index content verification failed');
 await D.db.ref(base+'/meta').update({complete:true,aggregatesTrusted:true,verifiedAt:Date.now(),sourceHash,active:false});
 setStatus('V2 đã đối chiếu thành công trên TESTLAB; chưa kích hoạt. Counts '+JSON.stringify(counts));
 return {counts,hash:sourceHash};
}
async function enable(){
 if(!isAdmin()||!stageCanary())throw Error('Chỉ bật v2 trên TESTLAB/staging');
 const m=await D.read('_v2/meta');if(!m?.complete||!m?.aggregatesTrusted)throw Error('V2 chưa hoàn tất kiểm tra');
 if(!confirm('Kích hoạt chỉ mục v2 cho TESTLAB '+D.tid+'? Có thể rollback metadata mà không ảnh hưởng dữ liệu gốc.'))return;
 await D.ref('_v2/meta/active').set(true);setStatus('Đã kích hoạt v2 testlab, hãy kiểm tra bảng xếp hạng, lịch và tài chính.');
}
async function rollback(){if(!isAdmin())throw Error('Chỉ ADMIN');if(!confirm('Chuyển về đọc dữ liệu legacy? Không xóa đội, trận hoặc tài chính.'))return;
 await D.ref('_v2/meta/active').set(false);setStatus('Đã tắt v2, dữ liệu gốc giữ nguyên.');}
function install(){if($('h104-migration-panel')||!isAdmin())return;
 const tab=$('page-health')||$('page-settings');if(!tab)return;
 const el=document.createElement('section');el.id='h104-migration-panel';el.className='card';el.style.marginTop='14px';
 el.innerHTML='<h3>H104 · Kiểm định cấu trúc v2</h3><p class="muted">Chạy trên testlab trước. Tạo backup JSON và chỉ mục mới; không ghi đè teams/matches/finance gốc. Cần Rules v2.</p><div class="action-bar"><button class="btn" id="h104-migrate">Sao lưu & tạo chỉ mục v2 (testlab)</button><button class="btn ok" id="h104-enable">Kích hoạt v2 testlab</button><button class="btn warn" id="h104-rollback">Rollback về legacy</button></div><p class="muted" id="h104-migration-status">Chưa thực hiện migration.</p>';
 tab.appendChild(el);for(const [id,fn] of [['h104-migrate',migrate],['h104-enable',enable],['h104-rollback',rollback]])$(id).onclick=async()=>{const btn=$(id);btn.disabled=true;try{await fn()}catch(e){console.error('H104 migration',e);setStatus('Lỗi: '+(e.message||e))}finally{btn.disabled=false}};
}
const previous=H.loadPage;H.migrate=migrate;H.enable=enable;H.rollback=rollback;
setTimeout(install,350);
const oldShow=T.App?.showTab?.bind(T.App);
if(oldShow&&!T.App.__h104MigrationShow){T.App.__h104MigrationShow=true;T.App.showTab=function(...a){const result=oldShow(...a);queueMicrotask(install);return result}}
document.addEventListener('topkey:tab-change',()=>queueMicrotask(install));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)install()},{passive:true});
})(window);
