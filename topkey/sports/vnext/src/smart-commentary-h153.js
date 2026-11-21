/* H153 - Badminton-inspired smart score commentary for football & volleyball.
   No duplicate Firebase writes; existing app.comment() remains the transport.
   Important: scores are read from the last committed scoring snapshot.
*/
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE || window.TopkeySmartBLVH153) return;
  const modes = {SMART:3, FULL:1, QUIET:5, MANUAL:0};
  const key = 'topkey_h153_score_commentary_mode';
  const previous = new Map();
  const $ = id => document.getElementById(id);
  function format(s, m, getTeamName, sport, mode='SMART', previousState) {
    if (!s || !m || !['score','sets'].includes(sport)) return '';
    const sets=sport==='sets', i=Number(s.setIndex)||0;
    const set=sets?s.sets?.[i]:null;
    if (sets&&!set) return '';
    const scoreA=Number(sets?set.a:s.scoreA)||0;
    const scoreB=Number(sets?set.b:s.scoreB)||0;
    const last=previousState||(Array.isArray(s.history)?s.history[s.history.length-1]:null);
    const previousSet=sets?(Array.isArray(last)?last[i]:last?.sets?.[i]):last;
    const a0=Number(sets?previousSet?.a:previousSet?.scoreA);
    const b0=Number(sets?previousSet?.b:previousSet?.scoreB);
    const hasBefore=Number.isFinite(a0)&&Number.isFinite(b0);
    const diffA=hasBefore?scoreA-a0:0,diffB=hasBefore?scoreB-b0:0;
    const scoringSide=diffA>0&&diffB<=0?'A':diffB>0&&diffA<=0?'B':null;
    const scorer=scoringSide==='A'?'A':scoringSide==='B'?'B':scoreA>=scoreB?'A':'B';
    const nameA=String(getTeamName(m.teamAId)||'Đội A').trim();
    const nameB=String(getTeamName(m.teamBId)||'Đội B').trim();
    const winnerName=scorer==='A'?nameA:nameB;
    const otherName=scorer==='A'?nameB:nameA;
    const own=scorer==='A'?scoreA:scoreB,opponent=scorer==='A'?scoreB:scoreA;
    const total=scoreA+scoreB;
    const first=sets&&total===1&&i>0;
    const lastLeader=hasBefore?(a0===b0?'':a0>b0?'A':'B'):'';
    const leader=scoreA===scoreB?'':scoreA>scoreB?'A':'B';
    const leadChange=!!lastLeader&&!!leader&&lastLeader!==leader;
    const tied=hasBefore&&scoreA===scoreB&&a0!==b0;
    const deuce=sets&&scoreA===scoreB&&scoreA>=19;
    const finished=sets&&!!set.finished&&scoringSide!==null;
    const previousFinished=!!previousSet?.finished;
    const finishNow=finished&&!previousFinished;
    const cadence=modes[mode]??modes.SMART;
    if (!scoringSide || cadence===0) return '';
    const important=finishNow||first||leadChange||tied||deuce;
    if(!important && total%cadence!==0)return '';
    const pair=`${winnerName} ${own}, ${otherName} ${opponent}.`;
    if(finishNow)return `Kết thúc set ${i+1}. ${pair}`;
    if(first)return `Bắt đầu set ${i+1}. ${pair}`;
    // Keep routine commentary concise: scoring team + own points first.
    // Deuce / lead change affect WHEN we speak, not a verbose prefix.
    if(deuce||leadChange)return pair;
    return pair;
  }
  function install(){
    const T=window.Topkey,app=T?.App;
    if (!app?.commentaryForScore || app.__h153Installed ||
        !['football','volleyball'].includes(T?.SPORT?.key)) return false;
    app.__h153Installed=true;
    let mode='FULL'; // Announce every scored point by default.
    try { localStorage.setItem(key, 'FULL'); } catch {}
    const select=document.createElement('select');
    select.id='tk153-density';
    select.setAttribute('aria-label','Mật độ bình luận tỷ số');
    for(const [value,text] of [
      ['SMART','Thông minh · điểm nổi bật & mỗi 3 điểm'],
      ['FULL','Đọc mỗi lần cộng điểm'],
      ['QUIET','Ít nói · mỗi 5 điểm & điểm nổi bật'],
      ['MANUAL','Chỉ đọc khi bấm nút thử']]){
      const opt=document.createElement('option');opt.value=value;opt.textContent=text;select.appendChild(opt);
    }
    select.value=mode;
    const wrap=document.createElement('label');wrap.className='field';wrap.id='tk153-density-control';
    wrap.textContent='Mật độ BLV';wrap.appendChild(select);
    const host=$('auto-commentary')?.closest('.card');
    if(host){
      const spot=$('auto-commentary')?.closest('.switch-line');
      if(spot)spot.after(wrap);else host.appendChild(wrap);
    }
    select.onchange=()=>{
      mode=select.value;
      try{localStorage.setItem(key,mode)}catch{}
    };
    const manual=document.createElement('button');
    manual.type='button';manual.id='tk153-speak-score';manual.className='btn';
    manual.textContent='🎙 Đọc tỷ số hiện tại';
    manual.onclick=()=>{
      const active=app.state?.activeMatches?.[app.currentCourt];
      const match=app.state?.matches?.[active?.matchId];
      if(!active||!match)return T.U?.toast?.('Chưa có trận đang chấm','info');
      const set=T.SPORT.mode==='sets'?active.sets?.[active.setIndex||0]:null;
      const a=Number(T.SPORT.mode==='sets'?set?.a:active.scoreA)||0;
      const b=Number(T.SPORT.mode==='sets'?set?.b:active.scoreB)||0;
      const history=active.history?.[active.history.length-1];
      const prev=T.SPORT.mode==='sets'?(Array.isArray(history)?history[active.setIndex||0]:history?.sets?.[active.setIndex||0]):history;
      const beforeA=Number(T.SPORT.mode==='sets'?prev?.a:prev?.scoreA);
      const beforeB=Number(T.SPORT.mode==='sets'?prev?.b:prev?.scoreB);
      const scorer=Number.isFinite(beforeB)&&b>beforeB&&!(a>beforeA)?'B':'A';
      const text=scorer==='B'
        ?`${app.teamName(match.teamBId)} ${b}, ${app.teamName(match.teamAId)} ${a}.`
        :`${app.teamName(match.teamAId)} ${a}, ${app.teamName(match.teamBId)} ${b}.`;
      app.speakCommentary?.({id:'tk153_manual_'+Date.now(),text,lang:'vi-VN'});
    };
    const testButton=$('commentary-test');
    if(testButton)testButton.after(manual);

    const original=app.commentaryForScore.bind(app);
    app.commentaryForScore=function(s) {
      if(!s)return '';
      const m=this.state.matches?.[s.matchId];
      if(!m)return original(s);
      const sport=T.SPORT.mode;
      if(!['score','sets'].includes(sport))return original(s);
      const matchKey=`${this.currentCourt||''}|${s.matchId}|${s.setIndex||0}`;
      const last=previous.get(matchKey);
      const lastHistory=Array.isArray(s.history)?s.history[s.history.length-1]:null;
      // Prefer history of the point just scored. The cache only covers legacy
      // paths that do not append history; do not infer from unrelated matches.
      const before=lastHistory||last;
      const text=format(s,m,id=>this.teamName(id),sport,mode,before);
      previous.set(matchKey,sport==='sets'?
        (s.sets||[]).map(x=>({a:x.a,b:x.b,finished:x.finished})):
        {scoreA:s.scoreA,scoreB:s.scoreB});
      return text;
    };
    return true;
  }
  if(!install()){
    window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
    window.addEventListener('topkey:admin-ready',install,{once:true});
  }
  window.TopkeySmartBLVH153={format,install,modes};
})();
