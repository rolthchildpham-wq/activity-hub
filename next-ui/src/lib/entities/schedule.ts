import type {Match} from '$lib/domain';
export type DatedMatch=Match&{id:string};
export function byDate(records:Record<string,Match>|null|undefined){
 const all=Object.entries(records??{}).filter((v):v is [string,Match]=>!!v[1]&&typeof v[1]==='object').map(([id,m])=>({...m,id}));
 all.sort((a,b)=>((a.date||'9999')+' '+(a.time||'')).localeCompare((b.date||'9999')+' '+(b.time||'')));
 const groups=new Map<string,DatedMatch[]>();
 for(const m of all){const k=m.date||'Chưa xếp ngày';if(!groups.has(k))groups.set(k,[]);groups.get(k)!.push(m)}
 return [...groups].map(([date,matches])=>({date,matches}));
}
