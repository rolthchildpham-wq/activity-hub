(()=>{'use strict';
const SPORTS=[
 {key:'football',name:'Bóng đá',icon:'⚽',href:'./sports/vnext/index.html?sport=football',description:'Lịch đấu, kết quả, BXH, sân, trọng tài, tài chính'},
 {key:'badminton',name:'Cầu lông',icon:'🏸',href:'./sports/badminton/index.html',description:'Nội dung thi, lịch sân, điểm set, trọng tài, BXH'},
 {key:'volleyball',name:'Bóng chuyền',icon:'🏐',href:'./sports/vnext/index.html?sport=volleyball',description:'Đội, lịch trận, tỷ số set, BXH, live'},
 {key:'running',name:'Chạy bộ',icon:'🏃',href:'./sports/vnext/index.html?sport=running',description:'Đăng ký VĐV, cự ly, thời gian, xếp hạng'},
 {key:'cooking',name:'Nấu ăn',icon:'👨‍🍳',href:'./sports/vnext/index.html?sport=cooking',description:'Đội thi, lịch chấm, giám khảo, kết quả'},
 {key:'handmade',name:'DIY / Handmade',icon:'🧶',href:'./sports/vnext/index.html?sport=handmade',description:'Tác phẩm, vòng chấm, tiêu chí và kết quả'},
 {key:'shuttle',name:'Đá cầu',icon:'🪶',href:'./sports/vnext/index.html?sport=shuttle',description:'Nội dung thi, lịch, tỷ số, BXH'}
];
const VLOG={name:'Vlog TikTok',href:'./sports/diy-vlog/index.html'};
const $=id=>document.getElementById(id);
const create=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
let selected='football';
function boot(){
 const host=$('sport-management');if(!host)return;
 host.replaceChildren();host.classList.add('tk-mgmt-panel');
 const top=create('div','tk-mgmt-top'),heading=create('div','tk-mgmt-heading');
 heading.append(create('span','tk-mgmt-kicker','QUẢN TRỊ & BÁO CÁO'),create('h2',null,'Trung tâm quản trị môn'),create('p',null,'Chọn bộ môn, xem báo cáo hoặc mở công cụ quản lý giải. Dùng tài khoản Firebase TOPKEY hiện có — không tạo tài khoản mới.'));
 const state=create('span','tk-mgmt-state','Đang kiểm tra đăng nhập…');state.id='sport-management-session';state.setAttribute('role','status');top.append(heading,state);
 const tabs=create('div','tk-mgmt-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Chọn bộ môn cần quản trị');
 const detail=create('div','tk-mgmt-detail');
 const name=create('h3','tk-mgmt-name'),description=create('p','tk-mgmt-desc'),links=create('div','tk-mgmt-actions');
 const view=create('a','tk-mgmt-action tk-mgmt-view sport','Xem môn / giải →');
 const manage=create('a','tk-mgmt-action tk-mgmt-manage sport','⚙ Vào quản trị môn →');
 view.setAttribute('aria-label','Mở môn đã chọn để xem thông tin');
 manage.setAttribute('aria-label','Mở môn đã chọn để đăng nhập và quản trị theo quyền');
 const note=create('p','tk-mgmt-note','Trang môn sẽ xác minh tài khoản và phân quyền Firebase: ADMIN quản trị theo phạm vi; BTC chỉ quản lý môn được cấp; Viewer chỉ xem. Chọn mở quản trị không tự cấp thêm quyền.');
 links.append(view,manage);detail.append(name,description,links,note);
 const steps=create('div','tk-mgmt-steps');
 for(const label of ['1. Chọn môn','2. Mở trang môn','3. Đăng nhập TOPKEY nếu cần','4. Firebase kiểm tra quyền']){
  steps.appendChild(create('span',null,label));
 }
 const extra=create('div','tk-mgmt-extra'),vlog=create('a','tk-mgmt-vlog','🎬 Quản trị Vlog TikTok →'),system=create('a','tk-mgmt-system','⚙ Cài đặt hệ thống (ADMIN) →');
 vlog.href=VLOG.href;system.href='./system-admin.html';
 extra.append(vlog,system);
 const more=create('p','tk-mgmt-footer','Vlog có trang đăng nhập riêng trong cùng Firebase. Quản trị tài khoản và phân quyền hệ thống ở thẻ Cài đặt hệ thống, không nằm trong quyền BTC.');
 host.append(top,tabs,detail,steps,extra,more);
 function select(sport){
  const item=SPORTS.find(s=>s.key===sport)||SPORTS[0];selected=item.key;
  for(const button of tabs.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.sport===selected));
  name.textContent=item.icon+' '+item.name;description.textContent=item.description;
  view.href=item.href;manage.href=item.href;
  view.setAttribute('aria-label','Xem giải '+item.name);
  manage.setAttribute('aria-label','Mở quản trị '+item.name+' (đăng nhập bằng tài khoản TOPKEY nếu cần)');
 }
 for(const item of SPORTS){
  const button=create('button','tk-mgmt-tab',item.icon+' '+item.name);button.type='button';button.dataset.sport=item.key;
  button.addEventListener('click',()=>select(item.key));tabs.appendChild(button);
 }
 select(selected);
 try{
  const auth=window.firebase?.auth?.();
  if(!auth){state.textContent='Chưa có kết nối Firebase';return;}
  auth.onAuthStateChanged(user=>{
   state.textContent=user&&!user.isAnonymous?'● Đã đăng nhập TOPKEY · quyền kiểm tra tại trang môn':'○ Chưa đăng nhập · trang môn sẽ yêu cầu khi cần';
  },()=>{state.textContent='Chưa xác minh được phiên · đăng nhập tại trang môn';});
 }catch{state.textContent='Không đọc được trạng thái phiên · đăng nhập tại trang môn';}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.TopkeySportManagement={sports:SPORTS.map(s=>({key:s.key,href:s.href})),boot};
})();