/* H116 Admin-only EdgeOne AI Chat Assistant integration slot.
   The EdgeOne Makers *developer* Copilot is not a chatbot. No Firebase token or user data is forwarded. */
(()=>{'use strict';
let granted=false,uid='',frame=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function endpoint(s){try{const u=new URL(String(s||''));if(u.protocol!=='https:'||u.username||u.password||u.hash||!u.hostname)return null;return u.origin+(u.pathname.replace(/\/$/,'').endsWith('/widget')?u.pathname.replace(/\/$/,''):u.pathname.replace(/\/$/,'')+'/widget')}catch{return null}}
function reset(){document.getElementById('tk116-ai-panel')?.remove();granted=false;uid='';frame=null}
function mount(){if(!granted||!document.getElementById('app')||document.getElementById('app').classList.contains('hidden'))return;
 let el=document.getElementById('tk116-ai-panel');if(el)return;
 el=document.createElement('section');el.id='tk116-ai-panel';el.className='card';el.style.cssText='margin-top:18px;';
 el.innerHTML=`<h2>🧠 TOPKEY AI Copilot – Trợ lý thống kê (ADMIN)</h2><p class="muted">Dùng EdgeOne <b>AI Chat Assistant</b>, không phải Copilot sửa mã nguồn của EdgeOne Makers. Chỉ hiển thị sau khi Firebase xác minh ADMIN. Không gửi token, mật khẩu, danh sách tài khoản hay dữ liệu Firebase sang AI.</p>
 <div class="grid"><div class="field"><label>Địa chỉ website AI Chat Assistant đã triển khai trên EdgeOne Makers (HTTPS)</label><input id="tk116-ai-url" type="url" placeholder="https://your-ai-assistant.edgeone.app" autocomplete="off"></div><div class="field"><label>Hành động</label><div class="row"><button type="button" id="tk116-ai-connect" class="btn">Mở AI Assistant</button><button type="button" id="tk116-ai-clear" class="btn">Ngắt kết nối</button></div></div></div>
 <div id="tk116-ai-status" class="notice" style="margin:10px 0">Chưa kết nối AI. Có thể hỏi về cách tạo biểu đồ sau khi thiết lập Agent trên EdgeOne.</div>
 <p class="muted">Gợi ý: “Cách tạo biểu đồ tổng thu/chi theo tháng?”, “Cách vẽ số VĐV theo 7 môn?”, “Biểu đồ thể hiện kết quả thi đấu theo giải?”. Để AI đọc số liệu thật, hãy xây API tổng hợp <b>chỉ đọc</b> có kiểm tra Firebase ID token và quyền ADMIN <b>trên máy chủ</b>.</p>
 <div id="tk116-ai-framebox" style="min-height:80px"></div>
 <p><a href="https://edgeone.ai/document/213782821217427456" target="_blank" rel="noopener noreferrer">Tài liệu chính thức: EdgeOne AI Chat Assistant</a></p>`;
 document.getElementById('app').appendChild(el);
 const input=el.querySelector('#tk116-ai-url');input.value=localStorage.getItem('tk116_admin_ai_url')||'';
 const status=el.querySelector('#tk116-ai-status'),place=el.querySelector('#tk116-ai-framebox');
 el.querySelector('#tk116-ai-connect').onclick=()=>{if(!granted)return;const url=endpoint(input.value);if(!url)return status.textContent='Chỉ chấp nhận đường dẫn HTTPS của dự án AI Assistant, không có mật khẩu trong URL.';
  // Only loads a separately deployed, explicitly configured AI site. Never transfers admin DOM/page content.
  localStorage.setItem('tk116_admin_ai_url',input.value.trim());place.textContent='';const f=document.createElement('iframe');f.title='TOPKEY EdgeOne AI Assistant';f.src=url;f.loading='lazy';f.referrerPolicy='no-referrer';f.style.cssText='width:100%;height:560px;border:1px solid #305d7a;border-radius:12px;background:white';f.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin allow-popups');place.appendChild(f);frame=f;status.textContent='Đang mở AI Assistant: '+url+'. Nếu Agent chưa triển khai hoặc cấm iframe, cần cấu hình dự án EdgeOne trước.';
 };
 el.querySelector('#tk116-ai-clear').onclick=()=>{frame?.remove();frame=null;localStorage.removeItem('tk116_admin_ai_url');input.value='';status.textContent='Đã ngắt AI Assistant. Không có dữ liệu Firebase nào được gửi đi.'};
}
window.addEventListener('topkey:admin-auth',e=>{const info=e.detail||{};if(info.admin===true&&typeof info.uid==='string'&&info.uid){granted=true;uid=info.uid;mount()}else reset()});
})();
