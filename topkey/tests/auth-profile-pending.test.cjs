/* Regression: Authenticated Firebase users must not be asked for a second password when profile verification stalls. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('topkey/topkey-shared-auth.js','utf8');
const elements=new Map();
function el(id){
 if(!elements.has(id))elements.set(id,{id,hidden:false,style:{},children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},remove(){for(const [key,value] of elements)if(value===this)elements.delete(key)},querySelector(selector){return this.children.find(c=>'#'+c.id===selector)||null},addEventListener(name,fn){this['on'+name]=fn},textContent:''});
 return elements.get(id);
}
const document={
 readyState:'loading',
 addEventListener(){},
 getElementById(id){return [...elements.values()].find(v=>v.id===id||v.children?.some(c=>c.id===id))?.id===id?[...elements.values()].find(v=>v.id===id):[...elements.values()].flatMap(v=>v.children||[]).find(c=>c.id===id)||null},
 createElement(){return el('generated-'+Math.random())},
 body:{appendChild(x){if(x.id)elements.set(x.id,x)}}
};
el('login-screen');el('app-shell');
const user={uid:'test-user',email:'test@example.org',isAnonymous:false};
const auth={currentUser:user};
const policy={isBlocked:p=>p.active===false,normalizeRole:r=>r||'VIEWER',normalizeScope:p=>p.sportScope||'',canAccess:p=>!!p.active&&p.role==='ADMIN',canTab:()=>true};
const win={TopkeyPlatform:{policy},TopkeyHubSession:{read:()=>({phase:'AUTHENTICATED',authUid:'test-user'})},dispatchEvent(){}};
const ctx={window:win,document,location:{},console,setTimeout,clearTimeout,CustomEvent:function(){},URLSearchParams};
vm.runInNewContext(source,ctx,{filename:'topkey-shared-auth.js'});
const service=win.TopkeySharedAuth.create({Data:{auth,db:{ref:()=>({once:()=>new Promise(()=>{})})}},SPORT:{key:'badminton',name:'Cầu lông'},ROOT:'topkey_badminton_vnext_2026',U:{}});
service._showLogin('Không đọc được hồ sơ quyền',true);
assert.ok(document.getElementById('topkey-auth-verification-pending'),'verification panel exists');
assert.equal(document.getElementById('topkey-auth-verification-message').textContent,'Không đọc được hồ sơ quyền');
assert.ok(document.getElementById('login-screen').classList,'login-screen remains present');
service._showApp();
assert.equal(document.getElementById('topkey-auth-verification-pending'),null,'verification panel removed after authenticated profile');
service._showLogin('Chưa có phiên',false);
assert.equal(document.getElementById('topkey-auth-verification-pending'),null);
console.log('Auth second-login UI regression passed');
