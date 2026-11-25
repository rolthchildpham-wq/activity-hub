type Match= {teamAId?:string;teamBId?:string;status?:string;scoreA?:number;scoreB?:number;date?:string};
type Team= {name?:string};
const completed=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const valid=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
const dateKey=(value:unknown)=>{const raw=String(value??'').trim();const iso=raw.match(/^(\d{4}-\d{2}-\d{2})/);if(iso)return iso[1];const d=raw.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);return d?d[3]+'-'+d[2].padStart(2,'0')+'-'+d[1].padStart(2,'0'):'Chưa có ngày'};
export type TeamAnalytics={id:string;name:string;played:number;won:number;drawn:number;lost:number;pointsFor:number;pointsAgainst:number;winRate:number};
export function buildSportsAnalytics(matches:Record<string,Match>|null|undefined,teams:Record<string,Team>|null|undefined){
 const records=new Map<string,TeamAnalytics>();
 for(const [id,team] of Object.entries(teams??{}))if(team&&typeof team==='object')records.set(id,{id,name:String(team.name||id),played:0,won:0,drawn:0,lost:0,pointsFor:0,pointsAgainst:0,winRate:0});
 const statuses=new Map<string,number>();const days=new Map<string,{date:string,total:number,completed:number,live:number}>();
 let scoredCompleted=0,totalPoints=0;
 for(const match of Object.values(matches??{})){
  if(!match||typeof match!=='object')continue;
  const status=String(match.status||'SCHEDULED').toUpperCase();statuses.set(status,(statuses.get(status)||0)+1);
  const date=dateKey(match.date);const day=days.get(date)||{date,total:0,completed:0,live:0};day.total++;
  if(completed.has(status))day.completed++;if(status==='LIVE'||status==='IN_PROGRESS')day.live++;days.set(date,day);
  if(!completed.has(status)||!valid(match.scoreA)||!valid(match.scoreB))continue;
  const a=records.get(match.teamAId||''),b=records.get(match.teamBId||'');if(!a||!b)continue;
  const x=match.scoreA as number,y=match.scoreB as number;a.played++;b.played++;a.pointsFor+=x;a.pointsAgainst+=y;b.pointsFor+=y;b.pointsAgainst+=x;scoredCompleted++;totalPoints+=x+y;
  if(x>y){a.won++;b.lost++}else if(y>x){b.won++;a.lost++}else{a.drawn++;b.drawn++}
 }
 const teamRecords=[...records.values()].map(t=>({...t,winRate:t.played?Math.round(100*t.won/t.played):0})).sort((a,b)=>b.winRate-a.winRate||b.won-a.won||b.pointsFor-a.pointsFor||a.name.localeCompare(b.name));
 const activity=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
 const statusDistribution=[...statuses.entries()].map(([status,count])=>({status,count}));
 return {teams:records.size,matches:Object.values(matches??{}).filter(m=>!!m&&typeof m==='object').length,scoredCompleted,totalPoints,teamRecords,activity,statusDistribution};
}
