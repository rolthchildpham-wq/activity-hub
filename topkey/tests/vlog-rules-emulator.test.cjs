'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const root=path.resolve(__dirname,'..');
const rules=fs.readFileSync(path.join(root,'firebase.database.rules.json'),'utf8');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-topkey-vlog',database:{rules,host:'127.0.0.1',port:9000}});
 const userRoot='topkey_badminton_vnext_2026/users';
 const vlogRoot='topkey_vlog2026';
 const entry={name:'Test Entry',type:'Đội',dept:'TOPKEY',views:123,likes:12,shares:3,url:'https://www.tiktok.com/@test/video/1234567890123456789'};
 try{
   await env.withSecurityRulesDisabled(async ctx=>{
     const db=ctx.database();
     await db.ref(userRoot).set({
       admin:{role:'ADMIN',active:true},
       btcHandmade:{role:'BTC',sportScope:'handmade',active:true},
       btcFootball:{role:'BTC',sportScope:'football',active:true},
       viewer:{role:'VIEWER',active:true},
       disabledAdmin:{role:'ADMIN',disabled:true},
       inactiveBtc:{role:'BTC',sportScope:'handmade',status:'inactive'}
     });
   });
   const anon=env.unauthenticatedContext().database();
   const admin=env.authenticatedContext('admin').database();
   const btc=env.authenticatedContext('btcHandmade').database();
   const out=env.authenticatedContext('btcFootball').database();
   const viewer=env.authenticatedContext('viewer').database();
   const disabled=env.authenticatedContext('disabledAdmin').database();
   const inactive=env.authenticatedContext('inactiveBtc').database();
   await assertFails(anon.ref(vlogRoot).once('value'));
   await assertSucceeds(anon.ref(vlogRoot+'/entries').once('value'));
   await assertSucceeds(anon.ref(vlogRoot+'/weights').once('value'));
   await assertFails(anon.ref(vlogRoot+'/entries/public').set(entry));
   await assertSucceeds(admin.ref(vlogRoot+'/entries/admin').set(entry));
   await assertSucceeds(btc.ref(vlogRoot+'/entries/btc').set(entry));
   await assertFails(out.ref(vlogRoot+'/entries/out').set(entry));
   await assertFails(viewer.ref(vlogRoot+'/entries/viewer').set(entry));
   await assertFails(disabled.ref(vlogRoot+'/entries/disabled').set(entry));
   await assertFails(inactive.ref(vlogRoot+'/entries/inactive').set(entry));
   await assertFails(admin.ref(vlogRoot+'/entries/bad').set({...entry,views:-1}));
   await assertFails(admin.ref(vlogRoot+'/weights').set({views:1,likes:3,shares:-5}));
   await assertSucceeds(admin.ref(vlogRoot+'/weights').set({views:1,likes:3,shares:5}));
   await assertFails(anon.ref('topkey_handmade_vnext_2026/tournaments').once('value'));
   console.log('PASS Vlog Firebase emulator: 14 permissions/validation assertions');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
