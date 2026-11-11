#!/usr/bin/env python3
"""Atomic-ish build stamping from release.json, the sole release authority.

Run before packing each release. It regenerates the 3 build manifests, the
browser release-runtime.js, and version stamps on entrypoint HTML and SW caches.
It does NOT rewrite business logic or Firebase records.
"""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parent.parent
SPORTS=('badminton','football','volleyball','running','handmade','shuttle','cooking')

def validate_rules_contract(require_mirror=True):
 canonical=root/'firebase.database.rules.json'
 try:
  rules=json.loads(canonical.read_text(encoding='utf-8'))['rules']
 except (OSError,KeyError,json.JSONDecodeError) as exc:
  raise SystemExit(f'Invalid canonical Firebase Database rules: {exc}')
 missing=[]
 for sport in SPORTS:
  namespace=f'topkey_{sport}_vnext_2026'
  branch=rules.get(namespace)
  if not isinstance(branch,dict) or not isinstance(branch.get('tournaments'),dict):
   missing.append(namespace)
 if not isinstance(rules.get('topkey_badminton_vnext_2026',{}).get('users'),dict):
  missing.append('topkey_badminton_vnext_2026/users (shared Auth root)')
 if missing:raise SystemExit('Firebase rules missing complete sport namespaces: '+', '.join(missing))
 if require_mirror:
  mirror=root/'sports/badminton/firebase.database.rules.json'
  if not mirror.is_file() or mirror.read_bytes()!=canonical.read_bytes():
   raise SystemExit('Firebase rules deployment mirror differs from canonical rules')
 return True

if '--validate-rules-only' in sys.argv:
 validate_rules_contract(require_mirror=True)
 print('Firebase rules contract valid for:',', '.join(SPORTS))
 raise SystemExit(0)

validate_rules_contract(require_mirror=False)
# This Firebase CLI project has ONE canonical ruleset for all sports. Preserve
# identical convenience copies in sports/badminton/ to prevent deployments of
# legacy badminton-only snapshots that could remove the other sport rules.
for rules_name in ('firebase.database.rules.json', 'firebase.storage.rules'):
 canonical=root/rules_name
 mirror=root/'sports/badminton'/rules_name
 if canonical.is_file() and mirror.parent.is_dir():
  mirror.write_bytes(canonical.read_bytes())
validate_rules_contract(require_mirror=True)
release=json.loads((root/'release.json').read_text(encoding='utf-8'))
need=('releaseId','build','cacheTag','version','release')
if any(not isinstance(release.get(k),str) or not release[k].strip() for k in need):
 raise SystemExit('release.json missing required release fields')
if not re.fullmatch(r'H[0-9]+',release['releaseId']):
 raise SystemExit('releaseId must be H followed by digits')
newtag=release['cacheTag']
previous=json.loads((root/'build.json').read_text(encoding='utf-8'))
oldtag=previous.get('cacheTag','')
oldversion=previous.get('version','')
old_release=re.search(r'H[0-9]+',previous.get('release',''))
old_id=old_release.group(0) if old_release else None
if not oldtag:raise SystemExit('Cannot identify previous build cacheTag')

# Cache busting and runtime version metadata must both derive from this manifest.
# Scan production JS/HTML only: tests and historical documentation remain unchanged.
for p in root.rglob('*'):
 if not p.is_file() or p.suffix not in ('.js','.html'):continue
 rel=p.relative_to(root).as_posix()
 if '/tests/' in '/'+rel or rel.startswith('tools/') or rel.startswith('vendor/') or rel.startswith('node_modules/'):continue
 text=p.read_text(encoding='utf-8')
 stamped=text.replace(oldtag,newtag)
 if oldversion:stamped=stamped.replace(oldversion,release['version'])
 if stamped!=text:p.write_text(stamped,encoding='utf-8')
# Preserve one shared authority for the entrypoint's runtime build version.
html=['index.html','system-admin.html','change-password.html',
      'sports/badminton/index.html','sports/vnext/index.html']
sw=['sw.js','sports/badminton/sw.js','sports/vnext/sw.js']
for item in html+sw:
 p=root/item
 s=p.read_text(encoding='utf-8')
 # Only replace the exact previous cache tag. Historical release notes unaffected.
 s=s.replace(oldtag,newtag)
 if item in sw:
  # Explicit cache id is the only SW version code and is generated from releaseId.
  s,num=re.subn(r"(?<=const CACHE=)'topkey-h[0-9]+-(hub|badminton|vnext)-(?:shell|auth-p5-[0-9]+)'",
                lambda m:repr('topkey-'+release['releaseId'].lower()+'-'+m.group(1)+'-shell'),s,count=1)
  if num!=1:raise SystemExit('Missing SW cache declaration in '+item)
 p.write_text(s,encoding='utf-8')

build={k:release[k] for k in ('build','cacheTag','version','release')}
for item in ('build.json','sports/badminton/build.json','sports/vnext/build.json'):
 (root/item).write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
meta={k:release[k] for k in ('releaseId','build','cacheTag','version')}
content=("/* Generated from release.json by tools/build_release.py. Do not edit manually. */\n"
 "(()=>{'use strict';\nconst meta=Object.freeze("+
 json.dumps(meta,ensure_ascii=False,separators=(',',':'))+
 ");\nObject.defineProperty(window,'TopkeyRelease',{value:meta,writable:false,configurable:false});\n"
 "window.__HUB_VERSION__=meta.cacheTag;\n})();\n")
(root/'release-runtime.js').write_text(content,encoding='utf-8')
for item in ('index.html','sports/badminton/index.html','sports/vnext/index.html'):
 src=(root/item).read_text(encoding='utf-8')
 if ('release-runtime.js?v='+newtag) not in src:
  raise SystemExit('Missing runtime script or stale version in '+item)
 if 'hub-entry-guard.js' in src and src.index('release-runtime.js')>src.index('hub-entry-guard.js'):
  raise SystemExit('Guard loads before shared runtime in '+item)
print('Release artifacts stamped:',release['releaseId'],newtag)
