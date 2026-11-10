(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46;
if(!T||!App||!U||!U46||App.__upgrade47Installed)return;
App.__upgrade47Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade47';
const CACHE_TAG='u47-20261029';
const SETTINGS_KEY='topkey_u47_android_voice_settings';
const PIPER_VOICE='vi_VN-vais1000-medium';
const PIPER_LABEL='TOPKEY Offline Voice · Việt Nam · vais1000 medium';
const PIPER_SIZE=63201294;
const PIPER_MODULE='https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm';
const $=id=>document.getElementById(id);
const Engine=U46.Engine;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

function readSettings(){let x={mode:'AUTO'};try{x={...x,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{}return x}
function saveSettings(patch){const x={...readSettings(),...patch};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(x))}catch{}return x}
function isAndroid(){return /Android/i.test(navigator.userAgent||'')}
function secureStorageOk(){return !!(window.isSecureContext&&navigator.storage?.getDirectory)}
function humanBytes(n){n=Number(n)||0;if(n<1024)return n+' B';if(n<1024*1024)return(n/1024).toFixed(1)+' KB';return(n/1024/1024).toFixed(1)+' MB'}
function systemVoices(){if(!('speechSynthesis'in window))return[];const all=speechSynthesis.getVoices().filter(v=>/^vi(?:[-_]|$)/i.test(v.lang||''));return U46.settings().localOnly?all.filter(v=>v.localService===true):all}
function chooseSystemVoice(){const vs=systemVoices(),sel=$('blv-voice'),idx=sel&&sel.value!=='AUTO'?Number(sel.value):-1;if(idx>=0&&vs[idx])return vs[idx];return vs.find(v=>/nam|male|minh|an|viet|vietnam|google/i.test(v.name||''))||vs[0]||null}

const Piper={
  module:null,modulePromise:null,installed:false,checking:false,busy:false,audio:null,objectUrl:'',token:0,lastError:'',
  async load(){
    if(this.module)return this.module;
    if(!secureStorageOk())throw new Error('Trình duyệt cần HTTPS và OPFS để lưu gói giọng offline.');
    if(!this.modulePromise)this.modulePromise=import(PIPER_MODULE).then(m=>{this.module=m;return m}).catch(e=>{this.modulePromise=null;throw e});
    return this.modulePromise;
  },
  async refresh(){
    if(this.checking)return this.installed;this.checking=true;
    try{const m=await this.load(),list=await m.stored();this.installed=Array.isArray(list)&&list.includes(PIPER_VOICE);this.lastError='';}
    catch(e){this.installed=false;this.lastError=e?.message||String(e)}finally{this.checking=false;renderVoicePack()}
    return this.installed;
  },
  async install(){
    if(this.busy)return;this.busy=true;this.lastError='';renderVoicePack();
    try{
      if(navigator.storage?.persist){try{await navigator.storage.persist()}catch{}}
      const m=await this.load();let lastPct=0;
      setPackStatus('Đang chuẩn bị tải gói giọng Việt…','working',0);
      await m.download(PIPER_VOICE,p=>{
        const loaded=Number(p?.loaded)||0,total=Number(p?.total)||PIPER_SIZE,pct=Math.max(0,Math.min(100,total?Math.round(loaded*100/total):0));
        if(pct!==lastPct){lastPct=pct;setPackStatus(`Đang tải giọng Việt: ${pct}% · ${humanBytes(loaded)} / ${humanBytes(total)}`,'working',pct)}
      });
      this.installed=true;saveSettings({mode:'PIPER'});setPackStatus('Đã cài TOPKEY Offline Voice. Có thể dùng cho BLV trên Android.','ok',100);U.toast('Đã tải xong giọng Việt TOPKEY','ok');
      await refreshStorageEstimate();
    }catch(e){this.installed=false;this.lastError=e?.message||String(e);setPackStatus('Không tải được gói giọng: '+this.lastError,'err',0);U.toast('Tải giọng Việt thất bại','err')}
    finally{this.busy=false;renderVoicePack()}
  },
  async remove(){
    if(this.busy)return;this.busy=true;renderVoicePack();
    try{const m=await this.load();await m.remove(PIPER_VOICE);this.installed=false;if(readSettings().mode==='PIPER')saveSettings({mode:'AUTO'});setPackStatus('Đã xóa gói giọng TOPKEY khỏi thiết bị.','info',0);U.toast('Đã xóa gói giọng Việt','ok');await refreshStorageEstimate()}
    catch(e){this.lastError=e?.message||String(e);setPackStatus('Không xóa được gói giọng: '+this.lastError,'err',0)}finally{this.busy=false;renderVoicePack()}
  },
  ensureAudio(){if(!this.audio){this.audio=document.createElement('audio');this.audio.preload='auto';this.audio.setAttribute('playsinline','');this.audio.id='tk47-piper-audio';this.audio.style.display='none';document.body.appendChild(this.audio)}return this.audio},
  stop(){this.token++;const a=this.audio;if(a){try{a.pause();a.currentTime=0}catch{}}if(this.objectUrl){try{URL.revokeObjectURL(this.objectUrl)}catch{}this.objectUrl='';}this.busy=false;},
  async speak(text,item){
    if(!this.installed)throw new Error('Chưa tải TOPKEY Offline Voice.');
    const m=await this.load(),token=++this.token,a=this.ensureAudio();this.busy=true;renderVoicePack();
    setPackStatus('Đang tạo giọng offline trên thiết bị…','working');
    try{
      const wav=await m.predict({text,voiceId:PIPER_VOICE});
      if(token!==this.token)return false;
      if(this.objectUrl)try{URL.revokeObjectURL(this.objectUrl)}catch{}
      this.objectUrl=URL.createObjectURL(wav);a.src=this.objectUrl;a.playbackRate=Math.max(.78,Math.min(1.3,Number($('blv-rate')?.value)||1.08));a.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));
      await a.play();
      return await new Promise(resolve=>{const done=()=>{a.onended=null;a.onerror=null;resolve(true)};a.onended=done;a.onerror=done});
    }finally{if(token===this.token){this.busy=false;renderVoicePack()}}
  }
};

