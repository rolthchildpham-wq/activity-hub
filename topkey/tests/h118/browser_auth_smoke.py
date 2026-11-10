"""Browser smoke for shared auth, with deterministic Firebase mock (not production login)."""
import json, pathlib, threading, time
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[2]
TAG=json.loads((ROOT/'release.json').read_text(encoding='utf-8'))['cacheTag']
MOCK=r'''(()=>{
 const role={uid:'u-admin',email:'admin@example.invalid',displayName:'Admin',role:'ADMIN',active:true};
 const user={uid:'u-admin',email:'admin@example.invalid',isAnonymous:false};
 const failOnce=new URL(location.href).searchParams.has('failOnce');
 let failNext=failOnce;
 const statistics=window.__authSmoke={signIn:0,signOut:0,profileReads:0,profileWatches:0,appReadyEvents:0};
 window.addEventListener('topkey:admin-ready',e=>{statistics.appReadyEvents++;statistics.lastReady=e.detail||null;});
 const s=v=>({val:()=>v,exists:()=>v!=null,key:'',forEach:fn=>{if(v&&typeof v==='object')for(const [k,x] of Object.entries(v))fn({...s(x),key:k});return false}});
 const fakeValue=p=>{if(/\/users\/u-admin$/.test(p))return role;if(/\/config$/.test(p))return{title:'Smoke tournament',rules:{}};if(/\/tournamentIndex\//.test(p))return{};if(p==='.info/connected')return true;return{}};
 const ref=p=>{
  const obj={key:String(p).split('/').pop(),
   once:async()=>{if(/\/users\/u-admin$/.test(p)){statistics.profileReads++;if(failNext){failNext=false;throw new Error('simulated transient profile read failure')}}return s(fakeValue(String(p)))},
   on:(event,fn)=>{if(/\/users\/u-admin$/.test(p))statistics.profileWatches++;queueMicrotask(()=>fn(s(fakeValue(String(p)))));return fn},
   off:()=>{},child:k=>ref(p+'/'+k),set:async()=>{},update:async()=>{},remove:async()=>{},
   push:()=>({key:'one',set:async()=>{}}),transaction:async fn=>({committed:true,snapshot:s(fn(fakeValue(String(p))))}),
   limitToFirst:()=>obj,limitToLast:()=>obj,orderByChild:()=>obj,orderByKey:()=>obj,
   startAt:()=>obj,endAt:()=>obj,equalTo:()=>obj};return obj;
 };
 const auth={currentUser:user,
  onAuthStateChanged(fn){queueMicrotask(()=>fn(this.currentUser));return()=>{}},
  async signInWithEmailAndPassword(email,password){statistics.signIn++;if(password!=='validPassword')throw new Error('Invalid password');this.currentUser=user;/* no second auth callback (Firebase same-UID case) */return{user}},
  async signOut(){statistics.signOut++;this.currentUser=null},
  async setPersistence(){},
  async createUserWithEmailAndPassword(){return{user}}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'local'}};
 const database={ref};const storage={ref:()=>({put:async()=>({ref:{getDownloadURL:async()=>''}}),getDownloadURL:async()=>''})};
 const app={auth:()=>auth,database:()=>database,storage:()=>storage,delete:async()=>{}};
 window.firebase={apps:[app],app:()=>app,initializeApp:()=>app,auth:authFn,database:()=>database,storage:()=>storage};
 const p=new URL(location.href),sport=p.searchParams.get('sport')||'badminton',ticket=p.searchParams.get('hubTicket')||'auth-h118';
 sessionStorage.setItem('topkey_hub_session_v86',JSON.stringify({sport,nonce:ticket,phase:'SELECTED',authUid:'',createdAt:Date.now(),touchedAt:Date.now(),loginStartedAt:0,build:p.searchParams.get('v')}));
 sessionStorage.setItem('topkey_hub_sport_ticket',JSON.stringify({sport,nonce:ticket,at:Date.now(),build:p.searchParams.get('v')}));
})();'''

class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
 thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
 base='http://127.0.0.1:'+str(server.server_address[1])
 results=[]
 try:
  with sync_playwright() as pl:
   browser=pl.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   for sport,path in [('badminton','sports/badminton/index.html'),('volleyball','sports/vnext/index.html'),('football','sports/vnext/index.html')]:
    for mode in ['restored','retry-same-uid']:
     ctx=browser.new_context(viewport={'width':1280,'height':860},service_workers='block')
     ctx.add_init_script(MOCK)
     ctx.route('https://**/*',lambda route: route.fulfill(status=200,content_type='application/javascript',body='/* firebase sdk mock is already installed */'))
     page=ctx.new_page()
     errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
     route=f'{base}/{path}?entry=hub&hubTicket=auth-h118&sport={sport}&v={TAG}&__topkey_build={TAG}&tid=__testlab_h118'
     if mode=='retry-same-uid':route+='&failOnce=1'
     t0=time.monotonic();page.goto(route,wait_until='domcontentloaded',timeout=22000)
     if mode=='retry-same-uid':
      page.locator('#auth-retry-profile:not([hidden])').wait_for(state='visible',timeout=12000)
      # Explicit retry with the existing Firebase user; no password or page reload.
      page.locator('#auth-retry-profile').click()
     page.locator('#app-shell:not(.hidden)').wait_for(state='visible',timeout=15000)
     elapsed=round((time.monotonic()-t0)*1000)
     stats=page.evaluate('window.__authSmoke')
     assert stats['signOut']==0,(sport,mode,stats)
     assert stats['profileReads']==(2 if mode=='retry-same-uid' else 1),(sport,mode,stats)
     assert stats['appReadyEvents']==1,(sport,mode,stats)
     assert stats['lastReady']['verified'] is True,(sport,mode,stats)
     # No unexpected navigations to the login Hub.
     assert '/index.html' in page.url and '/sports/' in page.url,page.url
     results.append({'sport':sport,'mode':mode,'elapsedMs':elapsed,'stats':stats,'errors':errors[:8]})
     page.close();ctx.close()
   browser.close()
 finally:server.shutdown();server.server_close()
 report={'release':TAG,'context':'local Chromium + fake Firebase, NOT a production authentication test','cases':results,'pass':True}
 out=ROOT/'tests/h118/BROWSER_AUTH_SMOKE.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('BROWSER_AUTH_SMOKE',json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
