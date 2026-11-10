(() => {
  'use strict'; const T=window.Topkey, U=T.U;
  T.Scoring={
    isSetWon(a,b,rules){const t=Number(rules.points)||21, cap=Number(rules.cap)||30, by=Number(rules.winBy)||2; return (Math.max(a,b)>=t&&Math.abs(a-b)>=by)||a>=cap||b>=cap;},
    setsWon(sets){return (sets||[]).reduce((o,s)=>{if(s.finished){if(s.a>s.b)o.a++;else if(s.b>s.a)o.b++;}return o},{a:0,b:0});},
    winner(sets,rules){const w=this.setsWon(sets), need=Math.ceil((Number(rules.bestOf)||3)/2); return w.a>=need?'A':w.b>=need?'B':null;},
    initial(match,rules){return {matchId:match.id,courtId:match.courtId||'',teamAId:match.teamAId,teamBId:match.teamBId,sets:[{a:0,b:0,finished:false}],setIndex:0,serverSide:'A',serverPlayer:'p1',positions:{A:{p1:'right',p2:'left'},B:{p1:'right',p2:'left'}},started:false,finished:false,sideSwapped:false,version:1,updatedAt:Date.now()};},
    point(state,side,delta,rules){
      const s=U.clone(state), set=s.sets[s.setIndex]; if(!s.started||s.finished)throw new Error('Trận chưa bắt đầu hoặc đã kết thúc');
      const before={a:set.a,b:set.b,serverSide:s.serverSide,serverPlayer:s.serverPlayer}; set[side==='A'?'a':'b']=Math.max(0,Math.min(Number(rules.cap)||30,set[side==='A'?'a':'b']+delta));
      if(delta>0){ if(s.serverSide===side){ const team=s.positions[side]; [team.p1,team.p2]=[team.p2,team.p1]; } else { s.serverSide=side; const score=set[side==='A'?'a':'b']; const wanted=score%2===0?'right':'left'; s.serverPlayer=s.positions[side].p1===wanted?'p1':'p2'; } }
      set.finished=this.isSetWon(set.a,set.b,rules); const win=this.winner(s.sets,rules); if(win){s.finished=true;s.winnerSide=win;} s.version=(s.version||0)+1;s.updatedAt=Date.now(); return {state:s,before,after:{a:set.a,b:set.b,serverSide:s.serverSide,serverPlayer:s.serverPlayer},setFinished:set.finished,matchFinished:s.finished};
    },
    nextSet(state){const s=U.clone(state); if(!s.sets[s.setIndex]?.finished)throw new Error('Set hiện tại chưa kết thúc'); if(s.finished)return s; s.setIndex++; s.sets[s.setIndex]={a:0,b:0,finished:false}; s.sideSwapped=false; s.version++; return s;}
  };
})();