function selectedEngine(){
  const mode=readSettings().mode;
  if(mode==='SYSTEM')return chooseSystemVoice()?'SYSTEM':'NONE';
  if(mode==='PIPER')return Piper.installed?'PIPER':'NONE';
  if(chooseSystemVoice())return'SYSTEM';
  if(Piper.installed)return'PIPER';
  return'NONE';
}
function setPackStatus(text,state='info',pct=null){
  const el=$('tk47-pack-status');if(el){el.textContent=text;el.dataset.state=state}
  const bar=$('tk47-progress-bar');if(bar&&pct!==null)bar.style.width=`${Math.max(0,Math.min(100,Number(pct)||0))}%`;
}
async function refreshStorageEstimate(){
  const el=$('tk47-storage');if(!el||!navigator.storage?.estimate)return;
  try{const e=await navigator.storage.estimate(),persisted=navigator.storage.persisted?await navigator.storage.persisted():false;el.textContent=`Bộ nhớ web: ${humanBytes(e.usage||0)} / ${humanBytes(e.quota||0)}${persisted?' · được giữ lâu dài':''}`}
  catch{el.textContent='Không đọc được dung lượng bộ nhớ web.'}
}
function renderVoicePack(){
  const installed=Piper.installed,mode=readSettings().mode,btn=$('tk47-install'),del=$('tk47-remove'),sel=$('tk47-engine');
  if(sel)sel.value=mode;if(btn){btn.disabled=Piper.busy;btn.textContent=installed?'✓ Giọng Việt TOPKEY đã cài':'⬇ Tải giọng Việt TOPKEY (~63 MB)'}
  if(del){del.disabled=Piper.busy||!installed;del.style.display=installed?'inline-flex':'none'}
  const badge=$('tk47-pack-badge');if(badge){badge.textContent=installed?'OFFLINE VOICE · ĐÃ CÀI':'OFFLINE VOICE · CHƯA CÀI';badge.dataset.state=installed?'ok':'info'}
  if(!Piper.busy){
    if(installed)setPackStatus(`Đã cài ${PIPER_LABEL}. Model nằm trong bộ nhớ riêng của website trên thiết bị này.`,'ok',100);
    else if(Piper.lastError)setPackStatus('Chưa kiểm tra được gói offline: '+Piper.lastError,'err',0);
    else setPackStatus('Nếu Android không có giọng vi-VN phù hợp, tải gói này một lần để BLV chạy bằng Piper ngay trên máy.','info',0);
  }
  updateVoiceSummary();
}
function updateVoiceSummary(){
  const el=$('tk47-engine-summary');if(!el)return;const sys=systemVoices().length,eng=selectedEngine();
  el.textContent=`Android: ${isAndroid()?'CÓ':'không'} · vi-VN hệ thống: ${sys} · Piper: ${Piper.installed?'đã cài':'chưa cài'} · đang ưu tiên: ${eng==='PIPER'?'TOPKEY Offline':eng==='SYSTEM'?'Hệ thống':'chưa có giọng'}`;
}

