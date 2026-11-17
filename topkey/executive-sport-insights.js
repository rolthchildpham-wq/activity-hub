(()=>{'use strict';
const LABELS={
 football:{title:'Bóng đá',icon:'⚽',focus:'BXH · lịch đấu · bàn thắng · phong độ',detail:'Bàn thắng, kiến tạo và phong độ chỉ hiển thị khi nguồn dữ liệu trận có trường tương ứng.'},
 badminton:{title:'Cầu lông',icon:'🏸',focus:'Nội dung · kết quả set · nhánh đấu',detail:'Điểm từng set và đối đầu phải lấy từ kết quả trận đã xác thực; không suy diễn từ số trận.'},
 volleyball:{title:'Bóng chuyền',icon:'🏐',focus:'Số set · tỷ số · tấn công · chắn bóng',detail:'Chỉ bổ sung chỉ số tấn công, chắn và giao bóng nếu biên bản trận có dữ liệu.'},
 running:{title:'Chạy bộ',icon:'🏃',focus:'Thời gian · thứ hạng · nhóm tuổi · pace',detail:'Pace và thành tích cần nguồn thời gian hoàn thành chính thức, không lấy từ số lượng VĐV.'},
 cooking:{title:'Nấu ăn',icon:'👨‍🍳',focus:'Phiếu chấm · tiêu chí · giải thưởng',detail:'Điểm giám khảo và đánh giá món ăn phải đến từ phiếu chấm có xác thực.'},
 handmade:{title:'DIY / Handmade',icon:'🧶',focus:'Gallery tác phẩm · rubric · điểm giám khảo',detail:'Ảnh tác phẩm và điểm thành phần chỉ dùng dữ liệu đã lưu, không tự gán điểm.'},
 shuttle:{title:'Đá cầu',icon:'🪶',focus:'Bảng đấu · tỷ số · nhánh loại trực tiếp',detail:'Thống kê trận đấu chỉ hiển thị sau khi có dữ liệu kết quả hợp lệ.'}
};
const fmt=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0);
let selected='football';
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function render(host,data){
 if(!host||!data||!Array.isArray(data.clubs)||!Array.isArray(data.events))return;
 host.querySelector('#exec-insights')?.remove();
 const panel=el('section','exec-insights');panel.id='exec-insights';
 const head=el('div','exec-insights-heading');
 const copy=el('div');copy.append(el('div','exec-eyebrow','TOPKEY · BÁO CÁO CHUYÊN SÂU'),el('h3',null,'Thống kê theo từng môn'),el('p',null,'Tách số liệu điều hành khỏi thống kê chuyên môn; chỉ sử dụng dữ liệu giải đấu đã ghi nhận.'));
 head.appendChild(copy);panel.appendChild(head);
 const tabs=el('div','exec-insights-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Chọn môn thể thao');
 const body=el('div','exec-insights-body');
 const keys=Object.keys(LABELS);
 if(!keys.includes(selected))selected='football';
 for(const key of keys){const label=LABELS[key],button=el('button','exec-insights-tab',label.icon+' '+label.title);button.type='button';button.dataset.sport=key;button.setAttribute('aria-pressed',String(key===selected));button.addEventListener('click',()=>{selected=key;update();});tabs.appendChild(button);}
 panel.append(tabs,body);host.prepend(panel);
 function update(){
  for(const button of tabs.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.sport===selected));
  body.replaceChildren();const meta=LABELS[selected]||LABELS.football;
  const club=data.clubs.find(c=>c.key===selected)||{};
  const events=data.events.filter(e=>e.sport===meta.title||(selected==='handmade'&&e.sport==='DIY / Handmade'));
  const totals=[['Giải đã tổ chức',events.length],['Lượt hồ sơ tham gia',events.reduce((n,e)=>n+(Number(e.teams)||0),0)],['Trận / lượt chấm ghi nhận',events.reduce((n,e)=>n+(Number(e.matches)||0),0)],['Số dư',fmt(Number(club.balance)||0)+' ₫']];
  const overview=el('div','exec-insights-stats');
  for(const [name,value] of totals){const card=el('div','exec-insights-stat');card.append(el('span',null,name),el('strong',null,String(value)));overview.appendChild(card);}
 const note=el('div','exec-insights-focus');note.append(el('strong',null,meta.focus),el('p',null,meta.detail));
 const tableWrap=el('div','exec-insights-tablewrap'),table=el('table','exec-insights-table'),thead=el('thead'),tr=el('tr');
 for(const col of ['Giải đấu','Năm','Hồ sơ','Trận / lượt chấm','Số dư'])tr.appendChild(el('th',null,col));thead.appendChild(tr);table.appendChild(thead);
 const tbody=el('tbody');
 for(const event of events.slice(0,12)){const row=el('tr');for(const x of [event.title,event.year,event.teams,event.matches,fmt(event.balance)+' ₫'])row.appendChild(el('td',null,String(x??'—')));tbody.appendChild(row);}
 if(!events.length){const row=el('tr'),cell=el('td',null,'Chưa có giải được ghi nhận trong snapshot điều hành.');cell.colSpan=5;row.appendChild(cell);tbody.appendChild(row);}
 table.appendChild(tbody);tableWrap.appendChild(table);
 const last=el('p','exec-insights-footnote','Dữ liệu tổng hợp theo snapshot điều hành · Không tự suy diễn điểm, thời gian hoặc thống kê kỹ thuật chưa được lưu.');
 body.append(overview,note,tableWrap,last);
 }
 update();
}
window.TopkeyExecutiveSportInsights={render};
})();