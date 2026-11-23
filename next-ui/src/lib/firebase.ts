import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth,type Auth} from 'firebase/auth';
import {getDatabase,ref,onValue,type Database} from 'firebase/database';
import type {SportKey,TournamentSnapshot} from './domain';
import {emptyTournament} from './domain';

// Firebase client keys identify the public Firebase project, not an admin secret.
// Existing configuration is retained to avoid breaking the connected competition.
const config={
 apiKey:'AIzaSyBSr7buP3bMf6HTg_YDWH_Xk5aNhyvfSRg',
 authDomain:'topkey-badminton.firebaseapp.com',
 databaseURL:'https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app',
 projectId:'topkey-badminton',
 storageBucket:'topkey-badminton.firebasestorage.app',
 messagingSenderId:'907878800245',
 appId:'1:907878800245:web:aa77e4846656a0ba84913c'
};
const ROOTS:Record<Exclude<SportKey,'vlog'>,string>={
 badminton:'topkey_badminton_vnext_2026',
 football:'topkey_football_vnext_2026',
 volleyball:'topkey_volleyball_vnext_2026',
 running:'topkey_running_vnext_2026',
 handmade:'topkey_handmade_vnext_2026',
 shuttle:'topkey_shuttle_vnext_2026',
 cooking:'topkey_cooking_vnext_2026'
};
const BRANCHES=['config','teams','matches','activeMatches'] as const;
const INITIAL_LOAD_TIMEOUT_MS=10_000;

export function client():{auth:Auth;db:Database}{
 const app=getApps().length?getApp():initializeApp(config);
 return {auth:getAuth(app),db:getDatabase(app)};
}

export function listenTournament(
 db:Database,sport:SportKey,tid:string,
 onData:(value:TournamentSnapshot)=>void,
 onError:(error:Error)=>void
):()=>void {
 if(sport==='vlog') {
  onError(new Error('Vlog có module riêng. Vui lòng sử dụng đường dẫn Vlog hiện tại.'));
  return ()=>{};
 }
 if(!/^[A-Za-z0-9_-]{1,100}$/.test(tid)) {
  onError(new Error('Mã giải không hợp lệ.'));
  return ()=>{};
 }

 // TOPKEY RTDB rules allow individual branch reads but NOT the parent node.
 // A blank branch still emits its initial Firebase onValue(null) snapshot.
 const next=emptyTournament();
 const received=new Set<string>();
 const off:(()=>void)[]=[];
 let stopped=false;
 let timeout:ReturnType<typeof setTimeout>|undefined;
 const cleanup=()=>{
  if(stopped)return;
  stopped=true;
  if(timeout!==undefined)clearTimeout(timeout);
  off.forEach(unsubscribe=>unsubscribe());
 };
 const fail=(error:Error)=>{if(stopped)return;cleanup();onError(error)};
 const publish=()=>{
  if(stopped||received.size!==BRANCHES.length)return;
  if(timeout!==undefined)clearTimeout(timeout);
  // Only complete initial snapshots can be presented as trusted statistics.
  onData({...next});
 };
 timeout=setTimeout(()=>{
  const missing=BRANCHES.filter(branch=>!received.has(branch));
  if(missing.length)fail(new Error('Quá thời gian đồng bộ: '+missing.join(', ')+'. Không dùng số 0 thay cho dữ liệu chưa tải.'));
 },INITIAL_LOAD_TIMEOUT_MS);

 for(const branch of BRANCHES){
  if(stopped)break;
  const location=ROOTS[sport]+'/tournaments/'+tid+'/'+branch;
  const stop=onValue(ref(db,location),snapshot=>{
   if(stopped)return;
   const raw=snapshot.val();
   // Discard invalid Firebase branch shapes to prevent rendering exceptions.
   const value=raw && typeof raw==='object'&&!Array.isArray(raw)?raw:{};
   if(branch==='config')next.config=value;
   else if(branch==='teams')next.teams=value;
   else if(branch==='matches')next.matches=value;
   else next.activeMatches=value;
   received.add(branch);
   publish();
  },error=>fail(error));
  off.push(stop);
 }
 return cleanup;
}
