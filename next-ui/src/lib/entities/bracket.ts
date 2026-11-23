import type {Match} from '$lib/domain';
export type BracketRound={name:string;matches:Array<Match&{id:string}>};
const rounds=['R64','R32','R16','QF','SF','F','FINAL'];
export function bracketRounds(records:Record<string,Match>|null|undefined):BracketRound[]{
 const map=new Map<string,BracketRound>();
 for(const [id,m] of Object.entries(records??{})){
  if(!m||typeof m!=='object')continue;
  const key=m.stage||m.group||'Chưa phân vòng';
  if(!map.has(key))map.set(key,{name:key,matches:[]});
  map.get(key)!.matches.push({...m,id});
 }
 for(const group of map.values())group.matches.sort((a,b)=>(a.code||a.id).localeCompare(b.code||b.id));
 return [...map.values()].sort((a,b)=>{
  const ai=rounds.indexOf(a.name.toUpperCase()),bi=rounds.indexOf(b.name.toUpperCase());
  return (ai<0?999:ai)-(bi<0?999:bi)||a.name.localeCompare(b.name);
 });
}
