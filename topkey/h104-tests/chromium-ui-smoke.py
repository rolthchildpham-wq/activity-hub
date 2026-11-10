#!/usr/bin/env python3
import asyncio,json,subprocess
from pathlib import Path
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1]
model=json.loads(subprocess.check_output(['node','-e',r'''
const V=require(process.argv[1]);const teams={},matches={},finance={};for(let i=0;i<330;i++){const id='t'+String(i).padStart(3,'0');teams[id]={id,name:'Team '+i,category:'MIX'};const mid='m'+String(i).padStart(3,'0');matches[mid]={id:mid,code:'M'+i,teamAId:id,teamBId:'t'+String((i+1)%330).padStart(3,'0'),date:'2026-11-'+String(1+i%28).padStart(2,'0'),time:'10:00',status:'FINISHED',winnerId:id,sets:[{a:21,b:12}]};const f='f'+String(i).padStart(3,'0');finance[f]={id:f,date:'2026-11-08',time:'12:00',amount:10000+i,type:i%2?'INCOME':'EXPENSE',status:'PAID'}}const m=V.createReadModel({teams,matches,finance},'root');m.meta.complete=true;m.meta.active=true;process.stdout.write(JSON.stringify(m));
''',str(root/'h104-v2-engine.js')]))
page_html='''<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<div id="app-shell"><section id="page-overview"><div class="card"><span id="kpi-teams">0</span><span id="kpi-ready">0</span><span id="kpi-finished">0</span><table><tbody id="standings-list"></tbody></table></div></section>
<section id="page-teams"><div class="card"><span id="team-count">0</span><div class="table-wrap"><table><tbody id="teams-list"></tbody></table></div><div id="checkin-list"></div></div></section>
<section id="page-schedule"><div class="card"><div class="table-wrap"><table><tbody id="matches-list"></tbody></table></div></div></section>
<section id="page-finance"><div class="card"><strong id="finance-income">0</strong><strong id="finance-expense">0</strong><strong id="finance-balance">0</strong><div class="table-wrap"><table><tbody id="finance-list"></tbody></table></div></div></section></div>
</body></html>'''
mock=r'''
window.__log={listeners:[],readQueries:[],rankCalls:0};
const DATA=window.__data;
const at=(path)=>{let d=DATA;for(const k of path.split('/').filter(Boolean))d=d?.[k];return d||{}};
class Q{
 constructor(path,opts={}){this.path=path;this.opts=opts;this.events={}}copy(p){return new Q(this.path,{...this.opts,...p})}
 orderByKey(){return this}startAt(x){return this.copy({start:x})}endAt(x){return this.copy({end:x})}
 limitToLast(x){return this.copy({last:x})}limitToFirst(x){return this.copy({first:x})}
 async once(){window.__log.readQueries.push(this.path);let a=Object.entries(at(this.path)).sort(([a],[b])=>a.localeCompare(b,'en'));if(this.opts.start)a=a.filter(([k])=>k>=this.opts.start);if(this.opts.end)a=a.filter(([k])=>k<=this.opts.end);if(this.opts.first)a=a.slice(0,this.opts.first);if(this.opts.last)a=a.slice(-this.opts.last);return{forEach(cb){for(const [key,val] of a)cb({key,val:()=>val})}}}
 on(ev,cb){window.__log.listeners.push(this.path+':'+ev);this.events[ev]=cb}off(){}
}
window.Topkey={SPORT:{key:'badminton',categories:['MIX']},Data:{ready:true,connected:true,tid:'main_2026',path(p=''){return 'topkey_badminton_vnext_2026/tournaments/main_2026'+(p?'/'+p:'')},ref(p){return new Q(p)},listen(path,cb){window.__log.listeners.push(path+':value');if(path==='_v2/meta')queueMicrotask(()=>cb(DATA._v2.meta));else if(path==='_v2/aggregates')queueMicrotask(()=>cb(DATA._v2.aggregates));else queueMicrotask(()=>cb({}));return()=>{}},read(p){return Promise.resolve(at(p))},queueMulti(updates){return Promise.resolve(updates)}},Auth:{role(){return 'ADMIN'},can(){return true},user:{uid:'test'}},U:{money:n=>String(n)+' đ'}};
window.Topkey.App={currentTab:'overview',state:{teams:{},matches:{},finance:{},activeMatches:{}},offs:[],renderAll(){},renderConfig(){},renderHealth(){},renderSelectors(){},renderCheckin(){},renderLiveScore(){},renderBranch(){},renderTeams(){const b=document.getElementById('teams-list');b.replaceChildren();for(const x of Object.values(this.state.teams||{})){let r=document.createElement('tr'),c=document.createElement('td');c.textContent=x.name;r.appendChild(c);b.appendChild(r)}},renderMatches(){const b=document.getElementById('matches-list');b.replaceChildren();for(const x of Object.values(this.state.matches||{})){let r=document.createElement('tr');r.dataset.matchId=x.id;for(const text of [x.code,x.teamAId+' vs '+x.teamBId]){let c=document.createElement('td');c.textContent=text;r.appendChild(c)}b.appendChild(r)}},renderFinance(){const b=document.getElementById('finance-list');b.replaceChildren();for(const x of Object.values(this.state.finance||{})){let r=document.createElement('tr'),c=document.createElement('td');c.textContent=String(x.amount);r.appendChild(c);b.appendChild(r)}},renderOverview(){},renderStandings(){window.__log.rankCalls++},showTab(tab){this.currentTab=tab},subscribe(){window.__log.listeners.push('legacy-subscribe')}};
'''
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1200,'height':800});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(page_html)
  await page.evaluate('(data)=>{window.__data={_v2:data,teams:{},matches:{},finance:{}}}',model)
  await page.add_script_tag(content=mock)
  await page.add_script_tag(content=(root/'h104-v2-engine.js').read_text())
  await page.add_script_tag(content=(root/'h104-indexed-runtime.js').read_text())
  await page.evaluate('window.Topkey.App.subscribe()')
  await page.wait_for_function("window.TopkeyH104.state.teams.loaded && window.TopkeyH104.state.matches.loaded")
  results=await page.evaluate('''() => ({teams:Object.keys(Topkey.App.state.teams).length,matches:Object.keys(Topkey.App.state.matches).length,teamComplete:TopkeyH104.state.teams.complete, matchComplete:TopkeyH104.state.matches.complete, totalTeams:document.querySelector('#kpi-teams').textContent, badFullListeners:__log.listeners.filter(x=>/^(teams|matches|finance):value$/.test(x)), winnerBadges:document.querySelectorAll('.h104-winner').length, indexedQueries:__log.readQueries})''')
  assert results['teams']==120,results
  assert results['matches']==120,results
  assert not results['teamComplete'] and not results['matchComplete'],results
  assert results['totalTeams']=='330',results
  assert not results['badFullListeners'],results
  assert results['winnerBadges']>0,results
  assert all(q.startswith('_v2/tables/') for q in results['indexedQueries']),results
  print('PASS Chrome index pages/summary/no-full-listener/winner badges', {k:v for k,v in results.items() if k!='indexedQueries'})
  await page.evaluate('Topkey.App.showTab("finance")')
  await page.wait_for_function('window.TopkeyH104.state.finance.loaded')
  result2=await page.evaluate('''() => ({finance:Object.keys(Topkey.App.state.finance).length, income:document.querySelector('#finance-income').textContent, hasMore:TopkeyH104.state.finance.hasMore, controls:!!document.querySelector('#h104-finance-controls')})''')
  assert result2['finance']==120 and result2['hasMore'] and result2['controls'],result2
  assert result2['income']==str(model['aggregates']['finance']['income'])+' đ',result2
  print('PASS Chrome finance page, true aggregate totals',result2)
  await page.evaluate('Topkey.App.showTab("schedule");Topkey.App.renderStandings()')
  result3=await page.evaluate('''() => ({blocked:document.querySelector('#standings-list').textContent.includes('BXH toàn giải'),calls:__log.rankCalls})''')
  assert result3['blocked'] and result3['calls']==0,result3
  print('PASS Chrome blocks incorrect standings on partial data')
  await page.screenshot(path='/mnt/data/H104_Chrome_UI_Smoke.png')
  assert not errors,errors
  print('PASS no browser JavaScript runtime exceptions; screen captured')
  await browser.close()
if __name__=='__main__':asyncio.run(main())
