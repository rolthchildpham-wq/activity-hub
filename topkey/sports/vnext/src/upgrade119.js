(() => {
'use strict';
const T=window.Topkey;if(!T||!T.App||!T.SPORT)return;const A=T.App,S=T.SPORT;
function addInfoCard(){
  const page=document.getElementById('page-settings'); if(!page||document.getElementById('u119-sport-profile'))return;
  const card=document.createElement('div'); card.id='u119-sport-profile'; card.className='card'; card.style.marginTop='14px';
  const rubric=(S.rubric||[]).map(x=>`<tr><td>${x.label}</td><td>${x.weight}</td></tr>`).join('');
  card.innerHTML=`<h2>${S.icon} Hồ sơ nghiệp vụ ${S.name}</h2><div class="grid g2"><div><p><b>Kiểu đăng ký:</b> ${S.registrationMode||'STANDARD'}</p><p><b>Thể thức hỗ trợ:</b> ${(S.formats||[]).join(' · ')}</p><p><b>Nội dung:</b> ${(S.categories||[]).join(' · ')}</p></div><div>${rubric?`<b>Rubric mặc định</b><div class="table-wrap"><table><thead><tr><th>Tiêu chí</th><th>Trọng số</th></tr></thead><tbody>${rubric}</tbody></table></div>`:'<p class="muted">Rule thi đấu và xếp hạng được cấu hình riêng cho môn này.</p>'}</div></div><p class="note">Upgrade119: profile chỉ áp dụng trong root dữ liệu riêng <code>${T.ROOT}</code>; không ghi chéo sang Badminton hoặc môn khác.</p>`;
  page.appendChild(card);
}
const oldSetup=A.setupUI.bind(A);A.setupUI=function(){oldSetup();addInfoCard();
 const note=document.getElementById('control-note'); if(note) note.textContent=`${S.name}: ${S.registrationMode||'STANDARD'} · ${(S.formats||[]).join(' / ')}`;
 const btn=document.getElementById('round-robin-gen'); if(btn&&['time','judged'].includes(S.mode))btn.textContent='Tạo lượt còn thiếu';
};
const oldAfter=A.afterLogin.bind(A);A.afterLogin=async function(){await oldAfter();addInfoCard();};
})();
