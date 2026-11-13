/* TOPKEY badminton performance diagnostics: no analytics, no user data.
 * Reports UI interaction/long-task metrics locally in the System Health tab.
 */
(()=>{'use strict';
if(window.TopkeyBadmintonPerf125)return;
const started=performance.now(),metrics={longTasks:0,longTaskTotalMs:0,longTaskMaxMs:0,inputSamples:0,inputDelayMaxMs:0,inputDelayTotalMs:0,authStates:[],readyMs:null};
let inputAt=0,queued=false,lastTouch=0;
const onDown=()=>{inputAt=performance.now();lastTouch=Date.now();if(queued)return;queued=true;
 const draw=()=>{queued=false;if(!inputAt)return;const t=Math.max(0,performance.now()-inputAt);
  // requestAnimationFrame includes one natural 60Hz frame; report only excess.
  const extra=Math.max(0,t-18);metrics.inputSamples++;metrics.inputDelayMaxMs=Math.max(metrics.inputDelayMaxMs,Math.round(extra));metrics.inputDelayTotalMs+=extra;inputAt=0;};
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(draw);else setTimeout(draw,16);
};
document.addEventListener('pointerdown',onDown,{passive:true,capture:true});
document.addEventListener('keydown',onDown,{passive:true,capture:true});
window.addEventListener('topkey:auth-state',e=>{const state=String(e.detail?.state||'');if(!state)return;
 metrics.authStates.push({state,ms:Math.round(performance.now()-started)});
 if(metrics.authStates.length>12)metrics.authStates.shift();
},{passive:true});
window.addEventListener('topkey:admin-ready',()=>{if(metrics.readyMs===null)metrics.readyMs=Math.round(performance.now()-started)},{passive:true});
if(typeof PerformanceObserver==='function')try{
 const obs=new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(entry.duration<50)continue;
  metrics.longTasks++;metrics.longTaskTotalMs+=entry.duration;metrics.longTaskMaxMs=Math.max(metrics.longTaskMaxMs,Math.round(entry.duration));
 }});
 obs.observe({type:'longtask',buffered:true});
}catch{}
function snapshot(){
 return {readyMs:metrics.readyMs,longTasks:metrics.longTasks,maxLongTaskMs:metrics.longTaskMaxMs,
 totalLongTaskMs:Math.round(metrics.longTaskTotalMs),samples:metrics.inputSamples,
 maxInputDelayMs:metrics.inputDelayMaxMs,avgInputDelayMs:metrics.inputSamples?Math.round(metrics.inputDelayTotalMs/metrics.inputSamples):0,
 authStates:[...metrics.authStates],overviewRequested:window.TopkeyBadmintonFastStart124?.overviewRequested||0,
 overviewFlushed:window.TopkeyBadmintonFastStart124?.overviewFlushed||0};
}
function show(){
 const parent=document.getElementById('page-health');if(!parent||parent.classList.contains('hidden'))return;
 let node=document.getElementById('tk125-performance');
 if(!node){node=document.createElement('section');node.id='tk125-performance';node.className='card';node.style.marginTop='12px';
  const h=document.createElement('h3');h.textContent='⚡ Đo hiệu năng cầu lông';
  const pre=document.createElement('pre');pre.id='tk125-performance-summary';pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,monospace;color:inherit';
  const button=document.createElement('button');button.textContent='Sao chép số đo (không chứa tài khoản)';button.className='btn mini';
  button.onclick=()=>navigator.clipboard?.writeText?.(JSON.stringify(snapshot(),null,2));
  const p=document.createElement('p');p.className='muted';p.textContent='Các số đo lưu trong trình duyệt; không gửi dữ liệu lên máy chủ.';
  node.append(h,pre,button,p);parent.appendChild(node);
 }
 const m=snapshot();const p=document.getElementById('tk125-performance-summary');
 if(p)p.textContent='Sẵn sàng: '+(m.readyMs??'đang xác minh')+' ms | Long tasks: '+m.longTasks+' (max '+m.maxLongTaskMs+' ms)\n'
 +'Click delay: TB '+m.avgInputDelayMs+' ms / max '+m.maxInputDelayMs+' ms | Overview redraw '+m.overviewFlushed+'/'+m.overviewRequested;
}
window.TopkeyBadmintonPerf125=Object.freeze({snapshot,show});
const timer=setInterval(show,2600);
window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();