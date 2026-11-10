const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/upgrade113.js'),'utf8');
let calls=[];let n=0;
const Data={queueMulti:(updates,meta)=>{calls.push({updates,meta});return Promise.resolve({updates,meta})}};
const app={state:{},renderHealth(){}};
const win={Topkey:{App:app,Data},TopkeyUpgrade105:{state:{}},addEventListener(){}};
const document={getElementById(){return null},documentElement:{dataset:{}}};
const sandbox={window:win,document,performance:{now:()=>++n},Promise,setTimeout,queueMicrotask};win.window=win;win.document=document;win.performance=sandbox.performance;
vm.createContext(sandbox);vm.runInContext(src,sandbox);
(async()=>{
 const rootPath='topkey_badminton_vnext_2026/tournaments/main_2026';
 for(let i=0;i<500;i++){
  const court='court_'+((i%4)+1),active=`${rootPath}/activeMatches/${court}`,event=`${rootPath}/events/${court}/e${i}`,comment=`${rootPath}/commentary/${court}/latest`;
  const p=Data.queueMulti({[active]:{version:i},[event]:{id:'e'+i,type:'POINT_AWARDED'}},{type:'SCORE',eventId:'e'+i});
  const cp=Data.queueMulti({[comment]:{id:'c'+i,text:'Điểm '+i,kind:'SCORE'}},{type:'COMMENTARY_LOCAL_U48_RT'});
  await Promise.all([p,cp]);
 }
 assert.strictEqual(calls.length,500,'500 scoring actions must produce exactly 500 underlying atomic writes');
 assert(calls.every(x=>Object.keys(x.updates).some(k=>/activeMatches\//.test(k))&&Object.keys(x.updates).some(k=>/events\//.test(k))&&Object.keys(x.updates).some(k=>/commentary\/.+\/latest$/.test(k))),'atomic write missing score/event/commentary path');
 assert.strictEqual(win.TopkeyUpgrade113.state.pending.size,0,'atomic pending map leaked after scoring soak');
 assert.strictEqual(win.TopkeyUpgrade113.state.joined,500,'joined metric mismatch after soak');
 console.log('PASS upgrade117 atomic score 500-action soak VM');
})().catch(e=>{console.error(e);process.exit(1)});
