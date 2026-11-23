export const sports = [
 {key:'football',name:'Bóng đá',icon:'⚽',legacy:'sports/vnext/index.html?sport=football'},
 {key:'badminton',name:'Cầu lông',icon:'🏸',legacy:'sports/badminton/index.html'},
 {key:'volleyball',name:'Bóng chuyền',icon:'🏐',legacy:'sports/vnext/index.html?sport=volleyball'},
 {key:'running',name:'Chạy bộ',icon:'🏃',legacy:'sports/vnext/index.html?sport=running'},
 {key:'handmade',name:'DIY / Handmade',icon:'🎨',legacy:'sports/vnext/index.html?sport=handmade'},
 {key:'vlog',name:'Vlog 2026',icon:'🎬',legacy:'sports/diy-vlog/index.html'},
 {key:'shuttle',name:'Đá cầu',icon:'🪶',legacy:'sports/vnext/index.html?sport=shuttle'},
 {key:'cooking',name:'Nấu ăn',icon:'🍳',legacy:'sports/vnext/index.html?sport=cooking'}
] as const;
export type SportKey = (typeof sports)[number]['key'];
export type Match = {id?:string;code?:string;teamAId?:string;teamBId?:string;status?:string;stage?:string;category?:string;group?:string;groupId?:string;groupName?:string;date?:string;time?:string;scoreA?:number;scoreB?:number};
export type Team = {id?:string;name?:string;checkedIn?:boolean};
export type TournamentSnapshot = { teams:Record<string,Team>; matches:Record<string,Match>; activeMatches:Record<string,{matchId?:string;started?:boolean;finished?:boolean}>; config:Record<string,unknown> };
export const completed = new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
export function summarize(s:TournamentSnapshot) {
 const teams=Object.values(s.teams), matches=Object.values(s.matches),active=Object.values(s.activeMatches);
 const live = new Set(matches.filter(m=>m.status==='LIVE').map(m=>m.id).filter(Boolean));
 for(const a of active)if(a.started&&!a.finished&&a.matchId)live.add(a.matchId);
 return {teams:teams.length,checkedIn:teams.filter(t=>t.checkedIn===true).length,scheduled:matches.length,live:live.size,completed:matches.filter(m=>completed.has(m.status||'')).length};
}
export function groupPhases(matches:Record<string,Match>) {
 const groups=new Map<string,{name:string;done:number;total:number}>();
 for (const m of Object.values(matches)) {
   const name=String(m.groupName||m.groupId||m.group||m.stage||'Chưa phân giai đoạn');
   const key=String(m.category||'')+' / '+name;
   const g=groups.get(key)||{name:key,done:0,total:0};g.total++;if(completed.has(m.status||''))g.done++;groups.set(key,g);
 }
 return [...groups.values()];
}
export function legacyHref(s:SportKey){return '../'+sports.find(x=>x.key===s)!.legacy;}
export const isTestLab=(tid:string)=>tid.startsWith('__testlab_');
