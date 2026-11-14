/* H134: additive admin match date/time editing. Shared VNext schedule, all sport modes.
 * Does not alter auth, score calculation, or spectator permissions. */
(()=>{"use strict";
  const tbody=document.getElementById("matches-list");
  if(!tbody||window.__tkH134DateEditor)return;
  window.__tkH134DateEditor=true;
  const getTopkey=()=>window.Topkey;
  const admin=()=>{try{return String(getTopkey()?.Auth?.role?.()||"").toUpperCase()==="ADMIN"}catch{return false}};
  const findMatch=code=>{
    const matches=getTopkey()?.App?.state?.matches||{};
    return Object.values(matches).find(m=>String(m?.code||"")===code);
  };
  const format=v=>String(v||"").trim();
  let pending=false;
  const decorate=()=>{
    pending=false;
    if(!admin())return;
    tbody.querySelectorAll("tr").forEach(row=>{
      if(row.querySelector(".tk134-date-edit"))return;
      const cells=[...row.children].filter(c=>c.tagName==="TD");
      if(cells.length<4)return;
      const code=format(cells[0].textContent);
      if(!/^[A-Z]{1,3}\d{2,}$/.test(code))return;
      const match=findMatch(code);
      if(!match?.id)return;
      const button=document.createElement("button");
      button.type="button";
      button.className="btn mini tk134-date-edit";
      button.textContent="✎ Sửa ngày / giờ";
      button.setAttribute("aria-label","Sửa ngày và giờ trận "+code);
      button.dataset.matchId=String(match.id);
      cells[3].appendChild(button);
    });
  };
  const requestDecorate=()=>{
    if(pending)return;
    pending=true;
    queueMicrotask(decorate);
  };
  function openEditor(matchId){
    if(!admin())return;
    const tk=getTopkey(),m=tk?.App?.state?.matches?.[matchId];
    if(!m||!tk?.Data?.queueSet){tk?.U?.toast?.("Không thể tải trận đấu, hãy tải lại trang.","err");return}
    if(document.getElementById("tk134-editor-modal"))return;
    const root=document.createElement("div");
    root.id="tk134-editor-modal";root.className="tk134-modal";
    root.innerHTML='<form class="tk134-dialog" aria-label="Sửa ngày giờ thi đấu"><h2>📅 Sửa lịch thi đấu</h2><p class="tk134-help"></p><label>Ngày thi đấu<input type="date" name="date" required></label><label>Giờ bắt đầu<input type="time" name="time" required></label><p class="tk134-error" role="alert" hidden></p><div class="tk134-actions"><button type="button" class="btn tk134-close">Hủy</button><button type="submit" class="btn primary tk134-save">Lưu thay đổi</button></div></form>';
    const form=root.querySelector("form"),date=form.elements.date,time=form.elements.time;
    form.querySelector(".tk134-help").textContent=String(m.code||"")+" · "+(tk.App.matchLabel?.(m)||"");
    date.value=/^\d{4}-\d{2}-\d{2}$/.test(m.date||"")?m.date:"";
    time.value=/^\d{2}:\d{2}$/.test(m.time||"")?m.time:"17:15";
    const close=()=>root.remove();
    root.querySelector(".tk134-close").addEventListener("click",close);
    root.addEventListener("click",e=>{if(e.target===root)close()});
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      if(!admin()){close();return}
      const valueDate=date.value,valueTime=time.value;
      const error=root.querySelector(".tk134-error");
      if(!/^\d{4}-\d{2}-\d{2}$/.test(valueDate)||!/^\d{2}:\d{2}$/.test(valueTime)){error.hidden=false;error.textContent="Ngày hoặc giờ không hợp lệ.";return}
      const fresh=tk.App?.state?.matches?.[matchId];if(!fresh){error.hidden=false;error.textContent="Trận đấu không còn tồn tại.";return}
      if(["LIVE","FINISHED","WALKOVER","RETIRED","DISQUALIFIED"].includes(fresh.status)){
        error.hidden=false;error.textContent="Không đổi lịch trận đã bắt đầu hoặc có kết quả.";return;
      }
      const save=root.querySelector(".tk134-save");save.disabled=true;save.textContent="Đang lưu...";
      const after={...fresh,date:valueDate,time:valueTime,updatedAt:Date.now()};
      try{
        await tk.Data.queueSet("matches/"+matchId,after,{type:"MATCH_RESCHEDULE_MANUAL"});
        try{await tk.Data.audit?.("RESCHEDULE","event",matchId,fresh,after)}catch(e){console.warn("Schedule audit",e)}
        tk.U?.toast?.("Đã lưu ngày và giờ thi đấu.","ok");
        close();
      }catch(err){
        error.hidden=false;error.textContent="Lưu thất bại: "+(err?.message||"Kiểm tra kết nối");
        save.disabled=false;save.textContent="Lưu thay đổi";
      }
    });
    document.body.appendChild(root);
    date.focus();
  }
  tbody.addEventListener("click",e=>{
    const button=e.target.closest?.(".tk134-date-edit");
    if(button&&tbody.contains(button)){e.preventDefault();openEditor(button.dataset.matchId)}
  });
  new MutationObserver(requestDecorate).observe(tbody,{childList:true,subtree:true});
  window.addEventListener("topkey:admin-ready",requestDecorate,{passive:true});
  window.addEventListener("hashchange",requestDecorate,{passive:true});
  if(window.__TOPKEY_VNEXT_BOOT?.then)window.__TOPKEY_VNEXT_BOOT.then(requestDecorate).catch(()=>{});
  requestDecorate();
  // The role can be resolved after the initial table paint.
  const tick=setInterval(()=>{if(!document.isConnected){clearInterval(tick);return}if(admin())requestDecorate()},5000);
})();
