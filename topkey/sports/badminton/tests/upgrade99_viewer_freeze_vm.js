const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/upgrade98.js'),'utf8');
let observer=null; const els={};
const classList=()=>({toggle(){},remove(){},add(){},contains(){return false}});
function baseEl(id=''){return {id,classList:classList(),style:{setProperty(){},removeProperty(){}},dataset:{},hidden:false,title:'',addEventListener(){},querySelector(){return null},getAttribute(){return null},setAttribute(){},parentNode:null};}
els['public-spectator']=baseEl('public-spectator');
class MO{constructor(cb){this.cb=cb;this.active=false;observer=this}observe(){this.active=true}disconnect(){this.active=false}}
const document={
  documentElement:{classList:classList(),dataset:{}},body:{classList:classList()},fullscreenElement:null,fullscreenEnabled:true,
  getElementById:id=>els[id]||null,addEventListener(){},exitFullscreen(){return Promise.resolve()},
  createElement(tag){const e=baseEl();e.tagName=tag.toUpperCase();return e;}
};
const window={Topkey:{App:{}},MutationObserver:MO,addEventListener(){},ResizeObserver:null};
const sandbox={window,document,MutationObserver:MO,location:{hash:'#spectator',href:'https://x/sports/badminton/#spectator'},screen:{orientation:{lock(){return Promise.resolve()},unlock(){}}},innerWidth:844,innerHeight:390,setTimeout(){return 1},clearTimeout(){},URL,fetch:async()=>({ok:true,json:async()=>({build:'upgrade98'})}),console};
sandbox.globalThis=sandbox; vm.createContext(sandbox); vm.runInContext(source,sandbox,{filename:'upgrade98.js'});
assert(window.TopkeyUpgrade98,'U98 installed');
assert.strictEqual(window.TopkeyUpgrade98.armViewerPatch(),false,'no Live button yet -> arm observer');
assert(observer&&observer.active,'one-shot observer must be active while waiting');
// Live stage appears later, exactly the production lifecycle that froze U98.
const player=baseEl('player'),video=baseEl('tk88-public-video'),stage=baseEl('tk88-public-live-stage');
stage.querySelector=sel=>sel==='.tk88-public-player'?player:null; player.clientWidth=844;player.clientHeight=390;video.videoWidth=1280;video.videoHeight=720;
els['tk88-public-live-stage']=stage;els['tk88-public-video']=video;
const parent=baseEl('toolbar'); parent.insertBefore=(e)=>{e.parentNode=parent;els[e.id]=e};
const full=baseEl('tk88-public-full'); full.parentNode=parent; let _text='⛶ Toàn màn hình';
Object.defineProperty(full,'textContent',{get(){return _text},set(v){assert(!observer.active,'observer MUST be disconnected before textContent mutation');_text=v}});
full.getAttribute=()=>null; full.setAttribute=()=>{}; els['tk88-public-full']=full;
observer.cb([]);
assert.strictEqual(observer.active,false,'observer disconnects after Live controls appear');
assert.strictEqual(full.dataset.tk100Viewer,'1','current Viewer patch applied once after one-shot observer');
assert.strictEqual(observer.active,false,'observer stays disconnected after current Viewer patch');
console.log('upgrade99 viewer freeze VM: PASS · observer disconnected before DOM mutation');
