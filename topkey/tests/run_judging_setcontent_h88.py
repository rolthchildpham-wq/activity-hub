from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/h88_work')
src=(root/'sports/vnext/src/upgrade122-hotfix88-judging.js').read_text(encoding='utf-8')
# Test harness only: allow explicitly calling startPublic() on about:blank without relying on hash navigation.
src_test=src.replace("if(location.hash!=='#judge'||state.publicStarted)return;", "if(state.publicStarted)return;").replace("const token=new URLSearchParams(location.search).get('judge')||''", "const token='tok88'").replace('localStorage.', 'window.__ls.')
start_sha=src_test.index('async function sha256(s){')
end_sha=src_test.index('\nfunction judgingUrl',start_sha)
src_test=src_test[:start_sha]+"async function sha256(s){return 'hash_'+String(s).replace(/[^a-z0-9]/gi,'_')}"+src_test[end_sha:]
base_html='''<!doctype html><html><head><meta charset="utf-8"><style>.hidden{display:none}.card{padding:10px}.field{margin:6px}.btn{padding:4px}.table-wrap{overflow:auto}</style></head><body><section id="login-screen"></section><main id="app-shell"></main><section id="public-spectator"></section><section id="public-register"></section><div id="page-settings"></div></body></html>'''

def harness_script(mode='PUBLIC_DEVICE'):
    return f'''
    const DB={{}};
    function snap(v){{return {{val:()=>v}}}}
    const cfg={{judging:{{enabled:true,mode:{mode!r},title:'Chấm điểm thử',token:'tok88',criteria:[{{id:'skill',label:'Kỹ năng',weight:60}},{{id:'beauty',label:'Đẹp',weight:40}}]}}}};
    const teams={{a:{{id:'a',name:'Đội Alpha'}},b:{{id:'b',name:'Đội Beta'}}}};
    const ref=(p)=>({{
      once:async()=>{{if(p.endsWith('/config'))return snap(cfg);if(p.endsWith('/teams'))return snap(teams);if(p.includes('judgeAccessCodes/'))return snap({{active:true}});return snap(null)}},
      set:async(v)=>{{if(DB[p]){{const e=new Error('PERMISSION_DENIED');throw e}}DB[p]=v;return true}},
      on:(ev,cb)=>cb(snap({{}})),off:()=>{{}},remove:async()=>{{}}
    }});
    const __lsm={{}}; window.__ls={{getItem:k=>(k in __lsm?__lsm[k]:null),setItem:(k,v)=>{{__lsm[k]=String(v)}},removeItem:k=>delete __lsm[k]}};
    window.QRCode=function(el,o){{el.dataset.qr=o.text;el.textContent='QR'}};
    window.confirm=()=>true;
    window.Topkey={{
      SPORT:{{key:'cooking',name:'Nấu ăn',rubric:[]}},
      U:{{toast:()=>{{}}}},
      Auth:{{user:{{uid:'admin'}}}},
      Data:{{tid:'T88',db:{{ref}},path:(x='')=>'sports/cooking/tournaments/T88'+(x?'/'+x:'') ,queueSet:async(path,v)=>{{DB[path]=v}}}},
      App:{{state:{{config:cfg,teams}},handlePublicHash:()=>{{}},afterLogin:async()=>{{}},renderConfig:()=>{{}},renderTeams:()=>{{}}}}
    }};
    window.__DB=DB;
    '''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page()
    page.set_content(base_html)
    page.add_script_tag(content=harness_script('PUBLIC_DEVICE'))
    page.add_script_tag(content=src_test)
    assert page.locator('#tk88-judge-admin').count()==1, 'admin judging card missing'
    assert '100%' in page.locator('#tk88j-weight-total').inner_text(), 'weights not 100'
    page.evaluate("TopkeyH88Judging.startPublic()")
    page.wait_for_timeout(150)
    assert page.locator('#public-judge').count()==1
    assert not page.locator('#public-judge').evaluate("e=>e.classList.contains('hidden')")
    assert page.locator('#tk88j-public-form').is_visible(), 'public form not visible'
    assert page.locator('#tk88j-public-team option').count()==3
    page.select_option('#tk88j-public-team','a')
    nums=page.locator('.tk88j-score-number')
    nums.nth(0).fill('8'); nums.nth(1).fill('9')
    page.locator('#tk88j-public-form').evaluate("f=>f.requestSubmit()")
    page.wait_for_timeout(100)
    status=page.locator('#tk88j-public-status').inner_text()
    assert 'Đã ghi nhận' in status, status
    assert page.locator('#tk88j-public-form button[type=submit]').is_disabled(), 'public submit should lock after one vote'
    db=page.evaluate('window.__DB')
    assert any('/judgingVotes/public/' in k for k in db), db
    print('PASS public device one-vote flow')

    # Judge-code mode: code unlocks form and one code can score a team once.
    page2=browser.new_page(); page2.set_content(base_html)
    page2.add_script_tag(content=harness_script('JUDGE_CODE'))
    page2.add_script_tag(content=src_test)
    page2.evaluate("TopkeyH88Judging.startPublic()")
    page2.wait_for_timeout(100)
    assert page2.locator('#tk88j-code-wrap').is_visible(), 'judge code form missing'
    page2.fill('#tk88j-public-code','12345678')
    page2.click('#tk88j-code-login'); page2.wait_for_timeout(100)
    assert page2.locator('#tk88j-public-form').is_visible(), 'judge form not unlocked'
    page2.select_option('#tk88j-public-team','a')
    nums=page2.locator('.tk88j-score-number'); nums.nth(0).fill('10'); nums.nth(1).fill('8')
    page2.locator('#tk88j-public-form').evaluate("f=>f.requestSubmit()")
    page2.wait_for_timeout(100)
    txt=page2.locator('#tk88j-public-status').inner_text()
    assert 'Đã lưu điểm' in txt, txt
    opt=page2.locator('#tk88j-public-team option[value=a]')
    assert opt.is_disabled(), 'scored team should be disabled for same code'
    print('PASS judge-code team-once flow')
    browser.close()
print('JUDGING_BROWSER_H88_OK')
