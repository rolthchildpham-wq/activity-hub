(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46;
if(!T||!App||!U||!U46||App.__upgrade52Installed)return;
App.__upgrade52Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade52';
const CACHE_TAG='u52-20261029';
const DICT_KEY='topkey_u46_pronunciation';
const META_KEY='topkey_u52_pronunciation_sync_meta';
const CLOUD_PATH='pronunciationDictionary';
const FALLBACK_RELATIVE_PATH='config/pronunciationDictionary';
const MAX_RAW=20000;
const $=id=>document.getElementById(id);
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

let offCloud=null,cloudRow=null,lastAppliedRaw='',migrating=false,saving=false,listenerUid='',cloudMode='PRIMARY';
function readLocal(){try{return String(localStorage.getItem(DICT_KEY)||'')}catch{return''}}
function writeLocal(raw){raw=String(raw||'');try{localStorage.setItem(DICT_KEY,raw)}catch{}lastAppliedRaw=raw;return raw}
function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{}}catch{return{}}}
function writeMeta(patch){const x={...readMeta(),...patch};try{localStorage.setItem(META_KEY,JSON.stringify(x))}catch{}return x}
function cleanRaw(raw){return String(raw||'').replace(/\r\n?/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean).join('\n').slice(0,MAX_RAW)}
function parseRows(raw){const map=new Map();for(const line of cleanRaw(raw).split('\n')){const p=line.indexOf('=');if(p<=0)continue;const from=line.slice(0,p).trim(),to=line.slice(p+1).trim();if(from&&to)map.set(from,to)}return map}
function mergeRaw(cloud,local){const a=parseRows(cloud),b=parseRows(local);for(const [k,v] of b)if(!a.has(k))a.set(k,v);return [...a].map(([k,v])=>`${k}=${v}`).join('\n')}
function role(){return String(T.Auth?.role?.()||T.Auth?.profile?.role||'VIEWER').toUpperCase()}
function livePerm(){const p=T.Auth?.profile?.permissions||{},m=p.modules?.live,d=p.details?.['live:commentary'];return d||m||''}
function canUse(){return !!T.Auth?.user&&(role()==='ADMIN'||T.Auth?.can?.('live')||T.Auth?.can?.('umpire'))}
function canEdit(){const r=role();return !!T.Auth?.user&&(r==='ADMIN'||(r!=='UMPIRE'&&livePerm()==='edit'))}
function actor(){const p=T.Auth?.profile||{},u=T.Auth?.user||{};return{uid:u.uid||'',name:p.displayName||p.username||u.displayName||u.email||'User'}}
function primaryPath(){return `${T.ROOT}/${CLOUD_PATH}`}
function fallbackPath(){return T.Data?.path?.(FALLBACK_RELATIVE_PATH)||`${T.ROOT}/tournaments/main_2026/${FALLBACK_RELATIVE_PATH}`}
function refForMode(mode){if(!T.Data?.db)return null;return T.Data.db.ref(mode==='FALLBACK'?fallbackPath():primaryPath())}
function isDenied(e){return /permission[_ -]?denied|PERMISSION_DENIED/i.test(String(e?.code||e?.message||e||''))}
function modeText(){return cloudMode==='FALLBACK'?' · Fixer56 theo giải':''}
function stateLabel(state,text){const box=$('tk52-dict-sync');if(!box)return;const b=box.querySelector('.tk52-badge'),t=box.querySelector('.tk52-text');if(b){b.dataset.state=state;b.textContent=state==='ok'?'☁ ĐÃ ĐỒNG BỘ':state==='pending'?'↻ CHỜ ĐỒNG BỘ':state==='local'?'📱 CACHE LOCAL':state==='readonly'?'☁ CHỈ ĐỌC':'⚠ LỖI'}if(t)t.textContent=text||''}
function setEditorFromRaw(raw,force=false){const ta=$('tk46-pronunciation');if(!ta)return;const activelyEditing=document.activeElement===ta&&ta.value!==lastAppliedRaw;if(force||!activelyEditing)ta.value=String(raw||'')}
function syncUi(){
  const ta=$('tk46-pronunciation'),btn=$('tk46-save-dict');if(!ta||!btn)return;
  const field=ta.closest('.tk46-dict')||ta.closest('.field');const label=field?.querySelector('label');if(label)label.textContent='Từ điển phát âm dùng chung · mỗi dòng: TÊN= cách đọc';
  btn.textContent=canEdit()?'☁ Lưu & đồng bộ cách đọc':'☁ Từ điển dùng chung';btn.disabled=!canEdit()||saving;btn.title=canEdit()?'Lưu lên Firebase và cache trên máy này':'Tài khoản Trọng tài/chỉ xem được dùng từ điển nhưng không sửa dữ liệu dùng chung';
  ta.readOnly=!canEdit();ta.title=canEdit()?'Sửa tại đây rồi bấm Lưu & đồng bộ':'Từ điển được đồng bộ từ website; tài khoản này chỉ đọc';
  if(!$('tk52-dict-sync')){const row=document.createElement('div');row.id='tk52-dict-sync';row.className='tk52-sync';row.innerHTML='<span class="tk52-badge" data-state="local">📱 CACHE LOCAL</span><span class="tk52-text">Đang kiểm tra từ điển dùng chung…</span><button type="button" class="btn mini tk52-refresh">↻ Đồng bộ</button>';field?.appendChild(row);row.querySelector('.tk52-refresh').onclick=()=>refreshNow(true)}
  btn.onclick=saveFromEditor;
  const meta=readMeta();if(meta.syncError)stateLabel('err','Chưa đồng bộ cloud: '+meta.syncError);
  else if(meta.pending)stateLabel('pending',T.Data?.connected?'Đang chờ Firebase xác nhận từ điển…':'Đã lưu trên máy · sẽ tự đồng bộ khi có mạng.');
  else if(cloudRow){const when=cloudRow.updatedAt?new Date(cloudRow.updatedAt).toLocaleString('vi-VN'):'';stateLabel(canEdit()?'ok':'readonly',`${parseRows(cloudRow.raw||'').size} cách đọc dùng chung${when?' · '+when:''}${cloudRow.updatedByName?' · '+cloudRow.updatedByName:''}${modeText()}`)}
  else if(!navigator.onLine||!T.Data?.connected)stateLabel('local','Đang offline · BLV vẫn dùng bản từ điển đã cache trên máy.');
  else stateLabel(canEdit()?'pending':'readonly','Đang chờ dữ liệu từ điển từ Firebase…');
}
async function writeCloud(row){
  if(!T.Data?.ready||!T.Data?.db||!T.Data?.connected||!T.Auth?.user)return{pendingLocal:true,mode:'LOCAL'};
  const tryMode=async mode=>{await refForMode(mode).set(row);cloudMode=mode;writeMeta({cloudMode:mode});return{pendingLocal:false,mode}};
  if(cloudMode==='FALLBACK')return tryMode('FALLBACK');
  try{return await tryMode('PRIMARY')}catch(e){
    if(!isDenied(e))throw e;
    // Upgrade56 compatibility path: older deployed Rules (pre-Upgrade52) do not
    // know the global pronunciationDictionary branch, while tournament/config
    // already exists and is writable by ADMIN/settings editors.
    try{return await tryMode('FALLBACK')}catch(fallbackError){
      const err=new Error(`Firebase Rules chặn cả từ điển chung và đường dự phòng theo giải: ${fallbackError?.message||fallbackError}`);err.cause=fallbackError;throw err;
    }
  }
}
async function publish(raw,reason='SAVE'){
  if(!canEdit())throw new Error('Tài khoản này chỉ được dùng từ điển, không có quyền sửa từ điển dùng chung.');
  raw=cleanRaw(raw);const a=actor(),now=Date.now(),row={raw,revision:Number(cloudRow?.revision||0)+1,updatedAt:now,updatedBy:a.uid,updatedByName:a.name,source:reason,build:T.VERSION||VERSION};
  writeLocal(raw);writeMeta({pending:true,syncError:'',localEditedAt:now,lastReason:reason});cloudRow=row;setEditorFromRaw(raw,true);syncUi();stateLabel('pending',T.Data?.connected?'Đang ghi từ điển lên Firebase…':'Đã lưu trên máy · sẽ tự đồng bộ khi có mạng.');
  const result=await writeCloud(row);
  if(result.pendingLocal)return{...row,__pendingLocal:true};
  writeMeta({pending:false,syncError:'',lastSyncedAt:Date.now(),cloudMode:result.mode});
  try{await T.Data.audit?.('PRONUNCIATION_DICTIONARY_SYNC','pronunciationDictionary',result.mode==='FALLBACK'?T.Data.tid:'global',null,{revision:row.revision,entries:parseRows(raw).size,reason,cloudMode:result.mode})}catch{}
  syncUi();return{...row,__cloudMode:result.mode};
}
async function saveFromEditor(){if(saving)return;const ta=$('tk46-pronunciation');if(!ta)return;saving=true;syncUi();try{const raw=cleanRaw(ta.value);if(raw!==ta.value)ta.value=raw;const result=await publish(raw,'MANUAL_SAVE');if(result.__pendingLocal)U.toast('Đã lưu cách đọc trên máy · sẽ đồng bộ khi có mạng','info');else U.toast(result.__cloudMode==='FALLBACK'?'Đã đồng bộ cách đọc qua Fixer56':'Đã lưu từ điển phát âm dùng chung','ok')}catch(e){writeLocal(cleanRaw(ta.value));writeMeta({pending:true,syncError:String(e?.message||e),localEditedAt:Date.now()});U.toast('Đã lưu trên máy nhưng chưa đồng bộ Firebase','err')}finally{saving=false;syncUi()}}
async function onCloud(value,mode=cloudMode){
  cloudMode=mode;writeMeta({cloudMode:mode});
  if(value&&typeof value==='object'&&typeof value.raw==='string'){
    cloudRow=value;const local=readLocal(),meta=readMeta(),remote=cleanRaw(value.raw);let chosen=remote;
    if(meta.migratedU52!==true&&local&&local!==remote&&canEdit()){
      const merged=mergeRaw(remote,local);writeMeta({migratedU52:true});if(merged!==remote){try{await publish(merged,'MERGE_LEGACY_LOCAL');return}catch(e){console.warn('Upgrade52 merge legacy local',e)}}
    }
    writeMeta({migratedU52:true,pending:false,syncError:'',lastSyncedAt:Date.now(),cloudRevision:Number(value.revision||0),cloudMode:mode});writeLocal(chosen);setEditorFromRaw(chosen);syncUi();return;
  }
  cloudRow=null;const local=cleanRaw(readLocal());
  if(local&&canEdit()&&!migrating){migrating=true;try{await publish(local,mode==='FALLBACK'?'MIGRATE_FIXER56_FALLBACK':'MIGRATE_LEGACY_LOCAL');writeMeta({migratedU52:true})}catch(e){console.warn('Upgrade52 migrate local dictionary',e);stateLabel('err','Có từ điển local nhưng chưa thể đưa lên cloud: '+(e?.message||e))}finally{migrating=false}}
  else{setEditorFromRaw(local);syncUi();if(!local)stateLabel(canEdit()?'pending':'readonly',canEdit()?'Cloud chưa có từ điển. Nhập cách đọc và bấm “Lưu & đồng bộ”.':'Cloud chưa có từ điển phát âm.')}
}
function attachCloud(mode){
  if(offCloud){try{offCloud()}catch{}offCloud=null}
  cloudMode=mode;const r=refForMode(mode);if(!r)return;
  const handler=s=>onCloud(s.val(),mode).catch(e=>{console.warn('Upgrade52 cloud dictionary',e);stateLabel('err','Không đọc được từ điển cloud: '+(e?.message||e))});
  const error=e=>{
    console.warn('Upgrade52 dictionary permission',e);
    if(mode==='PRIMARY'&&isDenied(e)){cloudMode='FALLBACK';writeMeta({cloudMode:'FALLBACK',primaryDeniedAt:Date.now()});stateLabel('pending','Rules cũ chưa mở nhánh từ điển · Fixer56 đang chuyển sang đồng bộ theo giải…');setTimeout(()=>attachCloud('FALLBACK'),0);return}
    stateLabel('err','Firebase Rules chưa cho phép đọc từ điển dùng chung: '+(e?.message||e));
  };
  r.on('value',handler,error);offCloud=()=>r.off('value',handler);
}
function startCloudSync(){
  syncUi();if(!canUse()||!T.Data?.ready||!T.Data?.db)return;
  const uid=T.Auth?.user?.uid||'';if(offCloud&&listenerUid===uid)return;if(offCloud){try{offCloud()}catch{}offCloud=null}
  listenerUid=uid;cloudMode='PRIMARY';attachCloud('PRIMARY');
}
async function refreshNow(showToast=false){
  syncUi();if(!canUse())return;if(!T.Data?.connected){stateLabel('local','Đang offline · dùng cache local.');if(showToast)U.toast('Đang offline, TOPKEY dùng từ điển đã cache','err');return}
  try{
    const meta=readMeta(),local=cleanRaw(readLocal());
    if(meta.pending&&local&&canEdit()){const result=await publish(local,'RETRY_PENDING');if(showToast)U.toast(result.__cloudMode==='FALLBACK'?'Đã đồng bộ cách đọc qua Fixer56':'Đã đồng bộ từ điển phát âm','ok');return}
    let mode='PRIMARY',snap;
    try{snap=await refForMode('PRIMARY').once('value')}catch(e){if(!isDenied(e))throw e;mode='FALLBACK';snap=await refForMode('FALLBACK').once('value')}
    await onCloud(snap.val(),mode);if(showToast)U.toast(mode==='FALLBACK'?'Đã đồng bộ cách đọc qua Fixer56':'Đã đồng bộ từ điển phát âm','ok');
  }catch(e){stateLabel('err','Đồng bộ thất bại: '+(e?.message||e));if(showToast)U.toast('Không đồng bộ được từ điển','err')}
}

