/* H152 TOPKEY commentary voice routing. No external TTS credentials or Firebase writes.
 * Uses installed device voices; Pinyin requires supplied Hanzi for lexical accuracy.
 * Video broadcast must use separately configured WHIP/WebRTC or HLS infrastructure.
 */
(() => {
 'use strict';
 if(window.__TOPKEY_PUBLIC_ROUTE||window.TopkeyCommentaryH152)return;
 const $=id=>document.getElementById(id);
 const hasHanzi=text=>/[\u3400-\u9fff]/u.test(String(text||''));
 const isIPA=text=>/[ˈˌɪæəʊɑɔʌɜθðʃʒŋː]/u.test(String(text||''))&&/^[\/\[\]a-zA-Zˈˌɪæəʊɑɔʌɜθðʃʒŋː .-]+$/u.test(String(text||'').trim());
 const hasTone=text=>/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]|(?:^|\s)[a-zü]+[1-5](?:\s|$)/iu.test(String(text||''));
 const localeFor=choice=>({vi:'vi-VN',en:'en-US',gb:'en-GB',zh:'zh-CN'}[choice]||'vi-VN');
 const normalize=(text,locale,original='')=>{
   const t=String(text||'').trim(),source=String(original||'').trim();
   if(locale.startsWith('zh')&&!hasHanzi(t)&&hasTone(t)){
     if(!hasHanzi(source))throw new Error('Pinyin cần chữ Hán tương ứng để đọc đúng thanh điệu; không tự đoán từ đồng âm.');
     return source;
   }
   if(locale.startsWith('en')&&isIPA(t)){
     if(!source||isIPA(source))throw new Error('IPA cần từ tiếng Anh gốc để tổng hợp âm, không đọc ký hiệu IPA như chữ.');
     return source;
   }
   return t;
 };
 function bestVoice(locale,voices){
  const base=locale.split('-')[0].toLowerCase();
  const eligible=[...(voices||[])].filter(v=>String(v.lang||'').toLowerCase().split('-')[0]===base);
  return eligible.sort((a,b)=>{
   const score=v=>Number(String(v.lang||'').toLowerCase()===locale.toLowerCase())*100+
     (/neural|natural|enhanced|premium|jenny|xiaoxiao|yunxi|google/i.test(v.name||'')?40:0)+
     (v.localService?4:0);
   return score(b)-score(a);
  })[0]||null;
 }
 function splitMixed(text){
   // Split script runs, not guessed lexical translations. Non-Hanzi Latin runs
   // are English; tone-marked Pinyin is NOT interpreted as English.
   return (String(text||'').match(/[\u3400-\u9fff]+|[^\u3400-\u9fff]+/gu)||[])
    .map(value=>({text:value.trim(),lang:hasHanzi(value)?'zh-CN':hasTone(value)?'zh-CN':'en-US'}))
    .filter(x=>x.text);
 }
 let generation=0;
 function cancel(){generation++;window.speechSynthesis?.cancel?.()}
 function speak(text,{lang='vi-VN',original='',rate=1,pitch=1,volume=1}={}){
  let parts;
  if(lang==='mix')parts=splitMixed(text);
  else parts=[{text:normalize(text,lang,original),lang}];
  if(!parts.length)return Promise.resolve(false);
  if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')
   return Promise.reject(new Error('Trình duyệt chưa hỗ trợ Text-to-Speech.'));
  cancel();const token=generation;
  const voices=window.speechSynthesis.getVoices?.()||[];
  return new Promise((resolve,reject)=>{
   const play=index=>{
    if(token!==generation){resolve(false);return}
    if(index>=parts.length){resolve(true);return}
    let segment=parts[index];
    if(segment.lang==='zh-CN'&&!hasHanzi(segment.text)){
      reject(new Error('Đoạn Pinyin cần chữ Hán gốc để phát âm chính xác.'));return;
    }
    const voice=bestVoice(segment.lang,voices);
    if(!voice){reject(new Error('Thiết bị chưa có giọng '+segment.lang+'. Hãy cài giọng ngôn ngữ hoặc dùng dịch vụ TTS đã cấu hình.'));return}
    const utterance=new SpeechSynthesisUtterance(segment.text);
    utterance.lang=segment.lang;utterance.voice=voice;
    utterance.rate=Math.max(.6,Math.min(1.3,Number(rate)||1));
    utterance.pitch=pitch;utterance.volume=volume;
    utterance.onend=()=>play(index+1);
    utterance.onerror=e=>reject(new Error('Phát âm thất bại: '+(e.error||'speech-error')));
    window.speechSynthesis.speak(utterance);
   };
   play(0);
  });
 }
 function init(){
  const T=window.Topkey,app=T?.App,anchor=$('commentary-test');
  if(!app?.speakCommentary||!anchor||$('tk152-panel'))return false;
  const container=document.createElement('div');container.id='tk152-panel';container.className='tk152-panel';
  container.innerHTML=`<h3>🌍 Phát âm đa ngôn ngữ</h3>
    <label for="tk152-language">Ngôn ngữ / giọng</label>
    <select id="tk152-language"><option value="vi">Tiếng Việt</option><option value="en">English · US</option><option value="gb">English · UK</option><option value="zh">普通话 · Mandarin</option><option value="mix">Trung + Anh xen kẽ (theo chữ viết)</option></select>
    <label for="tk152-text">Văn bản cần đọc</label><textarea id="tk152-text" rows="2" placeholder="Hello / 你好 / Bình luận thể thao"></textarea>
    <label for="tk152-original">Từ gốc (chữ Hán khi nhập Pinyin, từ tiếng Anh khi nhập IPA)</label>
    <input id="tk152-original" placeholder="你好 hoặc hello">
    <div class="tk152-buttons"><button id="tk152-play" type="button" class="btn ok">🔊 Nghe thử</button><button id="tk152-stop" type="button" class="btn">■ Dừng</button></div>
    <small id="tk152-status" role="status" aria-live="polite">Giọng đọc phụ thuộc vào giọng đã cài trên thiết bị; không truyền âm thanh đến Viewer.</small>`;
  anchor.closest('.action-bar')?.after(container);
  if(!$('tk152-panel'))return false;
  const play=$('tk152-play'),status=$('tk152-status');
  play.onclick=async()=>{
   play.disabled=true;status.textContent='Đang xử lý phát âm...';
   try{
    const lang=$('tk152-language').value;
    await speak($('tk152-text').value,{lang:lang==='mix'?'mix':localeFor(lang),original:$('tk152-original').value,
     rate:Number($('blv-rate')?.value||1),pitch:Number($('blv-pitch')?.value||1),volume:Number($('blv-volume')?.value||1)});
    status.textContent='Đã phát âm xong.';
   }catch(e){status.textContent=e.message}
   finally{play.disabled=false}
  };
  $('tk152-stop').onclick=()=>{cancel();status.textContent='Đã dừng giọng đọc.'};
  const old=app.speakCommentary.bind(app);
  app.speakCommentary=function(row){
    if($('tk152-language')?.value==='vi')return old(row);
    if(!row?.id||row.id===this.lastSpokenCommentId||!this.audioUnlocked||$('auto-commentary')?.checked===false)return;
    this.lastSpokenCommentId=row.id;
    const value=$('tk152-language').value,lang=value==='mix'?'mix':localeFor(value);
    speak(row.text,{lang,rate:Number($('blv-rate')?.value||1)})
      .catch(e=>{status.textContent=e.message});
  };
  return true;
 }
 function boot(){
  if(init())return;
  window.__TOPKEY_VNEXT_BOOT?.then(init).catch(()=>{});
  window.addEventListener('topkey:admin-ready',init,{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 window.TopkeyCommentaryH152={normalize,bestVoice,splitMixed,localeFor,speak,cancel,init};
})();
