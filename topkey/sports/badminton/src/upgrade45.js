(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||!T.Data||!T.Auth||App.__upgrade45Installed)return;
App.__upgrade45Installed=true;
const VERSION='2026.10.28-vnext-featureparity15-upgrade45';
const CACHE_TAG='u45-20261028';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
const $=id=>document.getElementById(id);
const SESSION_PREFIX='topkey_u45_access_';
const EXPLICIT_KEY='topkey_u45_explicit_login';
const tabLabels={overview:'Tổng quan',control:'Điều hành sân',teams:'Đội & Check-in',schedule:'Lịch & BXH',umpire:'Trọng tài',live:'Live & BLV',finance:'Tài chính',announcements:'Thông báo',audit:'Audit',health:'Health',settings:'Cài đặt'};
function sessionKey(uid=T.Auth.user?.uid||''){return SESSION_PREFIX+String(T.Data.tid||'main_2026')+'_'+uid;}
function makeId(){try{return crypto.randomUUID()}catch{return 'sess_'+Date.now()+'_'+Math.random().toString(36).slice(2,10)}}
function getSession(){const uid=T.Auth.user?.uid;if(!uid)return null;try{const raw=sessionStorage.getItem(sessionKey(uid));return raw?JSON.parse(raw):null}catch{return null}}
function setSession(s){const uid=T.Auth.user?.uid;if(!uid)return;try{sessionStorage.setItem(sessionKey(uid),JSON.stringify(s))}catch{}}
function clearSession(uid=T.Auth.user?.uid||''){if(!uid)return;try{sessionStorage.removeItem(sessionKey(uid))}catch{}}
function clientInfo(){return{build:VERSION,path:location.pathname,hrefBase:location.origin+location.pathname,language:navigator.language||'',platform:navigator.userAgentData?.platform||navigator.platform||'',userAgent:String(navigator.userAgent||'').slice(0,320),online:navigator.onLine};}
function role(){return T.Auth.role?.()||String(T.Auth.profile?.role||'VIEWER').toUpperCase();}
function actor(){return T.Auth.profile?.displayName||T.Auth.profile?.username||T.Auth.user?.displayName||T.Auth.user?.email||'User';}
function email(){return T.Auth.profile?.email||T.Auth.user?.email||'';}
function activeSessionId(){return getSession()?.id||'';}

// Enrich every audit row from Upgrade45 onward with account role/session/module context.
T.Data.audit=async function(action,entityType,entityId,before=null,after=null){
  const id=U.id('audit'),uid=T.Auth?.user?.uid||'local';
  const row={id,action,entityType,entityId,uid,actor:actor(),role:role(),email:email(),sessionId:activeSessionId(),tab:App.currentTab||'',build:VERSION,before,after,clientAt:Date.now()};
  return this.queueSet(`audit/${id}`,row,{eventId:id,type:'AUDIT'});
};
async function accessAudit(action,details={}){
  if(!T.Auth.user||!T.Data.ready)return;
  const session=getSession();
  const after={...clientInfo(),role:role(),email:email(),displayName:actor(),sessionId:session?.id||'',sessionStartedAt:session?.startedAt||null,tab:details.tab||App.currentTab||'',tabLabel:tabLabels[details.tab||App.currentTab]||details.tab||App.currentTab||'',...details};
  try{await T.Data.audit(action,'access',after.tab||'app',null,after);}catch(e){console.warn('Upgrade45 access audit',action,e);}
}
async function ensureAccessSession(){
  if(!T.Auth.user)return null;
  let s=getSession();
  if(s?.uid===T.Auth.user.uid)return s;
  const explicit=(()=>{try{return sessionStorage.getItem(EXPLICIT_KEY)==='1'}catch{return false}})();
  try{sessionStorage.removeItem(EXPLICIT_KEY)}catch{}
  s={id:makeId(),uid:T.Auth.user.uid,role:role(),startedAt:Date.now(),lastTab:'',explicit};setSession(s);
  await accessAudit(explicit?'ACCESS_LOGIN':'ACCESS_SESSION_OPEN',{event:explicit?'LOGIN':'SESSION_OPEN',loginType:explicit?'EMAIL_PASSWORD':'PERSISTED_AUTH'});
  return s;
}
async function logModule(tab){
  if(!T.Auth.user||!tab)return;
  const s=await ensureAccessSession();if(!s||s.lastTab===tab)return;
  s.lastTab=tab;s.lastTabAt=Date.now();setSession(s);
  await accessAudit('ACCESS_MODULE',{event:'MODULE_ACCESS',tab,tabLabel:tabLabels[tab]||tab});
}