// Upgrade46's commentary analysis/queue is retained. Upgrade47 only replaces the audio transport.
Engine.enqueue=function(item){
  if(!item?.text)return false;const now=Date.now(),x={id:item.id||`u47_${now}_${Math.random().toString(36).slice(2,7)}`,text:U46.pronounce(item.text),kind:item.kind||'SCORE',priority:Number(item.priority)||30,court:item.court||App.currentCourt||'court_1',createdAt:now,expiresAt:now+(item.priority>=85?20000:9000),source:item.source||'AUTO',total:item.total??0,eventAt:Number(item.eventAt||item.createdAt||now)};
  if(this.seen.has(x.id))return false;this.seen.add(x.id);if(this.seen.size>250)this.seen=new Set([...this.seen].slice(-150));
  if(x.source==='AUTO'&&$('auto-commentary')?.checked===false)return false;if(x.source==='AUTO'&&!this.densityAllows(item))return false;
  this.queue=this.queue.filter(q=>q.expiresAt>now);if(x.kind==='SCORE'||x.kind==='BIG_LEAD')this.queue=this.queue.filter(q=>!(q.court===x.court&&(q.kind==='SCORE'||q.kind==='BIG_LEAD')&&q.priority<=x.priority));if(x.priority>=85)this.queue=this.queue.filter(q=>q.priority>=85);
  this.queue.push(x);this.queue.sort((a,b)=>b.priority-a.priority||a.createdAt-b.createdAt);if(this.queue.length>5)this.queue=this.queue.slice(0,5);
  if(this.speaking&&this.current&&x.priority>=90&&this.current.priority<x.priority){try{speechSynthesis?.cancel?.()}catch{}Piper.stop();this.speaking=false;this.current=null;}
  this.status(`BLV: đã nhận ${x.kind} · ${x.text}`,'working');this.drain();return true;
};
Engine.drain=async function(){
  if(this.speaking||!App.audioUnlocked)return;if($('auto-commentary')?.checked===false&&this.queue[0]?.source==='AUTO'){this.queue=this.queue.filter(x=>x.source!=='AUTO');this.status('BLV: Auto đang tắt.','info');return}
  const now=Date.now();while(this.queue.length&&this.queue[0].expiresAt<=now)this.queue.shift();const item=this.queue.shift();if(!item){this.status('BLV: sẵn sàng · không có câu chờ.','ok');return}
  const transport=selectedEngine();if(transport==='NONE'){this.queue.unshift(item);this.status('Chưa có giọng Việt. Hãy tải TOPKEY Offline Voice hoặc chọn giọng hệ thống.','err');return}
  this.speaking=true;this.current=item;App.lastSpokenCommentId=item.id;this.status(`Đang bình luận bằng ${transport==='PIPER'?'TOPKEY Offline':'giọng hệ thống'} · ${item.kind}: ${item.text}`,'ok');
  try{
    if(transport==='PIPER')await Piper.speak(item.text,item);
    else await new Promise(resolve=>{const voice=chooseSystemVoice();if(!voice)throw new Error('Không tìm thấy voice vi-VN hệ thống');const u=new SpeechSynthesisUtterance(item.text);u.lang='vi-VN';u.voice=voice;u.rate=Math.max(.72,Math.min(1.35,Number($('blv-rate')?.value)||1.08));u.pitch=Math.max(.8,Math.min(1.2,Number($('blv-pitch')?.value)||.98));u.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));u.onend=()=>resolve();u.onerror=()=>resolve();try{speechSynthesis.speak(u)}catch{resolve()}});
  }catch(e){this.status('BLV không phát được: '+(e?.message||e),'err')}
  finally{this.speaking=false;this.current=null;setTimeout(()=>this.drain(),100)}
};
Engine.stop=function(){this.queue=[];this.speaking=false;this.current=null;try{speechSynthesis?.cancel?.()}catch{}Piper.stop();this.status('BLV: đã dừng và xóa hàng đợi.','info')};

App.populateVoices=function(){
  const sel=$('blv-voice');if(!sel)return;const voices=systemVoices();App.viVoices=voices;sel.innerHTML='<option value="AUTO">Tự động chọn giọng vi-VN hệ thống</option>'+voices.map((v,i)=>`<option value="${i}">${App.escape?.(v.name)||v.name} · ${v.lang}${v.localService===true?' · LOCAL':' · SYSTEM'}</option>`).join('');const keep=U46.settings().voice||'AUTO';sel.value=[...sel.options].some(o=>o.value===keep)?keep:'AUTO';sel.onchange=()=>U46.saveSettings({voice:sel.value});const count=$('tk46-voice-count');if(count)count.textContent=voices.length?`${voices.length} giọng vi-VN hệ thống tìm thấy`:'Không có giọng vi-VN hệ thống · có thể dùng TOPKEY Offline Voice';updateVoiceSummary();
};
App.chooseVoice=chooseSystemVoice;
App.unlockAudio=async function(){
  App.populateVoices();if(!Piper.checking&&!Piper.installed)await Piper.refresh();const eng=selectedEngine();
  if(eng==='NONE'){App.audioUnlocked=true;$('audio-overlay')?.classList.add('hidden');App.renderHealth?.();ensureUi();setPackStatus('Thiết bị chưa có giọng Việt. Bấm “Tải giọng Việt TOPKEY” để cài gói offline.','err',0);$('tk47-install')?.scrollIntoView?.({behavior:'smooth',block:'center'});return U.toast('Hãy tải giọng Việt TOPKEY một lần','err')}
  App.audioUnlocked=true;$('audio-overlay')?.classList.add('hidden');App.renderHealth?.();Engine.enqueue({text:'Kênh bình luận tiếng Việt tại thiết bị đã sẵn sàng.',kind:'TEST',priority:100,total:0,source:'MANUAL'});U.toast(eng==='PIPER'?'Đã bật TOPKEY Offline BLV':'Đã bật BLV bằng giọng hệ thống','ok');
};

