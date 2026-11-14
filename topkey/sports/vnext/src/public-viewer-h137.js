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
 let scheduled=false;
 function tell(message,error=false){status.textContent=message;status.classList.toggle("tk137-error",error)}
 function safeDate(s){return String(s||"").replace(/[^0-9-]/g,"").slice(0,10)}
 function name(id){return String(store.teams?.[id]?.name||id||"—")}
 function matchName(m){if(!m)return "—";const a=name(m.teamAId),b=m.teamBId?name(m.teamBId):"";return b?a+" vs "+b:a}
 function prettyStatus(s){return ({SCHEDULED:"Chưa thi đấu",CHECK_IN:"Điểm danh",READY:"Sẵn sàng",CALLED:"Đã gọi",LIVE:"Đang thi đấu",SUSPENDED:"Tạm dừng",FINISHED:"Đã kết thúc",WALKOVER:"Bỏ cuộc",CANCELLED:"Đã hủy"})[s]||String(s||"Chưa cập nhật")}
 function card(parent,primary,secondary){const el=document.createElement("article");el.className="tk137-item";const heading=document.createElement("strong");heading.textContent=primary;el.appendChild(heading);const note=document.createElement("small");note.textContent=secondary;el.appendChild(note);parent.appendChild(el)}
 function render(){
  scheduled=false;
  schedule.replaceChildren();live.replaceChildren();
  const events=Object.values(store.matches||{}).filter(x=>x&&typeof x==="object").sort((a,b)=>((a.date||"")+" "+(a.time||"")).localeCompare((b.date||"")+" "+(b.time||"")));
  const active=Object.values(store.activeMatches||{}).filter(Boolean);
  for(const a of active){const m=store.matches?.[a.matchId];card(live,matchName(m),[String(m?.code||""),prettyStatus(m?.status||"LIVE")].filter(Boolean).join(" · "))}
  if(!active.length)card(live,"Chưa có trận đang diễn ra","Các trận LIVE sẽ xuất hiện tại đây khi BTC bắt đầu.");
  for(const m of events.slice(0,150)){
    const court=store.courts?.[m.courtId]?.name||"";
    card(schedule,matchName(m),[safeDate(m.date),String(m.time||""),String(m.code||""),court,prettyStatus(m.status)].filter(Boolean).join(" · "));
  }
  if(!events.length)card(schedule,"Chưa có lịch thi đấu","Lịch sẽ xuất hiện khi ban tổ chức công bố.");
  if(loaded.has("matches"))tell("Đã kết nối lịch thi đấu · "+events.length+" trận");
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
