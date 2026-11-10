(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;if(!T||!App||!U||App.__upgrade19ReliabilityInstalled)return;App.__upgrade19ReliabilityInstalled=true;
const $=id=>document.getElementById(id),BR=['config','teams','matches','courts','activeMatches','commentary'];
async function clearCaches(){try{if(!('caches'in window))return;const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith('topkey-sports-vnext-')&&!k.includes('upgrade19')).map(k=>caches.delete(k)))}catch{}}
function status(s,bad=false){const root=$('tk12-spectator-layout');if(!root)return;let e=$('tk19-viewer-fresh');if(!e){e=document.createElement('div');e.id='tk19-viewer-fresh';e.className='tk19-viewer-fresh';root.prepend(e)}e.dataset.kind=bad?'err':'ok';e.textContent=s}
async function fresh(){if(location.hash!=='#spectator'||!T.Data?.ready)return;try{const ss=await Promise.all(BR.map(b=>T.Data.ref(b).once('value')));ss.forEach((s,i)=>App.state[BR[i]]=s.val()||{});App.renderSpectator?.();status('● Realtime · Firebase '+new Date().toLocaleTimeString('vi-VN')+' · tự kiểm tra mỗi 10 giây')}catch(e){status('⚠ Chưa tải được dữ liệu mới: '+(e?.message||e),true)}}
const start=(App.startPublicSpectator||App.startSpectator)?.bind(App);if(start){const name=App.startPublicSpectator?'startPublicSpectator':'startSpectator';App[name]=function(){BR.forEach(b=>this.state[b]={});this.renderSpectator?.();clearCaches();const r=start();clearInterval(this._u19ViewerTimer);this._u19ViewerTimer=setInterval(fresh,10000);fresh();return r;}}
addEventListener('focus',fresh);addEventListener('online',fresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)fresh()});
const apply=()=>document.querySelectorAll('.tk9-readonly').forEach(z=>{const ns=z.matches?.('button,input,select,textarea')?[z]:[...z.querySelectorAll('button,input,select,textarea')];ns.forEach(e=>{if(e.dataset.viewOk==='true')return;e.disabled=true;e.setAttribute('aria-disabled','true');e.title=e.title||'Tài khoản chỉ có quyền xem'})});
const p=window.TopkeyUpgrade9?.applyPermissionsDom?.bind(window.TopkeyUpgrade9);if(p){window.TopkeyUpgrade9.applyPermissionsDom=function(){const r=p();apply();return r}}setTimeout(()=>{apply();if(location.hash==='#spectator')(App.startPublicSpectator||App.startSpectator)?.call(App)},0);
window.TopkeyUpgrade19={fresh};
})();