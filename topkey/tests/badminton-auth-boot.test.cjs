const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
assert.match(html,/<section id="topkey-auth-boot-pending"/,'startup verification placeholder exists');
assert.match(html,/<section id="login-screen" class="login hidden"/,'password form starts hidden');
const source=fs.readFileSync('topkey/topkey-shared-auth.js','utf8');
const nodes=new Map();
function node(tag='div'){
 const item={tag,id:'',textContent:'',style:{},hidden:false,disabled:false,children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},append(...children){this.children.push(...children);for(const c of children)if(c.id)nodes.set(c.id,c)},remove(){nodes.delete(this.id)},querySelector(q){return nodes.get(q.slice(1))||null},addEventListener(event,fn){this['on'+event]=fn}};
 return item;
}
for(const id of ['login-screen','app-shell','topkey-auth-boot-pending']){const v=node();v.id=id;nodes.set(id,v)}
const document={readyState:'loading',addEventListener(){},createElement:node,getElementById:id=>nodes.get(id)||null,body:{appendChild(n){nodes.set(n.id,n)}}};
const auth={currentUser:null};const uid='test-user';
const user={uid,email:'test@example.com',isAnonymous:false};
const policy={isBlocked:p=>p.active===false,normalizeRole:r=>r||'ADMIN',normalizeScope:()=>'',canAccess:p=>!!p.active,canTab:()=>true};
const w={TopkeyPlatform:{policy},TopkeyHubSession:{read:()=>({phase:'AUTHENTICATED',authUid:uid})},dispatchEvent(){}};
const ctx={window:w,document,location:{hash:''},console,CustomEvent:function(){},setTimeout:fn=>{Promise.resolve().then(fn);return 1},clearTimeout(){}};
vm.runInNewContext(source,ctx);
const service=w.TopkeySharedAuth.create({Data:{auth},SPORT:{key:'badminton'},ROOT:'topkey_badminton_vnext_2026',U:{}});
(async()=>{
 service.user=user;service._profileVerifiedUid=uid;
 await service._onAuthState(null);
 assert.ok(nodes.has('topkey-auth-verification-pending'),'recovery shown when Firebase returns transient null');
 assert.ok(!nodes.has('topkey-auth-boot-pending'),'boot placeholder resolved');
 assert.equal(service._profileVerifiedUid,'','protected verification invalidated');
 assert.equal(service.user,null,'stale Firebase identity invalidated');
 assert.ok(nodes.has('topkey-auth-verification-sign-in'),'explicit sign-in option is available');
 auth.currentUser=user;
 service._showApp();
 assert.ok(!nodes.has('topkey-auth-verification-pending'),'verified app closes recovery');
 console.log('Badminton initial auth + transient null regression passed');
})().catch(e=>{console.error(e);process.exitCode=1});
