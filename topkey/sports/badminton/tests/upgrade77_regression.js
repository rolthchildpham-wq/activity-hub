const fs=require('fs'),path=require('path'),assert=require('assert');
const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..'),pkg=path.resolve(root,'../..');
const u77=fs.readFileSync(path.join(root,'src/upgrade77.js'),'utf8');
const css=fs.readFileSync(path.join(root,'upgrade77.css'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const edgePath=path.join(pkg,'edge-functions/api/ai-shuttle-analyze.js');
const edge=fs.readFileSync(edgePath,'utf8');
assert(index.indexOf('src/upgrade76.js')<index.indexOf('src/upgrade77.js'),'Upgrade77 must load after Upgrade76');
assert(index.includes('upgrade77.css')&&/u(?:7[7-9]|[89]\d|\d{3,})-20\d{6}/.test(index),'Upgrade77 CSS/current cache marker missing');
assert(/PRE_MS=6000,POST_MS=4000,SEGMENT_MS=3000/.test(u77),'rolling replay timing contract missing');
assert((u77.match(/new MediaRecorder\(/g)||[]).length===1,'Upgrade77 must use one MediaRecorder encoder path');
assert(u77.includes('videoBitsPerSecond:1200000'),'mobile recorder bitrate guard missing');
assert(u77.includes("DB_NAME='topkey_badminton_replays_v1'"),'local replay IndexedDB missing');
assert(u77.includes("width=480,quality=.52")&&u77.includes("const w=160"),'lightweight frame sizes missing');
assert(u77.includes('setTimeout(analyzeMotionFrame,125)'),'~8 FPS detector cadence missing');
assert(!/App\.score\s*=/.test(u77),'Upgrade77 must not override scoring');
assert(!/queueSet|queueMulti/.test(u77),'Upgrade77 must not mutate Firebase score/state');
for(const marker of ['Lưu replay ~10s','Đập cầu','Bỏ nhỏ','Sát vạch','AI phân loại candidate'])assert(u77.includes(marker),`missing replay UI ${marker}`);
for(const f of ['./upgrade77.css','./src/upgrade77.js','./tests/upgrade77_regression.js'])assert(sw.includes(f),`SW missing ${f}`);
assert(fs.existsSync(edgePath),'EdgeOne AI function missing');
assert(edge.includes('context.env?.MAKERS_MODELS_KEY')&&edge.includes('context.env?.AI_GATEWAY_API_KEY'),'AI key must come from EdgeOne env');
assert(!/sk-[A-Za-z0-9_-]{12,}/.test(edge),'hard-coded AI secret found');
assert(edge.includes('accounts:lookup')&&edge.includes("['ADMIN','UMPIRE','LIVE_ONLY']"),'Firebase auth/role gate missing');
assert(edge.includes("slice(-4)")&&edge.includes('total>850000'),'AI frame/request cap missing');
assert(edge.includes('advisoryOnly:true'),'AI must be advisory only');
assert(edge.includes("event (SMASH|DROP|LINE_NEAR|OTHER)"),'vision classification schema missing');
assert(css.includes('#tk77-replay-card')&&css.includes('.tk77-live-mark'),'Replay UI CSS missing');
const reg=JSON.parse(fs.readFileSync(path.join(root,'FEATURE_REGISTRY.json'),'utf8'));assert(reg.features.some(x=>x.id==='AI_SHUTTLE_REPLAY_001'),'AI_SHUTTLE_REPLAY_001 missing');
const contract=JSON.parse(fs.readFileSync(path.join(root,'REGRESSION_CONTRACT.json'),'utf8'));assert(contract.tests.some(x=>x.id==='AI_SHUTTLE_REPLAY_001'&&x.required),'required replay regression missing');
(async()=>{
  const mod=await import(pathToFileURL(edgePath).href+'?t='+Date.now());
  let r=await mod.onRequestGet({env:{}}),d=await r.json();assert(d.ok&&!d.configured,'GET health without key wrong');
  r=await mod.onRequestGet({env:{MAKERS_MODELS_KEY:'test'}});d=await r.json();assert(d.configured,'GET health with key wrong');
  const oldFetch=global.fetch;global.fetch=async(url,opt={})=>{
    const s=String(url);
    if(s.includes('accounts:lookup'))return new Response(JSON.stringify({users:[{localId:'u1'}]}),{status:200,headers:{'content-type':'application/json'}});
    if(s.includes('/users/u1/role.json'))return new Response(JSON.stringify('UMPIRE'),{status:200,headers:{'content-type':'application/json'}});
    if(s.includes('/chat/completions'))return new Response(JSON.stringify({choices:[{message:{content:'{"event":"SMASH","confidence":0.82,"landing":"UNCLEAR","shuttleVisible":true,"reasonVi":"Quỹ đạo nhanh, cầu nhìn thấy."}'}}]}),{status:200,headers:{'content-type':'application/json'}});
    throw new Error('unexpected fetch '+s);
  };
  try{
    const frame='data:image/jpeg;base64,AAAA';
    const req=new Request('https://example.com/api/ai-shuttle-analyze',{method:'POST',headers:{authorization:'Bearer fake','content-type':'application/json'},body:JSON.stringify({frames:[frame,frame],meta:{hint:'FAST_SMASH_CANDIDATE',speed:18}})});
    r=await mod.onRequestPost({request:req,env:{MAKERS_MODELS_KEY:'test'}});d=await r.json();assert(r.status===200&&d.ok&&d.event==='SMASH'&&d.advisoryOnly,'mock vision flow failed');
  }finally{global.fetch=oldFetch}
  console.log('upgrade77 replay regression: PASS · local buffer + auth edge vision + advisory-only');
})().catch(e=>{console.error(e);process.exit(1)});
