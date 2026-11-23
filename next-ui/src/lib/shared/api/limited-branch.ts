import {ref,onValue,type Database} from 'firebase/database';
import type {SportKey} from '$lib/domain';
const roots:Record<Exclude<SportKey,'vlog'>,string>={
 badminton:'topkey_badminton_vnext_2026',football:'topkey_football_vnext_2026',
 volleyball:'topkey_volleyball_vnext_2026',running:'topkey_running_vnext_2026',
 handmade:'topkey_handmade_vnext_2026',shuttle:'topkey_shuttle_vnext_2026',cooking:'topkey_cooking_vnext_2026'
};
export function listenLimitedBranch<T>(
 db:Database,sport:SportKey,tid:string,branch:'finance'|'audit',
 onData:(data:Record<string,T>)=>void,onError:(message:string)=>void
):()=>void{
 if(sport==='vlog'||!/^[A-Za-z0-9_-]{1,100}$/.test(tid)){
  onError('Mã giải hoặc bộ môn không hợp lệ');
  return ()=>{};
 }
 const location=roots[sport]+'/tournaments/'+tid+'/'+branch;
 const node=ref(db,location);
 // Both branches use the same snapshot semantics as the live TOPKEY client.
 // Audit is sorted by clientAt and bounded in the UI; ordering random keys
 // before limiting can omit the latest events.
 return onValue(node,snap=>{
  const raw=snap.val();
  onData(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{});
 },err=>onError(err.message));
}
