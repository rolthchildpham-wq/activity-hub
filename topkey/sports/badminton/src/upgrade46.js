(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade46Installed)return;
App.__upgrade46Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade46';
const CACHE_TAG='u46-20261029';
const SETTINGS_KEY='topkey_u46_local_blv_settings';
const DICT_KEY='topkey_u46_pronunciation';
const $=id=>document.getElementById(id);
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

// Keep Upgrade45 access-audit context, but stamp new rows with the actual Upgrade46 build.
if(T.Data?.audit){
  T.Data.audit=async function(action,entityType,entityId,before=null,after=null){
    const id=U.id('audit'),uid=T.Auth?.user?.uid||'local',profile=T.Auth?.profile||{},session=window.TopkeyUpgrade45?.getSession?.();
    const row={id,action,entityType,entityId,uid,actor:profile.displayName||profile.username||T.Auth?.user?.displayName||T.Auth?.user?.email||'User',role:T.Auth?.role?.()||String(profile.role||'VIEWER').toUpperCase(),email:profile.email||T.Auth?.user?.email||'',sessionId:session?.id||'',tab:App.currentTab||'',build:VERSION,before,after,clientAt:Date.now()};
    return this.queueSet(`audit/${id}`,row,{eventId:id,type:'AUDIT'});
  };
}

