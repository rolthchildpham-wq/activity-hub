from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
mock=r'''const __RealDate=Date; window.Date=class extends __RealDate{constructor(...a){super(...(a.length?a:['2026-11-07T12:00:00+07:00']))}static now(){return new __RealDate('2026-11-07T12:00:00+07:00').getTime()}static parse(v){return __RealDate.parse(v)}static UTC(...a){return __RealDate.UTC(...a)}}; window.Topkey={};
const T=window.Topkey;
T.SPORT={key:'volleyball',name:'Bóng chuyền',mode:'sets',categories:['OPEN'],stages:['GROUP','SEMIFINAL','FINAL'],eventLabel:'Trận',participantLabel:'Đội',rules:{bestOf:5}};
T.MATCH_STATUSES=['SCHEDULED','LIVE','FINISHED','WALKOVER','CANCELLED','SUSPENDED']; T.DEFAULT_RULES={bestOf:5};
T.Auth={role:()=> 'ADMIN',profile:{role:'ADMIN'},user:{uid:'test'}};
T.Data={ready:false,read:async()=>null,queueSet:async()=>{},queueMulti:async()=>{},audit:async()=>{},listen:()=>()=>{},path:x=>x};
T.U={toast:()=>{},confirmDanger:async()=>true,money:n=>String(n),setText:()=>{},download:()=>{}};
const teams={A:{id:'A',name:'Volley Alpha'},B:{id:'B',name:'Volley Beta'},C:{id:'C',name:'Volley Gamma'},D:{id:'D',name:'Volley Delta'},E:{id:'E',name:'Volley Epsilon'},F:{id:'F',name:'Volley Zeta'},G:{id:'G',name:'Volley Eta'},H:{id:'H',name:'Volley Theta'}};
const mk=(id,code,date,time,stage,status,a,b,sets=[])=>({id,code,date,time,stage,status,teamAId:a,teamBId:b,sets});
const matches={m003:mk('m003','M003','2026-11-03','01:00','GROUP','FINISHED','E','F',[{a:25,b:18}]),m005:mk('m005','M005','2026-11-03','12:00','GROUP','WALKOVER','B','D',[{a:25,b:18}]),m001:mk('m001','M001','2026-11-03','08:00','SEMIFINAL','FINISHED','A','B',[{a:25,b:18}]),m004:mk('m004','M004','2026-11-04','11:00','SEMIFINAL','FINISHED','A','C',[{a:25,b:18}]),m006:mk('m006','M006','2026-11-04','13:00','FINAL','FINISHED','E','A',[{a:18,b:25}]),m002:mk('m002','M002','2026-11-04','09:00','GROUP','LIVE','C','D',[{a:18,b:25}]),m008:mk('m008','M008','2026-11-05','10:00','GROUP','SCHEDULED','A','D',[{a:25,b:18}]),m009:mk('m009','M009','2026-11-05','10:00','SEMIFINAL','FINISHED','B','E',[{a:18,b:25}]),m007:mk('m007','M007','2026-11-05','09:00','GROUP','WALKOVER','G','H',[]),m010:mk('m010','M010','2026-11-06','13:00','FINAL','FINISHED','A','E',[{a:25,b:18}]),m011:mk('m011','M011','2026-11-06','15:00','GROUP','LIVE','C','F',[]),m012:mk('m012','M012','2026-11-07','09:00','GROUP','SCHEDULED','G','H',[])};
T.App={state:{matches,teams,courts:{c1:{name:'Sân 1'}},activeMatches:{},config:{rules:{bestOf:5}}},matchLabel(m){return this.teamName(m.teamAId)+' vs '+this.teamName(m.teamBId)},teamName(id){return teams[id]?.name||id},resultLabel(m){return (m.sets||[]).map(s=>s.a+'-'+s.b).join(' | ')||'—'},ranking(){return[]},formatTime:x=>String(x),setMatchStatus:async()=>{},seedIfEmpty:async()=>{},toggleWithdraw:async()=>{},renderFinance(){},renderAll(){},showTab(){}};'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page=b.new_page()
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content('<table><tbody id="matches-list"></tbody></table><div id="test-output"></div>')
    page.add_script_tag(content=mock)
    for rel in ['sports/vnext/src/upgrade12.js','sports/vnext/src/upgrade122-hotfix58.js','sports/vnext/src/upgrade122-hotfix86.js']:
        page.add_script_tag(content=(root/rel).read_text())
    page.evaluate('Topkey.App.renderMatches()')
    result=page.evaluate(r'''() => { const seq=[];let current='';const bad=[];for(const tr of document.querySelectorAll('#matches-list > tr')){if(tr.classList.contains('tk12-day-row')){current=tr.querySelector('b')?.textContent||'';seq.push('H:'+current);continue;}const code=(tr.cells[0]?.textContent.match(/M\d+/)||[])[0]||'';const id=tr.dataset.matchId||'';const m=Topkey.App.state.matches[id];seq.push('M:'+code);if(!m||!current.includes(m.date.split('-').reverse().join('/')))bad.push({code,current,date:m?.date});}const stages=Object.fromEntries([...document.querySelectorAll('#matches-list tr.tk12-match-row')].map(tr=>[(tr.cells[0].textContent.match(/M\d+/)||[''])[0],tr.cells[2].textContent]));const statuses=Object.fromEntries([...document.querySelectorAll('#matches-list tr.tk12-match-row')].map(tr=>[(tr.cells[0].textContent.match(/M\d+/)||[''])[0],tr.cells[5].textContent.trim()]));const expected=['H:⭐ HÔM NAY · 07/11/2026','M:M012','H:03/11/2026','M:M003','M:M001','M:M005','H:04/11/2026','M:M002','M:M004','M:M006','H:05/11/2026','M:M008','M:M009','M:M007','H:06/11/2026','M:M010','M:M011'];return {pass:bad.length===0 && JSON.stringify(seq)===JSON.stringify(expected) && stages.M001==='Bán kết' && stages.M010==='Chung kết' && stages.M003==='Vòng bảng' && statuses.M012==='Chưa thi đấu' && statuses.M011==='Đang thi đấu',seq,bad,stages,statuses};}''')
    print('volleyball=',result)
    print('volleyball_pageerrors=',errors)
    if not result['pass'] or errors: raise SystemExit(1)
    # Football uses the same VNext schedule renderer; run a second fresh page so the sport constants are captured independently.
    page2=b.new_page(); errors2=[]; page2.on('pageerror', lambda e: errors2.append(str(e)))
    page2.set_content('<table><tbody id="matches-list"></tbody></table><div id="test-output"></div>')
    mock2=mock.replace("key:'volleyball',name:'Bóng chuyền',mode:'sets'","key:'football',name:'Bóng đá',mode:'score'")
    page2.add_script_tag(content=mock2)
    for rel in ['sports/vnext/src/upgrade12.js','sports/vnext/src/upgrade122-hotfix58.js','sports/vnext/src/upgrade122-hotfix86.js']:
        page2.add_script_tag(content=(root/rel).read_text())
    page2.evaluate('Topkey.App.renderMatches()')
    result2=page2.evaluate(r'''() => { const seq=[];let current='';const bad=[];for(const tr of document.querySelectorAll('#matches-list > tr')){if(tr.classList.contains('tk12-day-row')){current=tr.querySelector('b')?.textContent||'';seq.push('H:'+current);continue;}const code=(tr.cells[0]?.textContent.match(/M\d+/)||[])[0]||'';const id=tr.dataset.matchId||'';const m=Topkey.App.state.matches[id];seq.push('M:'+code);if(!m||!current.includes(m.date.split('-').reverse().join('/')))bad.push({code,current,date:m?.date});}const expected=['H:⭐ HÔM NAY · 07/11/2026','M:M012','H:03/11/2026','M:M003','M:M001','M:M005','H:04/11/2026','M:M002','M:M004','M:M006','H:05/11/2026','M:M008','M:M009','M:M007','H:06/11/2026','M:M010','M:M011'];return {pass:bad.length===0 && JSON.stringify(seq)===JSON.stringify(expected),seq,bad};}''')
    print('football=',result2); print('football_pageerrors=',errors2)
    b.close()
    if not result2['pass'] or errors2: raise SystemExit(1)
