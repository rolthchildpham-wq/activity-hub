(()=>{'use strict';
const PHRASES=[
'{name} đang đánh rất gọn, quả cầu đi như có GPS tìm đúng khoảng trống!',
'{name} xử lý pha vừa rồi mềm mại và rất đúng nhịp, nhìn thật đã mắt!',
'Nhịp chân của {name} hôm nay khá mượt, lên lưới xuống cuối sân đều rất chủ động.',
'{name} đang giữ sự tập trung rất tốt. Khán giả mình cổ vũ thật văn minh nhé!',
'Pha vừa rồi của {name} khiến quả cầu có vẻ cũng phải suy nghĩ thêm một nhịp!',
'Nếu sự bình tĩnh có bảng xếp hạng thì {name} đang ở nhóm đầu của sân này.',
'{name} điều cầu khá tinh tế, góc sân nào cũng được hỏi thăm một cách lịch sự.',
'{name} đang có một chuỗi xử lý rất sáng sủa, vừa chắc tay vừa có ý tưởng.',
'Pha cầu của {name} vừa rồi gọn như một dấu chấm câu đúng chỗ.',
'{name} đang đọc tình huống khá nhanh, đối thủ vừa chạm cầu là phương án đã sẵn sàng.',
'Hôm nay {name} có vẻ rất hợp với những đường cầu sát biên, chính xác và tự tin.',
'{name} giữ nhịp trận đấu rất duyên, nhanh khi cần và chậm đúng lúc.',
'Pha xử lý của {name} vừa đủ khó, vừa đủ đẹp, đúng chất một trận cầu vui.',
'{name} đang biến những bước chân nhỏ thành lợi thế lớn trên sân.',
'Quả cầu vừa ghé qua góc sân và {name} đã có mặt đúng lúc, rất chủ động!',
'{name} đang chơi với tinh thần rất tích cực, điểm số nào cũng bắt đầu lại bằng sự tập trung.',
'Pha vừa rồi cho thấy {name} có cảm giác cầu khá tốt, tiếp xúc rất gọn.',
'{name} đang kiên nhẫn xây dựng từng pha, không vội nhưng cũng không bỏ lỡ cơ hội.',
'Khán giả có thể dành một tràng vỗ tay cho pha xử lý rất sáng của {name}!',
'{name} đang cho thấy cầu lông hay không chỉ ở sức mạnh mà còn ở cách chọn thời điểm.',
'Pha điều cầu của {name} vừa rồi có độ chính xác rất đẹp, sân đấu bỗng rộng thêm một chút.',
'{name} đang giữ năng lượng rất tốt, mỗi pha cầu đều có sự chuẩn bị rõ ràng.',
'Một pha xử lý thông minh của {name}; đơn giản, hiệu quả và rất dễ xem.',
'{name} vừa có pha cầu khiến khán giả phải chú ý, kỹ thuật gọn và tinh thần rất vui vẻ.'
];
const $=id=>document.getElementById(id);document.body?.classList.add('tk121-themed');if(window.__TOPKEY_IS_SPECTATOR===true){window.TopkeyUpgrade121={installed:true,feature:'BADMINTON_BACKGROUND'};return}let installed=false,lastSig='';
function app(){return window.Topkey?.App||null}
function activeContext(){const A=app();if(!A)return null;const court=$('stream-court')?.value||A.currentCourt||$('umpire-court')?.value||'';const st=A.state?.activeMatches?.[court];if(!st)return {court,players:[]};const m=A.state?.matches?.[st.matchId],TA=A.state?.teams?.[m?.teamAId]||{},TB=A.state?.teams?.[m?.teamBId]||{};const players=[];[[TA,'A'],[TB,'B']].forEach(([t,side])=>['p1','p2'].forEach(pk=>{const name=String(t?.[pk]||'').trim();if(name)players.push({name,side,team:String(t?.name||'')})}));return {court,st,m,players}}
function phraseText(){const p=$('tk121-fun-phrase'),pl=$('tk121-fun-player');const name=pl?.value||'VĐV';return String(p?.value||'').replaceAll('{name}',name)}
function renderPreview(){const e=$('tk121-fun-preview');if(e)e.textContent=phraseText()||'Chọn VĐV và câu bình luận.'}
function refreshPlayers(){const ctx=activeContext(),sel=$('tk121-fun-player'),btn=$('tk121-fun-speak');if(!sel||!ctx)return;const sig=ctx.court+'|'+ctx.players.map(x=>x.name).join('|');if(sig!==lastSig){const old=sel.value;sel.innerHTML='';if(!ctx.players.length){const o=document.createElement('option');o.value='';o.textContent='Chưa có VĐV đang thi đấu';sel.appendChild(o)}else ctx.players.forEach(x=>{const o=document.createElement('option');o.value=x.name;o.textContent=`${x.name}${x.team?' · '+x.team:''}`;sel.appendChild(o)});if([...sel.options].some(o=>o.value===old))sel.value=old;lastSig=sig}if(btn)btn.disabled=!ctx.players.length;renderPreview()}
function randomPhrase(){const sel=$('tk121-fun-phrase');if(!sel)return;let i=Math.floor(Math.random()*PHRASES.length);if(sel.selectedIndex===i)i=(i+1)%PHRASES.length;sel.selectedIndex=i;renderPreview()}
async function speak(){const A=app(),ctx=activeContext(),text=phraseText();if(!A||!ctx?.players?.length||!text)return window.Topkey?.U?.toast?.('Chưa có VĐV đang thi đấu để bình luận','info');try{A.currentCourt=ctx.court||A.currentCourt;if(!A.audioUnlocked&&typeof A.unlockAudio==='function')await A.unlockAudio();await Promise.resolve(A.comment?.(text,{kind:'FUN',priority:85,court:ctx.court,source:'MANUAL_FUN_U121'}));window.Topkey?.U?.toast?.('Đã gửi câu bình luận vui','ok')}catch(e){window.Topkey?.U?.toast?.('Không phát được bình luận: '+(e?.message||e),'err')}}
function install(){if(installed)return;const card=document.querySelector('#page-umpire > .card')||$('commentary-test')?.closest('.card');if(!card)return;installed=true;const box=document.createElement('div');box.id='tk121-fun-commentary';box.className='tk121-funbox';box.innerHTML=`<h3>😊 Bình luận vui của trọng tài</h3><p class="muted" style="font-size:12px;margin:0 0 8px">Chỉ dùng câu tích cực, vui vẻ; không chế giễu, kích động, nói xấu, tiền bạc hay gây hấn.</p><div class="tk121-fun-grid"><div class="field"><label>VĐV trên sân</label><select id="tk121-fun-player"></select></div><div class="field"><label>Câu bình luận</label><select id="tk121-fun-phrase"></select></div></div><div class="tk121-fun-actions"><button id="tk121-fun-speak" class="btn tk121-fun-btn" type="button">🎙 Bình luận câu này</button><button id="tk121-fun-random" class="btn tk121-random-btn" type="button">🎲 Câu khác</button></div><div id="tk121-fun-preview" class="tk121-preview"></div>`;card.appendChild(box);const ps=$('tk121-fun-phrase');PHRASES.forEach((x,i)=>{const o=document.createElement('option');o.value=x;o.textContent=`${i+1}. ${x.replace('{name}','[VĐV]')}`;ps.appendChild(o)});$('tk121-fun-player').addEventListener('change',renderPreview);ps.addEventListener('change',renderPreview);$('tk121-fun-speak').addEventListener('click',speak);$('tk121-fun-random').addEventListener('click',randomPhrase);$('stream-court')?.addEventListener('change',()=>setTimeout(refreshPlayers,0));$('umpire-court')?.addEventListener('change',()=>setTimeout(refreshPlayers,0));refreshPlayers();window.TopkeyUpgrade121={installed:true,feature:'BADMINTON_FUN_COMMENTARY',phrases:PHRASES.slice(),refreshPlayers}}
function boot(){install();if(!installed)setTimeout(boot,350)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();