import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/mnt/data/h105work')
JS=(ROOT/'sports/badminton/upgrade122-hotfix80.js').read_text('utf8')
VENDOR=(ROOT/'vendor/pptxgen.bundle.js').read_text('utf8')
HTML='''<!doctype html><meta charset="utf-8"><form id="rules-form"><div class="field"><input id="cfg-location" value="Topkey"></div></form><button id="tk65-download-current">Export</button>'''
MOCK=r'''
window.__audit=[];window.__rows=[{id:'a',name:'First award',quantity:1,reward:'1.000.000 VND',note:'Per prize'}];window.__simulateConflict=false;
const snap=v=>({val:()=>JSON.parse(JSON.stringify(v))});
window.Topkey={SPORT:{key:SPORT,name:SPORT,mode:'sets'},AUTH_ROOT:'test-root',ROOT:'test-root',
 Auth:{role:()=>window.__role||'ADMIN',user:{uid:'admin-test'},profile:{role:'ADMIN'}},
 U:{toast:(...a)=>{window.__toast=a}},
 Data:{tid:'qa1',db:{ref:(p)=>({
   transaction:async fn=>{const x=fn(window.__rows);if(x===undefined)return {committed:false,snapshot:snap(window.__rows)};window.__rows=JSON.parse(JSON.stringify(x));return {committed:true,snapshot:snap(window.__rows)}},
   once:async()=>snap(window.__rows),
   set:async x=>{},
   child:(key)=>({once:async()=>snap('qa1'),set:async()=>{}})
 })},path:s=>'test-root/tournaments/qa1/'+s,audit:async(...xs)=>window.__audit.push(xs)}
};
window.Topkey.App={state:{config:{title:'Test',rulesLocked:true,prizeStructure:JSON.parse(JSON.stringify(window.__rows))},matches:{},teams:{},finance:{}},renderConfig(){},saveRules(){}};
window.TopkeyUpgrade9={archives:{},renderSettings(){},renderArchives(){}};
window.TopkeyUpgrade122Hotfix65={buildReport(){return {tid:'qa1',title:'Test report',sport:'test',sportName:SPORT,generatedAt:Date.now(),summary:{teams:2,matches:2,finished:2,participants:4,categories:1},top4:{},rankings:{},matches:[],finance:{rows:[],income:0,expense:0,balance:0},prizeStructure:JSON.parse(JSON.stringify(window.Topkey.App.state.config.prizeStructure))}}};
'''
async def run_one(browser,sport):
 p=await browser.new_page(viewport={'width':1420,'height':900},accept_downloads=True)
 errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 await p.set_content(HTML)
 await p.add_script_tag(content='const SPORT='+json.dumps(sport)+';'+MOCK)
 await p.add_script_tag(content=JS)
 await p.wait_for_timeout(1700)
 assert await p.locator('#tk105-prize-save').count()==1
 assert await p.locator('#tk105-prize-save').is_visible()
 await p.locator('.tk79-p-name').first.fill('Custom gold')
 await p.locator('#tk105-prize-save').click()
 await p.wait_for_function("window.__rows[0].name === 'Custom gold'")
 assert await p.evaluate('window.__audit.length')>=1
 # Optimistic concurrency: a second client changing prizes must abort this edit.
 await p.locator('.tk79-p-name').first.fill('Should not overwrite')
 await p.evaluate("window.__rows[0].name='Remote edit'")
 await p.locator('#tk105-prize-save').click()
 await p.wait_for_function("window.__toast && window.__toast[1] === 'err'")
 assert await p.evaluate('window.__rows[0].name')=='Remote edit'
 await p.evaluate("window.__role='VIEWER'")
 await p.locator('#tk105-prize-save').click()
 assert await p.evaluate('window.__rows[0].name')=='Remote edit'
 await p.evaluate("window.__role='ADMIN'")
 
 assert await p.evaluate('window.Topkey.App.state.config.rulesLocked') is True
 await p.evaluate('window.TopkeyUpgrade122Hotfix79.openExport(window.TopkeyUpgrade122Hotfix65.buildReport())')
 assert await p.locator('.tk105-ppt-item').count()==9
 assert await p.locator('.tk105-section-files').count()==9
 assert await p.locator('#tk105-ppt-template').count()==1
 assert await p.locator('.tk105-ppt-item').count()==9
 assert await p.locator('.tk105-body').count()==9
 await p.locator('.tk105-ppt-item[data-key="summary"] .tk105-edit').check()
 await p.locator('.tk105-ppt-item[data-key="summary"] .tk105-body').fill('Editable summary text. This is the customized body.')
 await p.locator('#tk79-lang').select_option('vi-zh')
 assert await p.locator('.tk105-ppt-item[data-key="summary"] .tk105-body').input_value()=='Editable summary text. This is the customized body.'
 content=await p.evaluate('window.TopkeyUpgrade122Hotfix79.reportHtml(window.TopkeyUpgrade122Hotfix65.buildReport())')
 assert 'Custom gold' in content
 if sport=='badminton':
  await p.locator('.tk105-ppt-item[data-key="prizes"] .tk105-section-files').set_input_files(str(ROOT/'h105-tests/fixture-photo.png'))
  await p.wait_for_function('document.querySelectorAll("#tk79-images .tk79-row").length===1')
  assert await p.locator('#tk79-images .tk79-pos').input_value()=='prizes'
 await p.add_script_tag(content=VENDOR)
 await p.evaluate('''() => {const P=window.PptxGenJS||window.pptxgenjs; P.prototype.writeFile=async function(opt){window.__generated={file:opt.fileName,count:this._slides.length,slides:this._slides}}}''')
 await p.locator('#tk79-ppt').click()
 
 try: await p.wait_for_function('window.__generated && window.__generated.count >= 5',timeout=7000)
 except Exception:
  print('DEBUG',sport,await p.evaluate('({status:document.getElementById("tk79-status")?.textContent,toast:window.__toast,hasVendor:typeof window.PptxGenJS,hasPptx:typeof window.pptxgenjs})'),errors);raise
 meta=await p.evaluate('({count:window.__generated.count,file:window.__generated.file,note:window.__generated.slides.some(sl=>JSON.stringify(sl._slideObjects||[]).includes("Editable summary text"))})')
 assert meta['count']>=6 and meta['note'],meta
 assert not errors,errors
 await p.close()
 return dict(sport=sport,prize_saved=True,report_contains_prize=True,config_locked=True,slide_count=meta['count'],js_errors=errors)

async def main():
 async with async_playwright() as ap:
  browser=await ap.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  results=[]
  for sport in ['badminton','football','volleyball','running','handmade','shuttle','cooking']:
   results.append(await run_one(browser,sport))
  await browser.close()
  out=ROOT/'H105_UI_AND_PPT_RUNTIME_TEST.json'
  out.write_text(json.dumps(results,indent=2,ensure_ascii=False),'utf8')
  print(json.dumps(results,indent=2,ensure_ascii=False))
if __name__=='__main__':asyncio.run(main())
