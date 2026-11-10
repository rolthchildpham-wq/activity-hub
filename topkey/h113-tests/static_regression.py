#!/usr/bin/env python3
"""H113 release checks. Read-only, no production Firebase operations."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,concurrent.futures,zipfile,sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,ok,details=''):
 checks.append(dict(name=name,pass_=bool(ok),details=str(details)))
 if not ok: print('FAIL',name,details)
def nodecheck(p):
 r=subprocess.run(['node','--check',str(p)],capture_output=True,timeout=25)
 return p,r.returncode==0,r.stderr.decode(errors='replace')[-150:]
js=[p for p in ROOT.rglob('*.js') if 'node_modules' not in p.parts]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool: results=list(pool.map(nodecheck,js))
check('JS syntax',all(r[1] for r in results),f'{len(js)} files; errors: '+','.join(str(a[0].relative_to(ROOT)) for a in results if not a[1]))
files=list(ROOT.rglob('*.json'));bad=[]
for f in files:
 try:json.loads(f.read_text('utf-8'))
 except Exception as e:bad.append((str(f.relative_to(ROOT)),str(e)))
check('JSON valid',not bad,f'{len(files)} files; invalid:{bad[:3]}')
release=json.loads((ROOT/'release.json').read_text('utf-8'))
meta=[json.loads((ROOT/f).read_text('utf-8')) for f in ['build.json','sports/badminton/build.json','sports/vnext/build.json']]
check('Release consistency',release['releaseId']=='H113' and all(m['cacheTag']==release['cacheTag'] and m['version']==release['version'] for m in meta),release['cacheTag'])
for fn in ['sw.js','sports/badminton/sw.js','sports/vnext/sw.js']:
 s=(ROOT/fn).read_text('utf-8');check(fn+' cache H113',"topkey-h113-" in s)
for fn in ['index.html','sports/badminton/index.html','sports/vnext/index.html']:
 s=(ROOT/fn).read_text('utf-8');check(fn+' canonical release',f"release-runtime.js?v={release['cacheTag']}" in s)
for fn in ['sports/badminton/index.html','sports/vnext/index.html']:
 s=(ROOT/fn).read_text('utf-8');check(fn+' finance module imported',f'h113-finance-report.js?v={release["cacheTag"]}' in s)
for fn in ['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js','sports/vnext/h97-vnext.bundle.js']:
 s=(ROOT/fn).read_text('utf-8');check(fn+' prize structure in final report', 'prizeStructure' in s and 'prizeHtml' in s)
for f in ['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js']:
 s=(ROOT/f).read_text('utf-8');check(f+' editing awards after lock', 'savePrizesAdmin' in s and 'ref.transaction(' in s)
check('H106 direct PDF export present', 'createPdfBytes' in (ROOT/'h106-final-report-pdf.js').read_text('utf-8'))
check('H112 real per-sport PPTX', all((ROOT/f'report-templates/{k}-topkey-report.pptx').exists() for k in ['badminton','football','volleyball','running','handmade','shuttle','cooking']))
check('H112 original PPTX module', 'JSZip.loadAsync' in (ROOT/'h112-ppt-template.js').read_text('utf-8'))
check('H113 receipts embedded in PDF', all(k in (ROOT/'h113-finance-report.js').read_text('utf-8') for k in ['EmbeddedFiles','/FileAttachment','receiptState','collectReceipts','rawPdf','h113-finance-controls']))
check('H113 csv + pdf TestLab gates', all(k in (ROOT/'h112-testlab-export-check.js').read_text('utf-8') for k in ['finance-csv','finance-pdf','finance-appendix','prizes','html','ppt']))
with zipfile.ZipFile(ROOT/'report-templates/volleyball-topkey-report.pptx') as z:
 check('PPTX ZIP valid',z.testzip() is None)
regress=['tests/auth_matrix_h83.js','tests/auth_integration_h83.js','tests/h108_auth_security_regression.js','tests/report_fixture_h83.js','tests/report_html_h88.js','tests/security_contract_h88.js','h104-tests/v2-engine.test.js']
for f in regress:
 p=subprocess.run(['node',f],cwd=ROOT,capture_output=True,timeout=55)
 check(f,p.returncode==0,(p.stdout.decode(errors='replace').splitlines()[-1:] if p.returncode==0 else p.stderr.decode(errors='replace')[-180:]))
status='PASS_LOCAL_STATIC' if all(x['pass_'] for x in checks) else 'FAIL'
result={'release':'H113','status':status,'checks':len(checks),'passed':sum(x['pass_'] for x in checks),'failed':sum(not x['pass_'] for x in checks),'results':checks,'notTested':['Firebase production role + Cloud Storage receipt URLs','EdgeOne real network and Service Worker upgrade','Simultaneous financial edits from multiple authenticated devices','PDF attachments visibility in every PDF viewer']}
(ROOT/'H113_RELEASE_TEST_MATRIX.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(status,'PASSED',result['passed'],'/',len(checks))
if result['failed']:sys.exit(1)
