(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U48=window.TopkeyUpgrade48,U51=window.TopkeyUpgrade51;
if(!T||!App||!U||!U46||!U47||!U48||!U51||App.__upgrade75Installed)return;
App.__upgrade75Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade75-mandarin-pinyin-voice';
const CACHE_TAG='u75-20261029';
const BUILD='upgrade75';
const DICT_KEY='topkey_u46_pronunciation';
const SETTINGS_KEY='topkey_u75_pinyin_voice';
const ZH_VOICE='zh_CN-huayan-x_low';
const ZH_LABEL='TOPKEY Mandarin · Huayan x_low';
const ZH_SIZE=20628813;
const $=id=>document.getElementById(id),Engine=U46.Engine,Piper=U47.Piper;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

const state={installed:false,checking:false,installing:false,progress:0,lastError:'',session:null,sessionPromise:null,audio:null,audioDone:null,objectUrl:'',detected:[],lastMode:'',lastName:''};
function readSettings(){let x={enabled:true,autoInstall:true,preferSystem:true};try{x={...x,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{}return x}
function saveSettings(p){const x={...readSettings(),...p};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(x))}catch{}return x}
function humanBytes(n){n=Number(n)||0;if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';return(n/1048576).toFixed(1)+' MB'}
function hasHanzi(s){return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(String(s||''))}
function foldPinyin(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ü/gi,'v').replace(/[1-5]/g,'').toLowerCase()}
function pinyinTokens(s){return String(s||'').trim().split(/[\s'’\-]+/u).map(x=>x.replace(/[^A-Za-zÀ-žüÜ1-5]/g,'')).filter(Boolean)}
const PINYIN_ALIASES={roi:'rui',rung:'rong',ching:'qing'};
function normalizePinyinToken(raw){const s=foldPinyin(raw);return PINYIN_ALIASES[s]||s}
function isPinyinSyllable(raw){
  const s=normalizePinyinToken(raw);if(!s||s.length>7)return false;
  if(/^(zhi|chi|shi|ri|zi|ci|si)$/.test(s))return true;
  if(/^(yi|ya|yai|yao|ye|you|yan|yin|yang|ying|yong|wu|wa|wai|wei|wan|wen|wang|weng|yu|yue|yuan|yun)$/.test(s))return true;
  return /^(?:(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcs])?(?:a|ai|an|ang|ao|e|ei|en|eng|er|i|ia|ian|iang|iao|ie|in|ing|iong|iu|o|ong|ou|u|ua|uai|uan|uang|ui|un|uo|v|ve|van|vn))$/.test(s);
}
function looksLikePinyinName(name){
  const raw=String(name||'').trim();if(!raw)return false;if(hasHanzi(raw))return true;
  const toks=pinyinTokens(raw);if(toks.length<2||toks.length>5)return false;
  return toks.every(isPinyinSyllable);
}
function parseDictionary75(){
  let raw='';try{raw=localStorage.getItem(DICT_KEY)||''}catch{}
  const rows=[];for(const line of String(raw).split(/\r?\n/)){
    const p=line.indexOf('=');if(p<=0)continue;const from=line.slice(0,p).trim(),rhs=line.slice(p+1).trim();if(!from||!rhs)continue;
    let mode='LEGACY',target=rhs;const m=rhs.match(/^\s*(PY|PINYIN|ZH|HANZI|VI)\s*:\s*(.+)$/iu);if(m){mode=/^(ZH|HANZI)$/iu.test(m[1])?'ZH':/^(PY|PINYIN)$/iu.test(m[1])?'PY':'VI';target=m[2].trim()}
    rows.push({from,target,mode,pinyinSource:looksLikePinyinName(from)||hasHanzi(from)});
  }
  return rows.sort((a,b)=>b.from.length-a.from.length);
}
function regexEscape(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function dictionaryEntryFor(name){const n=String(name||'').trim().toLocaleLowerCase('vi');return parseDictionary75().find(x=>x.from.toLocaleLowerCase('vi')===n)||null}

// Preserve Pinyin/Hanzi names for the Mandarin segmenter. Legacy dictionary rows for
// ordinary Vietnamese names still behave exactly as Upgrade46. For Chinese/Pinyin
// rows, the RHS becomes a fallback or an explicit PY:/ZH: Mandarin target instead of
// destroying the original name before language routing can see it.
const legacyPronounce=U46.pronounce;
U46.pronounce=function(text){
  let out=String(text||'').replace(/\bMIX\b/gi,'đôi nam nữ').replace(/\bMEN\b/gi,'đôi nam').replace(/\bWOMEN\b/gi,'đôi nữ');
  for(const row of parseDictionary75()){
    if(row.mode==='PY'||row.mode==='ZH'||(row.pinyinSource&&row.mode==='LEGACY'))continue;
    try{out=out.replace(new RegExp(regexEscape(row.from),'giu'),row.target)}catch{out=out.split(row.from).join(row.target)}
  }
  return out.replace(/\s+/g,' ').trim();
};

function zhSystemVoices(){if(!('speechSynthesis'in window))return[];return speechSynthesis.getVoices().filter(v=>/^zh(?:[-_]|$)/i.test(v.lang||''))}
function chooseZhSystemVoice(){const vs=zhSystemVoices();return vs.find(v=>/mandarin|putong|普通|中文|china|chinese|google/i.test(`${v.name||''} ${v.lang||''}`))||vs[0]||null}
function rosterNames(){const set=new Set();for(const t of Object.values(App.state?.teams||{})){for(const x of [t?.p1,t?.p2]){const n=String(x||'').trim();if(n)set.add(n)}}return[...set]}
function chineseRosterNames(){return rosterNames().filter(n=>!!mandarinTarget(n))}
function needsMandarin(){return readSettings().enabled&&chineseRosterNames().length>0}

function mandarinTarget(name){
  const n=String(name||'').trim(),row=dictionaryEntryFor(n);
  if(row?.mode==='VI')return null;
  if(row?.mode==='ZH'||row?.mode==='PY')return{display:n,target:row.target,mode:row.mode,legacyFallback:row.target};
  if(hasHanzi(n))return{display:n,target:n,mode:'ZH',legacyFallback:n};
  if(looksLikePinyinName(n)){const normalized=pinyinTokens(n).map(t=>PINYIN_ALIASES[foldPinyin(t)]||t).join(' ');return{display:n,target:normalized,mode:'PY',legacyFallback:row?.target||n};}
  return null;
}
function collectNameTargets(){
  const rows=[];for(const n of rosterNames()){const target=mandarinTarget(n);if(target)rows.push(target)}
  for(const d of parseDictionary75()){if(['PY','ZH'].includes(d.mode)&&!rows.some(x=>x.display.toLocaleLowerCase('vi')===d.from.toLocaleLowerCase('vi')))rows.push({display:d.from,target:d.target,mode:d.mode,legacyFallback:d.target})}
  return rows.sort((a,b)=>b.display.length-a.display.length);
}
function splitMixed(text){
  const source=String(text||''),targets=collectNameTargets();if(!source||!targets.length)return[{lang:'vi',text:source}];
  const hits=[];for(const t of targets){let re;try{re=new RegExp(regexEscape(t.display),'giu')}catch{continue}let m;while((m=re.exec(source))){hits.push({start:m.index,end:m.index+m[0].length,...t});if(!m[0].length)break}}
  hits.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));const picked=[];let end=-1;for(const h of hits){if(h.start<end)continue;picked.push(h);end=h.end}
  if(!picked.length)return[{lang:'vi',text:source}];
  const out=[];let pos=0;for(const h of picked){if(h.start>pos){const v=source.slice(pos,h.start);if(v.trim())out.push({lang:'vi',text:v})}out.push({lang:'zh',text:h.target,display:source.slice(h.start,h.end),mode:h.mode,fallback:h.legacyFallback});pos=h.end}if(pos<source.length){const v=source.slice(pos);if(v.trim())out.push({lang:'vi',text:v})}
  return out.filter(x=>String(x.text||'').trim());
}

async function refreshInstalled(){
  if(state.checking)return state.installed;state.checking=true;try{const m=await Piper.load(),list=await m.stored?.();state.installed=Array.isArray(list)&&list.includes(ZH_VOICE);state.lastError=''}catch(e){state.lastError=e?.message||String(e)}finally{state.checking=false;renderUi()}return state.installed;
}
async function installMandarin(force=false){
  if(state.installing)return false;if(!force&&(!needsMandarin()||chooseZhSystemVoice()||!readSettings().autoInstall))return false;
  if(await refreshInstalled())return prepareZhSession();
  state.installing=true;state.progress=0;state.lastError='';renderUi();
  try{
    const m=await Piper.load();if(!m.download)throw new Error('Runtime Piper không hỗ trợ tải model Mandarin.');
    await m.download(ZH_VOICE,p=>{const loaded=Number(p?.loaded)||0,total=Number(p?.total)||ZH_SIZE;state.progress=Math.max(0,Math.min(100,total?Math.round(loaded*100/total):0));renderUi()});
    state.installed=true;state.progress=100;renderUi();return await prepareZhSession();
  }catch(e){state.lastError=e?.message||String(e);return false}finally{state.installing=false;renderUi()}
}
async function prepareZhSession(){
  if(state.session)return true;if(state.sessionPromise)return state.sessionPromise;if(!state.installed)return false;
  state.sessionPromise=(async()=>{
    const m=await Piper.load();const opts={voiceId:ZH_VOICE,allowLocalModels:true,fallbackStrategy:'local',wasmPaths:{onnxWasm:U51.ORT_BASE,piperData:`${U51.PHONEMIZE_BASE}.data`,piperWasm:`${U51.PHONEMIZE_BASE}.wasm`},logger:()=>{}};
    // Direct constructor deliberately avoids the library singleton used by the hot
    // Vietnamese session. Mandarin and Vietnamese can therefore coexist.
    const s=m.TtsSession?new m.TtsSession(opts):null;if(!s?.predict)throw new Error('Không tạo được Mandarin TtsSession.');state.session=s;return true;
  })().catch(e=>{state.session=null;state.lastError=e?.message||String(e);return false}).finally(()=>{state.sessionPromise=null;renderUi()});
  return state.sessionPromise;
}
function ensureZhAudio(){if(!state.audio){const a=document.createElement('audio');a.id='tk75-mandarin-audio';a.preload='auto';a.setAttribute('playsinline','');a.style.display='none';document.body.appendChild(a);state.audio=a}return state.audio}
async function playBlob(blob,item,first=false){
  const a=ensureZhAudio();if(state.objectUrl)try{URL.revokeObjectURL(state.objectUrl)}catch{}state.objectUrl=URL.createObjectURL(blob);a.src=state.objectUrl;a.playbackRate=Math.max(.84,Math.min(1.22,Number($('blv-rate')?.value)||1.08));a.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));
  return new Promise(async(resolve,reject)=>{let started=false,settled=false;const clean=()=>{a.onplaying=null;a.onended=null;a.onerror=null;state.audioDone=null};const done=(ok,err)=>{if(settled)return;settled=true;clean();ok?resolve(true):reject(err||new Error('Audio Mandarin không phát được'))};state.audioDone=()=>done(true);a.onplaying=()=>{started=true;if(first)Piper.lastStartLatency=Math.max(0,Date.now()-Number(item?.eventAt||item?.createdAt||Date.now()));renderUi()};a.onended=()=>done(true);a.onerror=()=>done(false,new Error('Audio Mandarin không phát được'));try{await a.play()}catch(e){done(false,e)}setTimeout(()=>{if(!started)done(false,new Error('Audio Mandarin không bắt đầu sau 2 giây'))},2000)});
}
function stopMandarin(){const a=state.audio,done=state.audioDone;try{a?.pause?.();if(a)a.currentTime=0}catch{}try{done?.()}catch{}return true}
async function speakZhPiper(text,item,first=false){
  if(!state.installed&&!(await refreshInstalled()))return false;if(!(await prepareZhSession()))return false;const t0=performance.now(),blob=await state.session.predict(String(text||''));Piper.lastSynthMs=Math.round(performance.now()-t0);await playBlob(blob,item,first);return true;
}
function speakSystem(text,lang,voice,item,first=false){
  return new Promise(resolve=>{if(!voice||!('speechSynthesis'in window))return resolve(false);const u=new SpeechSynthesisUtterance(String(text||''));u.lang=lang;u.voice=voice;u.rate=Math.max(.82,Math.min(1.3,Number($('blv-rate')?.value)||1.08));u.pitch=lang.startsWith('zh')?1:Math.max(.8,Math.min(1.2,Number($('blv-pitch')?.value)||.98));u.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));u.onstart=()=>{if(first)Piper.lastStartLatency=Math.max(0,Date.now()-Number(item?.eventAt||item?.createdAt||Date.now()));renderUi()};u.onend=()=>resolve(true);u.onerror=()=>resolve(false);try{speechSynthesis.speak(u)}catch{resolve(false)}})
}
async function speakVi(text,item,first=false){
  const transport=U47.selectedEngine();if(transport==='PIPER')return Piper.speak(String(text||''),item);
  const voice=App.chooseVoice?.()||U48.fastSystemVoice?.();return speakSystem(text,'vi-VN',voice,item,first);
}
function viFallbackFor(seg){
  const row=dictionaryEntryFor(seg.display);if(row&&row.mode==='VI')return row.target;if(row&&row.mode==='LEGACY'&&row.target)return row.target;
  return seg.display||seg.text;
}
async function speakMixed(item){
  const segs=splitMixed(item.text);if(!segs.some(x=>x.lang==='zh'))return false;let first=true;
  for(const seg of segs){
    if(!String(seg.text||'').trim())continue;
    if(seg.lang==='vi'){await speakVi(seg.text,item,first);first=false;continue}
    state.lastName=seg.display||seg.text;let ok=false;const sys=readSettings().preferSystem?chooseZhSystemVoice():null;
    if(sys){state.lastMode='SYSTEM zh-CN';ok=await speakSystem(seg.text,'zh-CN',sys,item,first)}
    else if(state.installed||(await refreshInstalled())){state.lastMode=ZH_LABEL;try{ok=await speakZhPiper(seg.text,item,first)}catch(e){state.lastError=e?.message||String(e);ok=false}}
    if(!ok){state.lastMode='VI fallback';const fallback=viFallbackFor(seg);await speakVi(fallback,item,first)}
    first=false;renderUi();
  }
  return true;
}

