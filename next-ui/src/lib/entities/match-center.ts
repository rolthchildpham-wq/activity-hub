import type {Match,Team} from '../domain.ts';
import {completed} from '../domain.ts';
export type TeamRecord={played:number;won:number;drawn:number;lost:number;pointsFor:number;pointsAgainst:number};
const blank=():TeamRecord=>({played:0,won:0,drawn:0,lost:0,pointsFor:0,pointsAgainst:0});
const score=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null;
export function headToHead(matches:Record<string,Match>|null|undefined,teams:Record<string,Team>|null|undefined,teamAId:string,teamBId:string){
 const a=blank(),b=blank();let meetings=0;
 if(!teamAId||!teamBId||teamAId===teamBId)return {a,b,meetings,available:false};
 for(const match of Object.values(matches??{})){
  if(!match||typeof match!=='object'||!completed.has(String(match.status||'').toUpperCase()))continue;
  const x=score(match.scoreA),y=score(match.scoreB);if(x===null||y===null)continue;
  const direct=match.teamAId===teamAId&&match.teamBId===teamBId,reverse=match.teamAId===teamBId&&match.teamBId===teamAId;
  if(!direct&&!reverse)continue;meetings++;
  const pointsA=direct?x:y,pointsB=direct?y:x;
  a.played++;b.played++;a.pointsFor+=pointsA;a.pointsAgainst+=pointsB;b.pointsFor+=pointsB;b.pointsAgainst+=pointsA;
  if(pointsA>pointsB){a.won++;b.lost++}else if(pointsB>pointsA){b.won++;a.lost++}else{a.drawn++;b.drawn++}
 }
 return {a,b,meetings,available:meetings>0};
}
export function matchScoreLabel(match:Match):string{const a=score(match.scoreA),b=score(match.scoreB);return a===null&&b===null?'—':(a===null?'—':String(a))+' : '+(b===null?'—':String(b))}
export function matchStatusLabel(status?:string):string{
 const key=String(status||'SCHEDULED').toUpperCase();
 const labels:Record<string,string>={LIVE:'ĐANG LIVE',IN_PROGRESS:'ĐANG THI ĐẤU',SCHEDULED:'SẮP DIỄN RA',PENDING:'CHỜ THI ĐẤU',FINISHED:'KẾT THÚC',WALKOVER:'BỎ CUỘC',RETIRED:'DỪNG TRẬN',DISQUALIFIED:'BỊ LOẠI'};
 return labels[key]||key;
}
