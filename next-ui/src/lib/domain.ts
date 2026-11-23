export const sports = [
 {key:'football',name:'Bóng đá',icon:'⚽',legacy:'sports/vnext/index.html?sport=football'},
 {key:'badminton',name:'Cầu lông',icon:'🏸',legacy:'sports/badminton/index.html'},
 {key:'volleyball',name:'Bóng chuyền',icon:'🏐',legacy:'sports/vnext/index.html?sport=volleyball'},
 {key:'running',name:'Chạy bộ',icon:'🏃',legacy:'sports/vnext/index.html?sport=running'},
 {key:'handmade',name:'DIY / Handmade',icon:'🎨',legacy:'sports/vnext/index.html?sport=handmade'},
 {key:'vlog',name:'Vlog 2026',icon:'🎬',legacy:'sports/diy-vlog/index.html'},
 {key:'shuttle',name:'Đá cầu',icon:'🪶',legacy:'sports/vnext/index.html?sport=shuttle'},
 {key:'cooking',name:'Nấu ăn',icon:'🍳',legacy:'sports/vnext/index.html?sport=cooking'}
] as const satisfies ReadonlyArray<{key:string;name:string;icon:string;legacy:string}>;

export type SportKey = (typeof sports)[number]['key'];
export type Match = {
 id?:string;code?:string;teamAId?:string;teamBId?:string;
 status?:string;stage?:string;category?:string;group?:string;groupId?:string;
 groupName?:string;date?:string;time?:string;scoreA?:number;scoreB?:number;
};
export type Team = {id?:string;name?:string;checkedIn?:boolean};
export type ActiveMatch = {matchId?:string;started?:boolean;finished?:boolean};
export type TournamentConfig = {title?:string;[key:string]:unknown};
export type TournamentSnapshot = {
 teams:Record<string,Team>;
 matches:Record<string,Match>;
 activeMatches:Record<string,ActiveMatch>;
 config:TournamentConfig;
};
export const emptyTournament = ():TournamentSnapshot=>({teams:{},matches:{},activeMatches:{},config:{}});
export const completed = new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);

const validValues = <T>(records:Record<string,T>|null|undefined):T[] =>
 Object.values(records ?? {}).filter((value):value is T=>value!==null&&typeof value==='object');

export function summarize(s:TournamentSnapshot) {
 const teams=validValues(s.teams),matches=validValues(s.matches),active=validValues(s.activeMatches);
 const live=new Set<string>();
 for(const [key,m] of Object.entries(s.matches ?? {})){
  if(m && (m.status==='LIVE'||m.status==='IN_PROGRESS')) live.add(m.id||key);
 }
 for(const a of active)if(a.started&&!a.finished&&a.matchId)live.add(a.matchId);
 return {
  teams:teams.length,checkedIn:teams.filter(t=>t.checkedIn===true).length,
  scheduled:matches.length,live:live.size,
  completed:matches.filter(m=>completed.has(m.status??'')).length
 };
}
export function groupPhases(matches:Record<string,Match>|null|undefined) {
 const groups=new Map<string,{name:string;done:number;total:number}>();
 for(const m of validValues(matches)){
  const name=String(m.groupName||m.groupId||m.group||m.stage||'Chưa phân giai đoạn');
  const key=String(m.category||'')+' / '+name;
  const g=groups.get(key)??{name:key,done:0,total:0};
  g.total++;
  if(completed.has(m.status??''))g.done++;
  groups.set(key,g);
 }
 return [...groups.values()];
}
// SvelteKit is mounted at /next/ in the same TOPKEY host.
export function legacyHref(s:SportKey):string {
 const sport=sports.find(x=>x.key===s);
 if(!sport)throw new Error('Unknown sport: '+s);
 return '../'+sport.legacy;
}
export const isTestLab=(tid:string)=>tid.startsWith('__testlab_');
