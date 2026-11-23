import {ref,onValue,query,orderByKey,limitToLast,type Database} from 'firebase/database';
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
 // Finance totals must include EVERY entry. The audit trail is a bounded view.
 const target=branch==='audit'?query(node,orderByKey(),limitToLast(200)):node;
 return onValue(target,snap=>{
  const raw=snap.val();
  onData(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{});
 },err=>onError(err.message));
}
