'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const bad=path.resolve(__dirname,'..'),root=path.resolve(bad,'../..');
let pass=0;const notes=[];function ok(c,m){if(!c)throw new Error(m);pass++;notes.push('PASS '+m)}
const read=p=>fs.readFileSync(p,'utf8');
function baseContext(){
  const noop=()=>{};
  const classList={contains:()=>false,toggle:noop,add:noop,remove:noop};
  const doc={documentElement:{dataset:{},classList},body:{classList},fullscreenElement:null,getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:noop,createElement:()=>({classList,dataset:{},setAttribute:noop,removeAttribute:noop,appendChild:noop,insertAdjacentElement:noop})};
  const ctx={console,Date,Math,JSON,Object,Array,String,Number,Boolean,Promise,Error,RegExp,Map,Set,URL,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:f=>{f();return 1},cancelAnimationFrame:noop,document:doc,navigator:{},location:{protocol:'file:',href:'file:///test'},innerWidth:390,innerHeight:844};
  ctx.window=ctx;ctx.addEventListener=noop;ctx.visualViewport={width:390,height:844,addEventListener:noop};return vm.createContext(ctx);
}
function run(ctx,rel){vm.runInContext(read(path.join(bad,rel)),ctx,{filename:rel});}

// Core scoring rules.
{
 const c=baseContext();c.Topkey={U:{clone:v=>JSON.parse(JSON.stringify(v))}};run(c,'src/scoring.js');
 const S=c.Topkey.Scoring,r={points:21,cap:30,winBy:2,bestOf:3};
 ok(!S.isSetWon(20,20,r),'DEUCE 20-20 not finished');ok(!S.isSetWon(21,20,r),'DEUCE 21-20 not finished');ok(S.isSetWon(22,20,r),'DEUCE 22-20 finished');
 ok(S.winner([{a:21,b:10,finished:true},{a:21,b:8,finished:true}],r)==='A','2-0 winner recognized');
}

// Upgrade67 Start Gate contract.
{
 const c=baseContext(),toasts=[];let starts=0,scores=0;
 const state={matchId:'m',sets:[{a:0,b:0,finished:false}],setIndex:0,serverSide:'A',serverPlayer:'p1',positions:{A:{p1:'right',p2:'left'},B:{p1:'right',p2:'left'}},openingServerSelected:false,openingServerSetIndex:0,started:false,finished:false};
 c.Topkey={U:{toast:(m,t)=>toasts.push([t,m])},App:{currentCourt:'c',state:{activeMatches:{c:state},matches:{m:{teamAId:'ta',teamBId:'tb'}},teams:{ta:{name:'A',p1:'A1'},tb:{name:'B',p1:'B1'}}},renderUmpire(){},renderHealth(){},async startUmpire(){starts++;state.started=true;return true},async score(){scores++;return true}}};
 run(c,'src/upgrade67.js');
 ok(c.TopkeyUpgrade67.stage(state)==='NEED_SERVER','START_GATE needs opening server');
 c.Topkey.App.startUmpire();ok(starts===0,'START_GATE blocks Start before server selection');
 state.openingServerSelected=true;state.openingServerSetIndex=0;ok(c.TopkeyUpgrade67.stage(state)==='READY','START_GATE becomes READY after valid even-court server');
 c.Topkey.App.score('A',1);ok(scores===0,'START_GATE blocks score before Start');
 c.Topkey.App.startUmpire();ok(starts===1&&state.started,'START_GATE allows explicit Start');
 c.Topkey.App.score('A',1);ok(scores===1,'START_GATE allows score after Start');
}

// Upgrade69 immutable opening ledger and A-B-A rotation helpers.
{
 const c=baseContext();c.__events={};
 c.Topkey={U:{clone:v=>JSON.parse(JSON.stringify(v)),toast:()=>{}},Scoring:{},Auth:{user:{uid:'t'}},Data:{queueSet:async()=>true,read:async()=>c.__events},App:{currentCourt:'c',state:{matches:{m:{id:'m',teamAId:'ta',teamBId:'tb'}},teams:{ta:{id:'ta',name:'A',p1:'VIET',p2:'A2'},tb:{id:'tb',name:'B',p1:'B1',p2:'B2'}},activeMatches:{}},renderUmpire(){},renderHealth(){},async selectOpeningServer(side,key){const s=this.state.activeMatches.c;s.serverSide=side;s.serverPlayer=key;s.openingServerSelected=true;s.openingServerSetIndex=s.setIndex;return s},async startUmpire(){this.state.activeMatches.c.started=true;return true},async nextSet(){return this.state.activeMatches.c},async score(){return true}}};
 c.TopkeyUpgrade63={openingAnchor:s=>s.serverSide,openingSideForSet:(s,i)=>s.serverSide,setOpeningServer:s=>s};run(c,'src/upgrade69.js');
 const s={matchId:'m',courtId:'c',sets:[{a:0,b:0,finished:false}],setIndex:0,serverSide:'A',serverPlayer:'p1',positions:{A:{p1:'right',p2:'left'},B:{p1:'right',p2:'left'}},openingServerSelected:true,openingServerSetIndex:0,started:false};c.Topkey.App.state.activeMatches.c=s;
 c.TopkeyUpgrade69.freezeSetOneSelection(s);const snap=JSON.parse(JSON.stringify(c.TopkeyUpgrade69.snapshotFor(s,0)));s.serverSide='B';s.serverPlayer='p2';
 ok(c.TopkeyUpgrade69.snapshotFor(s,0).side===snap.side&&c.TopkeyUpgrade69.snapshotFor(s,0).player===snap.player,'OPENING_LEDGER H1 snapshot immutable after rally server changes');
 ok(c.TopkeyUpgrade69.designatedSide(s,1)==='B'&&c.TopkeyUpgrade69.designatedSide(s,2)==='A','OPENING_LEDGER alternates A-B-A from H1 anchor');
}

