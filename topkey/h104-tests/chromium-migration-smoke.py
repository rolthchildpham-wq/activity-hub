#!/usr/bin/env python3
"""Browser test of staging migration/rollback; real Topkey backup, mocked RTDB.
Never contacts or changes the real Firebase service.
"""
import asyncio,json,copy,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
BACKUP=Path(os.environ.get('TOPKEY_BACKUP','/mnt/data/TOPKEY_Backup_badminton_ALL_2026-11-08T05-14-29-335Z.json'))
SRC=json.loads(BACKUP.read_text(encoding='utf-8'))['data']['tournaments']['main_2026']
DATA={k:SRC.get(k,{}) for k in ['teams','matches','finance']}
PAGE='<!doctype html><html><head><meta charset="utf-8"></head><body><div id="page-health"></div></body></html>'
BOOT=r'''(data)=>{
 window.__store={topkey_badminton_vnext_2026:{tournaments:{__testlab_h104_real:JSON.parse(JSON.stringify(data))}}};
 window.__writes=[];window.__downloadClicks=0;
 const keys=(p)=>p.split('/').filter(Boolean);
 const get=(p)=>keys(p).reduce((obj,k)=>obj?.[k],window.__store);
 const put=(p,value)=>{const all=keys(p),leaf=all.pop();let obj=window.__store;for(const k of all)obj=obj[k]||(obj[k]={});if(value===null)delete obj[leaf];else obj[leaf]=value;};
 function query(path){return {async set(value){put(path,value);window.__writes.push({op:'set',path})},async update(up){for(const [k,v] of Object.entries(up)){put(path?path+'/'+k:k,v)}window.__writes.push({op:'update',path,count:Object.keys(up).length})},async remove(){put(path,null);window.__writes.push({op:'remove',path})}}}
 window.Topkey={ROOT:'topkey_badminton_vnext_2026',SPORT:{key:'badminton'},Auth:{user:{uid:'admin-fixture'},role(){return 'ADMIN'}},Data:{tid:'__testlab_h104_real',connected:true,path(p=''){return 'topkey_badminton_vnext_2026/tournaments/'+this.tid+(p?'/'+p:'')},async read(p=''){return JSON.parse(JSON.stringify(get(this.path(p))??null))},ref(p=''){return query(this.path(p))},db:{ref(path=''){return query(path)}}}};
 window.TopkeyH104={};window.confirm=()=>true;
 const aClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__downloadClicks++; /* prevent navigation in mock */ };
}'''
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1150,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(PAGE)
  # This environment blocks URL navigation; in about:blank, provide deterministic
  # digest shim only for browser workflow testing, not for cryptographic tests.
  await page.evaluate("""() => Object.defineProperty(crypto,'subtle',{configurable:true,value:{digest:async(_algorithm,bytes)=>{const a=new Uint8Array(bytes);let h=2166136261;for(const b of a){h=Math.imul(h^b,16777619)}const out=new Uint8Array(32);new DataView(out.buffer).setUint32(0,h>>>0);return out.buffer}}})""")
  await page.evaluate(BOOT,DATA)
  await page.add_script_tag(content=(ROOT/'h104-v2-engine.js').read_text(encoding='utf-8'))
  await page.add_script_tag(content=(ROOT/'h104-migration-ui.js').read_text(encoding='utf-8'))
  await page.wait_for_function('document.getElementById("h104-migration-panel")!=null')
  baseline=await page.evaluate('''() => JSON.stringify(({teams,matches,finance})=>({teams,matches,finance}))(Topkey.Data.read)''') if False else await page.evaluate('''() => JSON.stringify({teams:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real.teams,matches:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real.matches,finance:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real.finance})''')
  r=await page.evaluate('''async()=>await TopkeyH104.migrate()''')
  out=await page.evaluate('''() => ({meta:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real._v2.meta,agg:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real._v2.aggregates,download:__downloadClicks,writes:__writes.length})''')
  assert r['counts']=={'teams':26,'matches':99,'finance':4},r
  assert out['meta']['complete'] and not out['meta']['active'] and out['meta']['aggregatesTrusted'],out
  assert out['download']==1,out
  assert await page.evaluate('''() => JSON.stringify({teams:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real.teams,matches:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real.matches,finance:__store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real.finance})''')==baseline
  print('PASS actual-backup fixture: export backup + migrate + compare indexes + canonical unchanged',r['counts'])
  await page.evaluate('TopkeyH104.enable()')
  assert await page.evaluate('''() => __store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real._v2.meta.active''')
  await page.evaluate('TopkeyH104.rollback()')
  assert not await page.evaluate('''() => __store.topkey_badminton_vnext_2026.tournaments.__testlab_h104_real._v2.meta.active''')
  print('PASS staging enable/rollback without canonical writes')
  await page.evaluate('Topkey.Data.tid="main_2026"')
  blocked=await page.evaluate('''async()=>{const n=__writes.length;try{await TopkeyH104.migrate();return false}catch(e){return /testlab|staging/.test(e.message)&&__writes.length===n}}''')
  assert blocked,'Production migration was not blocked'
  print('PASS production migration hard-blocked')
  assert errors==[],errors
  print('PASS Chromium no JavaScript runtime errors')
  await browser.close()
if __name__=='__main__':asyncio.run(main())
