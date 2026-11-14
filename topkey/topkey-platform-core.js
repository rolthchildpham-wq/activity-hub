/* TOPKEY H119 shared platform bootstrap: Firebase, login and sport startup. */
(()=>{'use strict';
const W=window;
if(W.TopkeyPlatform)return;

const SDK_VERSION='9.23.0';
const SDK={
 app:'firebase-app-compat.js',
 auth:'firebase-auth-compat.js',
 database:'firebase-database-compat.js'
};
const PRIMARY=`https://www.gstatic.com/firebasejs/${SDK_VERSION}/`;
const FALLBACK=`https://cdnjs.cloudflare.com/ajax/libs/firebase/${SDK_VERSION}/`;
const state={firebasePromise:null,publicFirebasePromise:null,appPromise:null,authPromise:null,databasePromise:null,loginBound:false,loginBusy:false,bootPromise:null,sportController:null};
const sports=Object.freeze(['badminton','football','volleyball','running','handmade','shuttle','cooking']);
// Runtime role presets extend this shared table; every sport keeps the same object.
const roles={
 ADMIN:['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'],
 BTC:['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'],
 UMPIRE:['overview','control','umpire','live','health'],
 VIEWER:['overview','schedule','live'],
 LIVE_ONLY:['live']
};
const aliases=Object.freeze({
 badminton:'badminton','cau long':'badminton','🏸 cau long':'badminton',
 football:'football','bong da':'football','⚽ bong da':'football',
 volleyball:'volleyball','bong chuyen':'volleyball','🏐 bong chuyen':'volleyball',
 running:'running','chay bo':'running','🏃 chay bo':'running',
 handmade:'handmade','diy':'handmade','diy / handmade':'handmade','🧶 diy / handmade':'handmade',
 shuttle:'shuttle','da cau':'shuttle','🪶 da cau':'shuttle',
 cooking:'cooking','nau an':'cooking','👨‍🍳 nau an':'cooking'
});
function normalizedText(value){
 const raw=String(value??'').trim().toLowerCase();
 return (raw.normalize?raw.normalize('NFD').replace(/[\u0300-\u036f]/g,''):raw).replace(/đ/g,'d');
}
function normalizeSport(value){const normalized=normalizedText(value);return aliases[normalized]||normalized}
function normalizeScope(profileOrValue){
 const value=profileOrValue&&typeof profileOrValue==='object'?(profileOrValue.sportScope||profileOrValue.assignedSport||''):profileOrValue;
 return normalizeSport(value);
}
function normalizeRole(value){const role=String(value||'VIEWER').trim().toUpperCase();return Object.hasOwn(roles,role)?role:'VIEWER'}
function isBlocked(profile){return !profile||profile.active===false||profile.disabled===true||profile.locked===true||profile.enabled===false||profile.isActive===false||['DISABLED','BLOCKED','SUSPENDED','INACTIVE'].includes(String(profile.status||'').toUpperCase())}
function canAccess(profile,targetSport){
 if(isBlocked(profile))return false;
 const role=normalizeRole(profile.role),target=normalizeSport(targetSport),scope=normalizeScope(profile);
 if(!sports.includes(target))return false;
 if(role==='ADMIN')return true;
 if(role==='BTC')return !!scope&&scope===target;
 return !scope||scope===target;
}
const policy=Object.freeze({
 version:'H119',mechanism:'UNIFIED_MULTISPORT',sports,roles,
 normalizeSport,normalizeScope,normalizeRole,isBlocked,canAccess,
 tabs:role=>roles[normalizeRole(role)],
 canTab:(role,tab)=>roles[normalizeRole(role)].includes(String(tab||''))
});

function defaultLoadScript(src,timeout=4500){return new Promise((resolve,reject)=>{
 const found=[...document.scripts].find(script=>script.dataset?.topkeyPlatformSrc===src||script.src===src);
 if(found?.dataset?.topkeyLoaded==='1')return resolve(src);
 const script=found||document.createElement('script');let settled=false;
 const finish=(ok,error)=>{if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;if(ok){script.dataset.topkeyLoaded='1';resolve(src)}else{if(script.parentNode)script.remove();reject(error||new Error('Không tải được '+src))}};
 script.dataset.topkeyPlatformSrc=src;script.src=src;script.async=true;
 script.onload=()=>finish(true);script.onerror=()=>finish(false);
 const timer=setTimeout(()=>finish(false,new Error('Quá thời gian tải '+src)),timeout);
 if(!found)document.head.append(script);
})}

async function loadModule(name,verify,loader){
 if(verify())return;
 const file=SDK[name];let firstError;
 try{await loader(PRIMARY+file);if(verify())return}catch(error){firstError=error}
 const fallback=FALLBACK+file.replace('.js','.min.js');
 try{await loader(fallback);if(verify())return}catch(error){throw error}
 throw firstError||new Error(`Firebase ${name} tải xong nhưng API chưa sẵn sàng`);
}
function ensureModule(name,verify,loader){
 const key=name+'Promise';
 if(state[key])return state[key];
 state[key]=loadModule(name,verify,loader).catch(error=>{state[key]=null;throw error});
 return state[key];
}

function loadFirebase(config,options={}){
 const withAuth=options.auth!==false;
 if(W.firebase?.initializeApp&&W.firebase?.database&&(!withAuth||W.firebase?.auth)){
  if(!W.firebase.apps.length)W.firebase.initializeApp(config);
  const ready=Promise.resolve(W.firebase);
  if(withAuth)return state.firebasePromise||(state.firebasePromise=ready);
  return state.publicFirebasePromise||(state.publicFirebasePromise=ready);
 }
 if(withAuth&&state.firebasePromise)return state.firebasePromise;
 if(!withAuth&&state.publicFirebasePromise)return state.publicFirebasePromise;
 const loader=options.loadScript||defaultLoadScript;
 const run=(async()=>{
  await ensureModule('app',()=>typeof W.firebase?.initializeApp==='function',loader);
  if(!W.firebase.apps.length){
   if(!config?.apiKey||!config?.databaseURL)throw new Error('Cấu hình Firebase chưa đầy đủ');
   W.firebase.initializeApp(config);
  }
  const modules=[ensureModule('database',()=>typeof W.firebase?.database==='function',loader)];
  if(withAuth)modules.push(ensureModule('auth',()=>typeof W.firebase?.auth==='function',loader));
  await Promise.all(modules);
  return W.firebase;
 })().catch(error=>{if(withAuth)state.firebasePromise=null;else state.publicFirebasePromise=null;throw error});
 if(withAuth)state.firebasePromise=run;else state.publicFirebasePromise=run;
 return run;
}

function status(form,message,kind='info'){
 let node=form.querySelector?.('[data-topkey-login-status]')||document.getElementById?.('topkey-auth-hint');
 if(!node&&form.append){node=document.createElement('p');node.dataset.topkeyLoginStatus='1';node.setAttribute('role','status');form.append(node)}
 if(node){node.textContent=message;node.dataset.state=kind}
}

const authMessages={
 'auth/invalid-credential':'Email hoặc mật khẩu không đúng.',
 'auth/wrong-password':'Email hoặc mật khẩu không đúng.',
 'auth/user-not-found':'Không tìm thấy tài khoản.',
 'auth/too-many-requests':'Tài khoản đang bị giới hạn đăng nhập. Vui lòng thử lại sau.',
 'auth/network-request-failed':'Không kết nối được Firebase Authentication. Kiểm tra mạng rồi thử lại.',
 'auth/unauthorized-domain':'Tên miền hiện tại chưa được cho phép trong Firebase Authentication.'
};

async function submitLogin(form,options){
 if(state.loginBusy)return;
 const emailEl=form.elements?.namedItem?.('email')||form.querySelector?.('[name="email"]');
 const passwordEl=form.elements?.namedItem?.('password')||form.querySelector?.('[name="password"]');
 const email=String(emailEl?.value||'').trim(),password=String(passwordEl?.value||'');
 if(!email||!password){status(form,'Nhập đầy đủ email và mật khẩu.','error');return}
 const button=form.querySelector?.('button[type="submit"]')||form.querySelector?.('button:not([type])');
 const label=button?.textContent||'Đăng nhập an toàn';state.loginBusy=true;
 if(button){button.disabled=true;button.textContent='Đang xác thực…'}
 try{
  status(form,'Đang kết nối và xác minh tài khoản…');
  if(/^#(?:spectator|register|judge)/.test(location.hash||'')){
   const url=new URL(location.href);url.hash='';history.replaceState(history.state,'',url.toString());
   W.__TOPKEY_PUBLIC_ROUTE='';W.__TOPKEY_IS_SPECTATOR=false;W.__TOPKEY_IS_REGISTER=false;
   document.documentElement?.classList.remove('tk-public-boot','tk-public-spectator-boot');
  }
  await options.beforeLogin?.();
  const T=await options.ensureCore();
  if(!T?.Auth?.login)throw new Error('Module đăng nhập chưa sẵn sàng.');
  await T.Auth.login(email,password);
  await (options.afterAuthenticated||options.ensureCore?.afterAuthenticated)?.(T);
  status(form,'Đăng nhập thành công.','success');
 }catch(error){status(form,authMessages[error?.code]||String(error?.message||error),'error');console.warn('TOPKEY login:',error?.code||error?.message||error)}
 finally{state.loginBusy=false;if(button){button.disabled=false;button.textContent=label}}
}

function bindLogin(options){
 if(state.loginBound)return;
 state.loginBound=true;
 document.addEventListener('submit',event=>{
  if(event.target?.id!=='login-form')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.target.reportValidity&&!event.target.reportValidity())return;
  submitLogin(event.target,options).catch(error=>console.error('TOPKEY login controller:',error));
 },true);
}

function bootSport(options){
 if(state.bootPromise)return state.bootPromise;
 state.bootPromise=(async()=>{
  const config=typeof options.config==='function'?await options.config():options.config;
  await loadFirebase(config,options.firebaseOptions);
  const T=await options.ensureCore();
  if(T?.Data&&!T.Data.auth&&typeof T.Data.ensureFirebase==='function')T.Data.ensureFirebase();
  if(T?.Auth?.init)await T.Auth.init();
  return T;
 })().catch(error=>{state.bootPromise=null;throw error});
 return state.bootPromise;
}

function tournamentId(T){
 const sport=String(T.SPORT?.key||'badminton');
 const key=sport==='badminton'?'topkey_vnext_tid':`topkey_${sport}_tid`;
 const backup=sport==='badminton'?'topkey_vnext_prod_tid':key+'_prod';
 const query=new URLSearchParams(location.search||'');
 try{return query.get('tid')||localStorage.getItem(key)||localStorage.getItem(backup)||'main_2026'}catch{return query.get('tid')||'main_2026'}
}

function prepareAuthShell(){
 const T=W.Topkey;
 if(!T?.SPORT?.key)throw new Error('Ngữ cảnh môn thể thao chưa sẵn sàng.');
 if(!T.Data){
  T.Data={
   __platformShell:true,
   app:W.firebase.app(),db:W.firebase.database(),auth:W.firebase.auth(),ready:true,
   tid:tournamentId(T),
   ensureFirebase(){return this}
  };
 }
 if(!T.Data.auth||!T.Data.db){
  T.Data.app=T.Data.app||W.firebase.app();T.Data.db=T.Data.db||W.firebase.database();T.Data.auth=T.Data.auth||W.firebase.auth();T.Data.ready=true;
 }
 if(!T.Auth){
  if(!W.TopkeySharedAuth?.create)throw new Error('Lõi xác thực dùng chung chưa sẵn sàng.');
  T.Auth=W.TopkeySharedAuth.create(T);
 }
 return T;
}

function startSport(options={}){
 if(state.sportController)return state.sportController;
 let corePromise=null;
 const shellPromise=(async()=>{
  const config=typeof options.config==='function'?await options.config():options.config;
  await loadFirebase(config,options.firebaseOptions);
  return prepareAuthShell();
 })();
 // Bind protected sign-in immediately, before any admin bundle is loaded.
 // A mobile submit must never navigate or silently wait for admin-core hydration.
 // The shared Firebase/Auth shell is sufficient to authenticate and verify role;
 // verified admin-ready hydrates the heavy sport runtime separately.
 bindLogin({ensureCore:()=>shellPromise});
 const ensureCore=()=>{
  if(corePromise)return corePromise;
  corePromise=(async()=>{
   const T=await shellPromise;
   const loaded=await options.loadCore?.(T)||T;
   if(typeof W.TopkeyBootAdmin==='function')await W.TopkeyBootAdmin();
   await loaded.Auth?.attachApp?.();
   return loaded;
  })().catch(error=>{corePromise=null;throw error});
  return corePromise;
 };
 const onReady=()=>{ensureCore().catch(error=>console.error('TOPKEY sport core hydration',error))};
 W.addEventListener?.('topkey:admin-ready',onReady,{passive:true});
 const ready=shellPromise.then(async T=>{
  await T.Auth.init?.();
  if(W.__TOPKEY_ADMIN_READY||T.Auth._profileVerifiedUid)await ensureCore();
  return T;
 });
 state.sportController=Object.freeze({ready,ensureCore,get corePromise(){return corePromise}});
 return state.sportController;
}

W.TopkeyPlatform=Object.freeze({
 loadFirebase,bindLogin,bootSport,startSport,
 policy,
 get state(){return Object.freeze({...state})}
});
})();