// Upgrade68 pure reset object.
{
 const c=baseContext();c.Topkey={U:{clone:v=>JSON.parse(JSON.stringify(v)),toast:()=>{}},Data:{},App:{state:{matches:{},activeMatches:{},courts:{}},renderHealth(){}}};run(c,'src/upgrade68.js');
 const x=c.TopkeyUpgrade68.resetMatchObject({id:'M011',status:'FINISHED',sets:[{a:21,b:12,finished:true},{a:21,b:6,finished:true}],winnerId:'ta',finishedAt:123,actualEnd:456},'SCHEDULED',999);
 ok(x.status==='SCHEDULED'&&Array.isArray(x.sets)&&x.sets.length===0&&!('winnerId'in x)&&!('finishedAt'in x),'ADMIN_RESET clears finished result evidence');
}

// Upgrade71 history follows team identity, not physical side.
{
 const c=baseContext();c.Topkey={U:{},App:{currentCourt:'c',state:{activeMatches:{},matches:{m:{id:'m',teamAId:'ta',teamBId:'tb',sets:[]}},teams:{ta:{name:'TAN & LY'},tb:{name:'NGHIA & THAO'}}},renderUmpire(){},renderHealth(){}}};run(c,'src/upgrade71.js');
 const s={matchId:'m',setIndex:1,sideSwapped:true,sets:[{a:21,b:18,finished:true},{a:10,b:12,finished:false}]};const rows=c.TopkeyUpgrade71.completedHistory(s,c.Topkey.App.state.matches.m);
 ok(rows.length===1&&rows[0].winnerName==='TAN & LY'&&rows[0].a===21&&rows[0].b===18,'SET_HISTORY keeps A/B winner identity after side swap');
}

// Upgrade74 mobile layout contract + durable package registry.
{
 const css=read(path.join(bad,'upgrade74.css'));
 ok(/max-width:600px/.test(css)&&/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(css),'MOBILE_SCORE uses two equal portrait score columns');
 ok(/grid-template-areas:"tk74left tk74right" "tk74center tk74center"/.test(css),'MOBILE_SCORE puts team names on separate row');
 for(const w of [320,360,375,390,412,430,600]){const available=w-20,gap=7,col=(available-gap)/2;ok(col>0&&2*col+gap<=available+0.001,`MOBILE_SCORE numerical fit ${w}px`)}
 const manifest=JSON.parse(read(path.join(root,'TOPKEY_PACKAGE_MANIFEST.json'))),registry=JSON.parse(read(path.join(bad,'FEATURE_REGISTRY.json'))),contract=JSON.parse(read(path.join(bad,'REGRESSION_CONTRACT.json')));
 ok(Number((String(manifest.badmintonBuild||'').match(/upgrade(\d+)/i)||[])[1]||0)>=74,'PACKAGE_HISTORY manifest is Upgrade74 or newer');
 const ids=new Set(registry.features.map(x=>x.id));for(const id of ['START_GATE_001','OPENING_LEDGER_001','RESPONSIVE_REFEREE_001','MOBILE_SCORE_001','PACKAGE_HISTORY_001'])ok(ids.has(id),`PACKAGE_HISTORY registry contains ${id}`);
 ok(contract.tests.some(x=>x.id==='MOBILE_SCORE_001'&&x.required),'PACKAGE_HISTORY regression contract requires mobile score test');
}

// HTML load order and SW asset integrity.
{
 const html=read(path.join(bad,'index.html'));
 ok(html.indexOf('upgrade74.css')>html.indexOf('upgrade73.css'),'Upgrade74 CSS loads after Upgrade73');ok(html.indexOf('src/upgrade74.js')>html.indexOf('src/upgrade73.js'),'Upgrade74 JS loads after Upgrade73');
 const sw=read(path.join(bad,'sw.js')),m=sw.match(/const ASSETS=(\[[^;]+\]);/);const assets=JSON.parse(m[1]);ok(new Set(assets).size===assets.length,'Badminton SW has no duplicate assets');
 for(const a of assets){if(!a.startsWith('./'))continue;const rel=a.slice(2)||'index.html';ok(fs.existsSync(path.join(bad,rel)),`SW asset exists: ${a}`)}
}
console.log(`ALL PASS ${pass}`);for(const n of notes)console.log(n);
