from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
module=(root/'sports/vnext/src/upgrade122-hotfix88-officials.js').read_text()
base='''<!doctype html><html><head><style>.hidden{display:none}.btn{padding:5px}.field{margin:4px}.split{display:flex}.official-board{padding:10px}</style></head><body><section id="page-umpire"><div class="card"><select id="umpire-court"><option value="c1">Sân 1</option></select><div id="umpire-board"></div><div id="set-actions"></div></div></section></body></html>'''

def harness(sport):
    mode='score' if sport=='football' else 'sets'
    active="{matchId:'m1',courtId:'c1',scoreA:1,scoreB:0,started:true,startedAt:Date.now()-65000,history:[],updatedAt:Date.now()}" if sport=='football' else "{matchId:'m1',courtId:'c1',sets:[{a:12,b:10,finished:false}],setIndex:0,started:true,startedAt:Date.now()-65000,history:[],updatedAt:Date.now()}"
    rules="{winPoints:3,drawPoints:1,lossPoints:0}" if sport=='football' else "{bestOf:5,points:25,decidingPoints:15,winBy:2,cap:99}"
    return f'''window.Topkey={{}};const T=window.Topkey;
T.SPORT={{key:'{sport}',name:'X',mode:'{mode}',rules:{rules}}};T.DEFAULT_RULES=T.SPORT.rules;
T.U={{clone:v=>JSON.parse(JSON.stringify(v)),toast:()=>{{}},confirmDanger:async()=>true}};
T.Auth={{user:{{uid:'u1'}},role:()=> 'ADMIN'}};
const active={active};
T.App={{currentCourt:'c1',state:{{activeMatches:{{c1:active}},matches:{{m1:{{id:'m1',code:'M001',teamAId:'A',teamBId:'B',date:'2026-11-07',time:'09:00'}}}},teams:{{A:{{name:'Alpha'}},B:{{name:'Beta'}}}},courts:{{c1:{{id:'c1',name:'Sân 1'}}}},config:{{rules:{rules}}}}},teamName:id=>T.App.state.teams[id]?.name||id,renderOfficial(){{}},score:async(side,delta)=>{{const s=T.App.state.activeMatches.c1;if('{mode}'==='score')s[side==='A'?'scoreA':'scoreB']=Math.max(0,Number(s[side==='A'?'scoreA':'scoreB']||0)+delta);else{{const q=s.sets[s.setIndex];q[side==='A'?'a':'b']=Math.max(0,Number(q[side==='A'?'a':'b']||0)+delta)}};T.App.renderOfficial()}},nextSet:async()=>{{const s=T.App.state.activeMatches.c1;s.setIndex++;s.sets.push({{a:0,b:0,finished:false}});T.App.renderOfficial()}},undo:async()=>{{}},endMatch:async()=>{{window.__ended=true}},logEvent:async()=>{{}},renderLiveScore(){{}},renderSpectator(){{}}}};
T.Data={{path:x=>x,queueSet:async(path,v)=>{{if(path.startsWith('activeMatches/'))T.App.state.activeMatches.c1=v;if(path.includes('/officialMeta'))T.App.state.matches.m1.officialMeta=v}},queueMulti:async(up)=>{{for(const [path,v] of Object.entries(up)){{if(path.includes('activeMatches/c1'))T.App.state.activeMatches.c1=v;if(path.includes('matches/m1/officialMeta'))T.App.state.matches.m1.officialMeta=v}}}}}};'''

with sync_playwright() as p:
    b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    # Football
    pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)));pg.set_content(base);pg.add_script_tag(content=harness('football'));pg.add_script_tag(content=module);pg.evaluate('Topkey.App.renderOfficial()');
    txt=pg.locator('#umpire-board').inner_text()
    for token in ['LIVE CONSOLE TRỌNG TÀI BÓNG ĐÁ','Bàn thắng','Thẻ vàng','Thẻ đỏ','Thay người','Chuyển hiệp','Kết thúc trận đấu']:
        assert token.lower() in txt.lower(), (token,txt)
    pg.click('[data-tk90-score="1"][data-side="A"]');assert pg.evaluate('Topkey.App.state.activeMatches.c1.scoreA')==2
    pg.click('[data-ev="YELLOW"][data-side="A"]');pg.fill('#tk88o-form [name=player]','10');pg.fill('#tk88o-form [name=minute]','15');pg.locator('#tk88o-form').evaluate('f=>f.requestSubmit()');pg.wait_for_timeout(30)
    assert pg.evaluate('Topkey.App.state.activeMatches.c1.officialMeta.cards.A.yellow')==1
    old=pg.evaluate('Topkey.App.state.activeMatches.c1.officialMeta.period');pg.click('#tk90-next-period');pg.wait_for_timeout(30);new=pg.evaluate('Topkey.App.state.activeMatches.c1.officialMeta.period');assert old=='1H' and new=='2H'
    assert not errs, errs
    print('PASS football referee console goal/cards/substitution/period')
    # Volleyball
    pg2=b.new_page();errs2=[];pg2.on('pageerror',lambda e:errs2.append(str(e)));pg2.set_content(base);pg2.add_script_tag(content=harness('volleyball'));pg2.add_script_tag(content=module);pg2.evaluate('Topkey.App.renderOfficial()');
    txt=pg2.locator('#umpire-board').inner_text()
    for token in ['LIVE CONSOLE TRỌNG TÀI BÓNG CHUYỀN','Set thắng','Timeout','Thay người','Giao bóng','Cảnh cáo / phạt','Set tiếp']:
        assert token.lower() in txt.lower(), (token,txt)
    pg2.click('[data-tk90-score="1"][data-side="B"]');assert pg2.evaluate('Topkey.App.state.activeMatches.c1.sets[0].b')==11
    pg2.click('[data-ev="TIMEOUT"][data-side="A"]');pg2.wait_for_timeout(30);assert pg2.evaluate('Topkey.App.state.activeMatches.c1.officialMeta.setMeta["0"].timeouts.A')==1
    pg2.click('[data-ev="SERVE"][data-side="B"]');pg2.wait_for_timeout(30);assert pg2.evaluate('Topkey.App.state.activeMatches.c1.officialMeta.serve')=='B'
    assert not errs2, errs2
    print('PASS volleyball referee console points/timeout/substitution/serve/sanction')
    b.close()
print('REFEREE_CONSOLE_H90_OK')
