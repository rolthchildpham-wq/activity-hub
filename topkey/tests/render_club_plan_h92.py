from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
css=(R/'club-planning.css').read_text(); src=(R/'club-planning.js').read_text()
html=f'''<!doctype html><html><head><style>body{{margin:0;background:#061425;color:#eaf4ff;font-family:Arial}}main.wrap{{padding:20px;max-width:1500px;margin:auto}}.panel{{background:#0b2238;border:1px solid #214c6d;border-radius:16px;padding:18px}}.muted{{color:#9bb5ca}}.pill{{border:1px solid #2dd4bf;padding:5px 8px;border-radius:999px;font-size:11px}}.cards{{display:none}}{css}</style></head><body><main class="wrap"><section id="executive-dashboard"></section><section class="cards"></section><section id="password-change-launch"></section></main></body></html>'''
harness='''const STORE={};const profile={role:'ADMIN',sportScope:'badminton'};function snap(v){return {val:()=>v}}function ref(path){return {once:async()=>{if(path==='topkey_badminton_vnext_2026/users/u1')return snap(profile);if(path.endsWith('/clubPlan'))return snap(STORE[path]||null);return snap(null)},set:async v=>{STORE[path]=v}}}const auth={onAuthStateChanged:cb=>setTimeout(()=>cb({uid:'u1'}),0)};window.firebase={auth:()=>auth,database:()=>({ref})};'''
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);pg=b.new_page(viewport={"width":1600,"height":1200});pg.set_content(html);pg.add_script_tag(content=harness);pg.add_script_tag(content=src);pg.wait_for_timeout(300);pg.screenshot(path='/mnt/data/h92_club_plan_preview.png',full_page=True);b.close()
