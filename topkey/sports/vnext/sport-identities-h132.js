/* TOPKEY H132 — sport-specific presentation only. Business logic is shared. */
(()=>{'use strict';
const sport=document.documentElement.dataset.tkSport;
const descriptions={
 football:{name:'Bóng đá',icon:'⚽',title:'Trung tâm điều hành bóng đá',description:'Đội bóng · Sân đấu · Bàn thắng · Bảng xếp hạng'},
 volleyball:{name:'Bóng chuyền',icon:'🏐',title:'Nhà thi đấu bóng chuyền',description:'Đội bóng · Set đấu · Trọng tài · Kết quả'},
 running:{name:'Chạy bộ',icon:'🏃',title:'Trung tâm điều hành đường chạy',description:'Vận động viên · Làn chạy · Thời gian · Thành tích'},
 handmade:{name:'DIY / Handmade',icon:'🧶',title:'Không gian sáng tạo',description:'Thí sinh · Tác phẩm · Giám khảo · Xếp hạng'},
 shuttle:{name:'Đá cầu',icon:'🪶',title:'Trung tâm điều hành đá cầu',description:'Nội dung đơn/đôi · Sân · Set đấu · Live'},
 cooking:{name:'Nấu ăn',icon:'👨‍🍳',title:'Nhà bếp thi đấu',description:'Đội thi · Khu bếp · Giám khảo · Điểm số'}
};
const info=descriptions[sport];
if(!info||window.__TOPKEY_PUBLIC_ROUTE)return;
const init=()=>{
 const page=document.getElementById('page-overview');
 if(!page||document.getElementById('tk-h132-hero'))return;
 const hero=document.createElement('section');
 hero.id='tk-h132-hero';hero.className='tk-h132-hero';
 hero.setAttribute('aria-label','Tổng quan môn '+info.name);
 const copy=document.createElement('div');
 const sub=document.createElement('small');sub.textContent='TOPKEY SPORTS · '+info.name.toLocaleUpperCase('vi-VN');
 const title=document.createElement('strong');title.textContent=info.title;
 const description=document.createElement('p');description.textContent=info.description;
 copy.append(sub,title,description);
 const indicator=document.createElement('span');
 indicator.className='tk-h132-live';indicator.textContent='Điều hành giải đấu';
 hero.append(copy,indicator);page.prepend(hero);
 // Does not touch data-tab, user identity, tournament title, Firebase or score writes.
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.TopkeySportIdentity132=Object.freeze({sport,installed:true,contract:'COSMETIC_SHARED_VNEXT_ENGINE'});
})();