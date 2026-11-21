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
 function matchScoreSummary(m){
  if(!m)return "";
  const sets=Array.isArray(m.sets)?m.sets:[];
  const played=sets.filter(s=>s&&((s.a!=null&&s.b!=null)||(s.scoreA!=null&&s.scoreB!=null)));
  if(played.length){
   const parts=played.map(s=>Number(s.a??s.scoreA??0)+"–"+Number(s.b??s.scoreB??0));
   const winsA=played.filter(s=>Number(s.a??s.scoreA??0)>Number(s.b??s.scoreB??0)).length;
   const winsB=played.filter(s=>Number(s.b??s.scoreB??0)>Number(s.a??s.scoreA??0)).length;
   return (winsA||winsB?winsA+" – "+winsB+"  ·  ":"")+parts.join("  ·  ");
  }
  if(m.scoreA!=null||m.scoreB!=null)return Number(m.scoreA||0)+" – "+Number(m.scoreB||0);
  if(m.resultMs!=null)return "Thời gian: "+String(m.resultMs)+" ms";
  if(m.judgeScore!=null)return "Điểm: "+String(m.judgeScore);
  if(m.result!=null && typeof m.result==="string")return String(m.result);
  return "";
 }
 function card(parent,primary,secondary,scoreText="",winnerName=""){const el=document.createElement("article");el.className="tk137-item";const heading=document.createElement("strong");heading.textContent=primary;el.appendChild(heading);if(winnerName){el.classList.add("tk137-winner-card");el.style.cssText="border:2px solid #24d6a0;background:#123f3b;box-shadow:0 0 14px rgba(36,214,160,.18)";const tag=document.createElement("span");tag.textContent="🏆 WIN · "+winnerName;tag.className="tk137-win-tag";tag.style.cssText="display:inline-block;margin:8px 0;padding:5px 10px;border-radius:999px;background:#087f61;color:#fff;font-weight:900;font-size:13px";el.appendChild(tag)}const note=document.createElement("small");note.textContent=secondary;el.appendChild(note);if(scoreText){const scoreNode=document.createElement("span");scoreNode.className="tk137-result";scoreNode.textContent=scoreText;el.appendChild(scoreNode)}parent.appendChild(el)}
 function safeMediaUrl(raw,type){
  try{
   const url=new URL(String(raw||""),location.href);
   if(url.protocol!=="https:")return null;
   if(type==="HLS")return /\.m3u8(?:$|[?#])/i.test(url.pathname+url.search)?url.href:null;
   if(type==="EMBED"){
    const host=url.hostname.toLowerCase();
    if(/(^|\.)youtube(-nocookie)?\.com$/.test(host)||host==="youtu.be"){
     let id=host==="youtu.be"?url.pathname.split("/")[1]:url.searchParams.get("v")||url.pathname.match(/\/(?:embed|live)\/([^/?]+)/)?.[1];
     if(!id||!/^[-_a-zA-Z0-9]{11}$/.test(id))return null;
     return "https://www.youtube-nocookie.com/embed/"+id;
    }
    if(host==="player.vimeo.com" && /^\/video\/[0-9]+/.test(url.pathname))return url.href;
    if(host==="player.twitch.tv" && url.pathname==="/"){
      const channel=String(url.searchParams.get("channel")||"").toLowerCase();
      if(!/^[a-z0-9_]{4,25}$/.test(channel))return null;
      // Twitch requires parent=the *actual* embedded host, not a saved
      // previous production/preview domain. Never trust stored parent params.
      return "https://player.twitch.tv/?channel="+encodeURIComponent(channel)+
        "&parent="+encodeURIComponent(location.hostname)+"&autoplay=false";
    }
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
  try{node.rtc?.close?.()}catch{}
  node.hls=null;node.rtc=null;node.player=null;node.media.replaceChildren();
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
  if(type==="WEBRTC"){
   const player=document.createElement("video");
   player.controls=true;player.playsInline=true;player.autoplay=true;player.muted=false;
   player.setAttribute("aria-label","Truyền hình và âm thanh Live WebRTC");
   node.media.appendChild(player);node.player=player;
   const connect=async()=>{
     try{
       const client=window.TopkeyWebRTCH154;
       if(!client)throw new Error("Thư viện WebRTC không được tải");
       const rtc=await client.play({sport,tid,court:node.courtId,
         ontrack:evt=>{
           if(node.sourceKey!==key)return;
           if(evt.streams?.[0])player.srcObject=evt.streams[0];
           else{
             const media=player.srcObject||new MediaStream();
             media.addTrack(evt.track);player.srcObject=media;
           }
           player.play().catch(()=>{message(node,"Chạm nút Play để nghe âm thanh Live.")});
         }});
       if(node.sourceKey!==key){rtc.close();return}
       node.rtc=rtc;
     }catch(e){
       if(node.sourceKey!==key)return;
       message(node,"WebRTC chưa kết nối: "+e.message);
       const retry=document.createElement("button");
       retry.type="button";retry.className="btn";
       retry.textContent="↻ Thử kết nối lại";
       retry.onclick=()=>{node.media.replaceChildren(player);void connect()};
       node.media.appendChild(retry);
     }
   };
   void connect();return;
  }

  if(!url){message(node,"Nguồn phát chưa có URL hợp lệ. Cần HLS (.m3u8) hoặc YouTube/Vimeo Embed HTTPS.");return}
  if(type==="EMBED"){
   const frame=document.createElement("iframe");
   frame.src=url;frame.title="Truyền hình trực tiếp";frame.allow="autoplay; fullscreen; picture-in-picture";
   frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";
   node.media.appendChild(frame);node.player=frame;
   if(url.startsWith("https://player.twitch.tv/")){
     const channel=new URL(url).searchParams.get("channel");
     const fallback=document.createElement("a");
     fallback.href="https://www.twitch.tv/"+encodeURIComponent(channel);
     fallback.target="_blank";fallback.rel="noopener noreferrer";
     fallback.textContent="Mở trực tiếp trong ứng dụng/trang Twitch nếu màn hình quá nhỏ";
     fallback.className="tk161-twitch-fallback";
     node.media.appendChild(fallback);
   }
   return;
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
 function renderStandings(){let box=document.getElementById("spectator-standings");if(!box){box=document.createElement("section");box.id="spectator-standings";box.className="tk137-standings";root.appendChild(box)}box.replaceChildren();box.style.cssText="display:block;width:100%;box-sizing:border-box;margin-top:18px;padding:14px;border:1px solid #335575;border-radius:14px;background:#102a44;color:#f3faff";const teamGroup=new Map(),groupNames=new Set();const groupValue=o=>{for(const k of ["groupName","group","groupId","poolName","pool","groupCode"]){const v=o?.[k];if(v!=null&&String(v).trim()&&String(v).toLowerCase()!=="all")return String(v).trim()}return ""};Object.entries(store.teams||{}).forEach(([id,t])=>{const g=groupValue(t);if(g){teamGroup.set(id,g);groupNames.add(g)}});Object.values(store.matches||{}).forEach(m=>{if(!m)return;const g=groupValue(m);if(g){groupNames.add(g);if(m.teamAId&&!teamGroup.has(m.teamAId))teamGroup.set(m.teamAId,g);if(m.teamBId&&!teamGroup.has(m.teamBId))teamGroup.set(m.teamBId,g)}});const stats=new Map();const ensure=id=>{if(!id)return null;if(!stats.has(id))stats.set(id,{id,name:name(id),played:0,wins:0,losses:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0});return stats.get(id)};const completed=Object.values(store.matches||{}).filter(m=>m&&["FINISHED","WALKOVER"].includes(String(m.status||"").toUpperCase()));for(const m of completed){const A=ensure(m.teamAId),B=ensure(m.teamBId);if(!A||!B)continue;const sets=Array.isArray(m.sets)?m.sets.filter(s=>s&&(s.a!=null||s.scoreA!=null)&&(s.b!=null||s.scoreB!=null)):[];let setA=0,setB=0,pA=0,pB=0;if(sets.length){for(const s of sets){const a=Number(s.a??s.scoreA??0),b=Number(s.b??s.scoreB??0);pA+=a;pB+=b;if(a>b)setA++;else if(b>a)setB++}}else if(m.scoreA!=null||m.scoreB!=null){pA=Number(m.scoreA||0);pB=Number(m.scoreB||0);if(pA>pB)setA=1;else if(pB>pA)setB=1}A.played++;B.played++;A.setsFor+=setA;A.setsAgainst+=setB;B.setsFor+=setB;B.setsAgainst+=setA;A.pointsFor+=pA;A.pointsAgainst+=pB;B.pointsFor+=pB;B.pointsAgainst+=pA;if(setA>setB){A.wins++;B.losses++}else if(setB>setA){B.wins++;A.losses++}}const rows=[...stats.values()],sortRows=(a,b)=>b.wins-a.wins||(b.setsFor-b.setsAgainst)-(a.setsFor-a.setsAgainst)||b.pointsFor-b.pointsFor||a.name.localeCompare(b.name);const title=document.createElement("h2");title.textContent="🏆 Bảng xếp hạng · Vòng bảng";box.appendChild(title);if(!rows.length){const note=document.createElement("p");note.textContent="Chưa có kết quả trận đã kết thúc để lập bảng xếp hạng.";box.appendChild(note);return}let groups=[...groupNames].sort((a,b)=>a.localeCompare(b,"vi"));if(groups.length<2){const sorted=rows.sort((a,b)=>a.name.localeCompare(b.name,"vi")),mid=Math.ceil(sorted.length/2);groups=["Bảng A","Bảng B"];sorted.forEach((r,i)=>teamGroup.set(r.id,i<mid?"Bảng A":"Bảng B"));const note=document.createElement("small");note.textContent="Chưa có nhãn nhóm từ dữ liệu giải; đang chia tạm theo tên đội.";note.style.cssText="display:block;color:#ffd98a;margin-bottom:10px";box.appendChild(note)}if(groups.length>2)groups=groups.slice(0,2);groups.forEach(g=>{const h=document.createElement("h3");h.textContent=g;h.style.cssText="margin:16px 0 8px;font-size:20px;color:#72f0c1";box.appendChild(h);const table=document.createElement("div");table.className="tk137-rank-table";const members=rows.filter(r=>(teamGroup.get(r.id)||"Bảng A")===g).sort(sortRows);if(!members.length){const n=document.createElement("p");n.textContent="Chưa có đội/kết quả thuộc nhóm này.";table.appendChild(n)}members.forEach((r,i)=>{const row=document.createElement("div");row.className="tk137-rank-row";const rank=document.createElement("strong");rank.textContent=String(i+1);const team=document.createElement("span");team.className="tk137-rank-name";team.textContent=r.name;const detail=document.createElement("small");detail.textContent=r.played+" trận · "+r.wins+" thắng · "+r.losses+" thua · HS set "+(r.setsFor-r.setsAgainst)+" · HS điểm "+(r.pointsFor-r.pointsAgainst);row.append(rank,team,detail);table.appendChild(row)});box.appendChild(table)})} function render(){
  scheduled=false;
  schedule.replaceChildren();
  const events=Object.values(store.matches||{}).filter(x=>x&&typeof x==="object").sort((a,b)=>((a.date||"")+" "+(a.time||"")).localeCompare((b.date||"")+" "+(b.time||"")));
  const active=Object.entries(store.activeMatches||{}).filter(([,a])=>a && (a.started || store.matches?.[a.matchId]?.status==="LIVE"));
  const activeMatchIds=new Set(active.map(([,a])=>a.matchId));
  // Legacy matches may be LIVE without an activeMatches record; show the match
  // and recorded score rather than an empty Viewer. Do not synthesize scores.
  for(const m of events.filter(x=>x.status==="LIVE" && !activeMatchIds.has(x.id))){
   active.push([m.courtId||"match_"+m.id,{matchId:m.id,scoreA:m.scoreA,scoreB:m.scoreB,sets:m.sets,setIndex:m.setIndex,started:true}]);
  }
  const activeIds=new Set(active.map(([id])=>id));
  for(const [id,node] of liveNodes){
   if(!activeIds.has(id)){clearMedia(node);node.article.remove();liveNodes.delete(id)}
  }
  for(const [id,a] of active){
   const m=store.matches?.[a.matchId],court=store.courts?.[id]||{};
   const node=liveNodes.get(id)||createLiveNode(id);
   node.courtId=id;
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
   const court=store.courts?.[m.courtId]?.name||"";let winnerId="";if(["FINISHED","WALKOVER"].includes(String(m.status||"").toUpperCase())){const sets=Array.isArray(m.sets)?m.sets.filter(s=>s&&(s.a!=null||s.scoreA!=null)&&(s.b!=null||s.scoreB!=null)):[];let wa=0,wb=0;if(sets.length){sets.forEach(s=>{const a=Number(s.a??s.scoreA??0),b=Number(s.b??s.scoreB??0);if(a>b)wa++;else if(b>a)wb++})}else if(m.scoreA!=null||m.scoreB!=null){const a=Number(m.scoreA||0),b=Number(m.scoreB||0);if(a>b)wa=1;else if(b>a)wb=1}winnerId=wa>wb?m.teamAId:wb>wa?m.teamBId:""}const winnerName=winnerId?name(winnerId):"";
   card(schedule,matchName(m),[safeDate(m.date),String(m.time||""),String(m.code||""),court,prettyStatus(m.status)].filter(Boolean).join(" · "),matchScoreSummary(m),winnerName);
  }
  if(!events.length)card(schedule,"Chưa có lịch thi đấu","Lịch sẽ xuất hiện khi ban tổ chức công bố.");
  renderStandings();
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
