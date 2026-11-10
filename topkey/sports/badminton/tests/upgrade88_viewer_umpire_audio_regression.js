const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src/upgrade88.js'),'utf8');
const css=fs.readFileSync(path.join(root,'upgrade88.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const u78=fs.readFileSync(path.join(root,'src/upgrade78.js'),'utf8');
const registry=JSON.parse(fs.readFileSync(path.join(root,'FEATURE_REGISTRY.json'),'utf8'));
const contract=JSON.parse(fs.readFileSync(path.join(root,'REGRESSION_CONTRACT.json'),'utf8'));
const rules=JSON.parse(fs.readFileSync(path.join(root,'firebase.database.rules.json'),'utf8'));
const wr=rules.rules.topkey_badminton_vnext_2026.tournaments['$tid'].webrtc;
assert(html.indexOf('src/upgrade87.js')<html.indexOf('src/upgrade88.js'),'Upgrade88 must load after Upgrade87');
const cache=(html.match(/upgrade88\.css\?v=(u(\d+)-\d+)/)||[]);assert(cache[1]&&Number(cache[2])>=88&&html.includes(`src/upgrade88.js?v=${cache[1]}`),'Upgrade88 assets must remain loaded under current release cache >=88');
// Viewer: camera stream is reused for secure WebRTC. Never acquire a second camera in Upgrade88.
for(const marker of ['publishSharedCamera','CAMERA_SHARED_U88',"viewerType:'WEBRTC'",'stream.getTracks().forEach(t=>pc.addTrack(t,stream))'])assert(src.includes(marker),`shared-camera viewer path missing ${marker}`);
assert(!src.includes('getUserMedia('),'Upgrade88 must reuse the existing camera stream, not open a second camera/encoder');
assert(src.includes("if(type==='CAMERA'||type==='WEBRTC'||s.viewerType==='WEBRTC'){await App.startWebRTCViewer?.()"),'authenticated VIEWER must receive CAMERA through WebRTC, never open its own camera');
assert(src.includes("this.currentTab='live';this.showTab?.('live')"),'VIEWER/LIVE_ONLY must land on Live player first');
assert(css.includes('#page-live.tk88-viewer-mode #tk84-source-card')&&css.includes('#page-live.tk88-viewer-mode #tk84-blv-card'),'viewer-only Live mode must hide broadcaster/BLV controls');
assert(src.includes('quiesceViewerReplay')&&src.includes('U77.stopAnalysisLoops?.(false)'),'VIEWER must not keep replay detector/recorder running on the remote stream');
assert(!wr['.write'],'WebRTC root must not grant broad write access');assert(wr['$courtId'].broadcast['.write'].includes("permissions/modules/live').val() === 'edit'"),'broadcast write must remain broadcaster/edit only');assert(wr['$courtId'].sessions['$sid'].request['.write'].includes("newData.child('uid').val() === auth.uid"),'VIEWER request must be limited to own UID');assert(wr['$courtId'].sessions['$sid'].viewerCandidates['$cid']['.write'].includes('request/uid'),'viewer ICE writes must be session-owner scoped');assert(wr['$courtId'].sessions['$sid'].answer['.write'].includes('request/uid'),'viewer answer must be session-owner scoped');
// Public spectator: Live is first and real public media plays when transport is public.
for(const marker of ['layout.insertBefore(card,layout.firstElementChild||null)','tk88-public-live-stage','▶ Xem LIVE',"type==='HLS'", "type==='YOUTUBE'",'Camera/WebRTC dùng signaling bảo mật'])assert(src.includes(marker),`public Live-first marker missing ${marker}`);
assert(css.includes('.tk88-public-player')&&css.includes('aspect-ratio:16/9'),'public viewer player stage missing');
// UMPIRE audio ownership: preserve Upgrade78 assignment enforcement but make the scoring owner consistent with it.
assert(u78.includes("if(!court.umpireUid)return{ok:false,reason:'UMPIRE_UNASSIGNED'"),'Upgrade78 assignment gate must remain enforced');
for(const marker of ['claimUmpireIfNeeded',"role()!=='UMPIRE'",'umpireUid:uid',"type:'UMPIRE_SELF_CLAIM_U88'",'ASSIGN_UMPIRE_SELF','await claimUmpireIfNeeded(courtId)', 'U78.evaluate?.()', 'U87.syncAudioButtons?.()'])assert(src.includes(marker),`UMPIRE audio ownership marker missing ${marker}`);
assert(src.includes("if(assigned&&assigned!==uid)")&&src.includes('sân đang gán trọng tài khác'),'wrong UMPIRE must not bypass assignment gate');
// U88 must not invent score writes; only court ownership/stream transport writes are allowed.
assert(!src.includes("queueSet('activeMatches/")&&!src.includes("queueSet('matches/"),'Upgrade88 must not mutate score/match state directly');
for(const id of ['VIEWER_LIVE_PLAYER_001','UMPIRE_AUDIO_OWNERSHIP_001']){assert(registry.features.some(x=>x.id===id),`registry missing ${id}`);assert(contract.tests.some(x=>x.id===id&&x.required),`contract missing ${id}`)}
for(const f of ['./upgrade88.css','./src/upgrade88.js','./tests/upgrade88_viewer_umpire_audio_regression.js'])assert(sw.includes(f),`SW missing ${f}`);
console.log('upgrade88 viewer/umpire regression: PASS · Live-first viewer + shared-camera WebRTC + UMPIRE self-claim audio ownership');
// Dynamic ownership regression: unassigned UMPIRE self-claims; a different assigned UID is never overwritten.
const vm=require('vm');
const writes=[],audits=[];let evals=0,syncs=0;
const app={__upgrade88Installed:false,state:{courts:{court_1:{id:'court_1',name:'Sân 1',status:'LIVE',activeMatchId:'m1'}},activeMatches:{court_1:{matchId:'m1',started:true}},matches:{m1:{id:'m1',status:'LIVE',courtId:'court_1'}}},currentCourt:'court_1',currentTab:'umpire',startLocalCamera:async()=>{},startWebRTCBroadcast:async()=>{},stopLive:async()=>{},renderSpectator(){},startSpectator(){},startUmpire:async()=>{},score:async()=>{},applyRole(){},showTab(){},renderBranch(){}};
const auth={user:{uid:'ump_1',email:'u@test'},profile:{displayName:'TT 1'},role:()=> 'UMPIRE',can:()=>true};
const Topkey={App:app,U:{toast:()=>{},id:()=> 'id1'},Auth:auth,Data:{db:{ref:()=>({set:async()=>{},remove:async()=>{},on(){},off(){}})},path:x=>x,queueSet:async(path,val,meta)=>{writes.push({path,val,meta})},audit:async(...x)=>audits.push(x)}};
const documentMock={documentElement:{dataset:{}},getElementById:()=>null,addEventListener(){},hidden:false};
const windowMock={Topkey,TopkeyUpgrade77:{state:{},stopAnalysisLoops(){},installed:true},TopkeyUpgrade78:{installed:true,evaluate:()=>{evals++}},TopkeyUpgrade85:{installed:true},TopkeyUpgrade86:{installed:true,ensureLayout(){}},TopkeyUpgrade87:{installed:true,syncAudioButtons:()=>{syncs++}},addEventListener(){}};
const ctx={window:windowMock,document:documentMock,navigator:{},location:{protocol:'file:',hash:''},setTimeout:fn=>{fn();return 1},clearTimeout(){},setInterval:()=>1,clearInterval(){},console,URL,Promise};
vm.runInNewContext(src,ctx);
(async()=>{
  const u=windowMock.TopkeyUpgrade88;assert(u?.installed,'Upgrade88 mock install failed');
  assert.strictEqual(await u.claimUmpireIfNeeded('court_1'),true,'unassigned UMPIRE should self-claim');
  assert.strictEqual(app.state.courts.court_1.umpireUid,'ump_1','self-claim must update local court owner before gate evaluation');
  assert(writes.some(x=>x.path==='courts/court_1'&&x.val.umpireUid==='ump_1'&&x.meta.type==='UMPIRE_SELF_CLAIM_U88'),'self-claim Firebase write missing');
  assert(audits.some(x=>x[0]==='ASSIGN_UMPIRE_SELF'),'self-claim audit missing');
  app.state.courts.court_2={id:'court_2',name:'Sân 2',umpireUid:'ump_other'};const before=writes.length;
  assert.strictEqual(await u.claimUmpireIfNeeded('court_2',{silent:true}),false,'wrong UMPIRE must be rejected');assert.strictEqual(writes.length,before,'wrong UMPIRE must not overwrite assignment');
  assert(evals>0&&syncs>0,'audio gate/UI must re-evaluate after self-claim');
  console.log('upgrade88 dynamic ownership: PASS · unassigned self-claim + wrong-UID rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
