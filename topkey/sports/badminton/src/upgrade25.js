(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,$=id=>document.getElementById(id);
if(!T||!App||!U)return;
const U9=window.TopkeyUpgrade9;
const CLOUD_VOICES=[
  ['Charon','Nam AI · Charon'],
  ['Achird','Nam AI · Achird'],
  ['Fenrir','Nam AI · Fenrir'],
  ['Orus','Nam AI · Orus'],
  ['Iapetus','Nam AI · Iapetus'],
  ['Schedar','Nam AI · Schedar'],
  ['Aoede','Nữ AI · Aoede'],
  ['Kore','Nữ AI · Kore']
];
const DEFAULT_VOICE='Charon';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||a));
function setText(id,text){const el=$(id);if(el)el.textContent=text;}
function appearanceStatus(text,state='info'){
  const el=$('tk25-appearance-status');if(!el)return;el.textContent=text;el.dataset.state=state;
}
function ttsStatus(text,state='info'){
  const el=$('tk25-tts-status');if(!el)return;el.textContent=text;el.dataset.state=state;
}
function injectAppearanceStatus(){
  const card=$('tk9-appearance-card');if(!card||$('tk25-appearance-status'))return;
  $('tk9-appearance-save')?.setAttribute('type','button');$('tk9-background-remove')?.setAttribute('type','button');
  const d=document.createElement('div');d.id='tk25-appearance-status';d.className='tk25-status';d.textContent='Sẵn sàng lưu lên Firebase.';card.appendChild(d);
}
function injectTtsUi(){
  const voice=$('blv-voice');if(!voice||$('tk25-tts-status'))return;
  const card=voice.closest('.card');if(!card)return;
  const intro=card.querySelector('p.muted');if(intro)intro.innerHTML='Bình luận lấy từ sự kiện/tỷ số Firebase. Giọng chính dùng <b>Gemini TTS tiếng Việt</b> qua Firebase Function, tự rơi về Chirp 3 HD khi cần; giọng thiết bị chỉ là dự phòng khi Cloud TTS chưa sẵn sàng.';
  const label=voice.closest('.field')?.querySelector('label');if(label)label.textContent='Giọng BLV Cloud AI';
  const status=document.createElement('div');status.id='tk25-tts-status';status.className='tk25-status';status.textContent='Cloud AI: chờ bật âm thanh.';voice.closest('.field').appendChild(status);
  const note=card.querySelector('p.note');if(note)note.innerHTML='Cloud TTS dùng giọng tổng hợp tiếng Việt (Gemini TTS / Chirp 3 HD), <b>không clone/giả mạo giọng người thật</b>. Audio được cache trên Firebase Storage để các máy dùng lại. Nếu Firebase Function chưa deploy, hệ thống tự chuyển sang giọng vi-VN có trên thiết bị.';
  const pitch=$('blv-pitch')?.closest('.field');if(pitch){pitch.classList.add('tk25-browser-fallback');const l=pitch.querySelector('label');if(l)l.textContent='Cao độ (chỉ fallback thiết bị)';}
  const overlay=$('audio-overlay');if(overlay){const p=overlay.querySelector('p');if(p)p.textContent='Bấm một lần để mở kênh âm thanh. Hệ thống ưu tiên giọng Cloud AI tiếng Việt từ Firebase.';const b=$('audio-overlay-btn');if(b)b.textContent='Bật âm thanh BLV Cloud AI';}
}
async function compressForBackground(file){
  if(!file||!String(file.type||'').startsWith('image/'))throw new Error('Vui lòng chọn đúng file hình ảnh.');
  if(file.size>15*1024*1024)throw new Error('Ảnh quá lớn. Vui lòng dùng ảnh dưới 15 MB.');
  const img=new Image(),url=URL.createObjectURL(file);
  try{
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Không đọc được hình nền.'));img.src=url});
    let max=1920,quality=.82,blob=null;
    for(let attempt=0;attempt<5;attempt++){
      const scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
      const ctx=c.getContext('2d',{alpha:false});ctx.drawImage(img,0,0,c.width,c.height);
      blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Không nén được ảnh.')),'image/jpeg',quality));
      if(blob.size<=850*1024)break;max=Math.round(max*.82);quality=Math.max(.58,quality-.07);
    }
    return blob;
  }finally{URL.revokeObjectURL(url);}
}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Không tạo được dữ liệu ảnh dự phòng.'));r.readAsDataURL(blob);});}
function patchAppearance(){
  if(!U9)return;
  injectAppearanceStatus();
  const baseRender=U9.renderSettings?.bind(U9);
  if(baseRender&&!U9.__u25RenderSettings){U9.__u25RenderSettings=true;U9.renderSettings=function(...args){const out=baseRender(...args);const a=this.appearance?.()||{},src=a.backgroundUrl||a.backgroundDataUrl||'';const p=$('tk9-bg-preview');if(p&&src){p.style.backgroundImage=`linear-gradient(#07142677,#07142677),url("${src}")`;p.textContent=a.backgroundUrl?'Hình nền đang lưu trên Firebase Storage':'Hình nền đang lưu trong Firebase Database (dự phòng)';}injectAppearanceStatus();return out;};}
  U9.applyAppearance=function(){const a=this.appearance?.()||{},title=a.titlePrimary||App.state.config?.title||'TOPKEY BADMINTON VNEXT';if($('tournament-title'))$('tournament-title').textContent=title;const sub=$('sport-subtitle');if(sub&&a.titleSecondary)sub.textContent=a.titleSecondary;const top=document.querySelector('.topbar');if(top&&a.headerColor)top.style.background=a.headerColor+'f2';const src=a.backgroundUrl||a.backgroundDataUrl||'';if(src){document.body.style.backgroundImage=`linear-gradient(rgba(7,20,38,.82),rgba(7,20,38,.9)),url("${src}")`;document.body.style.backgroundAttachment='fixed';document.body.style.backgroundSize='cover';document.body.style.backgroundPosition='center'}else{document.body.style.backgroundImage='';}};
  U9.saveAppearance=async function(){
    const perms=T.Auth?.profile?.permissions||{},canAppearance=T.Auth?.role?.()==='ADMIN'||perms?.modules?.settings==='edit'||perms?.details?.['settings:appearance']==='edit';if(!canAppearance)return U.toast('Không có quyền sửa giao diện','err');
    const btn=$('tk9-appearance-save'),file=$('tk9-background-file')?.files?.[0],old=this.appearance?.()||{};if(btn){btn.disabled=true;btn.textContent='⏳ Đang lưu...';}
    appearanceStatus('Đang chuẩn bị dữ liệu giao diện...','working');
    try{
      if(!T.Data?.ready||!T.Data?.db)throw new Error('Firebase chưa kết nối.');
      let backgroundUrl=old.backgroundUrl||'',backgroundPath=old.backgroundPath||'',backgroundDataUrl=old.backgroundDataUrl||'';
      if(file){
        const blob=await compressForBackground(file);appearanceStatus(`Đang upload hình nền ${(blob.size/1024).toFixed(0)} KB lên Firebase Storage...`,'working');
        const uid=T.Auth?.user?.uid||'admin',path=`${T.ROOT}/${T.Data.tid}/appearance/background/${uid}/background_${Date.now()}.jpg`;
        try{
          if(!T.Data.storage)throw new Error('Firebase Storage chưa khởi tạo');
          const ref=T.Data.storage.ref(path),task=ref.put(blob,{contentType:'image/jpeg',cacheControl:'public,max-age=86400'});
          await new Promise((resolve,reject)=>task.on('state_changed',snap=>{const pct=snap.totalBytes?Math.round(snap.bytesTransferred/snap.totalBytes*100):0;appearanceStatus(`Đang upload hình nền... ${pct}%`,'working');},reject,resolve));
          backgroundUrl=await ref.getDownloadURL();backgroundPath=path;backgroundDataUrl='';
        }catch(storageErr){
          console.warn('Upgrade25 Storage upload fallback to RTDB',storageErr);
          if(blob.size>950*1024)throw new Error('Firebase Storage từ chối upload và ảnh dự phòng còn quá lớn. Hãy Publish firebase.storage.rules trong gói Upgrade 25. Chi tiết: '+(storageErr?.message||storageErr));
          appearanceStatus('Storage chưa cho phép upload; đang lưu ảnh nén vào Firebase Database để giao diện vẫn hoạt động...','working');
          backgroundDataUrl=await blobToDataUrl(blob);backgroundUrl='';backgroundPath='';
        }
      }
      const appearance={...old,titlePrimary:$('tk9-title-primary')?.value.trim()||'',titleSecondary:$('tk9-title-secondary')?.value.trim()||'',eventTime:$('tk9-event-time')?.value.trim()||'',format:$('tk9-format')?.value||'Vòng tròn tính điểm toàn giải',headerColor:$('tk9-header-color')?.value||'#0d2036',backgroundUrl,backgroundPath,backgroundDataUrl,updatedAt:Date.now(),updatedBy:T.Auth?.user?.uid||''};
      const title=appearance.titlePrimary||App.state.config?.title||'GIẢI CẦU LÔNG TOPKEY VNEXT',updates={};updates[T.Data.path('config/title')]=title;updates[T.Data.path('config/appearance')]=appearance;
      appearanceStatus('Đang xác nhận lưu cấu hình trên Firebase...','working');await T.Data.db.ref().update(updates);
      App.state.config={...(App.state.config||{}),title,appearance};this.applyAppearance();this.renderSettings?.();if($('tk9-background-file'))$('tk9-background-file').value='';
      appearanceStatus(backgroundUrl?'Đã lưu thành công · hình nền ở Firebase Storage.':'Đã lưu thành công · hình nền ở Firebase Database (chế độ dự phòng).','ok');U.toast('Đã lưu tiêu đề và hình nền Firebase','ok');
    }catch(e){console.error('Upgrade25 appearance save failed',e);appearanceStatus('Lỗi lưu: '+(e?.message||e),'err');U.toast('Không lưu được giao diện: '+(e?.message||e),'err');}
    finally{if(btn){btn.disabled=false;btn.textContent='💾 Lưu tiêu đề / giao diện';}}
  };
  U9.removeBackground=async function(){
    const perms=T.Auth?.profile?.permissions||{},canAppearance=T.Auth?.role?.()==='ADMIN'||perms?.modules?.settings==='edit'||perms?.details?.['settings:appearance']==='edit';if(!canAppearance)return U.toast('Không có quyền sửa giao diện','err');
    const old=this.appearance?.()||{};try{appearanceStatus('Đang xóa hình nền...','working');if(old.backgroundPath&&T.Data.storage){try{await T.Data.storage.ref(old.backgroundPath).delete();}catch(e){console.warn('Không xóa được object cũ, tiếp tục gỡ khỏi giao diện',e)}}const appearance={...old,backgroundUrl:'',backgroundPath:'',backgroundDataUrl:'',updatedAt:Date.now(),updatedBy:T.Auth?.user?.uid||''};await T.Data.db.ref(T.Data.path('config/appearance')).set(appearance);App.state.config={...(App.state.config||{}),appearance};this.applyAppearance();this.renderSettings?.();appearanceStatus('Đã xóa hình nền khỏi giao diện.','ok');U.toast('Đã xóa hình nền','ok');}catch(e){appearanceStatus('Lỗi xóa: '+(e?.message||e),'err');U.toast('Không xóa được hình nền: '+(e?.message||e),'err');}
  };
}
function selectedCloudVoice(){const v=$('blv-voice')?.value||localStorage.getItem('topkey_blv_cloud_voice')||DEFAULT_VOICE;return CLOUD_VOICES.some(x=>x[0]===v)?v:DEFAULT_VOICE;}
function browserFallbackVoice(){const vs=('speechSynthesis'in window)?speechSynthesis.getVoices().filter(v=>/^vi([-_]|$)/i.test(v.lang)):[];return vs.find(v=>/nam|male|minh|viet/i.test(v.name))||vs[0]||null;}
function cloudCallable(){
  try{if(!window.firebase?.functions||!T.Data?.ready)return null;App.__u25Functions=App.__u25Functions||firebase.app().functions('asia-southeast1');return App.__u25Functions.httpsCallable('synthesizeCommentary',{timeout:30000});}catch(e){console.warn('Cloud Functions unavailable',e);return null;}
}
async function ensureAudioContext(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;App.__u25AudioCtx=App.__u25AudioCtx||new C();if(App.__u25AudioCtx.state==='suspended')await App.__u25AudioCtx.resume();return App.__u25AudioCtx;}
function stopCloudAudio(){try{App.__u25AudioSource?.stop(0)}catch{}App.__u25AudioSource=null;}
async function playArrayBuffer(buf,volume=1){const ctx=await ensureAudioContext();if(!ctx)throw new Error('Trình duyệt không hỗ trợ Web Audio');stopCloudAudio();const audio=await ctx.decodeAudioData(buf.slice(0)),source=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=clamp(volume,0,1);source.buffer=audio;source.connect(gain);gain.connect(ctx.destination);App.__u25AudioSource=source;source.onended=()=>{if(App.__u25AudioSource===source)App.__u25AudioSource=null};source.start(0);return source;}
async function fetchAndPlay(url,volume){const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error('Không tải được audio Cloud ('+r.status+')');return playArrayBuffer(await r.arrayBuffer(),volume);}
function speakBrowserFallback(text){
  if(!('speechSynthesis'in window))throw new Error('Thiết bị không có giọng đọc dự phòng');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';u.rate=clamp($('blv-rate')?.value||1.08,.7,1.5);u.pitch=clamp($('blv-pitch')?.value||1,.7,1.3);u.volume=clamp($('blv-volume')?.value||1,0,1);const v=browserFallbackVoice();if(v)u.voice=v;speechSynthesis.speak(u);
}
async function cloudSpeak(text,token){
  const call=cloudCallable();if(!call)throw new Error('Firebase Function synthesizeCommentary chưa được deploy');
  const voice=selectedCloudVoice(),rate=clamp($('blv-rate')?.value||1.08,.8,1.3);ttsStatus('Cloud AI: đang tạo giọng bình luận...','working');
  const result=await call({text:String(text||'').slice(0,500),voice,rate,tournamentId:T.Data.tid});if(token!==App.__u25SpeakToken)return;
  const data=result?.data||{};if(!data.audioUrl)throw new Error('Firebase Function không trả về audioUrl');await fetchAndPlay(data.audioUrl,$('blv-volume')?.value||1);if(token===App.__u25SpeakToken)ttsStatus(`Cloud AI: ${data.cached?'đã phát từ cache':'đã tạo và phát'} · ${data.engine||'TTS'} · ${data.voice||voice}`,'ok');
}
function patchCommentary(){
  App.__u25SpeakToken=Number(App.__u25SpeakToken)||0;
  injectTtsUi();
  App.comment=async function(text){
    if(!text)return;const court=this.currentCourt||'court_1',id=U.id('cmt'),row={id,courtId:court,text,commentator:'BLV TOPKEY · Cloud AI',createdAt:Date.now(),ttsStatus:'PENDING'};
    await T.Data.queueSet('commentary/'+court+'/latest',row,{type:'COMMENTARY'});
    const call=cloudCallable();if(!call)return;
    call({text:String(text).slice(0,500),voice:selectedCloudVoice(),rate:clamp($('blv-rate')?.value||1.08,.8,1.3),tournamentId:T.Data.tid}).then(async result=>{
      const data=result?.data||{};if(!data.audioUrl)return;
      const patch={audioUrl:data.audioUrl,ttsVoice:data.voice||selectedCloudVoice(),ttsEngine:data.engine||'cloud-tts',ttsStatus:'READY',ttsUpdatedAt:Date.now()};
      try{await T.Data.db.ref(T.Data.path('commentary/'+court+'/latest')).transaction(cur=>cur&&cur.id===id?{...cur,...patch}:undefined);}catch(e){console.warn('Không cập nhật được audioUrl vào commentary Firebase',e);}
    }).catch(e=>console.warn('Không pre-generate được Cloud commentary audio; client sẽ fallback',e));
  };
  App.populateVoices=function(){const sel=$('blv-voice');if(!sel)return;const keep=localStorage.getItem('topkey_blv_cloud_voice')||sel.value||DEFAULT_VOICE;sel.innerHTML=CLOUD_VOICES.map(([v,label])=>`<option value="${v}">${label}</option>`).join('');sel.value=CLOUD_VOICES.some(x=>x[0]===keep)?keep:DEFAULT_VOICE;sel.onchange=()=>{localStorage.setItem('topkey_blv_cloud_voice',sel.value);ttsStatus('Đã chọn '+sel.options[sel.selectedIndex].text+'. Bấm Test câu BLV để nghe.','info');};};
  App.chooseVoice=()=>browserFallbackVoice();
  App.applyVoicePreset=function(mode){const presets={SPORT:{rate:1.08,pitch:.98},CALM:{rate:.94,pitch:1},ENERGY:{rate:1.18,pitch:1.02}},p=presets[mode]||presets.SPORT;if($('blv-rate'))$('blv-rate').value=p.rate;if($('blv-pitch'))$('blv-pitch').value=p.pitch;};
  App.unlockAudio=async function(){
    try{await ensureAudioContext();this.audioUnlocked=true;$('audio-overlay')?.classList.add('hidden');this.renderHealth();ttsStatus('Đã mở âm thanh. Đang kiểm tra Cloud AI...','working');U.toast('Đã bật kênh âm thanh BLV','ok');const token=this.__u25SpeakToken=(Number(this.__u25SpeakToken)||0)+1;try{await cloudSpeak('Âm thanh bình luận thể thao tiếng Việt đã sẵn sàng.',token);}catch(e){console.warn('Cloud TTS test fallback',e);ttsStatus('Cloud AI chưa sẵn sàng · đang dùng giọng tiếng Việt trên thiết bị. '+(e?.message||e),'warn');speakBrowserFallback('Âm thanh bình luận thể thao tiếng Việt đã sẵn sàng.');}}
    catch(e){ttsStatus('Không bật được âm thanh: '+(e?.message||e),'err');U.toast('Không bật được âm thanh BLV: '+(e?.message||e),'err');}
  };
  App.speakCommentary=function(row){
    if(!row?.id||row.id===this.lastSpokenCommentId||!this.audioUnlocked||$('auto-commentary')?.checked===false)return;
    if(row.ttsStatus==='PENDING'&&!row.audioUrl&&!row.__ttsTimeout){clearTimeout(this.__u25PendingTtsTimer);ttsStatus('Firebase: đang chuẩn bị audio bình luận...','working');this.__u25PendingTtsTimer=setTimeout(()=>{const latest=this.state.commentary?.[row.courtId||this.currentCourt]?.latest;if(latest?.id===row.id&&!latest.audioUrl)this.speakCommentary({...latest,__ttsTimeout:true});},2600);return;}
    clearTimeout(this.__u25PendingTtsTimer);this.lastSpokenCommentId=row.id;const token=this.__u25SpeakToken=(Number(this.__u25SpeakToken)||0)+1;stopCloudAudio();try{window.speechSynthesis?.cancel?.()}catch{}
    if(row.audioUrl){ttsStatus(`Firebase audio: ${row.ttsEngine||'Cloud AI'} · ${row.ttsVoice||''}`,'working');fetchAndPlay(row.audioUrl,$('blv-volume')?.value||1).then(()=>{if(token===this.__u25SpeakToken)ttsStatus(`Đang phát audio Firebase · ${row.ttsEngine||'Cloud AI'} · ${row.ttsVoice||''}`,'ok');}).catch(e=>{if(token===this.__u25SpeakToken){ttsStatus('Audio Firebase lỗi · fallback giọng thiết bị. '+(e?.message||e),'warn');try{speakBrowserFallback(row.text)}catch{}}});return;}
    cloudSpeak(row.text,token).catch(e=>{if(token!==this.__u25SpeakToken)return;console.warn('Cloud TTS fallback',e);ttsStatus('Cloud AI lỗi/chưa deploy · fallback giọng thiết bị. '+(e?.message||e),'warn');try{speakBrowserFallback(row.text)}catch(err){ttsStatus('Không phát được BLV: '+(err?.message||err),'err');}});
  };
  const baseHealth=App.renderHealth?.bind(App);if(baseHealth&&!App.__u25Health){App.__u25Health=true;App.renderHealth=function(...args){const out=baseHealth(...args);const h=$('health-audio');if(h&&this.audioUnlocked)h.textContent='UNLOCKED · CLOUD AI';return out;};}
  App.populateVoices();
}
function updateVersionUi(){
  // Version is owned by src/config.js. Do not overwrite it from a historical upgrade layer.
  const note=$('health-version');if(note)note.textContent=T.VERSION;
}
patchAppearance();patchCommentary();updateVersionUi();
setTimeout(()=>{injectAppearanceStatus();injectTtsUi();App.populateVoices?.();U9?.applyAppearance?.();},0);
window.TopkeyUpgrade25={CLOUD_VOICES,DEFAULT_VOICE,cloudSpeak,compressForBackground};
})();
