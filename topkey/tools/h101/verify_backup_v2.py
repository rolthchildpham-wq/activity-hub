#!/usr/bin/env python3
"""Offline, read-only preflight for TOPKEY backups; never connects to Firebase."""
import argparse, hashlib, json, pathlib, collections, sys

def digest(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
 return h.hexdigest()

def nodes(x): return x if isinstance(x,dict) else {}
def scan(p):
 root=json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
 data=nodes(root.get('data'))
 typ=root.get('type','UNKNOWN')
 out={'source':str(p),'sha256':digest(p),'type':typ,'exportedAt':root.get('exportedAt'),'tournaments':{},'issues':[]}
 if typ=='TOPKEY_SPORT_BACKUP_V2':
  ts=nodes(data.get('tournaments'))
  for tid,t in ts.items():
   t=nodes(t); teams=nodes(t.get('teams')); matches=nodes(t.get('matches')); finance=nodes(t.get('finance')); audit=nodes(t.get('audit'))
   counts={k:len(v) for k,v in [('teams',teams),('matches',matches),('finance',finance),('audit',audit)]}
   issues=[]
   for mid,m in matches.items():
    if not isinstance(m,dict): issues.append(f'{mid}: match not object');continue
    for key in ('teamAId','teamBId'):
     v=m.get(key)
     if v and v not in teams: issues.append(f'{mid}: {key} missing team {v}')
    wid=m.get('winnerId')
    if wid and wid not in (m.get('teamAId'),m.get('teamBId')): issues.append(f'{mid}: winnerId not a participant')
   out['tournaments'][tid]={'counts':counts,'issues':issues[:100],'issueCount':len(issues)}
 elif typ=='TOPKEY_SYSTEM_SHARED':
  out['counts']={k:len(nodes(data.get(k))) for k in ('users','rolePresets','security','tournamentIndex','associationDashboard')}
 else: out['issues'].append('Unknown backup type')
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('backups',nargs='+');ap.add_argument('--out');a=ap.parse_args()
 report={'schema':'TOPKEY_H101_READONLY_PREFLIGHT_V1','files':[scan(p) for p in a.backups], 'migrationExecuted':False,'productionWrites':False}
 s=json.dumps(report,ensure_ascii=False,indent=2)
 if a.out:pathlib.Path(a.out).write_text(s,encoding='utf-8')
 else:print(s)
 return 0
if __name__=='__main__':sys.exit(main())
