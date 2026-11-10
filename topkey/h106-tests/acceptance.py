#!/usr/bin/env python3
"""H105 static and regression gate. Does not contact Firebase production."""
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
import json,subprocess,sys,hashlib,re,datetime
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
records=[];failures=[]
def add(group,name,ok,detail=''):
 records.append({'group':group,'test':name,'status':'PASS' if ok else 'FAIL','detail':detail})
 if not ok:failures.append((name,detail))
def run_node_check(p):
 cp=subprocess.run(['node','--check',str(p)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=12)
 return (p,cp.returncode==0,(cp.stderr.decode(errors='replace')[-250:] if cp.returncode else ''))
js=[p for p in ROOT.rglob('*.js') if 'node_modules' not in p.parts]
with ThreadPoolExecutor(max_workers=12) as pool:
 for p,ok,detail in pool.map(run_node_check,js):
  if not ok:add('syntax',str(p.relative_to(ROOT)),False,detail)
add('syntax','All JS source files',not any(k[0]=='syntax' for k in [] ) and not [x for x in records if x['group']=='syntax' and x['status']=='FAIL'],f'{len(js)} files')
for p in ROOT.rglob('*.json'):
 try:json.loads(p.read_text(encoding='utf-8'))
 except Exception as e:add('json',str(p.relative_to(ROOT)),False,str(e))
add('json','All JSON configuration files',not any(x for x in records if x['group']=='json' and x['status']=='FAIL'),str(len(list(ROOT.rglob('*.json'))))+' files')
files=['release.json','build.json','sports/badminton/build.json','sports/vnext/build.json']
meta=[json.loads((ROOT/p).read_text(encoding='utf-8')) for p in files]
add('release','Hub/Badminton/VNext identical version/cache/build',len({(d.get('version'),d.get('cacheTag'),d.get('build')) for d in meta})==1,str([(d.get('cacheTag'),d.get('build')) for d in meta]))
add('release','H106 release id',meta[0].get('releaseId')=='H106')
for p in ['sw.js','sports/badminton/sw.js','sports/vnext/sw.js']:
 s=(ROOT/p).read_text(encoding='utf-8');add('cache',p+' H106 unique cache',bool(re.search(r"CACHE=\'topkey-h106(?:-r1)?-", s)));add('cache',p+' old H104 cache cleanup exists', "topkey-h104-" in s or (p=="sw.js" and "topkey-h\\d+-hub-shell" in s))
class ScriptParser(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.scripts=[];self.current=False;self.buf='';self.type=''
 def handle_starttag(self,tag,attrs):
  if tag!='script':return
  d=dict(attrs);self.current=True;self.buf='';self.type=d.get('type','');
  if 'src' in d:self.refs.append(d['src'])
 def handle_data(self,data):
  if self.current:self.buf+=data
 def handle_endtag(self,tag):
  if tag=='script' and self.current:self.current=False
  if self.buf.strip() and self.type not in ('application/json','importmap','application/ld+json'):self.scripts.append(self.buf)
  self.buf=''
for fn in ['index.html','sports/badminton/index.html','sports/vnext/index.html']:
 p=ROOT/fn;doc=p.read_text(encoding='utf-8');add('encoding',fn+' charset utf-8','charset="utf-8"' in doc[:600] or 'charset=utf-8' in doc[:600]);parser=ScriptParser();parser.feed(doc)
 bad=[ref for ref in parser.refs if not ref.startswith(('http:','https:','data:','//')) and not (p.parent/ref.split('?')[0]).resolve().exists()]
 add('assets',fn+' static JS refs resolve',not bad,','.join(bad))
 for i,script in enumerate(parser.scripts):
  cp=subprocess.run(['node','--check','-'],input=script.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  if cp.returncode:add('inline',fn+' script '+str(i+1),False,cp.stderr.decode(errors='replace')[-220:])
 add('inline',fn+' inline JS syntax',not any(x for x in records if x['group']=='inline' and x['test'].startswith(fn+' script')),str(len(parser.scripts))+' segments')
for p in ['firebase.database.rules.json','sports/badminton/firebase.database.rules.json']:
 d=json.loads((ROOT/p).read_text());sports=[(n,x['tournaments']['$tid']) for n,x in d['rules'].items() if isinstance(x,dict) and 'tournaments' in x]
 valid=len(sports) in [1,7] and all('_v2' in x and all(k in x['_v2'] for k in ('tables','meta','aggregates')) for _,x in sports)
 add('rules',p+' v2 subtrees',valid,str(len(sports))+' sports')
 old=json.loads((ROOT.parent/'Topkey_H103_H102_Runtime_Repair_STAGING'/p).read_text()) if (ROOT.parent/'Topkey_H103_H102_Runtime_Repair_STAGING'/p).exists() else None
 if old:
  unchanged=True
  for key,new in d['rules'].items():
   if not isinstance(new,dict) or 'tournaments' not in new:continue
   before=old['rules'].get(key,{}).get('tournaments',{}).get('$tid',{}).copy();after=new['tournaments']['$tid'].copy();after.pop('_v2',None)
   if before!=after:unchanged=False;break
  add('rules',p+' canonical permissions unchanged',unchanged)
# Regression tests that do not lock a previous release identifier.
for name in ['tests/auth_matrix_h83.js','tests/auth_integration_h83.js','tests/report_fixture_h83.js','tests/security_contract_h88.js','sports/badminton/tests/h44_standings_single_result_test.js']:
 cp=subprocess.run(['node',name],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=22)
 add('regression',name,cp.returncode==0,(cp.stderr.decode(errors='replace')[-180:] if cp.returncode else cp.stdout.decode(errors='replace').splitlines()[-1]))
# Inherited H105 modules, assets, and page integration gate.
mods=['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js']
for fn in mods:
 content=(ROOT/fn).read_text(encoding='utf-8')
 for token in ['tk105-prize-save','savePrizesAdmin','ref.transaction(', 'tk105-ppt-template','tk105-section-files','addCustomSectionSlides','reportWithPrizes','prizeStructure']:
  add('h105_awards',fn+' '+token,token in content)
bundle=(ROOT/'sports/vnext/h97-vnext.bundle.js').read_text(encoding='utf-8')
add('h105_integration','VNext bundle includes H105 admin prize and editable PPT',all(token in bundle for token in ['tk105-prize-save','tk105-ppt-template','ref.transaction(','addCustomSectionSlides']))
themes=['badminton','football','volleyball','running','handmade','shuttle','cooking']
for sport in themes:
 p=ROOT/'report-templates'/f'{sport}-topkey-report.pptx'
 add('h105_ppt',sport+' template exists',p.exists() and p.stat().st_size > 50000)
try:
 import zipfile
 for sport in themes:
  with zipfile.ZipFile(ROOT/'report-templates'/f'{sport}-topkey-report.pptx') as z:
   add('h105_ppt',sport+' pptx readable',z.testzip() is None and 'ppt/presentation.xml' in z.namelist())
except Exception as e:add('h105_ppt','All PPTX ZIP integrity',False,str(e))
ui=ROOT/'H105_UI_AND_PPT_RUNTIME_TEST.json'
try:
 runs=json.loads(ui.read_text(encoding='utf-8'))
 add('h105_browser','Seven sport browser mock report + prize + PowerPoint tests',len(runs)==7 and {x['sport'] for x in runs}==set(themes) and all(x['prize_saved'] and x['report_contains_prize'] and x['config_locked'] and x['slide_count'] >= 6 and not x['js_errors'] for x in runs))
except Exception as e:add('h105_browser','UI browser mock results',False,str(e))

# H106 PDF integration, without requiring Firebase production.
engine=(ROOT/'h106-final-report-pdf.js')
add('h106_pdf','Offline PDF engine exists',engine.exists() and engine.stat().st_size>7000)
if engine.exists():
 content=engine.read_text(encoding='utf-8')
 for token in ['createPdfBytes','checkInk','createPdf','contentCount','photosAt','Tệp PDF được tạo quá nhỏ']:
  add('h106_pdf','Offline PDF '+token,token in content)
for fn in ['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js']:
 text=(ROOT/fn).read_text(encoding='utf-8')
 add('h106_pdf',fn+' direct H106 export',"window.TopkeyFinalReportPdfH106" in text and 'engine.exportReport(' in text)
for fn in ['sports/badminton/index.html','sports/vnext/index.html']:
 add('h106_pdf',fn+' loads local PDF engine', 'h106-final-report-pdf.js' in (ROOT/fn).read_text(encoding='utf8'))
add('h106_pdf','VNext production bundle contains H106 export',"engine.exportReport(" in bundle)
add('h106_pdf','H105 auto-print PDF removed from active export', "async function exportPdf(){" in (ROOT/'sports/badminton/upgrade122-hotfix80.js').read_text(encoding='utf8') and 'Đang xuất PDF trực tiếp' in (ROOT/'sports/badminton/upgrade122-hotfix80.js').read_text(encoding='utf8'))
status='PASS_STATIC_AND_SIMULATED_ONLY'  if not failures else 'FAIL'
report={'name':'H106 staging acceptance','testedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':status,'jsFiles':len(js),'checks':len(records),'failures':failures,'results':records,'notTested':['Firebase real staging authentication/Rules deployment','EdgeOne production network behavior','7-sport end-to-end real-user workflows','Cross-client atomic aggregation (needs server-side support)']}
(ROOT/'H106_STATIC_TEST_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('STATUS',status,'JS',len(js),'CHECKS',len(records),'FAILED',len(failures))
for name,detail in failures[:12]:print('FAIL',name,detail)
if failures:sys.exit(1)
