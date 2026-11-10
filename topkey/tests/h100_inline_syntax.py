from pathlib import Path
from bs4 import BeautifulSoup
import subprocess
root=Path(__file__).resolve().parents[1]
failed=[];count=0
for p in root.rglob('*.html'):
 if 'vendor/' in str(p):continue
 for i,sc in enumerate(BeautifulSoup(p.read_text(errors='replace'),'html.parser').find_all('script')):
  if sc.get('src') or sc.get('type') in ['application/json','importmap']:continue
  txt=sc.text.strip()
  if not txt:continue
  count+=1
  proc=subprocess.run(['node','--check','-'],input=txt,text=True,capture_output=True)
  if proc.returncode:failed.append((str(p.relative_to(root)),i,proc.stderr.splitlines()[:4]))
print('INLINE_JS_SCRIPTS',count,'FAILED',len(failed))
for x in failed[:25]:print(x)
raise SystemExit(bool(failed))