const DEFAULTS={density:'MEDIUM',style:'LIVE',localOnly:true,voice:'AUTO',shareCaption:true};
function readJson(key,fallback){try{return{...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return{...fallback}}}
function settings(){return readJson(SETTINGS_KEY,DEFAULTS)}
function saveSettings(patch){const next={...settings(),...patch};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(next))}catch{}return next}
function esc(s){return App.escape?App.escape(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(n,a,b){return Math.min(b,Math.max(a,Number(n)||a))}
function choose(arr,key=0){if(!arr?.length)return'';return arr[Math.abs(Number(key)||0)%arr.length]}
function teamName(id){return App.teamName?.(id)||App.state.teams?.[id]?.name||'đội thi đấu'}
function currentRules(){return{...T.DEFAULT_RULES,...App.state.config?.rules}}
function setWins(sets){return T.Scoring?.setsWon?T.Scoring.setsWon(sets||[]):{a:0,b:0}}
function needSets(){return Math.ceil((Number(currentRules().bestOf)||3)/2)}
function canWinSetNext(side,a,b){const r=currentRules();return side==='A'?T.Scoring.isSetWon(a+1,b,r):T.Scoring.isSetWon(a,b+1,r)}
function scoreText(a,b){return `${a} - ${b}`}
function scoreSpoken(a,b){return a===b?`${a} đều`:`${a} - ${b}`}
function leaderSide(a,b){return a===b?'':a>b?'A':'B'}
function opponent(side){return side==='A'?'B':'A'}
function matchMemoryKey(court,matchId,setIndex){return `${court}|${matchId}|${setIndex}`}

function parseDictionary(){
  let raw='';try{raw=localStorage.getItem(DICT_KEY)||''}catch{}
  const out=[];String(raw).split(/\r?\n/).forEach(line=>{const p=line.indexOf('=');if(p<=0)return;const from=line.slice(0,p).trim(),to=line.slice(p+1).trim();if(from&&to)out.push([from,to]);});
  return out.sort((a,b)=>b[0].length-a[0].length);
}
function pronounce(text){
  let out=String(text||'').replace(/\bMIX\b/gi,'đôi nam nữ').replace(/\bMEN\b/gi,'đôi nam').replace(/\bWOMEN\b/gi,'đôi nữ');
  for(const [from,to] of parseDictionary()){try{out=out.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu'),to)}catch{out=out.split(from).join(to)}}
  return out.replace(/\s+/g,' ').trim();
}

const Engine={
  queue:[],speaking:false,current:null,seen:new Set(),mem:new Map(),lastKinds:[],lastTexts:[],lastCaption:null,
  priority:{MATCH_FINISH:100,MATCH_POINT:95,SET_FINISH:92,GAME_POINT:86,DEUCE:82,COMEBACK:78,LEAD_CHANGE:72,STREAK:64,BIG_LEAD:54,START:80,SCORE:30,MANUAL:100,TEST:100},
  status(text,state='info'){
    const el=$('tk46-local-status')||$('tk25-tts-status');if(el){el.textContent=text;el.dataset.state=state;}
    const q=$('tk46-queue-status');if(q)q.textContent=`Hàng đợi: ${this.queue.length}${this.speaking?' · đang đọc':''}`;
  },
  rememberKind(kind){this.lastKinds.push(kind);if(this.lastKinds.length>8)this.lastKinds.shift()},
  pick(kind,variants,key){
    const recent=new Set(this.lastTexts.slice(-6));let start=Math.abs(Number(key)||0)%variants.length;
    for(let i=0;i<variants.length;i++){const v=variants[(start+i)%variants.length];if(!recent.has(v)){this.lastTexts.push(v);if(this.lastTexts.length>12)this.lastTexts.shift();return v;}}
    const v=variants[start];this.lastTexts.push(v);return v;
  },
  memory(court,m,result,side){
    const setIndex=Number(result?.state?.setIndex??App.state.activeMatches?.[court]?.setIndex??0),key=matchMemoryKey(court,m?.id||result?.state?.matchId||'',setIndex),a=Number(result?.after?.a||0),b=Number(result?.after?.b||0),beforeA=Number(result?.before?.a||0),beforeB=Number(result?.before?.b||0);
    let x=this.mem.get(key)||{lastSide:null,streak:0,maxLeadA:0,maxLeadB:0,lastLeader:'',lastNonTiedLeader:'',leadChanges:0,wasTied:false};
    x.streak=x.lastSide===side?x.streak+1:1;x.lastSide=side;
    const beforeLeader=leaderSide(beforeA,beforeB),afterLeader=leaderSide(a,b);
    if(beforeLeader)x.lastNonTiedLeader=beforeLeader;
    const previousLeader=beforeLeader||x.lastNonTiedLeader||'';
    const leadChanged=!!afterLeader&&!!previousLeader&&afterLeader!==previousLeader;
    if(leadChanged)x.leadChanges++;
    x.maxLeadA=Math.max(x.maxLeadA,beforeA-beforeB,a-b);x.maxLeadB=Math.max(x.maxLeadB,beforeB-beforeA,b-a);
    const comeback=(side==='A'&&x.maxLeadB>=4&&afterLeader==='A')||(side==='B'&&x.maxLeadA>=4&&afterLeader==='B');
    x.lastLeader=afterLeader;if(afterLeader)x.lastNonTiedLeader=afterLeader;x.wasTied=a===b;this.mem.set(key,x);
    return{x,setIndex,a,b,beforeA,beforeB,beforeLeader,afterLeader,leadChanged,comeback};
  },
  composeScore(m,result,side){
    const court=App.currentCourt||result?.state?.courtId||'court_1',z=this.memory(court,m,result,side),{a,b,beforeA,beforeB,x}=z,total=a+b,setNo=z.setIndex+1,name=teamName(side==='A'?m.teamAId:m.teamBId),opp=teamName(side==='A'?m.teamBId:m.teamAId),rules=currentRules(),wins=setWins(result?.state?.sets||[]),need=needSets();
    const winnerScore=side==='A'?a:b,loserScore=side==='A'?b:a,diff=Math.abs(a-b),isDeuce=a===b&&a>=Number(rules.points||21)-1;
    let kind='SCORE',priority=this.priority.SCORE,text='';
    if(result?.matchFinished){kind='MATCH_FINISH';priority=this.priority.MATCH_FINISH;text=this.pick(kind,[
      `Điểm quyết định! ${name} khép lại set ${setNo} với tỷ số ${scoreText(a,b)} và đã đủ số set thắng.`,
      `Và đó là điểm kết thúc trận! ${name} thắng set ${setNo}, ${scoreText(a,b)}. Trọng tài chuẩn bị xác nhận kết quả chung cuộc.`,
      `${name} hoàn tất điểm cuối cùng. Tỷ số set ${setNo} là ${scoreText(a,b)} và chiến thắng trận đấu đã được xác lập.`],total);
    }else if(result?.setFinished){kind='SET_FINISH';priority=this.priority.SET_FINISH;text=this.pick(kind,[
      `${name} khép lại set ${setNo}, ${scoreText(a,b)}. Một set đấu đã có chủ.`,
      `Set ${setNo} kết thúc! ${name} giành phần thắng ${scoreText(a,b)}.`,
      `Điểm cuối của set! ${name} thắng ${scoreText(a,b)} ở set ${setNo}.`],total);
    }else{
      const gamePointA=canWinSetNext('A',a,b),gamePointB=canWinSetNext('B',a,b),gpSide=gamePointA&&!gamePointB?'A':gamePointB&&!gamePointA?'B':'';
      const matchPoint=gpSide&&((gpSide==='A'?wins.a:wins.b)+1>=need);
      if(matchPoint){const gpName=teamName(gpSide==='A'?m.teamAId:m.teamBId);kind='MATCH_POINT';priority=this.priority.MATCH_POINT;text=this.pick(kind,[
        `Match point cho ${gpName}! Tỷ số ${scoreSpoken(a,b)}. Chỉ còn một điểm để khép lại trận đấu.`,
        `Cơ hội kết thúc trận cho ${gpName}. ${scoreSpoken(a,b)} và đây là match point!`,
        `${gpName} đang đứng trước điểm quyết định của cả trận. Tỷ số ${scoreSpoken(a,b)}.`],total);
      }else if(gpSide){const gpName=teamName(gpSide==='A'?m.teamAId:m.teamBId);kind='GAME_POINT';priority=this.priority.GAME_POINT;text=this.pick(kind,[
        `Điểm set cho ${gpName}! Tỷ số ${scoreSpoken(a,b)}.`,
        `${gpName} chỉ còn một điểm để kết thúc set ${setNo}. Bảng điểm ${scoreSpoken(a,b)}.`,
        `Điểm set! ${gpName} đang có cơ hội khép lại set đấu ở tỷ số ${scoreSpoken(a,b)}.`],total);
      }else if(isDeuce){kind='DEUCE';priority=this.priority.DEUCE;text=this.pick(kind,[
        `${a} đều! Set đấu bước vào thời điểm cực kỳ căng thẳng.`,
        `Cân bằng ${a} đều. Từ lúc này từng điểm số đều có thể định đoạt set đấu.`,
        `${a} đều! Không còn khoảng trống cho sai lầm ở giai đoạn này.`],total);
      }else if(z.comeback&&diff<=2){kind='COMEBACK';priority=this.priority.COMEBACK;text=this.pick(kind,[
        `Một màn ngược dòng đáng chú ý! ${name} từ thế bị dẫn đã vươn lên ${scoreSpoken(a,b)}.`,
        `Thế trận đảo chiều! ${name} đã xóa cách biệt trước đó và giờ dẫn ${scoreSpoken(a,b)}.`,
        `${name} trở lại rất mạnh mẽ. Từ chỗ bị bỏ xa, họ đã vượt lên ở tỷ số ${scoreSpoken(a,b)}.`],total);
      }else if(z.leadChanged){kind='LEAD_CHANGE';priority=this.priority.LEAD_CHANGE;text=this.pick(kind,[
        `Và ${name} vượt lên dẫn ${scoreSpoken(a,b)}. Thế trận vừa đổi chiều.`,
        `${name} giành lại lợi thế, tỷ số ${scoreSpoken(a,b)}.`,
        `Lần đổi ngôi trên bảng điểm! ${name} đang dẫn ${scoreSpoken(a,b)}.`],total);
      }else if(x.streak>=4){kind='STREAK';priority=this.priority.STREAK;text=this.pick(kind,[
        `${x.streak} điểm liên tiếp cho ${name}! Tỷ số đã là ${scoreSpoken(a,b)}.`,
        `${name} đang có chuỗi ${x.streak} điểm không bị gián đoạn, bảng điểm ${scoreSpoken(a,b)}.`,
        `Nhịp ghi điểm rất tốt của ${name}: ${x.streak} điểm liên tiếp và tỷ số ${scoreSpoken(a,b)}.`],total+x.streak);
      }else if(diff>=6&&winnerScore>loserScore){kind='BIG_LEAD';priority=this.priority.BIG_LEAD;text=this.pick(kind,[
        `${name} tạo ra khoảng cách ${diff} điểm, tỷ số ${scoreSpoken(a,b)}.`,
        `Khoảng cách đang được nới rộng. ${name} dẫn ${scoreSpoken(a,b)}.`,
        `${name} kiểm soát bảng điểm với lợi thế ${diff} điểm, ${scoreSpoken(a,b)}.`],total);
      }else if(a===b&&a>=10){kind='DEUCE';priority=68;text=this.pick(kind,[
        `Tỷ số được san bằng ${a} đều.`,
        `${name} đưa set đấu trở lại thế cân bằng, ${a} đều.`,
        `Lại cân bằng! ${a} đều ở set ${setNo}.`],total);
      }else{text=this.pick(kind,[
        `Điểm cho ${name}. Tỷ số ${scoreSpoken(a,b)}.`,
        `${name} có thêm một điểm, bảng điểm ${scoreSpoken(a,b)}.`,
        `${name} ghi điểm. ${scoreSpoken(a,b)} ở set ${setNo}.`,
        `Một điểm nữa thuộc về ${name}. Tỷ số hiện tại ${scoreSpoken(a,b)}.`,
        `${name} nâng tỷ số lên ${scoreSpoken(a,b)}.`],total+(side==='B'?2:0));}
    }
    return{text,kind,priority,total,court,setNo,name,opp,before:{a:beforeA,b:beforeB},after:{a,b}};
  },
  densityAllows(meta){const d=settings().density;if(meta.priority>=68)return true;if(d==='HIGH')return true;if(d==='LOW')return meta.total%4===0;return meta.total%2===0;},
  enqueue(item){
    if(!item?.text||!('speechSynthesis'in window))return false;
    const now=Date.now(),x={id:item.id||`u46_${now}_${Math.random().toString(36).slice(2,7)}`,text:pronounce(item.text),kind:item.kind||'SCORE',priority:Number(item.priority)||30,court:item.court||App.currentCourt||'court_1',createdAt:now,expiresAt:now+(item.priority>=85?20000:9000),source:item.source||'AUTO'};
    if(this.seen.has(x.id))return false;this.seen.add(x.id);if(this.seen.size>250)this.seen=new Set([...this.seen].slice(-150));
    if(x.source==='AUTO'&&$('auto-commentary')?.checked===false)return false;
    if(x.source==='AUTO'&&!this.densityAllows(item))return false;
    this.queue=this.queue.filter(q=>q.expiresAt>now);
    if(x.kind==='SCORE'||x.kind==='BIG_LEAD')this.queue=this.queue.filter(q=>!(q.court===x.court&&(q.kind==='SCORE'||q.kind==='BIG_LEAD')&&q.priority<=x.priority));
    if(x.priority>=85)this.queue=this.queue.filter(q=>q.priority>=85);
    this.queue.push(x);this.queue.sort((a,b)=>b.priority-a.priority||a.createdAt-b.createdAt);
    if(this.queue.length>5)this.queue=this.queue.slice(0,5);
    if(this.speaking&&this.current&&x.priority>=90&&this.current.priority<x.priority){try{speechSynthesis.cancel()}catch{}this.speaking=false;this.current=null;}
    this.status(`Local BLV: đã nhận ${x.kind} · ${x.text}`,'working');this.drain();return true;
  },
  drain(){
    if(this.speaking||!App.audioUnlocked||!('speechSynthesis'in window))return;
    if($('auto-commentary')?.checked===false&&this.queue[0]?.source==='AUTO'){this.queue=this.queue.filter(x=>x.source!=='AUTO');this.status('Local BLV: Auto đang tắt.','info');return;}
    const now=Date.now();while(this.queue.length&&this.queue[0].expiresAt<=now)this.queue.shift();const item=this.queue.shift();if(!item){this.status('Local BLV: sẵn sàng · không có câu chờ.','ok');return;}
    const voice=App.chooseVoice?.();if(!voice){this.status(settings().localOnly?'Không tìm thấy giọng vi-VN LOCAL. Bỏ chọn “Chỉ giọng local” nếu muốn dùng voice hệ thống.':'Không tìm thấy giọng tiếng Việt trên thiết bị.','err');return;}
    const u=new SpeechSynthesisUtterance(item.text);u.lang='vi-VN';u.voice=voice;u.rate=clamp($('blv-rate')?.value||1.08,.72,1.35);u.pitch=clamp($('blv-pitch')?.value||.98,.8,1.2);u.volume=clamp($('blv-volume')?.value||1,0,1);
    this.speaking=true;this.current=item;App.lastSpokenCommentId=item.id;
    u.onstart=()=>this.status(`Đang bình luận · ${item.kind}: ${item.text}`,'ok');
    const done=()=>{this.speaking=false;this.current=null;setTimeout(()=>this.drain(),90)};u.onend=done;u.onerror=done;
    try{speechSynthesis.speak(u)}catch(e){this.speaking=false;this.current=null;this.status('Không phát được giọng local: '+(e?.message||e),'err');}
  },
  stop(){this.queue=[];this.speaking=false;this.current=null;try{speechSynthesis.cancel()}catch{}this.status('Local BLV: đã dừng và xóa hàng đợi.','info');},
  resetMatch(matchId=''){for(const k of [...this.mem.keys()])if(!matchId||k.includes(`|${matchId}|`))this.mem.delete(k);}
};

function localVoices(){if(!('speechSynthesis'in window))return[];const all=speechSynthesis.getVoices().filter(v=>/^vi(?:[-_]|$)/i.test(v.lang||''));return settings().localOnly?all.filter(v=>v.localService===true):all;}
App.populateVoices=function(){
  const sel=$('blv-voice');if(!sel)return;const cfg=settings(),voices=localVoices();App.viVoices=voices;
  sel.innerHTML='<option value="AUTO">Tự động chọn giọng Việt phù hợp</option>'+voices.map((v,i)=>`<option value="${i}">${esc(v.name)} · ${esc(v.lang)}${v.localService===true?' · LOCAL':' · SYSTEM'}</option>`).join('');
  const keep=cfg.voice||'AUTO';sel.value=[...sel.options].some(o=>o.value===keep)?keep:'AUTO';sel.onchange=()=>saveSettings({voice:sel.value});
  const count=$('tk46-voice-count');if(count)count.textContent=voices.length?`${voices.length} giọng vi-VN ${cfg.localOnly?'local':''} tìm thấy`:'Chưa tìm thấy giọng vi-VN phù hợp';
};
App.chooseVoice=function(){
  const vs=localVoices(),sel=$('blv-voice'),idx=sel&&sel.value!=='AUTO'?Number(sel.value):-1;if(idx>=0&&vs[idx])return vs[idx];
  return vs.find(v=>/nam|male|minh|an|viet|vietnam/i.test(v.name||''))||vs[0]||null;
};
App.applyVoicePreset=function(mode){
  const presets={SPORT:{rate:1.08,pitch:.98},CALM:{rate:.94,pitch:1},ENERGY:{rate:1.18,pitch:1.02},LIVE:{rate:1.12,pitch:.98}},p=presets[mode]||presets.LIVE;
  if($('blv-rate'))$('blv-rate').value=p.rate;if($('blv-pitch'))$('blv-pitch').value=p.pitch;saveSettings({style:mode});
};
App.unlockAudio=function(){
  if(!('speechSynthesis'in window)){Engine.status('Thiết bị không hỗ trợ SpeechSynthesis.','err');return U.toast('Thiết bị không hỗ trợ giọng đọc trình duyệt','err');}
  App.populateVoices();const voice=App.chooseVoice();if(!voice){Engine.status(settings().localOnly?'Không có giọng vi-VN local trên thiết bị.':'Không có giọng vi-VN trên thiết bị.','err');return U.toast('Chưa tìm thấy giọng tiếng Việt phù hợp','err');}
  Engine.queue=[];App.audioUnlocked=true;$('audio-overlay')?.classList.add('hidden');App.renderHealth?.();Engine.enqueue({text:'Kênh bình luận tiếng Việt tại thiết bị đã sẵn sàng.',kind:'TEST',priority:100,total:0,source:'MANUAL'});U.toast('Đã bật TOPKEY Local BLV','ok');
};

const baseComment=App.comment?.bind(App);
App.comment=async function(text,meta={}){
  if(!text)return;if(!meta.kind&&/chính thức bắt đầu|bắt đầu trận/i.test(String(text)))meta={...meta,kind:'START',priority:Engine.priority.START,total:0};const court=meta.court||this.currentCourt||'court_1',id=meta.id||U.id('cmt'),row={id,courtId:court,text,commentator:'TOPKEY Local BLV',createdAt:Date.now(),engine:'LOCAL_BROWSER_U46',priority:meta.priority||Engine.priority[meta.kind]||40,kind:meta.kind||'SCORE'};
  Engine.enqueue({...row,source:meta.source||'AUTO',total:meta.total??0});
  Engine.lastCaption=row;U.setText?.('live-caption',`BLV: ${text}`);
  if(settings().shareCaption&&T.Data?.ready){try{await T.Data.queueSet('commentary/'+court+'/latest',row,{type:'COMMENTARY_LOCAL_U46'});}catch(e){console.warn('Upgrade46: không đồng bộ caption; local BLV vẫn hoạt động',e)}}
  return row;
};
App.speakCommentary=function(row){
  if(!row?.id||Engine.seen.has(row.id)||$('auto-commentary')?.checked===false)return;Engine.enqueue({id:row.id,text:row.text,kind:row.kind||'SCORE',priority:row.priority||40,court:row.courtId||App.currentCourt,total:0,source:'REMOTE'});
};
const baseRenderCommentary=App.renderCommentary?.bind(App);
App.renderCommentary=function(){
  const court=$('stream-court')?.value||this.currentCourt,row=this.state.commentary?.[court]?.latest||Engine.lastCaption;
  U.setText('live-caption',row?`BLV: ${row.text}`:'TOPKEY Local BLV đang chờ diễn biến trận đấu.');if(row)this.speakCommentary(row);
};
App.buildScoreCommentary=function(m,result,side){const meta=Engine.composeScore(m,result,side);App.__u46PendingScoreMeta=meta;return meta.text;};

// Preserve the existing score/scoring pipeline. Only attach commentary metadata after buildScoreCommentary runs.
const commentWithMeta=App.comment.bind(App);
App.comment=async function(text,meta={}){
  if(App.__u46PendingScoreMeta&&(!meta.kind||meta.kind==='SCORE')){meta={...App.__u46PendingScoreMeta,...meta};App.__u46PendingScoreMeta=null;}
  return commentWithMeta(text,meta);
};

// Upgrade44 owns the actual finish transaction. Wrap only the commentary context around it.
const baseEndMatch=App.endMatch?.bind(App);
if(baseEndMatch)App.endMatch=async function(...args){
  const s=this.state.activeMatches?.[this.currentCourt],m=s&&this.state.matches?.[s.matchId],winner=s&&T.Scoring?.winner?.(s.sets,currentRules()),winnerName=winner&&m?teamName(winner==='A'?m.teamAId:m.teamBId):'';
  const oldComment=this.comment;this.comment=async(text,meta={})=>oldComment.call(this,text,{...meta,kind:'MATCH_FINISH',priority:100,source:'AUTO'});
  try{return await baseEndMatch(...args)}finally{this.comment=oldComment;if(winnerName)Engine.status(`Local BLV: trận vừa kết thúc · ${winnerName}`,'ok');}
};

function ensureUi(){
  const voice=$('blv-voice');if(!voice)return;const card=voice.closest('.card');if(!card)return;
  const h=card.querySelector('h2');if(h)h.textContent='🎙 TOPKEY Local BLV · tiếng Việt';
  const intro=card.querySelector('p.muted');if(intro)intro.innerHTML='Bình luận tự động <b>ngay trên trình duyệt</b> từ diễn biến bảng điểm. Không gọi AI/TTS API, không cần Function, không cần Storage và không cần thêm cấu hình Database.';
  const voiceLabel=voice.closest('.field')?.querySelector('label');if(voiceLabel)voiceLabel.textContent='Giọng tiếng Việt trên thiết bị';
  const oldStatus=$('tk25-tts-status');if(oldStatus){oldStatus.id='tk46-local-status';oldStatus.textContent='Local BLV: chưa bật âm thanh.';oldStatus.dataset.state='info';}
  const pitch=$('blv-pitch')?.closest('.field');pitch?.classList.remove('tk25-browser-fallback');const pitchLabel=pitch?.querySelector('label');if(pitchLabel)pitchLabel.textContent='Cao độ';
  const preset=$('blv-preset');if(preset&&!preset.querySelector('option[value="LIVE"]')){const o=document.createElement('option');o.value='LIVE';o.textContent='Live thể thao · tự nhiên';preset.insertBefore(o,preset.firstChild);}if(preset){preset.value=settings().style||'LIVE';preset.onchange=e=>App.applyVoicePreset(e.target.value);}
  if($('audio-unlock'))$('audio-unlock').textContent='🔊 Bật TOPKEY Local BLV';if($('commentary-test'))$('commentary-test').textContent='▶ Thử giọng local';
  const note=card.querySelector('p.note');if(note)note.innerHTML='Engine tự nhận biết: đổi ngôi, san bằng, chuỗi điểm, cách biệt lớn, lội ngược dòng, điểm set, match point và kết thúc set/trận. Câu cũ sẽ bị loại khỏi hàng đợi để giọng không chạy chậm hơn trận đấu.';
  const overlay=$('audio-overlay');if(overlay){const p=overlay.querySelector('p');if(p)p.textContent='Trình duyệt cần một thao tác người dùng để mở giọng tiếng Việt trên thiết bị. Không có Cloud TTS/API.';const b=$('audio-overlay-btn');if(b)b.textContent='Bật TOPKEY Local BLV';}
  if(!$('tk46-controls')){
    const wrap=document.createElement('div');wrap.id='tk46-controls';wrap.className='tk46-controls';wrap.innerHTML=`
      <div class="tk46-grid">
        <div class="field"><label>Mật độ bình luận</label><select id="tk46-density"><option value="LOW">Ít · chỉ tình huống đáng chú ý</option><option value="MEDIUM">Vừa · giống truyền hình</option><option value="HIGH">Nhiều · gần như mỗi điểm</option></select></div>
        <label class="tk46-check"><input id="tk46-local-only" type="checkbox"> Chỉ dùng giọng LOCAL</label>
        <label class="tk46-check"><input id="tk46-share-caption" type="checkbox"> Đồng bộ phụ đề hiện có</label>
      </div>
      <div class="tk46-meta"><span id="tk46-voice-count">Đang dò giọng vi-VN…</span><span id="tk46-queue-status">Hàng đợi: 0</span></div>
      <div class="tk46-actions"><button id="tk46-stop" type="button" class="btn mini danger">⏹ Dừng giọng</button><button id="tk46-save-dict" type="button" class="btn mini">💾 Lưu cách đọc tên</button></div>
      <div class="field tk46-dict"><label>Từ điển phát âm local · mỗi dòng: TÊN= cách đọc</label><textarea id="tk46-pronunciation" rows="3" placeholder="CHEN LI REN=Chen Li Ren\nĐẠT=Đạt"></textarea></div>
      <div class="field tk46-manual"><label>Bình luận thủ công ngay</label><div class="tk46-manual-row"><input id="tk46-manual-text" placeholder="Nhập câu muốn BLV đọc ngay…"><button id="tk46-manual-speak" type="button" class="btn mini primary">🗣 Đọc ngay</button></div></div>`;
    note?.insertAdjacentElement('beforebegin',wrap);
  }
  const cfg=settings();if($('tk46-density')){$('tk46-density').value=cfg.density;$('tk46-density').onchange=e=>saveSettings({density:e.target.value});}
  if($('tk46-local-only')){$('tk46-local-only').checked=!!cfg.localOnly;$('tk46-local-only').onchange=e=>{saveSettings({localOnly:e.target.checked,voice:'AUTO'});App.populateVoices();};}
  if($('tk46-share-caption')){$('tk46-share-caption').checked=!!cfg.shareCaption;$('tk46-share-caption').onchange=e=>saveSettings({shareCaption:e.target.checked});}
  if($('tk46-pronunciation')){try{$('tk46-pronunciation').value=localStorage.getItem(DICT_KEY)||''}catch{}}
  if($('tk46-save-dict'))$('tk46-save-dict').onclick=()=>{try{localStorage.setItem(DICT_KEY,$('tk46-pronunciation')?.value||'')}catch{}U.toast('Đã lưu từ điển phát âm trên thiết bị','ok')};
  if($('tk46-stop'))$('tk46-stop').onclick=()=>Engine.stop();
  if($('tk46-manual-speak'))$('tk46-manual-speak').onclick=()=>{const input=$('tk46-manual-text'),text=input?.value.trim();if(!text)return;Engine.enqueue({text,kind:'MANUAL',priority:100,total:0,source:'MANUAL'});U.setText('live-caption','BLV: '+text);if(input)input.value='';};
  if($('commentary-test'))$('commentary-test').onclick=()=>Engine.enqueue({text:'Một pha cầu rất quan trọng. Tỷ số đang cân bằng và áp lực của set đấu đang tăng lên.',kind:'TEST',priority:100,total:0,source:'MANUAL'});
  if($('auto-commentary'))$('auto-commentary').onchange=e=>{localStorage.setItem('topkey_auto_blv',e.target.checked?'1':'0');if(!e.target.checked)Engine.stop();};
  App.populateVoices();App.applyVoicePreset(settings().style||'LIVE');
}

const baseHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){const out=baseHealth?.(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h)h.textContent=this.audioUnlocked?'UNLOCKED · LOCAL BLV':'LOCKED · LOCAL BLV';document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out;};
async function hardenServiceWorker46(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade46 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade46';try{App.renderHealth?.()}catch{}}
function install(){ensureUi();stamp();setTimeout(()=>{ensureUi();stamp()},0);setTimeout(()=>{ensureUi();stamp()},900);hardenServiceWorker46();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=()=>App.populateVoices();}
install();window.addEventListener('focus',()=>{ensureUi();stamp();hardenServiceWorker46();},{passive:true});
window.TopkeyUpgrade46={installed:true,VERSION,CACHE_TAG,Engine,settings,saveSettings,pronounce,parseDictionary,localVoices,canWinSetNext};
})();
