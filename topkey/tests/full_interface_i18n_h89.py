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
        raise AssertionError(f'{label}: residual={residual[:20]}')

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
      pg.wait_for_timeout(60)
      for lang in ['vi','zh','en','vi','zh']:
        pg.evaluate('(l)=>TopkeyI18n.setLanguage(l,true)',lang)
        pg.wait_for_timeout(30)
        assert_clean(pg,f'{name}:{lang}')
        if pg.evaluate('document.documentElement.lang') != {'vi':'vi','en':'en','zh':'zh-CN'}[lang]:
          raise AssertionError(f'{name}:{lang}: html lang mismatch')
        passes+=1
      # Dynamic UI created after language switch must translate automatically.
      pg.evaluate("""()=>{TopkeyI18n.setLanguage('zh',true); const d=document.createElement('div'); d.id='h89-dyn'; d.textContent='Đổi mật khẩu tài khoản'; document.body.appendChild(d);}""")
      pg.wait_for_timeout(80)
      if pg.locator('#h89-dyn').inner_text()!='修改账号密码':
        raise AssertionError(f'{name}: dynamic mutation did not translate: '+pg.locator('#h89-dyn').inner_text())
      assert_clean(pg,f'{name}:dynamic-zh')
      passes+=1
      # Picker itself must present all language names in the currently selected language.
      pg.evaluate("TopkeyI18n.openLanguagePicker()")
      pg.wait_for_timeout(20)
      picker=pg.locator('#tk28-language-modal').inner_text()
      if any(x in picker for x in ['Tiếng Việt','Tiếng Trung','Tiếng Anh','Vietnamese','Simplified Chinese','English']):
        raise AssertionError(f'{name}: Chinese picker has mixed language labels: {picker}')
      pg.close()
    b.close()
  print('H89_FULL_INTERFACE_I18N_OK',passes)

if __name__=='__main__':
  try: main()
  except Exception as e:
    print('H89_FULL_INTERFACE_I18N_FAIL',e,file=sys.stderr);sys.exit(1)