function ensureUi(){
  const anchor=$('tk46-controls');if(!anchor)return;
  if(!$('tk47-voice-pack')){
    const box=document.createElement('section');box.id='tk47-voice-pack';box.className='tk47-pack';box.innerHTML=`
      <div class="tk47-pack-head"><div><b>📱 Giọng Việt cho Android</b><div class="muted">Ưu tiên giọng hệ thống; thiếu giọng thì tải TOPKEY Offline Voice một lần.</div></div><span id="tk47-pack-badge" class="tk47-badge">Đang kiểm tra…</span></div>
      <div class="tk47-grid"><div class="field"><label>Engine phát giọng</label><select id="tk47-engine"><option value="AUTO">AUTO · hệ thống trước, offline dự phòng</option><option value="SYSTEM">Chỉ giọng vi-VN hệ thống</option><option value="PIPER">TOPKEY Offline Voice · Piper</option></select></div><div class="tk47-actions"><button id="tk47-install" class="btn primary" type="button">⬇ Tải giọng Việt TOPKEY (~63 MB)</button><button id="tk47-remove" class="btn danger" type="button">🗑 Xóa gói giọng</button></div></div>
      <div class="tk47-progress"><i id="tk47-progress-bar"></i></div><div id="tk47-pack-status" class="tk47-status" data-state="info">Đang kiểm tra bộ nhớ giọng…</div><div id="tk47-engine-summary" class="tk47-summary"></div><div id="tk47-storage" class="tk47-summary">Đang đọc dung lượng bộ nhớ web…</div>
      <div class="tk47-note">Gói giọng được lưu trong bộ nhớ riêng của website (OPFS) trên đúng thiết bị/trình duyệt này. Không dùng Firebase, không upload nội dung bình luận lên dịch vụ TTS. Lần tải đầu cần Internet; sau đó model có thể dùng lại từ bộ nhớ thiết bị. Voice: Piper vi_VN-vais1000-medium; dataset VAIS1000 · CC BY 4.0.</div>`;
    anchor.insertAdjacentElement('afterend',box);
  }
  const sel=$('tk47-engine');if(sel){sel.value=readSettings().mode;sel.onchange=async e=>{saveSettings({mode:e.target.value});if(e.target.value==='PIPER'&&!Piper.installed){setPackStatus('Chế độ Offline đã chọn nhưng chưa có model. Hãy bấm Tải giọng Việt TOPKEY.','err',0)}updateVoiceSummary()}}
  if($('tk47-install'))$('tk47-install').onclick=()=>Piper.installed?U.toast('Gói giọng đã có trên thiết bị','ok'):Piper.install();
  if($('tk47-remove'))$('tk47-remove').onclick=()=>Piper.remove();
  const localCheck=$('tk46-local-only')?.closest('label');if(localCheck)localCheck.title='Chỉ áp dụng cho giọng hệ thống. TOPKEY Offline Voice luôn chạy local trên thiết bị.';
  const h=$('page-live')?.querySelector('h2');
  App.populateVoices();renderVoicePack();refreshStorageEstimate();
}

const baseHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){const out=baseHealth?.(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h)h.textContent=this.audioUnlocked?`UNLOCKED · ${selectedEngine()==='PIPER'?'PIPER OFFLINE':'LOCAL BLV'}`:'LOCKED · LOCAL BLV';document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out};
async function hardenServiceWorker47(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade47 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade47';try{App.renderHealth?.()}catch{}}
async function install(){ensureUi();stamp();setTimeout(()=>{ensureUi();stamp()},0);setTimeout(()=>{ensureUi();stamp()},900);hardenServiceWorker47();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=()=>App.populateVoices();setTimeout(()=>Piper.refresh(),1200)}
install();window.addEventListener('focus',()=>{ensureUi();stamp();hardenServiceWorker47();Piper.refresh()},{passive:true});
window.TopkeyUpgrade47={installed:true,VERSION,CACHE_TAG,PIPER_VOICE,PIPER_SIZE,Piper,selectedEngine,systemVoices,readSettings,saveSettings};
})();
