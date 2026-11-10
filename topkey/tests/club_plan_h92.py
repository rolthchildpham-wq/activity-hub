from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
src=(ROOT/'club-planning.js').read_text(encoding='utf-8')
html='''<!doctype html><html><body><main class="wrap"><section id="executive-dashboard"></section><section class="cards"></section><section id="password-change-launch"></section></main></body></html>'''

def harness(role='ADMIN',scope='badminton'):
    return f'''
    const STORE={{}};
    const LS={{topkey_ui_language_v1:'vi'}}; Object.defineProperty(window,'localStorage',{{value:{{getItem:k=>LS[k]||null,setItem:(k,v)=>LS[k]=String(v)}},configurable:true}}); window.__setLang=(l)=>{{LS.topkey_ui_language_v1=l;window.dispatchEvent(new CustomEvent('topkey:languagechange',{{detail:{{language:l}}}}))}};
    const profile={{role:{role!r},sportScope:{scope!r}}};
    function snap(v){{return {{val:()=>v}}}}
    function ref(path){{return {{
      once: async()=>{{if(path==='topkey_badminton_vnext_2026/users/u1')return snap(profile);if(path.endsWith('/clubPlan'))return snap(STORE[path]||null);return snap(null)}},
      set: async(v)=>{{STORE[path]=JSON.parse(JSON.stringify(v));return true}}
    }}}}
    const auth={{currentUser:{{uid:'u1'}},onAuthStateChanged:cb=>setTimeout(()=>cb({{uid:'u1'}}),0)}};
    window.firebase={{auth:()=>auth,database:()=>({{ref}})}};
    window.__STORE=STORE;
    '''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(); page.set_content(html); page.add_script_tag(content=harness('ADMIN','badminton')); page.add_script_tag(content=src); page.wait_for_timeout(150)
    assert page.locator('#club-plan-calendar').is_visible(), 'calendar missing'
    assert page.locator('#club-plan-btc').is_visible(), 'BTC editor missing'
    txt=page.locator('#club-plan-calendar').inner_text()
    assert 'Cầu lông' in txt and 'Vòng bảng' in txt and 'Chung kết' in txt, txt
    assert '15.000.000' in txt and '14.315.000' in txt and '685.000' in txt, txt
    assert page.locator('#club-plan-task-rows').count()==0, 'default tab should be plan'
    page.click('[data-tab="budget"]'); page.wait_for_timeout(30)
    assert page.locator('#club-plan-income-rows .club-plan-row').count()==1
    assert page.locator('#club-plan-expense-rows .club-plan-row').count()==10
    page.click('[data-tab="tasks"]'); page.wait_for_timeout(30)
    assert page.locator('#club-plan-task-rows .club-plan-row').count()==5
    assert page.locator('#club-plan-task-rows .club-plan-row.overdue').count()>=4
    page.click('#club-plan-save'); page.wait_for_timeout(80)
    store=page.evaluate('window.__STORE')
    assert 'topkey_badminton_vnext_2026/clubPlan' in store, store.keys()
    page.evaluate("window.__setLang('zh')"); page.wait_for_timeout(120)
    ztxt=page.locator('#club-plan-calendar').inner_text()+page.locator('#club-plan-btc').inner_text()
    assert '社团日程与计划' in ztxt and '社团计划档案' in ztxt and '预算' in ztxt, ztxt
    assert 'Lịch & kế hoạch CLB' not in ztxt and 'Ngân sách' not in ztxt, ztxt
    page.evaluate("window.__setLang('en')"); page.wait_for_timeout(120)
    etxt=page.locator('#club-plan-calendar').inner_text()+page.locator('#club-plan-btc').inner_text()
    assert 'Club calendar & plan' in etxt and 'Club planning workspace' in etxt and 'Budget' in etxt, etxt
    print('PASS H92 club-plan i18n vi/zh/en')
    print('PASS ADMIN Badminton Excel seed + budget/tasks save')

    page2=browser.new_page(); page2.set_content(html); page2.add_script_tag(content=harness('BTC','volleyball')); page2.add_script_tag(content=src); page2.wait_for_timeout(150)
    assert page2.locator('#club-plan-btc').is_visible()
    assert page2.locator('#club-plan-sport').input_value()=='volleyball'
    assert page2.locator('#club-plan-sport').is_disabled()
    assert 'Cầu lông' not in page2.locator('#club-plan-calendar').inner_text(), page2.locator('#club-plan-calendar').inner_text()
    page2.fill('[data-field="info.title"]','Kế hoạch bóng chuyền 2027')
    page2.click('#club-plan-save'); page2.wait_for_timeout(80)
    store2=page2.evaluate('window.__STORE')
    assert 'topkey_volleyball_vnext_2026/clubPlan' in store2
    assert store2['topkey_volleyball_vnext_2026/clubPlan']['info']['title']=='Kế hoạch bóng chuyền 2027'
    print('PASS BTC fixed sport scope + own clubPlan write')

    page3=browser.new_page(); page3.set_content(html)
    lead=harness('VIEWER','').replace("const profile={role:'VIEWER',sportScope:''};","const profile={role:'VIEWER',sportScope:'',permissions:{modules:{executiveDashboard:'view'}}};")
    page3.add_script_tag(content=lead); page3.add_script_tag(content=src); page3.wait_for_timeout(150)
    assert page3.locator('#club-plan-calendar').is_visible(), 'leadership calendar missing'
    assert not page3.locator('#club-plan-btc').is_visible(), 'leadership must not see BTC editor'
    print('PASS delegated leadership calendar read-only')
    browser.close()
print('CLUB_PLAN_H92_OK')
