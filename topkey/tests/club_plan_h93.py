from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
src=(ROOT/'club-planning.js').read_text(encoding='utf-8')
layout=(ROOT/'hub-layout93.js').read_text(encoding='utf-8')
css=(ROOT/'hub-layout93.css').read_text(encoding='utf-8')

def harness(role='ADMIN',scope='badminton',appearance=None):
    app=appearance or {}
    return f'''
    const STORE={{}};
    const LS={{topkey_ui_language_v1:'vi'}}; Object.defineProperty(window,'localStorage',{{value:{{getItem:k=>LS[k]||null,setItem:(k,v)=>LS[k]=String(v)}},configurable:true}});
    const profile={{role:{role!r},sportScope:{scope!r}}}; const appearance={app!r};
    function snap(v){{return {{val:()=>v}}}}
    function ref(path){{return {{once:async()=>{{if(path==='topkey_badminton_vnext_2026/users/u1')return snap(profile);if(path==='topkey_badminton_vnext_2026/associationDashboard/hubAppearance')return snap(appearance);if(path.endsWith('/clubPlan'))return snap(STORE[path]||null);return snap(null)}},set:async(v)=>{{STORE[path]=JSON.parse(JSON.stringify(v));return true}}}}}}
    const auth={{currentUser:{{uid:'u1'}},onAuthStateChanged:cb=>setTimeout(()=>cb({{uid:'u1'}}),0)}};
    window.firebase={{auth:()=>auth,database:()=>({{ref}})}}; window.__STORE=STORE;
    '''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    # Hub: read-only calendar only + compact selector above dashboard
    page=browser.new_page(); page.set_content('''<!doctype html><html><head></head><body><header><div class="brand-title"><div class="eyebrow">OLD</div><h1>OLD TITLE</h1></div></header><main class="wrap"><section id="executive-dashboard"></section><section class="cards">'''+''.join([f'<a class="sport"><span class="badge">B</span><div class="emoji">{e}</div><h3>{n}</h3><p>description</p><span class="open">Open</span></a>' for e,n in [('⚽','Bóng đá'),('🏸','Cầu lông'),('🏐','Bóng chuyền'),('🏃','Chạy bộ'),('🧶','Thủ công'),('🪶','Đá cầu'),('👨‍🍳','Nấu ăn')]])+'''</section></main></body></html>''')
    page.add_style_tag(content=css); page.add_script_tag(content=harness('ADMIN','badminton',{'title':'HUB CUSTOM','eyebrow':'TOPKEY CUSTOM','background':'https://example.com/bg.jpg'})); page.add_script_tag(content=src); page.add_script_tag(content=layout); page.wait_for_timeout(180)
    assert page.locator('.cards').evaluate('(e)=>e.compareDocumentPosition(document.querySelector("#executive-dashboard")) & Node.DOCUMENT_POSITION_FOLLOWING'), 'sport picker not above dashboard'
    assert page.locator('.cards').get_attribute('class').find('compact-sports')>=0
    assert page.locator('.cards .sport').count()==7
    assert page.locator('.cards .sport p').evaluate_all('(els)=>els.every(e=>getComputedStyle(e).display==="none")')
    assert page.locator('#club-plan-calendar').is_visible(), 'Hub calendar missing'
    assert page.locator('#club-plan-admin').count()==0 and page.locator('#club-plan-btc').count()==0, 'Hub must not contain editor'
    assert page.locator('.brand-title h1').inner_text()=='HUB CUSTOM'
    assert page.locator('.brand-title .eyebrow').inner_text()=='TOPKEY CUSTOM'
    assert 'hub-custom-bg' in (page.locator('body').get_attribute('class') or '')
    print('PASS H93 compact sport selector + Hub read-only calendar + appearance apply')

    # System admin surface: plan editor mounted here, no calendar created
    page2=browser.new_page(); page2.set_content('''<!doctype html><html><body><main class="wrap"><section id="club-plan-admin" class="card hidden"></section></main></body></html>''')
    page2.add_script_tag(content=harness('ADMIN','badminton')); page2.add_script_tag(content=src); page2.wait_for_timeout(180)
    assert page2.locator('#club-plan-admin').is_visible(), 'admin plan editor missing'
    assert page2.locator('#club-plan-calendar').count()==0, 'admin page must not create Hub calendar'
    assert page2.locator('#club-plan-sport').count()==1
    assert page2.locator('[data-field="info.title"]').count()==1
    assert page2.locator('#club-plan-schedule-rows').count()==1
    page2.click('[data-tab="budget"]'); assert page2.locator('#club-plan-expense-rows .club-plan-row').count()==10
    page2.click('[data-tab="tasks"]'); assert page2.locator('#club-plan-task-rows .club-plan-row').count()==5
    page2.click('#club-plan-save'); page2.wait_for_timeout(80)
    store=page2.evaluate('window.__STORE'); assert 'topkey_badminton_vnext_2026/clubPlan' in store
    print('PASS H93 Club plan/milestones/budget/tasks moved to System Admin')
    browser.close()
print('CLUB_PLAN_H93_OK')
