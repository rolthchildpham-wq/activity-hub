/* H118: One authenticated, server-profile-verified session implementation for all TOPKEY sports.
 * The sport adapters only supply T.SPORT / T.ROOT; they do not fork the auth workflow.
 * Never infer administrator privilege from localStorage, Hub tickets or Firebase Auth alone.
 */
(()=>{
 'use strict';
 if(window.TopkeySharedAuth)return;
 const PROFILE_TIMEOUT=6500,REVALIDATE_DELAY=300,AUTH_NULL_GRACE=6500;
 const PROFILE_MESSAGE='Firebase đã đăng nhập nhưng chưa xác minh được quyền tài khoản. Bấm "Thử kiểm tra quyền" để thử lại, không cần đăng nhập lại.';
 const blocked=profile=>window.TopkeyPlatform?.policy.isBlocked(profile)??true;
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function withTimeout(promise,ms,message){let timer;return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms)})]).finally(()=>clearTimeout(timer));}
 function create(T){
  if(!T||!T.Data||!T.SPORT)throw new Error('TOPKEY sport context is not available for shared authentication');
  const policy=window.TopkeyPlatform?.policy;
  if(!policy)throw new Error('TOPKEY platform policy is not available for shared authentication');
  const U=T.U||{};
  const sport=()=>String(T.SPORT.key||'badminton');
  const authRoot=()=>String(T.AUTH_ROOT||T.ROOT);
  const safeMessage=e=>String(e?.message||e||'Lỗi không xác định');
  class AuthService{
   constructor(){
    this.user=null;this.profile=null;this.mode='SECURE';this.profileRef=null;this.profileHandler=null;
    this.sessionUid=null;this._profileVerifiedUid='';this._h108ObserverReady=false;
    this._verifyFlight=null;this._loginFlight=null;this._initPromise=null;this._generation=0;
    this._appStartedUid='';this._publishedReadyUid='';this._lastProfileFingerprint='';
    this._authObserverUnsubscribe=null;this._profileRevalidation=null;this._suppressTransientLoginUI=false;this.state='BOOTSTRAP';
   }
   transition(state,detail={}){
    this.state=state;
    const payload={state,sport:sport(),uid:this.user?.uid||this.ensureAuth()?.currentUser?.uid||'',at:Date.now(),...detail};
    try{window.dispatchEvent?.(typeof CustomEvent==='function'?new CustomEvent('topkey:auth-state',{detail:payload}):{type:'topkey:auth-state',detail:payload})}catch{}
    return payload;
   }
   selectedSport(){return sport()}
   freshKey(){return 'topkey_require_fresh_login_'+sport()}
   sportScope(profile=this.profile){
    return policy.normalizeScope(profile);
   }
   hasSportAccess(profile=this.profile){
    return policy.canAccess(profile,sport());
   }
   normalizeProfile(raw,user){
    const p=raw&&typeof raw==='object'?{...raw}:{};
    p.role=policy.normalizeRole(p.role);
    p.uid=p.uid||user?.uid||'';p.email=p.email||user?.email||'';
    p.displayName=p.displayName||user?.displayName||user?.email||'User';
    p.active=!policy.isBlocked(p);
    return p;
   }
   normalize(raw,user){return this.normalizeProfile(raw,user)}
   detachProfile(){
    if(this.profileRef&&this.profileHandler)try{this.profileRef.off('value',this.profileHandler)}catch{}
    this.profileRef=null;this.profileHandler=null;this.sessionUid=null;
   }
   detach(){return this.detachProfile()}
   _removeVerificationPending(){
    document.getElementById('topkey-auth-verification-pending')?.remove();
   }
   _finishInitialAuthCheck(){
    document.getElementById('topkey-auth-boot-pending')?.remove();
   }
   _showVerificationPending(message='Đang xác minh quyền tài khoản…'){
    this._finishInitialAuthCheck();
    // Firebase identity is retained: never show a second password form for a
    // network timeout, delayed profile read or an in-progress session restore.
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app-shell')?.classList.add('hidden');
    let panel=document.getElementById('topkey-auth-verification-pending');
    if(!panel){
     panel=document.createElement('section');
     panel.id='topkey-auth-verification-pending';
     panel.setAttribute('role','status');
     panel.style.cssText='max-width:520px;margin:10vh auto;padding:24px;border:1px solid #446180;border-radius:16px;background:#10243d;color:#f2f7ff;line-height:1.5;box-shadow:0 12px 40px #0004';
     const heading=document.createElement('h2');heading.textContent='Đang xác minh phiên đăng nhập';
     const detail=document.createElement('p');detail.id='topkey-auth-verification-message';
     const retry=document.createElement('button');retry.type='button';retry.id='topkey-auth-verification-retry';
     retry.textContent='Thử kiểm tra quyền';retry.style.cssText='padding:10px 16px;border-radius:10px;background:#0f987d;color:white;border:0;cursor:pointer';
     retry.addEventListener('click',async()=>{
      if(retry.disabled)return;
      retry.disabled=true;retry.textContent='Đang kiểm tra…';
      try{
       const auth=this.ensureAuth();
       const user=auth?.currentUser;
       if(user&&!user.isAnonymous)await this.retryProfile();
       else if(auth)await this._onAuthState(auth.currentUser);
       else throw new Error('Firebase chưa kết nối. Vui lòng kiểm tra mạng.');
      }catch(e){this._showVerificationPending(safeMessage(e))}
      finally{retry.disabled=false;retry.textContent='Thử kiểm tra quyền'}
     });
     const signIn=document.createElement('button');signIn.type='button';signIn.id='topkey-auth-verification-sign-in';
     signIn.textContent='Đăng nhập lại (nếu phiên đã hết hạn)';
     signIn.style.cssText='display:block;margin-top:12px;padding:8px 12px;border:1px solid #65809b;background:transparent;color:#e4eeff;border-radius:8px;cursor:pointer';
     signIn.addEventListener('click',()=>this._clearProtectedSession('SIGNED_OUT'));
     panel.append(heading,detail,retry,signIn);document.body.appendChild(panel);
    }
    const detail=panel.querySelector('#topkey-auth-verification-message');
    if(detail)detail.textContent=message;
    this.transition('REVALIDATING',{reason:'profile-wait'});
   }
   _showLogin(message='',allowRetry=false){
    const authUser=this.ensureAuth()?.currentUser;
    const hub=window.TopkeyHubSession?.read?.();
    const restoring=hub?.phase==='AUTHENTICATED'&&!!hub?.authUid;
    if(allowRetry&&((authUser&&!authUser.isAnonymous)||restoring)){
     this._showVerificationPending(message||PROFILE_MESSAGE);return;
    }
    this._removeVerificationPending();
    this._finishInitialAuthCheck();
    document.getElementById('app-shell')?.classList.add('hidden');
    document.getElementById('login-screen')?.classList.remove('hidden');
    const retry=document.getElementById('auth-retry-profile');
    if(retry){retry.hidden=!allowRetry;retry.classList.toggle?.('hidden',!allowRetry)}
    if(message){
     const el=document.getElementById('topkey-auth-hint');
     if(el)el.textContent=message;
     else U.toast?.(message,'err');
    }
   }
   _showApp(){
    this._finishInitialAuthCheck();
    this._removeVerificationPending();
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app-shell')?.classList.remove('hidden');
    const hint=document.getElementById('topkey-auth-hint');if(hint)hint.textContent='';
    const retry=document.getElementById('auth-retry-profile');if(retry){retry.hidden=true;retry.classList.add?.('hidden')}
    this.transition('AUTHENTICATED',{verified:true});
   }
   async _startAppIfReady(){
    const uid=this._profileVerifiedUid||this.user?.uid||'';
    if(!uid||typeof T.App?.afterLogin!=='function')return false;
    if(this._appStartedUid===uid)return true;
    this._appStartedUid=uid;
    try{await T.App.afterLogin()}
    catch(e){this._appStartedUid='';throw e}
    setTimeout(()=>this.recoverProductionTournament().catch(e=>console.warn('Tournament recovery',e)),250);
    return true;
   }
   attachApp(){return this._startAppIfReady()}
   _clearProtectedSession(state='SIGNED_OUT'){
    this._generation++;this.detachProfile();this.user=null;this.profile=null;
    this._profileVerifiedUid='';this._verifyFlight=null;this._profileRevalidation=null;this._appStartedUid='';this._publishedReadyUid='';
    if(T.App)T.App.__afterLoginUid='';
    window.__TOPKEY_ADMIN_READY=false;
    if(Array.isArray(T.App?.offs)){for(const off of T.App.offs)try{off()}catch{}T.App.offs=[]}
    this._removeVerificationPending();
    this.transition(state);this._showLogin();
   }
   async rejectSportAccess(profile=this.profile){
    // Keep the Firebase identity intact: rejecting a sport does not sign the user
    // out of other sports or start an auth-state loop in another tab.
    try{sessionStorage.setItem('topkey_access_denied',JSON.stringify({sport:sport(),uid:this.user?.uid||'',role:profile?.role||'',scope:this.sportScope(profile),at:Date.now()}))}catch{}
    try{window.TopkeyHubSession?.invalidate?.()}catch{}
    this._clearProtectedSession('DENIED');
    location.replace('../../index.html?access=denied&sport='+encodeURIComponent(sport()));
   }
   ensureAuth(){
    if(T.Data?.auth)return T.Data.auth;
    if(typeof T.Data?.ensureFirebase==='function')try{T.Data.ensureFirebase()}catch(e){console.warn('Auth SDK not ready',e)}
    if(T.Data?.auth)return T.Data.auth;
    if(typeof firebase==='undefined'||typeof firebase.auth!=='function')return null;
    if(!firebase.apps.length){if(!T.FIREBASE_CONFIG?.apiKey)return null;firebase.initializeApp(T.FIREBASE_CONFIG)}
    T.Data.auth=firebase.auth();T.Data.db=T.Data.db||firebase.database?.();
    T.Data.ready=!!T.Data.db;
    return T.Data.auth;
   }
   _startPublic(){
    const route=window.__TOPKEY_PUBLIC_ROUTE||(/^(#spectator|#register|#judge)/.exec(location.hash||'')||[])[1]||'';
    if(!route)return false;
    this.profile={uid:'',role:'VIEWER',active:true,public:true,displayName:'Public'};
    document.getElementById('app-shell')?.classList.add('hidden');
    document.getElementById('login-screen')?.classList.add('hidden');
    setTimeout(()=>{try{T.App?.handlePublicHash?.();if(route==='#spectator'||route==='spectator')T.App?.startSpectator?.()||T.App?.startPublicSpectator?.();if(route==='#judge'||route==='judge')window.TopkeyH88Judging?.startPublic?.()}catch(e){console.warn('Public route boot',e)}},0);
    return true;
   }
   async init(){
    if(this._startPublic())return;
    if(this._h108ObserverReady)return this._initPromise||Promise.resolve();
    const auth=this.ensureAuth();
    if(!auth)return;
    this.transition('RESTORING');
    this._h108ObserverReady=true;
    this._initPromise=new Promise(resolve=>{
     let first=true;
     const finish=()=>{if(!first)return;first=false;clearTimeout(timer);resolve()};
     const timer=setTimeout(()=>{this.transition('ERROR',{reason:'auth-restore-timeout'});this._showLogin('Đang chờ Firebase khôi phục phiên…',true);finish()},12000);
     this._h108HandleState=user=>Promise.resolve(this._onAuthState(user)).finally(finish);
     this._authObserverUnsubscribe=auth.onAuthStateChanged(
      user=>this._h108HandleState(user).catch(e=>console.warn('TOPKEY shared auth observer',e)),
      error=>{this.transition('ERROR',{reason:'auth-observer',message:safeMessage(error)});this._showLogin(safeMessage(error),true);finish()}
     );
    });
    return this._initPromise;
   }
   async _onAuthState(user){
    if(user?.isAnonymous){
     this._clearProtectedSession();
     // Anonymous public credentials must not become a protected login session.
     try{await T.Data.auth.signOut()}catch(e){console.warn('Anonymous auth signout deferred',e)}
     return;
    }
    if(!user){
     // Persistence restore can briefly expose null after a verified session.
     // Confirm it before clearing the protected UI.
     let liveUser=this.ensureAuth()?.currentUser;
     if(liveUser&&!liveUser.isAnonymous)return this._onAuthState(liveUser);
     // Hub may already hold a Firebase identity while the SDK restores it on
     // the sport page. That is not a second login requirement.
     const hubSession=window.TopkeyHubSession?.read?.();
     const restoringFromHub=hubSession?.phase==='AUTHENTICATED'&&!!hubSession?.authUid;
     if(this._profileVerifiedUid||this.user?.uid||this._loginFlight||restoringFromHub){
      // Do not bounce an authenticated scorer to login during a short SDK reconnect.
      this.transition('REVALIDATING',{reason:'auth-null'});
      const generation=this._generation;
      for(let elapsed=0;elapsed<AUTH_NULL_GRACE;elapsed+=REVALIDATE_DELAY){
       await pause(REVALIDATE_DELAY);
       if(generation!==this._generation)return;
       liveUser=this.ensureAuth()?.currentUser;
       if(liveUser&&!liveUser.isAnonymous)return this._onAuthState(liveUser);
      }
     }
     if(this.ensureAuth()?.currentUser)return;
     // Firebase may briefly lose its persisted user after a successful login.
     // Withhold protected UI and wait for re-verification; never use Hub state
     // alone as authorization. Provide explicit sign-in only on user request.
     if(this._profileVerifiedUid||this.user?.uid){
      this._generation++;this.detachProfile();
      this.user=null;this.profile=null;this._profileVerifiedUid='';
      this._appStartedUid='';this._publishedReadyUid='';
      window.__TOPKEY_ADMIN_READY=false;
      if(Array.isArray(T.App?.offs)){for(const off of T.App.offs)try{off()}catch{}T.App.offs=[]}
      this._showVerificationPending('Firebase đang khôi phục phiên. Thử kiểm tra quyền để tiếp tục nếu tài khoản vẫn còn đăng nhập.');
      return;
     }
     this._clearProtectedSession('SIGNED_OUT');return
    }
    if(this.user?.uid!==user.uid){
     this._generation++;this.detachProfile();this.profile=null;this._profileVerifiedUid='';
     this._appStartedUid='';this._publishedReadyUid='';if(T.App)T.App.__afterLoginUid='';window.__TOPKEY_ADMIN_READY=false;
    }
    this.user=user;
    if(this._profileVerifiedUid===user.uid){this.transition('AUTHENTICATED',{verified:true,revalidated:true});await this.attachApp();return}
    try{window.TopkeyHubSession?.adoptFirebaseUser?.(user.uid)}catch{}
    try{await this.verifyProfile(user)}catch(e){console.warn('TOPKEY auth profile verification',e)}
   }
   async verifyProfile(user=this.ensureAuth()?.currentUser){
    if(!user||user.isAnonymous)throw new Error('Chưa có tài khoản Firebase hợp lệ.');
    if(this._profileVerifiedUid===user.uid&&this.profile?.active&&this.hasSportAccess(this.profile))return this.profile;
    if(this._verifyFlight?.uid===user.uid)return this._verifyFlight.promise;
    const version=this._generation;this.transition('VERIFYING_PROFILE',{uid:user.uid});
    const promise=(async()=>{
     if(!T.Data.db)throw new Error('Firebase Database chưa kết nối.');
     const ref=T.Data.db.ref(`${authRoot()}/users/${user.uid}`);
     const snapshot=await withTimeout(ref.once('value'),PROFILE_TIMEOUT,'Hết thời gian chờ đọc hồ sơ quyền.');
     const raw=snapshot?.val?.();
     if(!raw||typeof raw!=='object')throw new Error('Tài khoản chưa có hồ sơ quyền trên Firebase. Hãy liên hệ ADMIN.');
     // Auth changed while this read was in flight: the stale profile must never open the UI.
     if(version!==this._generation||this.ensureAuth()?.currentUser?.uid!==user.uid)throw new Error('Phiên đã thay đổi trong lúc kiểm tra quyền.');
     const profile=this.normalizeProfile(raw,user);
     if(!this.hasSportAccess(profile)){
      await this.rejectSportAccess(profile);
      throw new Error('Tài khoản không được cấp quyền môn '+(T.SPORT.name||sport()));
     }
     this.user=user;this.profile=profile;this.sessionUid=user.uid;
     this._profileVerifiedUid=user.uid;
     try{window.TopkeyHubSession?.markAuthenticated?.(user.uid)}catch{}
     this._showApp();
     this._attachProfileRef(ref,user);
     if(this._publishedReadyUid!==user.uid){
      this._publishedReadyUid=user.uid;
      window.__TOPKEY_ADMIN_READY=true;
      const detail={uid:user.uid,sport:sport(),verified:true};
      window.dispatchEvent?.(typeof CustomEvent==='function'?new CustomEvent('topkey:admin-ready',{detail}):{type:'topkey:admin-ready',detail});
     }
     this.attachApp().catch(e=>console.error('TOPKEY afterLogin',e));
     return profile;
    })();
    this._verifyFlight={uid:user.uid,promise};
    try{return await promise}catch(e){
     if(version===this._generation){
      this.profile=null;this._profileVerifiedUid='';this.transition('ERROR',{reason:'profile-verification',message:safeMessage(e)});
      // Never turn a network hiccup into a fake sign-out. Keep credentials
      // intact and present an explicit retry action only after retries finish.
      if(!this._suppressTransientLoginUI)this._showLogin(PROFILE_MESSAGE,true);
     }
     throw e;
    }finally{if(this._verifyFlight?.promise===promise)this._verifyFlight=null}
   }
   _attachProfileRef(ref,user){
    this.detachProfile();this.profileRef=ref;this.sessionUid=user.uid;
    this._lastProfileFingerprint=JSON.stringify(this._permissionFingerprint(this.profile));
    this.profileHandler=async snap=>{
     if(this.sessionUid!==user.uid||this.ensureAuth()?.currentUser?.uid!==user.uid)return;
     const raw=snap.val();
     if(!raw||typeof raw!=='object'){
      if(this._profileRevalidation)return this._profileRevalidation;
      const version=this._generation;
      this.transition('REVALIDATING',{reason:'profile-null'});
      const flight=(async()=>{
       await pause(REVALIDATE_DELAY);
       let confirmed=null;
       try{confirmed=(await withTimeout(ref.once('value'),PROFILE_TIMEOUT,'Hết thời gian kiểm tra lại hồ sơ quyền.'))?.val?.()}catch(e){
        if(version===this._generation){this.transition('ERROR',{reason:'profile-revalidation',message:safeMessage(e)});this._showLogin(PROFILE_MESSAGE,true)}
        return;
       }
       if(version!==this._generation||this.ensureAuth()?.currentUser?.uid!==user.uid)return;
       if(!confirmed||typeof confirmed!=='object'){
        this._clearProtectedSession('REVOKED');this._showLogin('Hồ sơ quyền đã bị thu hồi. Liên hệ ADMIN.',true);return;
       }
       const restored=this.normalizeProfile(confirmed,user);
       if(!this.hasSportAccess(restored)){await this.rejectSportAccess(restored);return}
       this.profile=restored;this._profileVerifiedUid=user.uid;this._lastProfileFingerprint=JSON.stringify(this._permissionFingerprint(restored));this._showApp();
      })();
      this._profileRevalidation=flight;
      try{return await flight}finally{if(this._profileRevalidation===flight)this._profileRevalidation=null}
     }
     const next=this.normalizeProfile(raw,user),fingerprint=JSON.stringify(this._permissionFingerprint(next));
     if(!this.hasSportAccess(next)){this.rejectSportAccess(next).catch(e=>console.warn('Permission revoked',e));return}
     if(fingerprint===this._lastProfileFingerprint)return;
     const prevRole=this.profile?.role,prevPermissions=JSON.stringify(this.profile?.permissions||{});
     this._lastProfileFingerprint=fingerprint;this.profile=next;
     try{
      T.App?.applyRole?.();
      if(prevRole!==next.role||prevPermissions!==JSON.stringify(next.permissions||{}))T.App?.subscribe?.();
      T.App?.renderAll?.();
     }catch(e){console.warn('Profile UI refresh deferred',e)}
    };
    ref.on('value',this.profileHandler,error=>console.warn('Profile realtime listener',error));
   }
   _permissionFingerprint(p){return {role:p?.role||'',active:p?.active,sport:this.sportScope(p),permissions:p?.permissions||{},displayName:p?.displayName||'',status:p?.status||''}}
   async retryProfile(){
    const user=this.ensureAuth()?.currentUser;
    if(!user||user.isAnonymous)throw new Error('Chưa có phiên Firebase. Vui lòng đăng nhập.');
    return this.verifyProfile(user);
   }
   async login(email,password){
    if(this._loginFlight)return this._loginFlight;
    const auth=this.ensureAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
    const promise=(async()=>{
     this.transition('AUTHENTICATING');
     try{window.TopkeyHubSession?.beginLogin?.();sessionStorage.removeItem(this.freshKey())}catch{}
     try{
      const p=window.firebase?.auth?.Auth?.Persistence?.LOCAL;
      if(p&&typeof auth.setPersistence==='function')await auth.setPersistence(p);
     }catch(e){console.warn('Firebase persistence fallback',e)}
     let credential;
     try{credential=await auth.signInWithEmailAndPassword(email,password)}
     catch(e){try{window.TopkeyHubSession?.loginFailed?.()}catch{}throw e}
     // Same-UID signInWithEmailAndPassword need not trigger onAuthStateChanged.
     // Explicitly coalesce the profile verification with the observer instead of
     // waiting for a callback that Firebase is not required to repeat.
     const user=credential?.user||auth.currentUser;
     if(!user)throw new Error('Firebase chưa trả về tài khoản hợp lệ.');
     if(this.user?.uid!==user.uid){this._generation++;this.detachProfile();this._profileVerifiedUid='';this.profile=null;this._appStartedUid='';this._publishedReadyUid=''}
     this.user=user;
     // A successful Firebase sign-in must not require a second password submission
     // just because the profile read raced connectivity restoration.
     this._suppressTransientLoginUI=true;
     try{
      try{await this.verifyProfile(user)}catch(firstError){
       const recoverable=/timeout|thời gian|network|disconnect|unavailable|connection|kết nối|phiên đã thay đổi/i.test(safeMessage(firstError));
       if(!recoverable||this.ensureAuth()?.currentUser?.uid!==user.uid)throw firstError;
       await pause(450);
       await this.verifyProfile(user);
      }
     }finally{this._suppressTransientLoginUI=false}
     return credential;
    })();
    this._loginFlight=promise;
    try{return await promise}finally{if(this._loginFlight===promise)this._loginFlight=null}
   }
   async logout(){
    this._clearProtectedSession();
    try{window.TopkeyHubSession?.markLoggedOut?.()}catch{}
    if(T.Data.auth)return T.Data.auth.signOut();
   }
   role(){return policy.normalizeRole(this.profile?.role)}
   can(tab){return policy.canTab(this.role(),tab)}
   async recoverProductionTournament(){
    try{
     const q=new URLSearchParams(location.search),id=q.get('tid')||'';
     const isTest=x=>String(x||'').startsWith('__testlab_');
     if(id||isTest(T.Data?.tid)||this.role()!=='ADMIN'||!T.Data?.db)return false;
     const current=String(T.Data.tid||'main_2026');
     const root=`${T.ROOT}/tournaments/`;
     const cfg=(await withTimeout(T.Data.db.ref(root+current+'/config').once('value'),4000,'Config timeout')).val();
     if(cfg)return false;
     const idx=(await withTimeout(T.Data.db.ref(`${authRoot()}/tournamentIndex/${sport()}`).once('value'),4000,'Index timeout')).val()||{};
     const rows=Object.values(idx).filter(x=>x&&x.tid&&!isTest(x.tid));
     rows.sort((a,b)=>(Number(b.status==='ACTIVE')-Number(a.status==='ACTIVE'))||((b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)));
     const checks=await Promise.all(rows.slice(0,10).map(async row=>{
      try{const cfg=(await withTimeout(T.Data.db.ref(root+row.tid+'/config').once('value'),4000,'Config timeout')).val();return cfg?String(row.tid):''}catch{return''}
     }));
     const found=checks.find(Boolean);
     if(!found||found===current||this._profileVerifiedUid!==this.user?.uid)return false;
     const k=sport()==='badminton'?'topkey_vnext_tid':'topkey_'+sport()+'_tid';
     try{localStorage.setItem(k,found);localStorage.setItem(sport()==='badminton'?'topkey_vnext_prod_tid':k+'_prod',found)}catch{}
     T.Data.tid=found;
     try{const u=new URL(location.href);u.searchParams.set('tid',found);u.searchParams.set('recovered','1');history.replaceState(history.state,'',u.href)}catch{}
     // Change of tournament must update subscriptions in place without reload.
     if(Array.isArray(T.App?.offs))for(const off of T.App.offs)try{off()}catch{}
     if(T.App)T.App.offs=[];
     T.App?.subscribe?.();
     // Reconnect only the visible tournament panel. Rendering every finance,
     // umpire, schedule and audit tab synchronously caused seconds of jank
     // immediately after the Firebase profile had been verified.
     const active=String(T.App?.currentTab||'overview');
     const renderActive=window.TopkeyCoreDataRuntime115?.renderTabFromCache;
     if(typeof renderActive==='function')renderActive(active);
     else if(active==='overview')T.App?.renderOverview?.();
     else T.App?.renderBranch?.(active==='schedule'?'matches':active);
     return true;
    }catch(e){console.warn('Non-blocking tournament recovery deferred',e);return false}
   }
   async bootstrapAdmin(email,password,name){
    const auth=this.ensureAuth();if(!auth)throw new Error('Firebase chưa sẵn sàng');
    const cred=await auth.createUserWithEmailAndPassword(email,password);
    const profile={uid:cred.user.uid,email,displayName:name||'Administrator',role:'ADMIN',active:true,createdAt:Date.now()};
    await T.Data.db.ref(`${authRoot()}/users/${cred.user.uid}`).set(profile);return profile;
   }
   async createUser(email,password,role,displayName){
    if(this.role()!=='ADMIN')throw new Error('Chỉ ADMIN mới được tạo tài khoản');
    const normalizedRole=String(role||'VIEWER').trim().toUpperCase();
    if(!Object.prototype.hasOwnProperty.call(T.ROLES||{},normalizedRole))throw new Error('Vai trò không hợp lệ');
    const name='secondary-'+Date.now(),app=firebase.initializeApp(T.FIREBASE_CONFIG,name);
    try{
     const auth=app.auth(),cred=await auth.createUserWithEmailAndPassword(email,password);
     const profile={uid:cred.user.uid,email,displayName,role:normalizedRole,active:true,createdAt:Date.now()};
     await T.Data.db.ref(`${authRoot()}/users/${cred.user.uid}`).set(profile);
     await auth.signOut();await T.Data.audit?.('USER_CREATED','user',cred.user.uid,null,{email,displayName,role:normalizedRole});
     return profile;
    }finally{await app.delete()}
   }
  }
  const service=new AuthService();
  const hookRetry=()=>{
   const retry=document.getElementById('auth-retry-profile');if(!retry||retry.dataset.topkeyBound)return;
   retry.dataset.topkeyBound='1';retry.addEventListener('click',async()=>{
    if(retry.disabled)return;retry.disabled=true;
    const text=retry.textContent;retry.textContent='Đang xác minh quyền…';
    try{await service.retryProfile()}catch(e){service._showLogin(safeMessage(e),true)}
    finally{retry.disabled=false;retry.textContent=text}
   });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hookRetry,{once:true});else hookRetry();
  return service;
 }
 window.TopkeySharedAuth=Object.freeze({create,blocked,contract:'TOPKEY_SHARED_AUTH_H118_001'});
})();
