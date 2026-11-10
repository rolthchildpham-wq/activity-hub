from pathlib import Path
from playwright.sync_api import sync_playwright
import re, sys
R=Path(__file__).resolve().parents[1]
PAGES=[
 ('hub','index.html','upgrade30.js'),
 ('vnext','sports/vnext/index.html','sports/vnext/src/upgrade30.js'),
 ('badminton','sports/badminton/index.html','upgrade30.js'),
 ('system','system-admin.html','upgrade30.js'),
 ('password','change-password.html','upgrade30.js'),
]

def body(html):
    lo=html.lower(); a=lo.rfind('<body'); a=lo.find('>',a)+1; z=lo.rfind('</body>'); return html[a:z]

def clean_body(html):
    return re.sub(r'<script[^>]*>.*?</script>','',body(html),flags=re.S|re.I)

def assert_clean(pg,label):
    residual=pg.evaluate("window.TopkeyI18n ? TopkeyI18n.auditResidual() : ['NO_I18N']")
    if residual:
        raise AssertionError(f'{label}: residual={residual[:30]}')

def main():
  passes=0
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for name,hf,jf in PAGES:
      html=clean_body((R/hf).read_text(encoding='utf-8'))
      pg=b.new_page()
      pg.set_content('<!doctype html><html><head><title>TOPKEY Sports Hub VNext 2026</title></head><body>'+html+'</body></html>')
      pg.evaluate("""()=>{const store={topkey_ui_language_v1:'vi'};Object.defineProperty(window,'localStorage',{value:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v)},configurable:true});}""")
      pg.add_script_tag(content=(R/jf).read_text(encoding='utf-8'))
      pg.wait_for_timeout(80)
      for lang in ['vi','zh','en','vi','zh']:
        pg.evaluate('(l)=>TopkeyI18n.setLanguage(l,true)',lang)
        pg.wait_for_timeout(40)
        assert_clean(pg,f'{name}:{lang}')
        if pg.evaluate('document.documentElement.lang') != {'vi':'vi','en':'en','zh':'zh-CN'}[lang]:
          raise AssertionError(f'{name}:{lang}: html lang mismatch')
        passes+=1
      # General dynamic UI.
      pg.evaluate("""()=>{TopkeyI18n.setLanguage('zh',true); const d=document.createElement('div'); d.id='h91-dyn'; d.textContent='Đổi mật khẩu tài khoản'; document.body.appendChild(d);}""")
      pg.wait_for_timeout(80)
      if pg.locator('#h91-dyn').inner_text()!='修改账号密码':
        raise AssertionError(f'{name}: dynamic mutation did not translate: '+pg.locator('#h91-dyn').inner_text())
      assert_clean(pg,f'{name}:dynamic-zh'); passes+=1
      # Executive Dashboard is dynamically rendered after Firebase role/data callbacks.
      if name=='hub':
        pg.evaluate("""()=>{const x=document.createElement('section');x.id='h91-exec-fixture';x.innerHTML=`
          <h2>📊 Dashboard điều hành xã đoàn</h2>
          <p>Tổng hợp toàn bộ CLB, lịch sử giải, VĐV, thành tích và tài chính cho Ban lãnh đạo.</p>
          <button>↻ Cập nhật dữ liệu</button><div>Đang tải dashboard…</div>
          <div>CLB đang hoạt động</div><div>VĐV/đại diện duy nhất</div><div>🏛 Tổng quan từng CLB</div>
          <div>📈 Hoạt động theo CLB</div><div>📅 Xu hướng theo năm</div><div>⚠ Cảnh báo lãnh đạo</div>
          <div>🏆 Nhà vô địch qua các giải</div><div>💰 Tài chính từng giải</div>
          <div>🏸 Cầu lông Club: chưa khai báo Trưởng BTC/phụ trách.</div>
          <div>🏐 Bóng chuyền Club: còn 2 khoản tài chính chưa hoàn tất.</div>`;document.body.appendChild(x);}""")
        pg.wait_for_timeout(120)
        txt=pg.locator('#h91-exec-fixture').inner_text()
        forbidden=['Dashboard điều hành','Cập nhật dữ liệu','Đang tải dashboard','CLB đang hoạt động','VĐV/đại diện','Tổng quan từng CLB','Hoạt động theo CLB','Xu hướng theo năm','Cảnh báo lãnh đạo','Nhà vô địch qua các giải','Tài chính từng giải','chưa khai báo Trưởng BTC','khoản tài chính chưa hoàn tất']
        bad=[x for x in forbidden if x in txt]
        if bad: raise AssertionError('hub executive dashboard zh residual: '+repr(bad)+'\n'+txt)
        assert_clean(pg,'hub:executive-dashboard-zh'); passes+=1
      pg.close()
    b.close()
  print('H91_FULL_INTERFACE_I18N_OK',passes)

if __name__=='__main__':
  try: main()
  except Exception as e:
    print('H91_FULL_INTERFACE_I18N_FAIL',e,file=sys.stderr);sys.exit(1)
