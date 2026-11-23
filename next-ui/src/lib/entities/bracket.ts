import type {Match} from '$lib/domain';
export type BracketRound={name:string;stage:string;matches:Array<Match&{id:string}>};
const rounds=['GROUP','ROUND_ROBIN','GROUP_STAGE','R64','R32','R16','QF','SF','F','FINAL'];
const rank=(stage:string)=>{const n=rounds.indexOf(stage.toUpperCase());return n<0?999:n};
export function bracketRounds(records:Record<string,Match>|null|undefined):BracketRound[]{
 const map=new Map<string,BracketRound>();
 for(const [id,m] of Object.entries(records??{})){
  if(!m||typeof m!=='object')continue;
  const stage=String(m.stage||'Chưa phân vòng');
  const group=String(m.groupName||m.groupId||m.group||'');
  const category=String(m.category||'');
  const key=[category,stage,group].filter(Boolean).join(' · ');
  if(!map.has(key))map.set(key,{name:key,stage,matches:[]});
  map.get(key)!.matches.push({...m,id});
 }
 for(const group of map.values())group.matches.sort((a,b)=>(a.code||a.id).localeCompare(b.code||b.id));
 return [...map.values()].sort((a,b)=>rank(a.stage)-rank(b.stage)||a.name.localeCompare(b.name));
}
