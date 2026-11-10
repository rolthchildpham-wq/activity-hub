(() => {
  'use strict'; const T=window.Topkey, U=T.U;
  const cleanFirebase=v=>{if(v===undefined)return undefined;if(v===null||typeof v==='string'||typeof v==='boolean')return v;if(typeof v==='number')return Number.isFinite(v)?v:null;if(Array.isArray(v))return v.map(x=>{const c=cleanFirebase(x);return c===undefined?null:c});if(typeof v==='object'){const o={};for(const [k,x] of Object.entries(v)){const c=cleanFirebase(x);if(c!==undefined)o[k]=c}return o}return String(v)};
  const errorText=e=>String(e?.code||e?.message||e||'Firebase error');
  const isPermissionDenied=e=>/permission[_ -]?denied|PERMISSION_DENIED/i.test(errorText(e));
  const isPublicQueueItem=item=>String(item?.meta?.type||'')==='PUBLIC_REGISTRATION';
  class DataService{
    constructor(){ this.ready=false; this.online=navigator.onLine; this.connected=false; this.app=null; this.db=null; this.auth=null; this.storage=null; const urlTid=new URLSearchParams(location.search).get('tid'),isTestTid=v=>String(v||'').startsWith('__testlab_'); let savedTid=localStorage.getItem('topkey_vnext_tid')||'',prodBackup=localStorage.getItem('topkey_vnext_prod_tid')||''; if(isTestTid(savedTid)){localStorage.removeItem('topkey_vnext_tid');savedTid='';} if(isTestTid(prodBackup)){localStorage.removeItem('topkey_vnext_prod_tid');prodBackup='';} this.tid=urlTid||savedTid||prodBackup||'main_2026'; if(urlTid&&!isTestTid(urlTid)){localStorage.setItem('topkey_vnext_tid',urlTid);localStorage.setItem('topkey_vnext_prod_tid',urlTid);} else if(savedTid&&!isTestTid(savedTid))localStorage.setItem('topkey_vnext_prod_tid',savedTid); this.listeners=[]; this.pending=0; this.blocked=0; this.lastQueueError=''; this._initPromise=null; this._networkBound=false; this._connectionBound=false; }
    path(s=''){ return `${T.ROOT}/tournaments/${this.tid}${s?'/'+s.replace(/^\//,''):''}`; }
    ensureFirebase(){
      if(this.auth&&this.db){this.ready=true;return this;}
      if(typeof firebase==='undefined'||!firebase?.initializeApp||!firebase?.auth||!firebase?.database)throw new Error('Firebase SDK chưa sẵn sàng');
      if(!firebase.apps.length)firebase.initializeApp(T.FIREBASE_CONFIG);
      this.app=firebase.app(); this.db=firebase.database(); this.auth=firebase.auth(); this.storage=typeof firebase.storage==='function'?firebase.storage():null; this.ready=!!(this.db&&this.auth);
      if(this.db&&!this._connectionBound){this._connectionBound=true;this.db.ref('.info/connected').on('value',snap=>{this.connected=!!snap.val();this.online=this.connected;T.App?.renderHealth?.();if(this.connected)this.flushQueue({source:'connection'}).catch(e=>console.warn('Queue flush connection',e));});}
      return this;
    }
    async init(){
      if(this._initPromise)return this._initPromise;
      this._initPromise=(async()=>{
        try{this.ensureFirebase()}catch(e){console.warn('Firebase unavailable',e);this.ready=false;}
        if(!this._networkBound){this._networkBound=true;addEventListener('online',()=>{this.online=true;this.flushQueue({source:'online'}).catch(e=>console.warn('Queue flush online',e));T.App?.renderHealth?.()});addEventListener('offline',()=>{this.online=false;T.App?.renderHealth?.()});}
        try{await this.refreshQueueStats()}catch(e){console.warn('Offline queue unavailable during boot; continuing without blocking login',e);this.pending=0;this.blocked=0}
        if(this.auth?.currentUser)this.flushQueue({source:'init-authenticated',silent:true}).catch(e=>console.warn('Initial queue flush deferred',e));
        return this;
      })();
      try{return await this._initPromise}finally{if(!this.ready)this._initPromise=null}
    }
    ref(p=''){ return this.db?.ref(this.path(p)); }
    async read(p=''){ if(!this.ready)return null; const s=await this.ref(p).once('value'); return s.val(); }
    listen(p,cb,event='value'){ if(!this.ready)return()=>{}; const r=this.ref(p); const f=s=>cb(s.val(),s.key); r.on(event,f); const off=()=>{r.off(event,f);const i=this.listeners.indexOf(off);if(i>=0)this.listeners.splice(i,1)}; this.listeners.push(off); return off; }
    listenGlobal(p,cb,event='value'){ if(!this.ready)return()=>{}; const r=this.db.ref(`${T.ROOT}/${String(p).replace(/^\//,'')}`); const f=s=>cb(s.val(),s.key); r.on(event,f); const off=()=>{r.off(event,f);const i=this.listeners.indexOf(off);if(i>=0)this.listeners.splice(i,1)}; this.listeners.push(off); return off; }
    async refreshQueueStats(){
      const items=await T.idb.all('queue');
      this.blocked=items.filter(x=>x?.status==='BLOCKED').length;
      this.pending=items.filter(x=>x?.status!=='BLOCKED').length;
      T.App?.renderHealth();
      return {pending:this.pending,blocked:this.blocked,total:items.length};
    }
    async queueMulti(updates, meta={}){
      const id=meta.eventId||U.id('q'); updates=cleanFirebase(updates)||{}; const item={id,updates,meta:cleanFirebase(meta)||{},createdAt:Date.now(),attempts:0,status:'PENDING'};
      await T.idb.put('queue',item); await this.refreshQueueStats();
      if(this.connected){
        await this.flushQueue({source:'action',focusId:id});
        const pending=await T.idb.get('queue',id);
        if(pending?.status==='ERROR'||pending?.status==='BLOCKED') throw new Error(pending.lastError||'Firebase không ghi được dữ liệu');
      }
      return item;
    }
    async queueSet(p,value,meta={}){ return this.queueMulti({[this.path(p)]:value},meta); }
    async flushQueue({source='auto',focusId='',retryBlocked=false,silent=false}={}){
      if(!this.ready||!this.connected)return {synced:[],failed:[],blocked:[],deferred:[]};
      const items=(await T.idb.all('queue')).sort((a,b)=>a.createdAt-b.createdAt);
      const report={synced:[],failed:[],blocked:[],deferred:[]};
      let firstNewError=null;
      for(const item of items){
        if(item?.status==='BLOCKED'&&!retryBlocked){report.blocked.push(item.id);continue}
        // Firebase restores Auth asynchronously. Never convert that short unauthenticated
        // window into a permanent permission error for protected tournament writes.
        if(!this.auth?.currentUser&&!isPublicQueueItem(item)){report.deferred.push(item.id);continue}
        try{
          const normalized=cleanFirebase(item.updates||{})||{};
          await this.db.ref().update(normalized);
          await T.idb.del('queue',item.id); report.synced.push(item.id);
        }catch(e){
          item.attempts=(item.attempts||0)+1; item.lastError=errorText(e); item.lastAttemptAt=Date.now();
          const denied=isPermissionDenied(e);
          // A real permission denial while authenticated is not a transient network error.
          // Park it so it cannot be retried on every score/start action and poison their UX.
          item.status=denied&&this.auth?.currentUser?'BLOCKED':'ERROR';
          if(item.status==='BLOCKED')item.blockedAt=Date.now();
          await T.idb.put('queue',item);
          (item.status==='BLOCKED'?report.blocked:report.failed).push(item.id);
          firstNewError=firstNewError||item.lastError;
          console.error('Firebase queue write failed',item.meta||{},e);
        }
      }
      await this.refreshQueueStats();
      this.lastQueueError=firstNewError||this.lastQueueError;
      if(firstNewError&&!silent){
        const focused=focusId&&[...report.failed,...report.blocked].includes(focusId);
        if(focused) U.toast('Firebase từ chối thao tác hiện tại: '+firstNewError,'err');
        else if(source==='manual') U.toast('Firebase còn thay đổi chưa ghi được: '+firstNewError,'err');
      }
      return report;
    }
    async retryBlocked(){
      const items=await T.idb.all('queue');
      for(const item of items){if(item?.status==='BLOCKED'){item.status='PENDING';delete item.blockedAt;await T.idb.put('queue',item)}}
      await this.refreshQueueStats();
      return this.flushQueue({source:'manual',retryBlocked:true});
    }
    async removeQueuedWhere(predicate){
      const items=await T.idb.all('queue');let removed=0;
      for(const item of items){if(predicate(item)){await T.idb.del('queue',item.id);removed++}}
      await this.refreshQueueStats();return removed;
    }
    async audit(action,entityType,entityId,before=null,after=null){
      const id=U.id('audit'); const uid=T.Auth?.user?.uid||'local'; const row={id,action,entityType,entityId,uid,actor:T.Auth?.profile?.displayName||T.Auth?.profile?.username||'local',before,after,clientAt:Date.now()};
      return this.queueSet(`audit/${id}`,row,{eventId:id,type:'AUDIT'});
    }
    async uploadReceipt(file,id){ if(!this.storage||!file)return null; const ext=(file.name.split('.').pop()||'bin').toLowerCase(); const uid=T.Auth?.user?.uid||'unknown'; const path=`${T.ROOT}/${this.tid}/receipts/${uid}/${id}.${ext}`; const snap=await this.storage.ref(path).put(file); return await snap.ref.getDownloadURL(); }
  }
  const shell=T.Data,data=new DataService();
  if(shell?.__platformShell){data.app=shell.app;data.db=shell.db;data.auth=shell.auth;data.ready=!!(data.db&&data.auth);data.tid=shell.tid||data.tid;}
  T.Data=data;
})();
