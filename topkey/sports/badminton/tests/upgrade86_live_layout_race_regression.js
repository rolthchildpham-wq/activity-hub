const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const u77=fs.readFileSync(path.join(root,'src/upgrade77.js'),'utf8');
const u84=fs.readFileSync(path.join(root,'src/upgrade84.js'),'utf8');
const u85=fs.readFileSync(path.join(root,'src/upgrade85.js'),'utf8');
const u86=fs.readFileSync(path.join(root,'src/upgrade86.js'),'utf8');
const css=fs.readFileSync(path.join(root,'upgrade86.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const registry=JSON.parse(fs.readFileSync(path.join(root,'FEATURE_REGISTRY.json'),'utf8'));
const contract=JSON.parse(fs.readFileSync(path.join(root,'REGRESSION_CONTRACT.json'),'utf8'));
assert(html.indexOf('src/upgrade84.js')<html.indexOf('src/upgrade85.js')&&html.indexOf('src/upgrade85.js')<html.indexOf('src/upgrade86.js'),'Upgrade86 must load after U84/U85');
assert(html.includes('upgrade86.css'),'Upgrade86 CSS missing');
assert(u77.includes('page.appendChild(card)')&&u77.includes('TopkeyUpgrade84?.ensureLayout'),'late replay creation must immediately re-run Live-first layout');
assert(u86.includes("observer.observe(page,{childList:true})")&&!u86.includes("subtree:true")&&!u86.includes("document.body,{"),'race guard must watch only direct Live children, not whole DOM');
assert(u86.includes("n?.id==='tk77-replay-card'")&&u86.includes('replay.parentElement!==left'),'late replay guard missing');
assert(u86.includes("setTimeout(ensureLayout,90)")&&u86.includes("setTimeout(ensureLayout,240)"),'async settle checks missing');
assert(!/App\.score\s*=|queueSet\(|queueMulti\(/.test(u86),'Upgrade86 must not mutate score/Firebase');
assert(css.includes('#tk84-live-left>#tk77-replay-card'),'left-column CSS lock missing');
for(const f of ['./upgrade86.css','./src/upgrade86.js','./tests/upgrade86_live_layout_race_regression.js'])assert(sw.includes(f),`SW missing ${f}`);
assert(registry.features.some(x=>x.id==='LIVE_LAYOUT_RACE_GUARD_001'),'registry missing LIVE_LAYOUT_RACE_GUARD_001');
assert(contract.tests.some(x=>x.id==='LIVE_LAYOUT_RACE_GUARD_001'&&x.required),'contract missing LIVE_LAYOUT_RACE_GUARD_001');

// Dynamic regression: U84 arranged the workspace before replay existed; later U77 appends replay directly to page.
class Node{
  constructor(id){this.id=id;this.children=[];this.parentElement=null;this.dataset={};}
  appendChild(n){if(n.parentElement){const a=n.parentElement.children,i=a.indexOf(n);if(i>=0)a.splice(i,1)}this.children.push(n);n.parentElement=this;return n}
  insertBefore(n,ref){if(n.parentElement){const a=n.parentElement.children,i=a.indexOf(n);if(i>=0)a.splice(i,1)}const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(n);else this.children.splice(i,0,n);n.parentElement=this;return n}
}
const page=new Node('page-live'),grid=new Node('tk84-live-layout'),left=new Node('tk84-live-left'),viewer=new Node('tk84-viewer-card'),source=new Node('tk84-source-card'),blv=new Node('tk84-blv-card'),replay=new Node('tk77-replay-card');
page.appendChild(grid);grid.appendChild(left);left.appendChild(viewer);left.appendChild(source);grid.appendChild(blv);page.appendChild(replay); // exact bad state seen in Upgrade85 screenshot
const nodes=Object.fromEntries([page,grid,left,viewer,source,blv,replay].map(n=>[n.id,n]));
const documentMock={documentElement:{dataset:{}},getElementById:id=>nodes[id]||null};
const windowMock={Topkey:{App:{currentTab:'overview'},U:{}},TopkeyUpgrade84:{ensureLayout:()=>true},TopkeyUpgrade85:{installed:true}};
const context={window:windowMock,document:documentMock,navigator:{},location:{protocol:'file:'},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>{fn();return 1},setTimeout:()=>0,console};
vm.runInNewContext(u86,context);
assert(windowMock.TopkeyUpgrade86?.installed,'Upgrade86 mock install failed');
assert.strictEqual(replay.parentElement,page,'precondition: replay should start outside left column');
assert.strictEqual(windowMock.TopkeyUpgrade86.ensureLayout(),true,'layout repair should succeed');
assert.strictEqual(replay.parentElement,left,'late-created replay must be re-parented into Live-left column');
assert.deepStrictEqual(left.children.map(x=>x.id),['tk84-viewer-card','tk84-source-card','tk77-replay-card'],'desktop left order must remain Viewer -> Source -> Replay');
console.log('upgrade86 live-layout race regression: PASS · delayed replay is repaired into Viewer -> Source -> Replay left column');
