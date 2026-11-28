'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('topkey/sports/vnext/src/public-viewer-h137.js','utf8');
const app=fs.readFileSync('topkey/sports/vnext/src/app.js','utf8');
const runtime=fs.readFileSync('topkey/sports/vnext/src/live-state-h143.js','utf8');
const bootstrap=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');

function createHarness(stream={type:'EMBED',status:'LIVE',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}){
 const nodes={},callbacks={},created=[];
 function elem(tag='div'){
  const x={tagName:tag.toUpperCase(),children:[],textContent:'',className:'',style:{},parent:null,
   classList:{add(){},remove(){},toggle(){}},setAttribute(){},after(){},
   append(...items){items.forEach(i=>{i.parent=this;this.children.push(i)})},
   appendChild(item){item.parent=this;this.children.push(item)},
   replaceChildren(...items){this.children=[];this.append(...items)},
   remove(){if(this.parent)this.parent.children=this.parent.children.filter(i=>i!==this)},
   querySelector:()=>null,
   closest(selector){let node=this;while(node){if(selector==='.card'&&String(node.className||'').split(/\s+/).includes('card'))return node;node=node.parent||null;}return null;}};
  created.push(x);return x;
 }
 for(const id of ['public-spectator','spectator-schedule','spectator-live','spectator-title','login-screen','app-shell'])nodes[id]=elem();
 const liveCard=elem();liveCard.className='card';liveCard.appendChild(nodes['spectator-live']);
 const viewerGrid=elem();viewerGrid.className='grid g2';
 const viewerHeader=elem();viewerHeader.className='split';
 nodes['public-spectator'].querySelector=selector=>selector==='.grid.g2'?viewerGrid:selector==='.split'?viewerHeader:null;
 const data={
  matches:{m1:{id:'m1',code:'M001',teamAId:'t1',teamBId:'t2',status:'LIVE',courtId:'c1'}},
  teams:{t1:{name:'Đội Xanh'},t2:{name:'Đội Đỏ'}},
  courts:{c1:{id:'c1',name:'Sân 1',stream}},
  activeMatches:{c1:{matchId:'m1',started:true,scoreA:1,scoreB:2}}
 };
 const ref={child:key=>({on:(event,callback)=>{callbacks[key]=callback;callback({val:()=>data[key]})}})};
 const document={getElementById:id=>nodes[id],documentElement:{classList:{add(){}}},head:elem('head'),createElement:elem};
 const sandbox={document,console,URLSearchParams,URL,setTimeout:()=>0,
  location:{search:'?sport=football&tid=main_2026',href:'https://example.com/'},
  window:{requestAnimationFrame:cb=>cb(),TopkeyPlatform:{loadFirebase:async()=>{}},
    Topkey:{FIREBASE_CONFIG:{apiKey:'mock'}},firebase:{database:()=>({ref:()=>ref})}}};
 vm.runInNewContext(src,sandbox,{timeout:2000});
 const flush=()=>new Promise(setImmediate);
 const update=(key,value)=>{data[key]=value;callbacks[key]({val:()=>value})};
 return {nodes,callbacks,created,data,flush,update};
}

test('Viewer renders live score, player and updates score without restarting iframe',async()=>{
 const h=createHarness();await h.flush();
 const card=h.nodes['spectator-live'].children[0];
 assert.ok(card);
 assert.match(card.children[0].textContent,/Đội Xanh vs Đội Đỏ/);
 assert.match(card.children[2].textContent,/1 – 2/);
 const player=card.children[3].children[0];
 assert.equal(player.tagName,'IFRAME');
 assert.match(player.src,/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
 h.update('activeMatches',{c1:{matchId:'m1',started:true,scoreA:3,scoreB:4}});
 assert.match(card.children[2].textContent,/3 – 4/);
 assert.strictEqual(card.children[3].children[0],player,'score updates must not restart player');
});
test('Viewer shows set score and never treats local-only camera as remote video',async()=>{
 const h=createHarness({type:'CAMERA',status:'LOCAL_ONLY'});
 await h.flush();
 const card=h.nodes['spectator-live'].children[0];
 h.update('activeMatches',{c1:{matchId:'m1',started:true,setIndex:1,sets:[{a:25,b:17},{a:7,b:8}]}});
 assert.match(card.children[2].textContent,/SET 2: 7 – 8/);
 assert.match(card.children[3].children[0].textContent,/Camera đang mở cục bộ/);
 assert.equal(h.created.filter(x=>x.tagName==='IFRAME').length,0);
});
test('Source rejects unsupported embed and no viewer writes',()=>{
 assert.match(src,/safeMediaUrl\(raw,type\)/);
 assert.match(src,/youtube-nocookie/);
 assert.match(src,/player\.vimeo/);
 assert.match(src,/loadHls\(\)/);
 assert.doesNotMatch(src,/(?:queueSet|queueMulti|ref\.set\(|ref\.update\()/);
});
test('Admin opens local camera before state change and does not mark it public LIVE',()=>{
 const begin=app.indexOf('async applyStream(){'),end=app.indexOf('},pauseLive(){',begin);
 assert.ok(begin>0 && end>begin);
 const live=app.slice(begin,end);
 assert.match(live,/facingMode:\{ideal:'environment'\}/);
 assert.match(live,/status:'LOCAL_ONLY'/);
 assert.match(live,/STREAM_LOCAL_PREVIEW/);
 assert.match(live,/if\(!isHttps/);
});

test('Production prebuilt runtime loads H143 guard and anonymous spectator player',()=>{
 assert.match(html,/live-state-h143\.js\?v=h143-20261121/);
 assert.match(html,/public-viewer-h137\.js\?v=h143-20261121/);
 assert.ok(/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/.test(html));
 assert.match(runtime,/app\.applyStream=async function/);
 assert.match(runtime,/status:'LOCAL_ONLY'/);
 assert.doesNotMatch(runtime,/\.ref\([^)]*webrtc/);
});
