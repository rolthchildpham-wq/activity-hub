(()=>{'use strict';
const VERSION='2026.11.06-vnext-upgrade122-hotfix66-btc-sport-list-recovery';
const SPORTS=[
 {key:'badminton',name:'Cầu lông',icon:'🏸'},
 {key:'football',name:'Bóng đá',icon:'⚽'},
 {key:'volleyball',name:'Bóng chuyền',icon:'🏐'},
 {key:'running',name:'Chạy bộ',icon:'🏃'},
 {key:'handmade',name:'DIY / Handmade',icon:'🧶'},
 {key:'shuttle',name:'Đá cầu',icon:'🪶'},
 {key:'cooking',name:'Nấu ăn',icon:'👨‍🍳'}
];
function fill(sel){
 if(!sel)return;
 const current=sel.value;
 const expected=SPORTS.length+1;
 if(sel.options.length!==expected || ![...sel.options].some(o=>o.value==='volleyball')){
  sel.innerHTML='<option value="">-- Chọn môn cố định --</option>'+SPORTS.map(s=>`<option value="${s.key}">${s.icon} ${s.name}</option>`).join('');
  if(current && SPORTS.some(s=>s.key===current)) sel.value=current;
 }
}
function heal(){
 fill(document.getElementById('tk64-create-scope-select'));
 fill(document.getElementById('tk64-edit-scope-select'));
 const form=document.getElementById('user-form');
 if(form){
  const role=form.querySelector('[name="role"]');
  const sel=form.querySelector('[name="sportScope"]');
  if(sel)fill(sel);
  if(role&&sel&&String(role.value||'').toUpperCase()==='BTC'&&!sel.value){
   const sport=String(window.Topkey?.SPORT?.key||'').toLowerCase();
   if(SPORTS.some(s=>s.key===sport)) sel.value=sport;
  }
 }
}
function start(){heal();window.TopkeyLifecycle?.bind(heal,{settleTicks:10,settleEvery:250,debounceMs:40})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.TopkeyUpgrade122Hotfix66={VERSION,SPORTS,heal};
})();
