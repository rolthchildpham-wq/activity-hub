type Match= {teamAId?:string;teamBId?:string;status?:string;scoreA?:number;scoreB?:number;code?:string};
type Team= {name?:string};
const completed=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
export type BracketMatchView={id:string,teamAId:string,teamBId:string,teamAName:string,teamBName:string,scoreA:number|null,scoreB:number|null,winnerId:string|null,status:string,code:string};
const numberOrNull=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
export function bracketMatchView(id:string,match:Match,teams:Record<string,Team>|null|undefined):BracketMatchView{
 const scoreA=numberOrNull(match.scoreA),scoreB=numberOrNull(match.scoreB);
 const finished=completed.has(String(match.status||'').toUpperCase());
 const winnerId=finished&&scoreA!==null&&scoreB!==null&&scoreA!==scoreB?(scoreA>scoreB?String(match.teamAId||''):String(match.teamBId||''))||null:null;
 const teamAId=String(match.teamAId||''),teamBId=String(match.teamBId||'');
 return {id,teamAId,teamBId,teamAName:String(teams?.[teamAId]?.name||'Chưa xác định'),teamBName:String(teams?.[teamBId]?.name||'Chưa xác định'),scoreA,scoreB,winnerId,status:String(match.status||'SCHEDULED').toUpperCase(),code:String(match.code||id)};
}
export function bracketStatusLabel(status:string){
 return ({LIVE:'ĐANG LIVE',IN_PROGRESS:'ĐANG THI ĐẤU',SCHEDULED:'CHƯA ĐẤU',PENDING:'CHỜ ĐẤU',FINISHED:'HOÀN TẤT',WALKOVER:'BỎ CUỘC',RETIRED:'DỪNG TRẬN',DISQUALIFIED:'BỊ LOẠI'} as Record<string,string>)[status]||status;
}
