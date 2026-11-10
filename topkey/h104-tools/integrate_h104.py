#!/usr/bin/env python3
"""Build H104 on the H103 runtime-only repair tree, preserving its source maps and history."""
from pathlib import Path
import re,json
base=Path(__file__).resolve().parents[1]
OLD='u122h103-20261108'
NEW='u122h104-20261108'
OLDVER='2026.11.08-vnext-upgrade122-hotfix103-runtime-stability'
NEWVER='2026.11.08-vnext-upgrade122-hotfix104-indexed-v2'
for p in base.rglob('*'):
    if not p.is_file() or p.suffix not in ('.html','.js','.json','.css','.webmanifest'):continue
    # preserve historical test fixtures and source reports exactly
    if 'h104-' in p.name:continue
    try:content=p.read_text(encoding='utf-8')
    except:continue
    updated=content.replace(OLD,NEW).replace(OLDVER,NEWVER)
    if '/sports/' in str(p) or p.name in ('build.json','release.json','release-coordinator.js','index.html','sw.js','manifest.webmanifest'):
      updated=updated.replace('upgrade122-hotfix103','upgrade122-hotfix104')
    if updated!=content:p.write_text(updated,encoding='utf-8')
# add H104 scripts after the consolidated VNext app bundle is loaded.
p=base/'sports/vnext/index.html';s=p.read_text()
match=re.search(r'<script src="\./h97-vnext\.bundle\.js[^\"]*"></script>',s)
if not match:raise SystemExit('missing H97 app bundle reference')
include=f'<script src="../../h104-v2-engine.js?v={NEW}"></script><script src="../../h104-indexed-runtime.js?v={NEW}"></script><script src="../../h104-migration-ui.js?v={NEW}"></script>'
s=s[:match.end()]+include+s[match.end():];p.write_text(s)
# prevent old Badminton afterLogin from subscribing to full trees during async modules boot.
p=base/'sports/badminton/assets/u122/admin-core.h85full.js';s=p.read_text()
needle='async function bootTopkeyAdmin(){'
assert s.count(needle)==1
insert="""// H104 migration: defer data subscriptions until ordered runtime patches are installed.
const __h104OriginalAfterLogin=App.afterLogin;
App.afterLogin=async function(...args){
  if(window.__TOPKEY_H104_READY)await Promise.race([window.__TOPKEY_H104_READY,new Promise(resolve=>setTimeout(resolve,9000))]);
  return __h104OriginalAfterLogin.apply(this,args);
};
"""
s=s.replace(needle,insert+needle,1);p.write_text(s)
# Set a bounded readiness promise before dynamic Badminton core and runtime start.
p=base/'sports/badminton/index.html';s=p.read_text()
assert '<!-- H33 stable runtime:' in s
s=s.replace('<!-- H33 stable runtime:', '<script>window.__TOPKEY_H104_READY=new Promise(resolve=>{window.__TOPKEY_H104_RESOLVE=resolve})</script>\n<!-- H33 stable runtime:',1)
include=f'''<script src="../../h104-v2-engine.js?v={NEW}"></script>
<script>
(()=>{{
 if(window.__TOPKEY_IS_SPECTATOR||window.__TOPKEY_IS_REGISTER)return;
 const boot=window.__TOPKEY_BOOTSTRAP;
 if(!boot?.ensureAdmin||!boot.loadRuntime)return;
 const script=(src)=>new Promise((resolve,reject)=>{{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('H104 unavailable: '+src));document.body.appendChild(s)}});
 Promise.resolve().then(()=>boot.ensureAdmin()).then(()=>boot.loadRuntime()).then(async()=>{{
    await script('../../h104-indexed-runtime.js?v={NEW}');
    await script('../../h104-migration-ui.js?v={NEW}');
    window.__TOPKEY_H104_RESOLVE?.();
 }}).catch(err=>{{console.error('H104 setup fallback',err);window.__TOPKEY_H104_RESOLVE?.()}});
}})();
</script>'''
s=s.replace('</body></html>',include+'</body></html>');p.write_text(s)
# Record each live build consistently. Keep the atomic deploy guard enabled.
for rel in ('build.json','release.json','sports/badminton/build.json','sports/vnext/build.json'):
 p=base/rel
 if not p.exists():continue
 obj=json.loads(p.read_text(encoding='utf-8'))
 if 'build' in obj:obj['build']='upgrade122-hotfix104'
 if 'cacheTag' in obj:obj['cacheTag']=NEW
 if 'version' in obj:obj['version']=NEWVER
 if 'release' in obj:obj['release']='H104 Indexed Read Model (Staging)'
 p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Integrated H104 on H103')