// Final transport layer: preserve Upgrade48/73 queue semantics but route known
// Chinese/Pinyin player names through Mandarin without changing captions/data.
Engine.drain=async function(){
  if(this.speaking||!App.audioUnlocked)return;
  if($('auto-commentary')?.checked===false&&this.queue[0]?.source==='AUTO'){this.queue=this.queue.filter(x=>x.source!=='AUTO');this.status('BLV: Auto đang tắt.','info');return}
  const now=Date.now();while(this.queue.length&&this.queue[0].expiresAt<=now)this.queue.shift();const item=this.queue.shift();if(!item){this.status('BLV Realtime: sẵn sàng.','ok');renderUi();return}
  item.eventAt=Number(item.eventAt||item.createdAt||now);const segments=splitMixed(item.text),mixed=segments.some(x=>x.lang==='zh');
  const transport=U47.selectedEngine();if(transport==='NONE'&&!mixed){this.queue.unshift(item);this.status('Chưa có giọng Việt. Hãy tải TOPKEY Offline Voice hoặc chọn giọng hệ thống.','err');return}
  this.speaking=true;this.current=item;App.lastSpokenCommentId=item.id;this.status(`${mixed?'BLV VI + 中文/Pinyin':'BLV Realtime'} · ${item.kind}: ${item.text}`,'ok');
  try{
    if(mixed)await speakMixed(item);
    else if(transport==='PIPER')await Piper.speak(item.text,item);
    else await speakVi(item.text,item,true);
  }catch(e){this.status('BLV không phát được: '+(e?.message||e),'err')}
  finally{this.speaking=false;this.current=null;setTimeout(()=>this.drain(),35)}
};

