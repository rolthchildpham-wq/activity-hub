import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth,type Auth} from 'firebase/auth';
import {getDatabase,ref,onValue,type Database} from 'firebase/database';
import type {SportKey,TournamentSnapshot} from './domain';
const config={apiKey:'AIzaSyBSr7buP3bMf6HTg_YDWH_Xk5aNhyvfSRg',authDomain:'topkey-badminton.firebaseapp.com',databaseURL:'https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app',projectId:'topkey-badminton',storageBucket:'topkey-badminton.firebasestorage.app',messagingSenderId:'907878800245',appId:'1:907878800245:web:aa77e4846656a0ba84913c'};
export function client():{auth:Auth;db:Database}{
 const app=getApps().length?getApp():initializeApp(config);
 return {auth:getAuth(app),db:getDatabase(app)};
}
export function listenTournament(db:Database,sport:SportKey,tid:string,onData:(value:TournamentSnapshot)=>void,onError:(error:Error)=>void){
 if(sport==='vlog')return ()=>{};
 const roots:Record<string,string>={badminton:'topkey_badminton_vnext_2026',football:'topkey_football_vnext_2026',volleyball:'topkey_volleyball_vnext_2026',running:'topkey_running_vnext_2026',handmade:'topkey_handmade_vnext_2026',shuttle:'topkey_shuttle_vnext_2026',cooking:'topkey_cooking_vnext_2026'};
 const root=roots[sport]; if(!root||!/^[a-zA-Z0-9_-]{1,100}$/.test(tid))throw Error('Mã giải không hợp lệ');
 // Firebase RTDB rules grant .read on individual branches, not the parent
 // tournament node. A parent onValue() is denied even when teams/matches
 // are public. Mirror the current TOPKEY client's branch subscriptions.
 const branches=['config','teams','matches','activeMatches'] as const;
 const next:TournamentSnapshot={config:{},teams:{},matches:{},activeMatches:{}};
 const arrived=new Set<string>();
 const subscriptions:(()=>void)[]=[];
 let closed=false;
 const onBranchError=(error:Error)=>{
  if(closed)return;
  closed=true;
  subscriptions.forEach(off=>off());
  onError(error);
 };
 for(const branch of branches){
  if(closed)break;
  const location=root+'/tournaments/'+tid+'/'+branch;
  subscriptions.push(onValue(ref(db,location),snapshot=>{
   if(closed)return;
   const value=snapshot.val()||{};
   if(branch==='config')next.config=value;
   else if(branch==='teams')next.teams=value;
   else if(branch==='matches')next.matches=value;
   else next.activeMatches=value;
   arrived.add(branch);
   if(arrived.size===branches.length){
    onData({config:next.config,teams:next.teams,matches:next.matches,activeMatches:next.activeMatches});
   }
  },onBranchError));
 }
 return ()=>{closed=true;subscriptions.forEach(off=>off())};
}
