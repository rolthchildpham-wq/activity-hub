import {ref,onValue,get,type Database} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {canAccess,isBlocked} from '$lib/platform-policy';
import type {SportKey} from '$lib/domain';
const roots:Record<Exclude<SportKey,'vlog'>,string>={
 badminton:'topkey_badminton_vnext_2026',football:'topkey_football_vnext_2026',
 volleyball:'topkey_volleyball_vnext_2026',running:'topkey_running_vnext_2026',
 handmade:'topkey_handmade_vnext_2026',shuttle:'topkey_shuttle_vnext_2026',
 cooking:'topkey_cooking_vnext_2026'
};
const AUTH_ROOT='topkey_badminton_vnext_2026/users/';
export function listenLimitedBranch<T>(
 db:Database,sport:SportKey,tid:string,branch:'finance'|'audit',
 onData:(data:Record<string,T>)=>void,onError:(message:string)=>void
):()=>void{
 if(sport==='vlog'||!/^[A-Za-z0-9_-]{1,100}$/.test(tid)){
  onError('Mã giải hoặc bộ môn không hợp lệ');
  return ()=>{};
 }
 const user=getAuth(db.app).currentUser;
 if(!user||user.isAnonymous){
  onError('Cần đăng nhập TOPKEY trước khi đọc dữ liệu nhạy cảm.');
  return ()=>{};
 }
 let stopped=false,branchStop:(()=>void)|undefined,profileStop:(()=>void)|undefined;
 const cleanup=()=>{if(stopped)return;stopped=true;branchStop?.();profileStop?.()};
 const fail=(message:string)=>{if(stopped)return;cleanup();onError(message)};
 const profileRef=ref(db,AUTH_ROOT+user.uid);
 const start=()=>{
  if(stopped||branchStop)return;
  branchStop=onValue(ref(db,roots[sport]+'/tournaments/'+tid+'/'+branch),snap=>{
   if(stopped)return;
   const raw=snap.val();
   onData(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{});
  },err=>fail(err.message));
 };
 get(profileRef).then(snapshot=>{
  if(stopped)return;
  const profile=snapshot.val();
  if(isBlocked(profile)||!canAccess(profile,sport)){
   fail('Tài khoản không có quyền truy cập dữ liệu '+branch+' của môn '+sport+'.');
   return;
  }
  start();
 }).catch(error=>fail('Không xác minh được quyền đọc '+branch+': '+(error instanceof Error?error.message:String(error))));
 profileStop=onValue(profileRef,snapshot=>{
  if(stopped)return;
  const profile=snapshot.val();
  if(isBlocked(profile)||!canAccess(profile,sport)){
   fail('Quyền truy cập dữ liệu '+branch+' của môn '+sport+' đã bị thu hồi.');
  }
 },error=>fail(error.message));
 return cleanup;
}
