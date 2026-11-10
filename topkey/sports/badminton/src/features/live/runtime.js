(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;if(!T||!App||!U||window.TopkeyLiveRuntime)return;
App.__upgrade80Installed=true;
const $=id=>document.getElementById(id);let facing='environment';
function selectedFacing(){const v=$('tk80-camera-facing')?.value;return v==='user'?'user':'environment'}
function videoConstraints(mode='ideal'){facing=selectedFacing();return {width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:60},facingMode:{[mode]:facing}}}
async function openPreferredCamera(){const media=navigator.mediaDevices;if(!media?.getUserMedia)throw new Error('Trình duyệt không hỗ trợ camera');try{return await media.getUserMedia({video:videoConstraints('exact'),audio:true})}catch(e){if(!['OverconstrainedError','NotFoundError','TypeError'].includes(e?.name))throw e;return media.getUserMedia({video:videoConstraints('ideal'),audio:true})}}
App.cameraVideoConstraints=videoConstraints;App.openPreferredCamera=openPreferredCamera;
const facingLabel=v=>v==='user'?'Camera trước':'Camera sau';
function streamInfo(){const stream=$('live-video')?.srcObject;if(!stream?.getVideoTracks)return null;const track=stream.getVideoTracks()[0];if(!track)return null;const st=track.getSettings?.()||{};return {track,settings:st,label:track.label||'',facing:st.facingMode||''}}
function renderStatus(){const el=$('tk80-camera-status');if(!el)return;const info=streamInfo();if(!info){el.textContent=`Mặc định: ${facingLabel(selectedFacing())}.`;el.dataset.state='idle';return}const actual=info.facing==='user'?'Camera trước':info.facing==='environment'?'Camera sau':facingLabel(selectedFacing());el.textContent=`Đang dùng: ${actual}${info.label?' · '+info.label:''}`;el.dataset.state='live'}
function syncVisibility(){const field=$('tk80-camera-field'),type=$('stream-type')?.value;if(field)field.hidden=!['CAMERA','WEBRTC'].includes(type);renderStatus()}
async function switchLocalCamera(){const type=$('stream-type')?.value;if(type!=='CAMERA')return;const v=$('live-video');if(!v?.srcObject)return;try{v.srcObject.getTracks?.().forEach(t=>t.stop());v.srcObject=null}catch{};U.toast(`Đang chuyển sang ${facingLabel(selectedFacing()).toLowerCase()}...`,'info');await App.startLocalCamera();renderStatus()}
function ensureUi(){const type=$('stream-type');if(!type)return;if(!$('tk80-camera-field')){const sourceField=type.closest('.field');if(!sourceField)return;const field=document.createElement('div');field.id='tk80-camera-field';field.className='field tk80-camera-field';field.innerHTML='<label>Camera điện thoại</label><div class="tk80-camera-row"><select id="tk80-camera-facing" aria-label="Chọn camera"><option value="environment" selected>📷 Camera sau (mặc định)</option><option value="user">🤳 Camera trước</option></select><button id="tk80-camera-switch" type="button" class="btn mini">↻ Đổi camera</button></div><div id="tk80-camera-status" class="tk80-camera-status">Mặc định: Camera sau.</div>';sourceField.insertAdjacentElement('afterend',field);const sel=$('tk80-camera-facing'),btn=$('tk80-camera-switch');sel.value='environment';facing='environment';sel.addEventListener('change',()=>{facing=selectedFacing();renderStatus();switchLocalCamera().catch(e=>U.toast('Không đổi được camera: '+(e?.message||e),'err'))});btn.addEventListener('click',()=>{sel.value=selectedFacing()==='environment'?'user':'environment';sel.dispatchEvent(new Event('change',{bubbles:true}))});type.addEventListener('change',syncVisibility)}syncVisibility()}
const baseLocal=App.startLocalCamera?.bind(App);if(baseLocal&&!App.__u116LiveLocal){App.__u116LiveLocal=true;App.startLocalCamera=async function(...args){facing=selectedFacing();const out=await baseLocal(...args);setTimeout(renderStatus,80);return out}}
const baseBroadcast=App.startWebRTCBroadcast?.bind(App);if(baseBroadcast&&!App.__u116LiveBroadcast){App.__u116LiveBroadcast=true;App.startWebRTCBroadcast=async function(...args){facing=selectedFacing();const out=await baseBroadcast(...args);setTimeout(renderStatus,120);return out}}
const baseStop=App.stopLive?.bind(App);if(baseStop&&!App.__u116LiveStop){App.__u116LiveStop=true;App.stopLive=async function(...args){const out=await baseStop(...args);setTimeout(renderStatus,30);return out}}
function onTab({tab}={}){if(tab==='live')setTimeout(ensureUi,20)}
window.TopkeyUIBoundary?.onTab?.(onTab,'u116:live:camera-ui');
setTimeout(()=>{ensureUi();renderStatus()},0);
const api={installed:true,selectedFacing,videoConstraints,openPreferredCamera,streamInfo,renderStatus,ensureUi,onTab,contract:'REAR_CAMERA_DEFAULT_001'};
window.TopkeyLiveRuntime=api;window.TopkeyUpgrade80=api;
})();
