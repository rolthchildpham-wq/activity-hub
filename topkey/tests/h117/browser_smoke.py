from playwright.sync_api import sync_playwright
import json, pathlib
root=pathlib.Path(__file__).resolve().parents[2]
JS=r'''(()=>{const copy=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
const STORE={};const ROOT='topkey_badminton_vnext_2026';
STORE[ROOT+'/users/admin']={role:'ADMIN',displayName:'Admin Test'};
STORE[ROOT+'/clubPlan']={info:{title:'Badminton plan',location:'Hall One'},schedule:[{id:'registration',label:{vi:'Đăng ký',en:'Registration',zh:'报名'},endDate:'2026-11-01'}],budget:{income:[{code:'A',amount:500}],expense:[]},tasks:[],updatedAt:1000,updatedBy:'seed'};
let watchers={};
window.__testStore=STORE;
window.__testStats={read:[],watch:[],transactions:[]};
window.__testUpdate=(path,data)=>{STORE[path]=copy(data);(watchers[path]||[]).forEach(cb=>cb({val:()=>copy(STORE[path])}));};
const db={ref(path){return {
 once:async()=>{window.__testStats.read.push(path);return{val:()=>copy(STORE[path])}},
 transaction:async fn=>{const next=fn(copy(STORE[path]));if(next===undefined)return{committed:false,snapshot:{val:()=>copy(STORE[path])}};STORE[path]=copy(next);window.__testStats.transactions.push(path);(watchers[path]||[]).forEach(cb=>cb({val:()=>copy(STORE[path])}));return{committed:true,snapshot:{val:()=>copy(next)}}},
 on:(event,cb)=>{window.__testStats.watch.push(path);(watchers[path]??=[]).push(cb);Promise.resolve().then(()=>cb({val:()=>copy(STORE[path])}));},
 off:(event,cb)=>{watchers[path]=(watchers[path]||[]).filter(f=>f!==cb)}
}}};
window.TopkeyRelease={version:'2026.11.09-H117',cacheTag:'u122h117-20261109'};
window.firebase={auth:()=>({onAuthStateChanged:cb=>{Promise.resolve().then(()=>cb({uid:'admin'}));return()=>{}}}),database:()=>db};
})();'''
with sync_playwright() as pl:
 b=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':920})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<html><body><section id="executive-dashboard"></section><section id="club-plan-admin"></section></body></html>')
 page.add_style_tag(path=str(root/'styles.css'))
 page.add_style_tag(path=str(root/'club-planning.css'))
 page.add_script_tag(content=JS)
 page.add_script_tag(path=str(root/'club-planning.js'))
 page.locator('#club-plan-save').wait_for(timeout=5000)
 print('OPEN',page.locator('#club-plan-editor-body').inner_text()[:70])
 # After all 7 listeners report, calendar should show 500 VND budget and plan.
 page.wait_for_function('window.__testStats.watch.length===7')
 title=page.locator('#club-plan-editor-body [data-field="info.title"]')
 title.fill('Badminton plan 2026')
 page.locator('#club-plan-save').click()
 page.wait_for_function('window.__testStore["topkey_badminton_vnext_2026/clubPlan"].info.title==="Badminton plan 2026"')
 print('SAVE_TEXT',page.locator('#club-plan-msg').inner_text())
 print('STORE_TITLE',page.evaluate('window.__testStore["topkey_badminton_vnext_2026/clubPlan"].info.title'))
 # Verify another session updates title on same root and UI refreshes without reload
 page.evaluate('''()=>{const k='topkey_badminton_vnext_2026/clubPlan',x=structuredClone(window.__testStore[k]);x.info.title='Badminton remote update';x.updatedAt+=1000;window.__testUpdate(k,x)}''')
 page.wait_for_function('document.querySelector("#club-plan-editor-body [data-field=\\"info.title\\"]")?.value === "Badminton remote update"')
 print('REMOTE_REFRESH','PASS')
 print('LISTENERS',page.evaluate('window.__testStats.watch.length'))
 page.screenshot(path=str(root/'tests/h117/H117_club_plan_browser_smoke.png'),full_page=True)
 print('JS_ERRORS',errors)
 assert not errors,errors
 b.close()
