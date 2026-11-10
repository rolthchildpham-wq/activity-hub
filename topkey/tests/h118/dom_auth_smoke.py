"""Headless Chromium DOM interaction with mock Firebase (no network or live credentials)."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
SHARED=(ROOT/'topkey-shared-auth.js').read_text(encoding='utf8')
ADAPTER=(ROOT/'sports/badminton/src/auth.js').read_text(encoding='utf8')
MOCK=r'''(()=>{
 window.__smoke={reads:0,ready:0,signOuts:0,afterLogin:0,replace:0};
 let failure=true;
 const u={uid:'alice',email:'alice@example.invalid',isAnonymous:false};
 const profile={role:'BTC',sportScope:'badminton',active:true,displayName:'BTC'};
 const db={ref(path){return {once:async()=>{if(path.endsWith('/users/alice')){window.__smoke.reads++;if(failure){failure=false;throw Error('temporary database issue')}return {val:()=>profile}}return{val:()=>({title:'Demo'})}},on(){},off(){}}}};
 const auth={currentUser:u,onAuthStateChanged(fn){Promise.resolve().then(()=>fn(u));return()=>{}},async signInWithEmailAndPassword(){return{user:u}},async signOut(){window.__smoke.signOuts++;this.currentUser=null}};
 window.Topkey={ROOT:'topkey_badminton_vnext_2026',AUTH_ROOT:'topkey_badminton_vnext_2026',SPORT:{key:'badminton',name:'Cầu lông'},ROLES:{ADMIN:['overview'],BTC:['overview'],VIEWER:['overview']},U:{toast(){}},Data:{auth,db,tid:'__testlab_h118'},App:{offs:[],afterLogin(){window.__smoke.afterLogin++},applyRole(){},renderAll(){},subscribe(){}}};
 window.TopkeyHubSession={adoptFirebaseUser(){},markAuthenticated(){},normalizeSportScope:p=>p.sportScope||''};
 window.addEventListener('topkey:admin-ready',()=>window.__smoke.ready++);
})();'''

def main():
 report=[]
 with sync_playwright() as pl:
  browser=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context()
  page=context.new_page()
  page.set_content('''<!doctype html><html><body><div id="login-screen"><form id="login-form"><button type="button" id="auth-retry-profile" class="hidden" hidden>Thử kiểm tra quyền</button><p id="topkey-auth-hint"></p></form></div><div id="app-shell" class="hidden">App ready</div></body></html>''')
  page.add_script_tag(content=MOCK)
  page.add_script_tag(content=SHARED)
  page.add_script_tag(content=ADAPTER)
  page.evaluate('window.Topkey.Auth.init()')
  page.locator('#auth-retry-profile').wait_for(state='visible')
  stats=page.evaluate('window.__smoke')
  assert stats['reads']==1 and stats['ready']==0 and stats['signOuts']==0,stats
  report.append('Denied first failed profile verification, shows retry without logout')
  page.locator('#auth-retry-profile').click()
  page.locator('#app-shell:not(.hidden)').wait_for(state='visible')
  stats=page.evaluate('window.__smoke')
  assert stats['reads']==2 and stats['ready']==1 and stats['afterLogin']==1 and stats['signOuts']==0,stats
  report.append('Retry click verifies cached Firebase identity, opens protected app exactly once')
  page.evaluate('window.Topkey.Auth._h108HandleState(window.Topkey.Data.auth.currentUser)')
  stats=page.evaluate('window.__smoke')
  assert stats['reads']==2 and stats['ready']==1,stats
  report.append('Repeated observer callback does not re-read or reload')
  browser.close()
 path=ROOT/'tests/h118/DOM_AUTH_SMOKE_RESULTS.json'
 path.write_text(json.dumps({'pass':True,'cases':report,'context':'Chromium DOM with mocked Firebase; no production deployment'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('DOM_AUTH_SMOKE PASS',len(report),'cases',json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