const baseAfterLogin=App.afterLogin?.bind(App);if(baseAfterLogin)App.afterLogin=async function(...args){const out=await baseAfterLogin(...args);setTimeout(()=>{syncUi();startCloudSync()},0);return out};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='live'||tab==='umpire')setTimeout(()=>{syncUi();startCloudSync()},0);return out};
const baseApplyRole=App.applyRole?.bind(App);if(baseApplyRole)App.applyRole=function(...args){const out=baseApplyRole(...args);setTimeout(()=>{syncUi();startCloudSync()},0);return out};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);U.setText?.('health-version',T.VERSION||VERSION);return out};
async function hardenServiceWorker52(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade52 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade52';try{App.renderHealth?.()}catch{}}
function install(){syncUi();stamp();setTimeout(()=>{syncUi();startCloudSync();stamp()},0);setTimeout(()=>{syncUi();startCloudSync();stamp()},1100);hardenServiceWorker52()}
install();window.addEventListener('focus',()=>{syncUi();startCloudSync();stamp();hardenServiceWorker52()},{passive:true});window.addEventListener('online',()=>setTimeout(()=>refreshNow(false),250),{passive:true});
window.TopkeyUpgrade52={installed:true,VERSION,CACHE_TAG,CLOUD_PATH,FALLBACK_RELATIVE_PATH,readLocal,canUse,canEdit,parseRows,mergeRaw,publish,refreshNow,startCloudSync,primaryPath,fallbackPath};
})();