function ensureUi(){
  const anchor=$('tk52-dict-sync')||$('tk46-pronunciation')?.closest('.field')||$('tk47-voice-pack')||$('tk46-controls');if(!anchor)return;
  if(!$('tk75-pinyin-card')){const box=document.createElement('section');box.id='tk75-pinyin-card';box.className='tk75-pinyin-card';box.innerHTML=`<div class="tk75-head"><div><b>🇨🇳 Tên Trung Quốc · Mandarin / Hanyu Pinyin</b><div class="muted">Tên Pinyin/Hán tự được đọc bằng giọng zh-CN; câu bình luận còn lại vẫn là tiếng Việt.</div></div><span id="tk75-pinyin-badge" class="tk75-badge">ĐANG KIỂM TRA</span></div><div id="tk75-pinyin-status" class="tk75-status">Đang dò tên và giọng Mandarin…</div><div class="tk75-options"><label><input id="tk75-enable" type="checkbox"> Tự nhận diện tên Pinyin/Hán tự</label><label><input id="tk75-auto" type="checkbox"> Tự tải giọng Mandarin nếu máy thiếu zh-CN</label></div><div class="tk75-progress"><i id="tk75-progress-bar"></i></div><div class="tk75-help"><b>Từ điển nâng cao:</b> <code>CHEN LI REN=PY: Chen Li Ren</code> · <code>TÊN=ZH: 汉字</code> · <code>TÊN=VI: cách đọc Việt</code>. Pinyin Latin không có dấu thanh sẽ dùng phát âm Mandarin của các âm tiết nhưng hệ thống không tự đoán thanh điệu/tên Hán tự.</div>`;anchor.insertAdjacentElement('afterend',box)}
  const cfg=readSettings(),en=$('tk75-enable'),au=$('tk75-auto');if(en){en.checked=cfg.enabled;en.onchange=e=>{saveSettings({enabled:e.target.checked});renderUi()}}if(au){au.checked=cfg.autoInstall;au.onchange=e=>{saveSettings({autoInstall:e.target.checked});if(e.target.checked)bootstrapMandarin('ui');renderUi()}}
  const label=$('tk46-pronunciation')?.closest('.field')?.querySelector('label');if(label)label.textContent='Từ điển phát âm dùng chung · TÊN=cách đọc · hỗ trợ PY:/ZH:/VI:';
  const ta=$('tk46-pronunciation');if(ta)ta.placeholder='CHEN LI REN=PY: Chen Li Ren\nTÊN TRUNG QUỐC=ZH: 汉字\nĐẠT=VI: Đạt';
  renderUi();
}
function renderUi(){
  const badge=$('tk75-pinyin-badge'),status=$('tk75-pinyin-status'),bar=$('tk75-progress-bar');if(!badge||!status)return;const names=chineseRosterNames();state.detected=names;
  if(bar)bar.style.width=`${state.installing?state.progress:state.installed?100:0}%`;
  if(!readSettings().enabled){badge.dataset.state='off';badge.textContent='ĐÃ TẮT';status.textContent='Đang tắt nhận diện tên Pinyin/Hán tự.';return}
  const sys=chooseZhSystemVoice();if(sys){badge.dataset.state='ok';badge.textContent='zh-CN SYSTEM';status.textContent=`✓ Có giọng Mandarin hệ thống: ${sys.name}. ${names.length?`Đã nhận diện ${names.length} tên: ${names.slice(0,4).join(', ')}${names.length>4?'…':''}`:'Chưa thấy tên Pinyin/Hán tự trong danh sách VĐV.'}`;return}
  if(state.installing){badge.dataset.state='working';badge.textContent=`ĐANG TẢI ${state.progress}%`;status.textContent=`Thiết bị thiếu zh-CN · đang tự tải ${ZH_LABEL} (~${humanBytes(ZH_SIZE)}).`;return}
  if(state.installed){badge.dataset.state='ok';badge.textContent='MANDARIN OFFLINE';status.textContent=`✓ ${ZH_LABEL} đã cài.${state.lastName?` Gần nhất: ${state.lastName} · ${state.lastMode}.`:''}`;return}
  if(state.lastError){badge.dataset.state='err';badge.textContent='MANDARIN LỖI';status.textContent=`Không chuẩn bị được giọng Mandarin: ${state.lastError}. Khi cần tên Trung Quốc, TOPKEY sẽ dùng cách đọc VI fallback.`;return}
  badge.dataset.state=names.length?'need':'info';badge.textContent=names.length?'CẦN GIỌNG zh-CN':'CHƯA CÓ TÊN';status.textContent=names.length?`Đã nhận diện ${names.length} tên Pinyin/Hán tự. TOPKEY sẽ tự chuẩn bị giọng Mandarin.`:'Chưa thấy tên Pinyin/Hán tự trong danh sách VĐV.';
}
async function bootstrapMandarin(reason='auto'){
  ensureUi();if(!needsMandarin()){renderUi();return false}if(chooseZhSystemVoice()){renderUi();return true}
  await refreshInstalled();if(state.installed){await prepareZhSession();renderUi();return true}
  if(readSettings().autoInstall&&navigator.onLine!==false){const ok=await installMandarin(false);renderUi();return ok}renderUi();return false;
}

