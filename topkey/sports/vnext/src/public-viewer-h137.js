/* H137: lightweight public spectator (no Firebase Auth / admin bundle).
 * Reads only Firebase public matches, teams, courts and activeMatches.
 * Never writes data, and reports loading/errors instead of an empty screen.
 */
(()=>{"use strict";
 const q=new URLSearchParams(location.search);
 const sport=q.get("sport")||"football";
 const roots={football:"topkey_football_vnext_2026",volleyball:"topkey_volleyball_vnext_2026",running:"topkey_running_vnext_2026",handmade:"topkey_handmade_vnext_2026",shuttle:"topkey_shuttle_vnext_2026",cooking:"topkey_cooking_vnext_2026"};
 const tid=q.get("tid")||"main_2026";
 const names={football:"Bóng đá",volleyball:"Bóng chuyền",running:"Chạy bộ",handmade:"DIY / Handmade",shuttle:"Đá cầu",cooking:"Nấu ăn"};
 const $=id=>document.getElementById(id);
 const root=$("public-spectator"),schedule=$("spectator-schedule"),live=$("spectator-live");
 if(!root||!schedule||!live)return;
 root.classList.remove("hidden");
 document.documentElement.classList.add("tk-public-boot");
 const login=$("login-screen"),admin=$("app-shell");
 login?.classList.add("hidden");admin?.classList.add("hidden");
 const title=$("spectator-title");if(title)title.textContent="TOPKEY · "+(names[sport]||sport)+" · Khán giả";
 const status=document.createElement("p");
 status.id="tk137-status";status.setAttribute("role","status");status.className="tk137-message";
 root.querySelector(".split")?.after(status);
 const store={matches:{},teams:{},courts:{},activeMatches:{}};
 const loaded=new Set();
 const liveNodes=new Map();
 let scheduled=false,mediaLoader=null;
 function tell(message,error=false){status.textContent=message;status.classList.toggle("tk137-error",error)}
 function safeDate(s){return String(s||"").replace(/[^0-9-]/g,"").slice(0,10)}
 function name(id){return String(store.teams?.[id]?.name||id||"—")}
 function matchName(m){if(!m)return "—";const a=name(m.teamAId),b=m.teamBId?name(m.teamBId):"";return b?a+" vs "+b:a}
 function prettyStatus(s){return ({SCHEDULED:"Chưa thi đấu",CHECK_IN:"Điểm danh",READY:"Sẵn sàng",CALLED:"Đã gọi",LIVE:"Đang thi đấu",SUSPENDED:"Tạm dừng",FINISHED:"Đã kết thúc",WALKOVER:"Bỏ cuộc",CANCELLED:"Đã hủy"})[s]||String(s||"Chưa cập nhật")}
 function score(a,m){
  if(!a)return "Chưa có điểm Live";
  const hasSets=Array.isArray(a.sets) && a.sets.length;
  if(hasSets){
   const index=Math.max(0,Math.min(a.sets.length-1,Number(a.setIndex)||0));
   const current=a.sets[index]||{a:0,b:0};
   return "SET "+(index+1)+": "+Number(current.a||0)+" – "+Number(current.b||0)+
    " · Các set: "+a.sets.map(s=>Number(s.a||0)+"–"+Number(s.b||0)).join(" | ");
  }
  if(a.scoreA!=null || a.scoreB!=null)return Number(a.scoreA||0)+" – "+Number(a.scoreB||0);
  if(a.resultMs!=null)return "Thời gian: "+String(a.resultMs)+" ms";
  if(a.judgeScore!=null)return "Điểm: "+String(a.judgeScore);
  if(m?.scoreA!=null||m?.scoreB!=null)return Number(m.scoreA||0)+" – "+Number(m.scoreB||0);
  return "Đang cập nhật tỷ số";
 }
 function card(parent,primary,secondary){const el=document.createElement("article");el.className="tk137-item";const heading=document.createElement("strong");heading.textContent=primary;el.appendChild(heading);const note=document.createElement("small");note.textContent=secondary;el.appendChild(note);parent.appendChild(el)}
 function safeMediaUrl(raw,type){
  try{
   const url=new URL(String(raw||""),location.href);
   if(url.protocol!=="https:")return null;
   if(type==="HLS")return /\\.m3u8(?:$|[?#])/i.test(url.pathname+url.search)?url.href:null;
   if(type==="EMBED"){
    const host=url.hostname.toLowerCase();
    if(/(^|\\.)youtube(-nocookie)?\\.com$/.test(host)||host==="youtu.be"){
     let id=host==="youtu.be"?url.pathname.split("/")[1]:url.searchParams.get("v")||url.pathname.match(/\\/(?:embed|live)\\/([^/?]+)/)?.[1];
     if(!id||!/^[-_a-zA-Z0-9]{11}$/.test(id))return null;
     return "https://www.youtube-nocookie.com/embed/"+id;
    }
    if(host==="player.vimeo.com" && /^\\/video\\/[0-9]+/.test(url.pathname))return url.href;
   }
  }catch{}
  return null;
 }
 function createLiveNode(id){
  const article=document.createElement("article");article.className="tk137-item tk143-live";
  const title=document.createElement("strong"),detail=document.createElement("small");
  const points=document.createElement("strong");points.className="tk143-score";points.setAttribute("aria-live","polite");
  const media=document.createElement("div");media.className="tk143-media";
  article.append(title,detail,points,media);
  live.appendChild(article);
  const node={article,title,detail,points,media,sourceKey:null,player:null,hls:null};
  liveNodes.set(id,node);return node;
 }
 function clearMedia(node){
  try{node.hls?.destroy?.()}catch{}
  node.hls=null;node.player=null;node.media.replaceChildren();
 }
 function loadHls(){
  if(window.Hls)return Promise.resolve(window.Hls);
  if(!mediaLoader)mediaLoader=new Promise((resolve,reject)=>{
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
   script.onload=()=>window.Hls?resolve(window.Hls):reject(new Error("HLS.js không khả dụng"));
   script.onerror=()=>reject(new Error("Không tải được HLS.js"));
   document.head.appendChild(script);
  }).catch(e=>{mediaLoader=null;throw e});
  return mediaLoader;
 }
 function message(node,text){
  const p=document.createElement("p");p.className="tk143-stream-note";p.textContent=text;node.media.appendChild(p);
 }
 function updateMedia(node,stream){
  const type=String(stream?.type||"").toUpperCase(),state=String(stream?.status||"OFFLINE").toUpperCase();
  const url=safeMediaUrl(stream?.url,type);
  const key=[type,state,url||""].join("|");
  if(key===node.sourceKey)return;
  node.sourceKey=key;clearMedia(node);
  if(state!=="LIVE"){message(node,type==="CAMERA"?"Camera đang mở cục bộ; chưa có đường truyền video đến Viewer.": "Chưa có luồng video công khai đang phát.");return}
  if(type==="CAMERA"){message(node,"Camera trên máy phát không tự truyền hình qua Firebase. BTC cần phát qua HLS/Embed hoặc thiết lập WebRTC.");return}
  if(!url){message(node,"Nguồn phát chưa có URL hợp lệ. Cần HLS (.m3u8) hoặc YouTube/Vimeo Embed HTTPS.");return}
  if(type==="EMBED"){
   const frame=document.createElement("iframe");
   frame.src=url;frame.title="Truyền hình trực tiếp";frame.allow="autoplay; fullscreen; picture-in-picture";
   frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";
   node.media.appendChild(frame);node.player=frame;return;
  }
  if(type==="HLS"){
   const video=document.createElement("video");
   video.controls=true;video.playsInline=true;video.preload="metadata";
   node.media.appendChild(video);node.player=video;
   if(video.canPlayType?.("application/vnd.apple.mpegurl")){video.src=url;return}
   loadHls().then(Hls=>{
    if(node.sourceKey!==key)return;
    if(!Hls.isSupported?.()){message(node,"Trình duyệt không hỗ trợ HLS.");return}
    const hls=new Hls();node.hls=hls;hls.loadSource(url);hls.attachMedia(video);
   }).catch(e=>{if(node.sourceKey===key)message(node,e.message)});
  }
 }
 function render(){
  scheduled=false;
  schedule.replaceChildren();
  const events=Object.values(store.matches||{}).filter(x=>x&&typeof x==="object").sort((a,b)=>((a.date||"")+" "+(a.time||"")).localeCompare((b.date||"")+" "+(b.time||"")));
  const active=Object.entries(store.activeMatches||{}).filter(([,a])=>a && (a.started || store.matches?.[a.matchId]?.status==="LIVE"));
  const activeIds=new Set(active.map(([id])=>id));
  for(const [id,node] of liveNodes){
   if(!activeIds.has(id)){clearMedia(node);node.article.remove();liveNodes.delete(id)}
  }
  for(const [id,a] of active){
   const m=store.matches?.[a.matchId],court=store.courts?.[id]||{};
   const node=liveNodes.get(id)||createLiveNode(id);
   node.title.textContent=matchName(m);
   node.detail.textContent=[court.name||id,String(m?.code||""),prettyStatus(m?.status||"LIVE")].filter(Boolean).join(" · ");
   const value=score(a,m);if(node.points.textContent!==value)node.points.textContent=value;
   updateMedia(node,court.stream);
  }
  if(!active.length && !liveNodes.has("_empty")) {
   const node=createLiveNode("_empty");
   node.title.textContent="Chưa có trận đang diễn ra";
   node.detail.textContent="Các trận LIVE sẽ xuất hiện tại đây khi BTC bắt đầu.";
  }
  if(active.length && liveNodes.has("_empty")){const n=liveNodes.get("_empty");n.article.remove();liveNodes.delete("_empty")}
  for(const m of events.slice(0,150)){
   const court=store.courts?.[m.courtId]?.name||"";
   card(schedule,matchName(m),[safeDate(m.date),String(m.time||""),String(m.code||""),court,prettyStatus(m.status)].filter(Boolean).join(" · "));
  }
  if(!events.length)card(schedule,"Chưa có lịch thi đấu","Lịch sẽ xuất hiện khi ban tổ chức công bố.");
  if(loaded.has("matches"))tell("Đã kết nối lịch thi đấu · "+events.length+" trận · "+active.length+" trận đang diễn ra");
 }
 function requestRender(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||((cb)=>setTimeout(cb,16)))(render)}
 async function start(){
  if(!roots[sport]||!(/^[a-zA-Z0-9_-]{1,100}$/.test(tid))){tell("Đường dẫn giải đấu không hợp lệ.",true);return}
  if(!window.TopkeyPlatform?.loadFirebase||!window.Topkey?.FIREBASE_CONFIG){tell("Không tải được cấu hình giải đấu. Vui lòng tải lại trang.",true);return}
  tell("Đang kết nối lịch và kết quả…");
  try{
    await window.TopkeyPlatform.loadFirebase(window.Topkey.FIREBASE_CONFIG,{auth:false});
    const ref=window.firebase.database().ref(roots[sport]+"/tournaments/"+tid);
    const publicBranches=["matches","teams","courts","activeMatches"];
    for(const key of publicBranches){
      ref.child(key).on("value",snapshot=>{
        store[key]=snapshot.val()||{};loaded.add(key);requestRender();
      },error=>{
        console.warn("Public viewer read failed",key,error);
        if(key==="matches")tell("Không đọc được lịch thi đấu. Hãy kiểm tra Firebase Rules hoặc thử lại.",true);
      });
    }
    setTimeout(()=>{if(!loaded.has("matches"))tell("Kết nối chậm hoặc chưa có quyền đọc lịch. Hãy thử tải lại trang.",true)},12000);
  }catch(error){
    console.error("TOPKEY public viewer",error);
    tell("Không kết nối được dữ liệu giải đấu. Kiểm tra mạng và tải lại trang.",true);
  }
 }
 start();
})();