const baseLogin=T.Auth.login.bind(T.Auth);
T.Auth.login=async function(emailAddr,password){
  try{sessionStorage.setItem(EXPLICIT_KEY,'1')}catch{}
  try{return await baseLogin(emailAddr,password)}catch(e){try{sessionStorage.removeItem(EXPLICIT_KEY)}catch{}throw e;}
};
const baseLogout=T.Auth.logout.bind(T.Auth);
T.Auth.logout=async function(...args){
  const uid=T.Auth.user?.uid||'',s=getSession();
  if(uid){await accessAudit('ACCESS_LOGOUT',{event:'LOGOUT',durationMs:s?.startedAt?Math.max(0,Date.now()-s.startedAt):null});clearSession(uid);}
  return baseLogout(...args);
};
const baseAfterLogin=App.afterLogin.bind(App);
App.afterLogin=async function(...args){
  await ensureAccessSession();
  const out=await baseAfterLogin(...args);
  await logModule(this.currentTab||'overview');
  return out;
};
const baseShowTab=App.showTab.bind(App);
App.showTab=function(tab,...args){
  const allowed=T.Auth.can?.(tab),out=baseShowTab(tab,...args);
  if(allowed&&T.Auth.user){Promise.resolve().then(()=>logModule(tab));}
  return out;
};

function detailText(a){
  if(a.entityType==='access'){
    const d=a.after||{},bits=[];
    if(d.tabLabel||a.tab)bits.push(d.tabLabel||a.tab);
    if(d.loginType)bits.push(d.loginType==='EMAIL_PASSWORD'?'Email/Password':'Phiên đăng nhập còn hiệu lực');
    if(d.durationMs!=null)bits.push('Phiên '+Math.max(0,Math.round(Number(d.durationMs)/60000))+' phút');
    if(d.platform)bits.push(d.platform);
    return bits.join(' · ')||'Truy cập hệ thống';
  }
  return a.tab?(tabLabels[a.tab]||a.tab):'—';
}
function actionLabel(a){const map={ACCESS_LOGIN:'🔐 ĐĂNG NHẬP',ACCESS_SESSION_OPEN:'🟢 MỞ PHIÊN',ACCESS_MODULE:'👁 TRUY CẬP',ACCESS_LOGOUT:'🚪 ĐĂNG XUẤT'};return map[a]||a;}
function enhanceAuditHeader(){
  const table=$('audit-list')?.closest('table'),head=table?.querySelector('thead tr');if(!head)return;
  head.innerHTML='<th>Thời gian</th><th>Người dùng / Vai trò</th><th>Hành động</th><th>Khu vực / Đối tượng</th><th>ID</th><th>Chi tiết truy cập</th>';
  const note=table.closest('.card')?.querySelector('p.muted');if(note)note.textContent='Ghi nhận cả đăng nhập, mở phiên, truy cập module, đăng xuất và các thay đổi dữ liệu của mọi tài khoản đã xác thực.';
}
function renderAudit45(){
  const box=$('audit-list');if(!box)return;enhanceAuditHeader();box.replaceChildren();
  Object.values(this.state.audit||{}).sort((a,b)=>(b.clientAt||0)-(a.clientAt||0)).slice(0,500).forEach(a=>{
    const tr=document.createElement('tr');if(a.entityType==='access')tr.classList.add('tk45-access-row');
    const user=document.createElement('td');const name=document.createElement('b');name.textContent=a.actor||a.email||a.uid||'—';user.appendChild(name);const meta=document.createElement('small');meta.className='tk45-audit-role';meta.textContent=`${a.role||'—'}${a.email?' · '+a.email:''}`;user.appendChild(meta);
    const values=[U.dateTime(a.clientAt),null,actionLabel(a.action),a.entityType==='access'?(tabLabels[a.after?.tab||a.tab]||a.after?.tab||a.tab||'Ứng dụng'):(a.entityType||'—'),a.entityId||'—',detailText(a)];
    values.forEach((x,i)=>{if(i===1){tr.appendChild(user);return;}const td=document.createElement('td');td.textContent=x??'—';if(i===2&&a.entityType==='access')td.className='tk45-access-action';tr.appendChild(td)});box.appendChild(tr);
  });
}
App.renderAudit=renderAudit45;

const baseRenderHealth=App.renderHealth?.bind(App);
function renderHealth45(...args){const out=baseRenderHealth?.(...args);U.setText?.('health-version',VERSION);document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out;}
App.renderHealth=renderHealth45;
async function hardenServiceWorker45(){if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update();}catch{}}catch(e){console.warn('Upgrade45 SW refresh',e);}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade45';try{renderHealth45();}catch{}}
function install(){enhanceAuditHeader();stamp();setTimeout(()=>{enhanceAuditHeader();stamp();},0);setTimeout(stamp,800);hardenServiceWorker45();}
install();window.addEventListener('focus',()=>{stamp();hardenServiceWorker45();},{passive:true});
window.TopkeyUpgrade45={installed:true,VERSION,ensureAccessSession,accessAudit,logModule,getSession,detailText,actionLabel};
})();
