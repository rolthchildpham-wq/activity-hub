const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {ref,get,set,query,orderByChild,limitToLast}=require('firebase/database');
const root='topkey_badminton_vnext_2026';
const legacy=['topkey_badminton_app','topkey_badminton_app_ai','topkey_badminton_app_ai_testing','topkey_multisport_app','topkey_multisport_app_v3','topkey_multisport_app_v4'];
(async()=>{
 if(!process.env.FIREBASE_DATABASE_EMULATOR_HOST)throw Error('Emulator required; production access is prohibited');
 const [host,port]=process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
 const env=await initializeTestEnvironment({projectId:'demo-topkey-scale',database:{host,port:Number(port),rules:fs.readFileSync(path.join(__dirname,'../firebase.database.rules.json'),'utf8')}});
 let checks=0;
 try{
  await env.withSecurityRulesDisabled(async ctx=>{await set(ref(ctx.database()),{
   ...Object.fromEntries(legacy.map(k=>[k,{fixture:true}])),
   [root]:{users:{admin:{role:'ADMIN',active:true},disabled:{role:'ADMIN',active:false},viewer:{role:'VIEWER'},btc:{role:'BTC',sportScope:'badminton',permissions:{modules:{teams:'edit'}}},wrong:{role:'BTC',sportScope:'football',permissions:{modules:{teams:'edit'}}}},tournamentIndex:{badminton:{a:{closedAt:1},b:{closedAt:2}}},tournaments:{sample:{config:{title:'Synthetic'},teams:{t1:{name:'Synthetic'}}}}}
  })});
  for(const name of legacy){
   for(const uid of [null,'viewer','btc','disabled']){const db=uid?env.authenticatedContext(uid).database():env.unauthenticatedContext().database();await assertFails(get(ref(db,name)));await assertFails(set(ref(db,name+'/probe'),true));checks+=2}
   const db=env.authenticatedContext('admin').database();await assertSucceeds(get(ref(db,name)));await assertFails(set(ref(db,name+'/probe'),true));checks+=2;
  }
  const admin=env.authenticatedContext('admin').database();
  await assertSucceeds(get(query(ref(admin,root+'/tournamentIndex/badminton'),orderByChild('closedAt'),limitToLast(27))));checks++;
  for(const [uid,allowed] of [['admin',true],['btc',true],['wrong',false],['viewer',false]]){
   const op=set(ref(env.authenticatedContext(uid).database(),root+'/tournaments/sample/teams/t2'),{name:'Emulator test'});
   await (allowed?assertSucceeds(op):assertFails(op));checks++;
  }
  console.log(`PASS ${checks} emulator authorization checks; legacy public access denied, active ADMIN migration read only, indexed archive query and sport-scoped team writes`);
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
