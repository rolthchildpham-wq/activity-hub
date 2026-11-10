#!/usr/bin/env python3
"""Append strictly-scoped v2 read-model rules to existing Topkey rules.
Does not deploy anything. Canonical rule expressions are never changed.
"""
import json,sys
from pathlib import Path

def patch(path):
    p=Path(path); source=json.loads(p.read_text(encoding='utf-8'))
    roots=source['rules']; count=0
    auth_root='topkey_badminton_vnext_2026'
    role=f"root.child('{auth_root}/users').child(auth.uid).child('role').val()"
    modules=f"root.child('{auth_root}/users').child(auth.uid).child('permissions/modules')"
    admin=f"(auth != null && {role} === 'ADMIN')"
    edit=f"(auth != null && ({role} === 'ADMIN' || {modules}.child('teams').val() === 'edit' || {modules}.child('schedule').val() === 'edit' || {modules}.child('umpire').val() === 'edit' || {modules}.child('finance').val() === 'edit'))"
    for name, item in roots.items():
        if not name.startswith('topkey_') or not isinstance(item,dict) or 'tournaments' not in item:continue
        base=item['tournaments'].get('$tid')
        if not base or not all(k in base for k in ('teams','matches','finance')): continue
        oldTeams,oldMatches,oldFinance=(base[x] for x in ('teams','matches','finance'))
        teamRead=oldTeams.get('.read',False);teamWrite=oldTeams.get('.write',False)
        matchRead=oldMatches.get('.read',False);matchWrite=oldMatches.get('$mid',{}).get('.write') or oldMatches.get('.write',False)
        financeRead=oldFinance.get('.read',False);financeWrite=oldFinance.get('.write',False)
        # Keep court-scoped referee permission for writes of a full indexed row.
        if isinstance(matchWrite,str) and 'newData' in matchWrite:
            deleteWrite=matchWrite.replace('newData', 'data')
            matchWrite=f'({matchWrite}) || (!newData.exists() && ({deleteWrite}))'
        leafMatch={'$row':{'.write':matchWrite}}
        base['_v2']={
            'meta':{'.read':'auth != null','.write':admin,
                'active':{'.write':admin,'.validate':'newData.isBoolean()'},
                'complete':{'.write':admin,'.validate':'newData.isBoolean()'},
                'aggregatesTrusted':{'.write':edit,'.validate':'newData.isBoolean()'},
                'rankingsTrusted':{'.write':edit,'.validate':'newData.isBoolean()'},
                '$other':{'.write':admin}},
            'aggregates':{'.read':financeRead,'.write':admin,
                'teams':{'.write':admin},'matches':{'.write':admin},'finance':{'.write':admin}},
            'tables':{'.write':admin,
                'teams':{'byName':{'.read':teamRead,'.write':teamWrite},'byCategoryName':{'.read':teamRead,'.write':teamWrite}},
                'matches':{'byTime':{'.read':matchRead,**leafMatch},
                    'byDay':{'.read':matchRead,'$day':leafMatch},
                    'byStatus':{'.read':matchRead,'$status':leafMatch},
                    'byDayStatus':{'.read':matchRead,'$day':{'$status':leafMatch}}},
                'finance':{'byTime':{'.read':financeRead,'.write':financeWrite},'byDay':{'.read':financeRead,'$day':{'.write':financeWrite}}}
            }
        }
        count+=1
    p.write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('v2 rules added for',count,'sports in',p)
    if count not in (1,7):raise SystemExit('expected 1 or 7 sports')
if __name__=='__main__':
 for x in sys.argv[1:]:patch(x)
