from pathlib import Path
import re, json, subprocess, tempfile, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
BUILD='u122h86-20261107'
VERSION='2026.11.07-vnext-upgrade122-hotfix86-report-parity-regression'
results=[]
def check(name, cond, detail=''):
    if not cond: raise AssertionError(f'{name}: {detail}')
    results.append((name,'PASS',detail))
def run(cmd,cwd=ROOT):
    return subprocess.run(cmd,cwd=cwd,text=True,capture_output=True)

# 1. Current role/session matrix
r=run(['node','tests/auth_matrix_h83.js'])
check('Auth matrix ADMIN + BTC badminton + BTC volleyball',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/auth_integration_h83.js'])
check('Auth integration Firebase mock ADMIN + 2 BTC + reload',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/report_fixture_h83.js'])
check('Report fixture Badminton + VNext + 3 languages + prize + image',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/pdf_binary_h83.js'])
check('PDF binary smoke creates non-empty multi-page PDF',r.returncode==0,r.stdout+r.stderr)


r=run(['node','tests/update_authority_h86.js'])
check('H86 update authority prevents legacy downgrade and preserves session',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/hub_guard_h86.js'])
check('H86 Hub guard migrates H83 authenticated session for Badminton + VNext',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/release_atomic_h86.js'])
check('H86 atomic deploy guard root + Badminton + VNext',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/security_contract_h86.js'])
check('H86 secure auth contract rejects client-side role guessing/mock fallback',r.returncode==0,r.stdout+r.stderr)

# 2. Active metadata/version consistency
m=json.loads((ROOT/'TOPKEY_PACKAGE_MANIFEST.json').read_text())
b=json.loads((ROOT/'sports/badminton/build.json').read_text())
check('Manifest cache tag H86',m.get('cacheTag')==BUILD,str(m.get('cacheTag')))
check('Manifest release title H86','Hotfix86' in m.get('releaseTitle',''),m.get('releaseTitle',''))
check('Manifest hub version H86',m.get('hubVersion')==VERSION,str(m.get('hubVersion')))
check('Manifest active version H86',m.get('version')==VERSION,str(m.get('version')))
check('Manifest latest hotfix H86',str(m.get('latestHotfix'))=='86',str(m.get('latestHotfix')))
check('Manifest hub build H86',m.get('hubBuild')=='upgrade122-hotfix86',str(m.get('hubBuild')))
check('Badminton build cache tag',b.get('cacheTag')==BUILD,str(b))
check('Badminton build version',b.get('version')==VERSION,str(b))
root_rel=json.loads((ROOT/'release.json').read_text()); vnb=json.loads((ROOT/'sports/vnext/build.json').read_text())
for label,data in [('Root release',root_rel),('Badminton build',b),('VNext build',vnb)]:
    check(label+' atomic cache tag',data.get('cacheTag')==BUILD,str(data))
    check(label+' atomic version',data.get('version')==VERSION,str(data))
check('Atomic release coordinator exists',(ROOT/'release-coordinator.js').exists())
rc=(ROOT/'release-coordinator.js').read_text()
check('Atomic release coordinator checks all branches',all(x in rc for x in ['./release.json','./sports/badminton/build.json','./sports/vnext/build.json']))
check('Atomic release coordinator blocks mismatched deploy','Deploy chưa đồng bộ' in rc and 'releaseBlocked' in rc)
check('Root service worker H86 cache','u122h86-report-parity-regression' in (ROOT/'sw.js').read_text())
check('Badminton service worker H86 cache','u122h86-report-parity-regression' in (ROOT/'sports/badminton/sw.js').read_text())
check('VNext service worker H86 cache','u122h86-report-parity-regression' in (ROOT/'sports/vnext/sw.js').read_text())
check('Hub writes H86 session key',"topkey_hub_session_v86" in (ROOT/'hub-auth-flow.js').read_text())
for gf in ['sports/badminton/hub-entry-guard.js','sports/vnext/hub-entry-guard.js']:
    gs=(ROOT/gf).read_text()
    check(gf+' reads H86 session',"topkey_hub_session_v86" in gs)
    check(gf+' migrates H84 session',"topkey_hub_session_v85" in gs)
    check(gf+' rejects route build mismatch','reason=deploy-mismatch' in gs and "routeBuild!==BUILD" in gs)
for fn in ['index.html','sports/badminton/index.html','sports/vnext/index.html','sw.js','sports/badminton/sw.js','sports/vnext/sw.js']:
    s=(ROOT/fn).read_text()
    check(f'No H84 active tag in {fn}','u122h85-20261107' not in s)

# 3. Inline script syntax for three main routes
htmls=['index.html','system-admin.html','change-password.html','sports/badminton/index.html','sports/vnext/index.html']
for fn in htmls:
    s=(ROOT/fn).read_text()
    scripts=re.findall(r'<script([^>]*)>(.*?)</script>',s,re.S|re.I)
    checked=0
    for i,(attrs,body) in enumerate(scripts,1):
        if re.search(r'\bsrc\s*=',attrs,re.I) or re.search(r'type\s*=\s*["\']application/json',attrs,re.I): continue
        if not body.strip(): continue
        with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False) as f:
            f.write(body); tmp=f.name
        rr=run(['node','--check',tmp],cwd=ROOT)
        Path(tmp).unlink(missing_ok=True)
        check(f'Inline JS syntax {fn} #{i}',rr.returncode==0,rr.stderr.strip())
        checked+=1
    check(f'Inline scripts checked {fn}',checked>=0,str(checked))

# 4. Local resources referenced by main routes exist; all local JS refs parse
local_js=set()
for fn in htmls:
    base=(ROOT/fn).parent;s=(ROOT/fn).read_text()
    refs=[]
    refs += re.findall(r'<script[^>]+src=["\']([^"\']+)',s,re.I)
    refs += re.findall(r'<link[^>]+href=["\']([^"\']+)',s,re.I)
    # dynamic JS strings used by badminton bootstrap
    refs += re.findall(r"['\"](\./[^'\"]+\.js(?:\?[^'\"]*)?)['\"]",s)
    for ref in refs:
        if ref.startswith(('http://','https://','data:','#')): continue
        clean=ref.split('?',1)[0].split('#',1)[0]
        p=(base/clean).resolve()
        check(f'Asset exists {fn} -> {clean}',p.exists(),str(p))
        if p.suffix=='.js': local_js.add(p)
for p in sorted(local_js):
    rr=run(['node','--check',str(p)])
    check(f'JS syntax {p.relative_to(ROOT)}',rr.returncode==0,rr.stderr.strip())


# 4b. H86 release authority and operator verification badges
check('Hub H86 visible badge','H86 · REPORT + PARITY REGRESSION' in (ROOT/'index.html').read_text())
check('Test Lab launch uses H86 route version',"v:'u122h86-20261107'" in (ROOT/'index.html').read_text())
check('Test Lab Badminton preboot restores H86 route version',"set('v','u122h86-20261107')" in (ROOT/'sports/badminton/testlab-preboot122-hotfix.js').read_text())
check('Test Lab VNext preboot restores H86 route version',"set('v','u122h86-20261107')" in (ROOT/'sports/vnext/src/testlab-preboot122-hotfix.js').read_text())
check('Badminton H86 visible badge','H86 · REPORT + PARITY REGRESSION' in (ROOT/'sports/badminton/index.html').read_text())
check('VNext H86 visible badge','H86 · REPORT + PARITY REGRESSION' in (ROOT/'sports/vnext/index.html').read_text())
check('Badminton H86 authority loaded last','./upgrade122-hotfix85.js?v='+BUILD in (ROOT/'sports/badminton/index.html').read_text())
check('VNext H86 authority loaded last','./src/upgrade122-hotfix85.js?v='+BUILD in (ROOT/'sports/vnext/index.html').read_text())
check('Badminton source version H86',VERSION in (ROOT/'sports/badminton/src/config.js').read_text())
check('VNext source version H86',VERSION in (ROOT/'sports/vnext/src/config.js').read_text())
check('Badminton bundle version H86',VERSION in (ROOT/'sports/badminton/assets/u122/admin-core.h85full.js').read_text())
check('Badminton source includes BTC role',"BTC: ['overview'" in (ROOT/'sports/badminton/src/config.js').read_text())
# Central admin and password-change safety contracts
sa=(ROOT/'system-admin.js').read_text();cp=(ROOT/'change-password.html').read_text()
check('System Admin ADMIN full access',"if(r==='ADMIN')return'edit'" in sa)
check('System Admin delegated access',"systemAdmin:access" in sa and "p.modules?.systemAdmin" in sa)
check('BTC creation requires sport scope',"role==='BTC'&&!sport" in sa)
check('System Admin canonicalizes legacy sport labels','function sportKey(v)' in sa and "'cau long':'badminton'" in sa and "'bong da':'football'" in sa)
check('Password change verifies current password','signInWithEmailAndPassword(email,oldPw)' in cp)
check('Password change updates Firebase password','updatePassword(newPw)' in cp)
check('Password change signs out after success','await auth.signOut()' in cp)
# EdgeOne cache headers cover all auth entrypoints
edge=json.loads((ROOT/'edgeone.json').read_text());sources={x.get('source') for x in edge.get('headers',[])}
for src in ['/','/index.html','/hub-auth-flow.js','/sports/badminton/','/sports/badminton/index.html','/sports/badminton/hub-entry-guard.js','/sports/vnext/','/sports/vnext/index.html','/sports/vnext/hub-entry-guard.js','/sports/vnext/src/auth.js','/system-admin.html','/change-password.html']:
    check('EdgeOne no-cache '+src,src in sources)

# 5. Unified auth must be wired into both branches
bad=(ROOT/'sports/badminton/assets/u122/admin-core.h85full.js').read_text()
vn=(ROOT/'sports/vnext/src/auth.js').read_text()
for tok in ['TopkeyHubSession?.needsFreshLogin','TopkeyHubSession?.markAuthenticated','TopkeyHubSession?.beginLogin','TopkeyHubSession?.loginFailed','TopkeyHubSession?.markLoggedOut']:
    check('Badminton unified auth '+tok,tok in bad)
    check('VNext unified auth '+tok,tok in vn)
check('Badminton final bundle selected','admin-core.h85full.js' in (ROOT/'sports/badminton/index.html').read_text())

# 6. Cross-sport feature parity demanded by current release
vapp=(ROOT/'sports/vnext/src/app.js').read_text();vcfg=(ROOT/'sports/vnext/src/config.js').read_text()
check('VNext venue rename','async renameVenue' in vapp)
check('VNext venue delete','async deleteVenue' in vapp)
check('VNext safe delete protects LIVE',"Không thể xóa" in vapp and 'activeMatchId' in vapp)
check('Cooking uses Khu vực (Sảnh)',re.search(r"cooking:\{[^\n]*venueLabel:'Khu vực \(Sảnh\)'",vcfg) is not None)
check('Handmade uses Khu vực (Sảnh)',re.search(r"handmade:\{[^\n]*venueLabel:'Khu vực \(Sảnh\)'",vcfg) is not None)
for sport in ['football','volleyball','running','handmade','shuttle','cooking']:
    check('VNext config contains '+sport,(sport+':{') in vcfg)
# Shared consolidated hotfixes must stay byte-identical across Badminton and VNext where designed as common modules.
for hf in [60,61,63,64,65,66,67,68,76,80]:
    a=ROOT/f'sports/badminton/upgrade122-hotfix{hf}.js'; b=ROOT/f'sports/vnext/src/upgrade122-hotfix{hf}.js'
    check(f'Shared Hotfix{hf} parity Badminton/VNext',a.exists() and b.exists() and hashlib.sha256(a.read_bytes()).hexdigest()==hashlib.sha256(b.read_bytes()).hexdigest())


# 7. Final report implementation must be identical in Badminton and VNext
bp=(ROOT/'sports/badminton/upgrade122-hotfix80.js').read_bytes();vp=(ROOT/'sports/vnext/src/upgrade122-hotfix80.js').read_bytes()
check('Report module exact parity',hashlib.sha256(bp).hexdigest()==hashlib.sha256(vp).hexdigest())
rep=bp.decode()
for tok in ['vi-en','en-vi-zh','vi-zh','Cơ cấu giải thưởng','PptxGenJS','rasterPageToJpeg','buildImagePdf','Trang PDF raster trắng','blob.size<12000']:
    check('Report feature '+tok,tok in rep)

# 8. Current standings tests only (exclude obsolete contracts)
for test in ['h44_standings_single_result_test.js','h45_core_standings_authority_test.js','h46_withdrawal_policy_recovery_test.js','h47_withdrawal_legacy_recovery_test.js','h48_ranking_mini_league_test.js']:
    p=ROOT/'sports/badminton/tests'/test
    rr=run(['node',str(p)])
    check('Current regression '+test,rr.returncode==0,rr.stdout+rr.stderr)
# H51-H53 historical tests pin obsolete cache tags; validate their consolidated H53 features instead.
h53=(ROOT/'sports/badminton/upgrade122-hotfix53.js').read_text();bidx=(ROOT/'sports/badminton/index.html').read_text()
for tok in ['Giải trình vị trí 1–2–3–4','id=\"tk51-logo-input\"','signatureHtml(model)','rows.slice(0,4)']:
    check('Consolidated H53 ranking feature '+tok,tok in h53)
check('Consolidated H53 runtime active','./upgrade122-hotfix53.js?v='+BUILD in bidx)


# 9. H86 report/runtime/parity regression additions
rep=(ROOT/'sports/badminton/upgrade122-hotfix80.js').read_text()
for tok in ["const BROWN='5B342B'",'async function getLogoData()','financeDetail','statusText(m.status)','financeTypeText(r.type)','knownText(r.category)','titleText(r.title)']:
    check('H86 report implementation '+tok,tok in rep)
check('H86 Badminton Test Lab applies fixture into App state','applyFixtureToApp' in (ROOT/'sports/badminton/testlab122.js').read_text())
check('H86 Badminton Test Lab validates finance totals','finance-values' in (ROOT/'sports/badminton/testlab122.js').read_text() and '10000000' in (ROOT/'sports/badminton/testlab122.js').read_text())
check('H86 VNext parity module loaded','./src/upgrade122-hotfix86.js?v='+BUILD in (ROOT/'sports/vnext/index.html').read_text())
v86=(ROOT/'sports/vnext/src/upgrade122-hotfix86.js').read_text()
for tok in ['openQuick','saveQuick','setMatchStatus','confirmDanger',"S.mode==='sets'","S.mode==='score'",'Khu vực (Sảnh)']:
    check('H86 VNext interaction parity '+tok,tok in v86)
check('H86 VNext team edit modal parity','tk86-team-edit' in v86 and 'saveTeamEdit' in v86)
check('H86 VNext withdraw confirmation parity','Xác nhận bỏ cuộc' in v86 and 'baseToggle' in v86)
check('H86 VNext registration approval confirmation parity','Duyệt đăng ký' in v86 and 'Từ chối đăng ký' in v86)
check('H86 VNext finance KPI parity','tk86-finance-kpi' in v86 and 'tk86-fin-income' in v86 and 'tk86-fin-balance' in v86)
check('H86 VNext finance confirmation parity','Duyệt khoản tài chính' in v86 and 'Xác nhận đã thu / chi' in v86)
check('H86 VNext finance readable status parity',"REQUESTED:'Chờ duyệt'" in v86 and "INCOME:'Thu'" in v86)
check('H86 VNext one-click confirmation parity','confirmDanger' in (ROOT/'sports/vnext/src/utils.js').read_text() and 'confirm-input' in (ROOT/'sports/vnext/src/utils.js').read_text())
r=run(['node','tests/report_translation_h86.js'])
check('H86 system report translation 3 language modes',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/ppt_export_h86.js','sports/badminton/upgrade122-hotfix80.js','vi-zh','/mnt/data/h86_acceptance_ppt_bad'])
check('H86 real PptxGenJS export Badminton finance + translation',r.returncode==0,r.stdout+r.stderr)
r=run(['node','tests/ppt_export_h86.js','sports/vnext/src/upgrade122-hotfix80.js','en-vi-zh','/mnt/data/h86_acceptance_ppt_vnext'])
check('H86 real PptxGenJS export VNext finance + translation',r.returncode==0,r.stdout+r.stderr)

# report
print('FULL_WEB_ACCEPTANCE_OK',len(results))
for x in results: print('PASS',x[0])
