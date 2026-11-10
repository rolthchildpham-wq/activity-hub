from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import re, json
ROOT=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.urls=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='script' and d.get('src'):self.urls.append(d['src'])
  if tag=='link' and d.get('href') and d.get('rel') in ('stylesheet','manifest'):self.urls.append(d['href'])
checks=[];missing=[]
for rel in ['index.html','sports/badminton/index.html','sports/vnext/index.html']:
 p=ROOT/rel;parser=Parser();parser.feed(p.read_text())
 for u in parser.urls:
  split=urlsplit(u)
  if split.scheme or u.startswith('//'):continue
  target=(p.parent/split.path).resolve();checks.append(str(target.relative_to(ROOT)) if target.is_relative_to(ROOT) else str(target))
  if not target.is_file():missing.append(f'{rel}: {u}')
for rel in ['sw.js','sports/badminton/sw.js','sports/vnext/sw.js']:
 p=ROOT/rel;src=p.read_text();m=re.search(r'const SHELL=\[([^\]]*)\]',src)
 assert m,rel
 for u in re.findall(r"['\"]([^'\"]+)['\"]",m.group(1)):
  if u.startswith('http'):continue
  target=(p.parent/urlsplit(u).path).resolve();checks.append(str(target.relative_to(ROOT)) if target.is_relative_to(ROOT) else str(target))
  if not target.is_file():missing.append(f'{rel}: {u}')
result={'localAssetsChecked':len(checks),'missing':missing,'pass':not missing}
(ROOT/'H108_ASSET_TEST.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(result);assert not missing
