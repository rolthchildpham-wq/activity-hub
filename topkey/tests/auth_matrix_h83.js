const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Store{constructor(seed={}){this.m={...seed}}getItem(k){return Object.prototype.hasOwnProperty.call(this.m,k)?this.m[k]:null}setItem(k,v){this.m[k]=String(v)}removeItem(k){delete this.m[k]}dump(){return {...this.m}}}
function runGuard(file,{pathname,search='',hash='',store=new Store()}){
  const redirects=[];
  const location={pathname,search,hash,replace:u=>redirects.push(String(u))};
  const ctx={console,URLSearchParams,Date,JSON,String,Number,Math,encodeURIComponent,decodeURIComponent,location,sessionStorage:store};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('release-runtime.js','utf8'),ctx,{filename:'release-runtime.js'});
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  return {ctx,api:ctx.TopkeyHubSession,redirects,store};
}
const BAD='sports/badminton/hub-entry-guard.js',VN='sports/vnext/hub-entry-guard.js';
let total=0;function t(name,fn){fn();total++;console.log('PASS',name)}

t('direct badminton without Hub is rejected',()=>{const r=runGuard(BAD,{pathname:'/sports/badminton/index.html'});assert(r.redirects.some(x=>x.includes('reason=select-sport'))) });
t('badminton Hub entry creates SELECTED session',()=>{const r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton'});assert.equal(r.redirects.length,0);assert.equal(r.api.read().sport,'badminton');assert.equal(r.api.read().phase,'SELECTED')});
t('ADMIN may access badminton',()=>{const r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton'});assert.equal(r.api.canProfileAccess({role:'ADMIN',active:true}),true)});
t('BTC badminton alias may access badminton',()=>{const r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton'});assert.equal(r.api.canProfileAccess({role:'BTC',active:true,sportScope:'🏸 Cầu lông'}),true)});
t('BTC volleyball cannot access badminton',()=>{const r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton'});assert.equal(r.api.canProfileAccess({role:'BTC',active:true,sportScope:'Bóng chuyền'}),false)});
t('disabled ADMIN is denied',()=>{const r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton'});assert.equal(r.api.canProfileAccess({role:'ADMIN',active:false}),false)});
t('manual login transition survives reload',()=>{const store=new Store();let r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton',store});assert.equal(r.api.needsFreshLogin('u1'),true);r.api.beginLogin();assert.equal(r.api.read().phase,'LOGIN_SUBMITTED');assert.equal(r.api.needsFreshLogin('u1'),false);r.api.markAuthenticated('u1');assert.equal(r.api.read().phase,'AUTHENTICATED');r=runGuard(BAD,{pathname:'/sports/badminton/index.html',store});assert.equal(r.redirects.length,0);assert.equal(r.api.needsFreshLogin('u1'),false)});
t('different restored Firebase uid requires fresh login',()=>{const store=new Store();let r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=n1&sport=badminton',store});r.api.beginLogin();r.api.markAuthenticated('u1');r=runGuard(BAD,{pathname:'/sports/badminton/index.html',store});assert.equal(r.api.needsFreshLogin('u2'),true)});
t('VNext volleyball Hub entry and BTC scope work',()=>{const r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:'?entry=hub&hubTicket=n2&sport=volleyball'});assert.equal(r.redirects.length,0);assert.equal(r.api.canProfileAccess({role:'BTC',active:true,assignedSport:'🏐 Bóng chuyền'}),true);assert.equal(r.api.canProfileAccess({role:'BTC',active:true,assignedSport:'🏸 Cầu lông'}),false);assert.equal(r.api.canProfileAccess({role:'ADMIN',active:true}),true)});
t('switching from authenticated badminton to volleyball starts a new fresh session',()=>{const store=new Store();let r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=b1&sport=badminton',store});r.api.beginLogin();r.api.markAuthenticated('uBad');r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:'?entry=hub&hubTicket=v1&sport=volleyball',store});assert.equal(r.api.read().sport,'volleyball');assert.equal(r.api.read().phase,'SELECTED');assert.equal(r.api.needsFreshLogin('uBad'),true)});
t('authenticated VNext session survives clean URL without sport query',()=>{const store=new Store();let r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:'?entry=hub&hubTicket=vclean&sport=volleyball',store});r.api.beginLogin();r.api.markAuthenticated('uVolley');r=runGuard(VN,{pathname:'/sports/vnext/index.html',store});assert.equal(r.redirects.length,0);assert.equal(r.api.sport,'volleyball');assert.equal(r.api.needsFreshLogin('uVolley'),false)});
t('direct VNext with mismatched stored sport is rejected',()=>{const store=new Store();let r=runGuard(BAD,{pathname:'/sports/badminton/index.html',search:'?entry=hub&hubTicket=b1&sport=badminton',store});r.api.beginLogin();r.api.markAuthenticated('uBad');r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:'?sport=volleyball',store});assert(r.redirects.some(x=>x.includes('reason=select-sport')))});
t('public spectator bypass does not require Hub ticket',()=>{const r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:'?sport=volleyball',hash:'#spectator'});assert.equal(r.redirects.length,0);assert.equal(r.api.bypass,true)});
t('testlab bypass does not require Hub ticket',()=>{const r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:'?sport=volleyball&testlab=1&tid=__testlab_x'});assert.equal(r.redirects.length,0);assert.equal(r.api.bypass,true)});
// exhaustive VNext sport-scope aliases
const SPORT_CASES={football:'⚽ Bóng đá',volleyball:'🏐 Bóng chuyền',running:'🏃 Chạy bộ',handmade:'🧶 DIY / Handmade',shuttle:'🪶 Đá cầu',cooking:'👨‍🍳 Nấu ăn'};
for(const [sport,scope] of Object.entries(SPORT_CASES)){
  t(`ADMIN allowed ${sport}`,()=>{const r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:`?entry=hub&hubTicket=a_${sport}&sport=${sport}`});assert.equal(r.api.canProfileAccess({role:'ADMIN',active:true}),true)});
  t(`BTC own scope allowed ${sport}`,()=>{const r=runGuard(VN,{pathname:'/sports/vnext/index.html',search:`?entry=hub&hubTicket=b_${sport}&sport=${sport}`});assert.equal(r.api.canProfileAccess({role:'BTC',active:true,sportScope:scope}),true)});
}

console.log(`AUTH_MATRIX_OK ${total}`);
