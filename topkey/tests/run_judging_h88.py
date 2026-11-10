from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading, os
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
os.chdir(ROOT)
srv=ThreadingHTTPServer(('127.0.0.1',0),H); port=srv.server_port
threading.Thread(target=srv.serve_forever,daemon=True).start()
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=b.new_page(); errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{port}/tests/judging_h88.html',wait_until='load')
    page.wait_for_timeout(350)
    admin=page.evaluate("""() => ({card:!!document.querySelector('#tk88-judge-admin'),title:document.querySelector('#tk88-judge-admin')?.innerText||'',rows:document.querySelectorAll('#tk88j-criteria .tk88j-row').length,qr:document.querySelector('#tk88j-qr')?.textContent||'',stats:document.querySelector('#tk88j-results-body')?.innerText||''})""")
    print('admin=',admin,'errors=',errors)
    assert admin['card'] and admin['rows']==3 and 'Chấm điểm & QR Giám khảo' in admin['title'] and 'Thống kê chấm điểm' in admin['title']
    assert not errors
    page2=b.new_page(); errors2=[]; page2.on('pageerror',lambda e: errors2.append(str(e)))
    page2.goto(f'http://127.0.0.1:{port}/tests/judging_h88.html?sport=cooking&tid=tid88&judge=token88#judge',wait_until='load')
    page2.wait_for_timeout(600)
    pub=page2.evaluate("""() => ({loginHidden:document.querySelector('#login-screen')?.classList.contains('hidden'),appHidden:document.querySelector('#app-shell')?.classList.contains('hidden'),publicVisible:!document.querySelector('#public-judge')?.classList.contains('hidden'),title:document.querySelector('#public-judge')?.innerText||'',teams:[...document.querySelectorAll('#tk88j-public-team option')].map(x=>x.textContent),criteria:document.querySelectorAll('#tk88j-public-criteria .tk88j-score-row').length})""")
    print('public=',pub,'errors=',errors2)
    assert pub['loginHidden'] and pub['appHidden'] and pub['publicVisible']
    assert 'Chấm món ăn' in pub['title'] and 'Gửi điểm' in pub['title'] and 'Đội A' in pub['teams'] and pub['criteria']==3
    assert not errors2
    # Judge-code surface: switch fixture config before loading by query mode hook in test harness isn't provided; static contract covers code flow.
    b.close()
finally:
  srv.shutdown();srv.server_close()
print('JUDGING_BROWSER_H88_OK')