const baseRenderBranch=App.renderBranch?.bind(App);if(baseRenderBranch)App.renderBranch=function(branch,...args){const out=baseRenderBranch(branch,...args);if(branch==='teams')setTimeout(()=>bootstrapMandarin('teams'),0);return out};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(['umpire','live'].includes(tab))setTimeout(()=>bootstrapMandarin(tab),0);return out};
const baseAfterLogin=App.afterLogin?.bind(App);if(baseAfterLogin)App.afterLogin=async function(...args){const out=await baseAfterLogin(...args);setTimeout(()=>bootstrapMandarin('login'),300);return out};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h&&needsMandarin())h.textContent+=chooseZhSystemVoice()?' · PINYIN zh-CN':state.installed?' · PINYIN OFFLINE':' · PINYIN PREP';return out};
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;ensureUi();try{App.renderHealth?.()}catch{}}
function install(){stamp();setTimeout(stamp,0);setTimeout(()=>bootstrapMandarin('boot'),1500);setTimeout(()=>bootstrapMandarin('boot-late'),4500)}
install();window.addEventListener('focus',()=>{stamp();setTimeout(()=>bootstrapMandarin('focus'),100)},{passive:true});window.addEventListener('online',()=>bootstrapMandarin('online'),{passive:true});if('speechSynthesis'in window){const old=speechSynthesis.onvoiceschanged;speechSynthesis.onvoiceschanged=()=>{try{old?.()}catch{}renderUi();bootstrapMandarin('voiceschanged')}}
window.TopkeyUpgrade75={installed:true,VERSION,CACHE_TAG,BUILD,ZH_VOICE,ZH_SIZE,looksLikePinyinName,isPinyinSyllable,splitMixed,mandarinTarget,parseDictionary75,chineseRosterNames,bootstrapMandarin,refreshInstalled,stopMandarin,state};
})();
