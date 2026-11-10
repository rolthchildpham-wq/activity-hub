const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../src/upgrade94.js','utf8');

const sw=fs.readFileSync(__dirname+'/../sw.js','utf8');
assert(/topkey-vnext-2026-upgrade(?:9[4-9]|[1-9]\d{2,})/.test(sw),'Badminton service-worker cache must be current');
assert(!src.includes('getUserMedia'),'Upgrade94 Viewer BLV layer must not open camera/microphone');
assert(src.includes('commentary/${c}/latest'),'commentary/<court>/latest must remain primary source');
assert(src.includes('},700);'),'activeMatches fallback must remain ~700 ms');
const els={
 'tk88-public-unmute':{id:'tk88-public-unmute',textContent:'🔊 Bật tiếng',disabled:false,closest(sel){return sel.includes(this.id)?this:null}},
 'tk88-public-live-stage':{id:'tk88-public-live-stage',querySelector(){return null},appendChild(){}},
 'health-version':{textContent:''},'tk55-runtime-build':{textContent:''}
};
const listeners={};const dataListeners={};const spoken=[];
function Utter(t){this.text=t;this.lang='';this.rate=1;this.pitch=1;this.volume=1;}
const speechSynthesis={
 getVoices(){return[{name:'Vietnamese Test',lang:'vi-VN'}]},cancel(){},resume(){},
 speak(u){spoken.push(u.text);u.onstart&&u.onstart();u.onend&&u.onend()}
};
const document={
 documentElement:{dataset:{}},
 getElementById:id=>els[id]||null,
 createElement(){return{style:{},dataset:{},appendChild(){}}},
 addEventListener(type,fn){(listeners[type]??=[]).push(fn)}
};
const App={__upgrade94Installed:false,state:{activeMatches:{},matches:{m2:{id:'m2',teamAId:'a',teamBId:'b'}},teams:{a:{name:'Đội A'},b:{name:'Đội B'}},courts:{}},currentCourt:'court_1',audioUnlocked:false};
const T={App,U:{},Auth:{role:()=> 'VIEWER'},Data:{ready:true,listen(path,cb){dataListeners[path]=cb;return()=>{};}}};
const window={Topkey:T,speechSynthesis,SpeechSynthesisUtterance:Utter,TopkeyUpgrade88:{state:{publicCourt:'court_2'},preferredLiveCourt:()=> 'court_2'},TopkeyUpgrade47:{Piper:{installed:false}},addEventListener(){},location:null};
const location={hash:'#spectator',href:'https://example.test/sports/badminton/#spectator'};window.location=location;
const ctx={window,document,location,SpeechSynthesisUtterance:Utter,speechSynthesis,console,setTimeout,clearTimeout,setInterval:()=>0,clearInterval,URL,fetch:async()=>({json:async()=>({build:'upgrade94',version:'v94'})})};
vm.createContext(ctx);vm.runInContext(src,ctx);
const U94=window.TopkeyUpgrade94;assert(U94,'Upgrade94 must install');
assert.strictEqual(U94.selectedCourt(),'court_2','Public Viewer must bind the court actually being watched');
// Simulate visible public button click: it must enable BLV, not only unmute video.
for(const fn of listeners.click||[])fn({target:els['tk88-public-unmute']});
setTimeout(()=>{},0);
assert.strictEqual(U94.state.enabled,true,'Public Bật tiếng must enable Viewer BLV');
assert(spoken.some(x=>x.includes('Âm thanh bình luận tỷ số đã bật')),'Enable gesture must produce an audible TTS test');
U94.bindCourt(true);assert(dataListeners['commentary/court_2/latest'],'Must listen commentary for selected public court');
const beforeBaseline=spoken.length;
dataListeners['commentary/court_2/latest']({id:'old0',courtId:'court_2',text:'Câu cũ trước khi Viewer bật.'});
assert.strictEqual(spoken.length,beforeBaseline,'Initial Firebase snapshot must be baselined, not replayed');
dataListeners['commentary/court_2/latest']({id:'c1',courtId:'court_2',text:'Đội A ghi điểm, tỷ số 5 - 3.'});
assert(spoken.some(x=>x.includes('tỷ số 5 - 3')),'Fresh Firebase commentary must be spoken on Viewer');
// Score fallback must exist even if commentary/latest is absent/delayed.
U94.state.lastScore.court_2={matchId:'m2',setIndex:0,sets:[{a:5,b:3}]};
U94.onActiveMatches({court_2:{matchId:'m2',setIndex:0,sets:[{a:6,b:3}]}});
assert(U94.state.fallbackTimer,'Score change must schedule fallback narration');
setTimeout(()=>{assert(spoken.some(x=>x.includes('tỷ số 6 - 3')),'Score fallback must actually speak when commentary is missing');console.log('upgrade94 viewer BLV regression PASS');},800);
