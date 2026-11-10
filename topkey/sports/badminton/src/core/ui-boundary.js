(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||window.TopkeyUIBoundary)return;
const hooks={tab:[],matches:[],spectator:[]},keys=new Set();
const state={installed:false,dispatch:{tab:0,matches:0,spectator:0},errors:0};
function add(kind,fn,key){if(typeof fn!=='function'||!hooks[kind])return()=>{};const k=String(key||`${kind}:${hooks[kind].length}`);if(keys.has(k))return()=>{};keys.add(k);const row={fn,key:k};hooks[kind].push(row);return()=>{const i=hooks[kind].indexOf(row);if(i>=0)hooks[kind].splice(i,1);keys.delete(k)}}
function run(kind,payload){state.dispatch[kind]=(state.dispatch[kind]||0)+1;for(const row of [...(hooks[kind]||[])]){try{row.fn(payload)}catch(e){state.errors++;console.warn('TOPKEY UI boundary hook',kind,row.key,e)}}}
function install(){if(state.installed)return true;state.installed=true;
  const show=App.showTab?.bind(App);if(show&&!App.__u116BoundaryShowTab){App.__u116BoundaryShowTab=true;App.showTab=function(tab,...args){const out=show(tab,...args);run('tab',{tab:String(tab||''),args,out,app:this});return out}}
  const matches=App.renderMatches?.bind(App);if(matches&&!App.__u116BoundaryMatches){App.__u116BoundaryMatches=true;App.renderMatches=function(...args){const out=matches(...args);run('matches',{args,out,app:this});return out}}
  const spectator=App.renderSpectator?.bind(App);if(spectator&&!App.__u116BoundarySpectator){App.__u116BoundarySpectator=true;App.renderSpectator=function(...args){const out=spectator(...args);run('spectator',{args,out,app:this});return out}}
  return true;
}
window.TopkeyUIBoundary={installed:false,state,hooks,onTab:(fn,key)=>add('tab',fn,key),afterMatches:(fn,key)=>add('matches',fn,key),afterSpectator:(fn,key)=>add('spectator',fn,key),install,run};
Object.defineProperty(window.TopkeyUIBoundary,'installed',{get:()=>state.installed});
})();
