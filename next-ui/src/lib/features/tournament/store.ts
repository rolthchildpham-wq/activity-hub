import {writable,derived} from 'svelte/store';
import {client,listenTournament} from '$lib/firebase';
import {emptyTournament,summarize,groupPhases,type SportKey,type TournamentSnapshot} from '$lib/domain';

type DashboardState={
 loading:boolean;loaded:boolean;error:string;data:TournamentSnapshot;sport:SportKey|null;tid:string
};
const initial=():DashboardState=>({loading:false,loaded:false,error:'',data:emptyTournament(),sport:null,tid:''});
const internal=writable<DashboardState>(initial());
let unsubscribe:(()=>void)|undefined;
let serial=0;

export const tournament={subscribe:internal.subscribe};
export const metrics=derived(tournament,s=>s.loaded?summarize(s.data):null);
export const phases=derived(tournament,s=>s.loaded?groupPhases(s.data.matches):[]);

export function loadTournament(sport:SportKey,tid:string):void{
 const key=++serial;
 unsubscribe?.();unsubscribe=undefined;
 internal.set({...initial(),sport,tid,loading:true});
 try{
  const {db}=client();
  const stop=listenTournament(db,sport,tid,data=>{
   if(key!==serial)return;
   internal.set({loading:false,loaded:true,error:'',data,sport,tid});
  },error=>{
   if(key!==serial)return;
   internal.update(s=>({...s,loading:false,loaded:false,error:error.message}));
  });
  if(key===serial)unsubscribe=stop;else stop();
 }catch(error){
  if(key===serial)internal.update(s=>({...s,loading:false,error:error instanceof Error?error.message:String(error)}));
 }
}
export function resetTournament():void{
 serial++;unsubscribe?.();unsubscribe=undefined;internal.set(initial());
}
