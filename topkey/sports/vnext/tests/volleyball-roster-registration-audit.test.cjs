'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/volleyball-roster-registration-audit.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/volleyball-roster-registration-audit\.js\?v=20261117-reg-audit-r1/);
const context={
 window:{Topkey:{SPORT:{key:'volleyball'},Auth:{role:()=> 'VIEWER',profile:{}},App:{state:{teams:{},registrations:{}}},Data:{path:x=>'root/'+x}},__TOPKEY_VNEXT_BOOT:null},
 document:{readyState:'complete',getElementById:()=>null},console,Promise,Object,Array,Set,Date,String,JSON,Error
};
vm.createContext(context);new vm.Script(source,{filename:'volleyball-roster-registration-audit.js'}).runInContext(context);
const audit=context.window.TopkeyRosterRegistrationAudit.auditRows;
const p=[{name:'A',jersey:'1',employeeId:'e1',shirtSize:'L'}];
const regs={
 reg1:{id:'reg1',status:'APPROVED',teamId:'team1',name:'MAI NHAM',roster:p},
 reg2:{id:'reg2',status:'APPROVED',teamId:'team2',name:'VAN PHONG',p1:'Doi truong'},
 reg3:{id:'reg3',status:'APPROVED',teamId:'team3',name:'TRANG TRI',roster:p},
 reg4:{id:'reg4',status:'APPROVED',teamId:'team4',name:'PHOI THO',members:p},
 reg5:{id:'reg5',status:'PENDING',teamId:'team5',roster:p}
};
const teams={
 team1:{id:'team1',registrationId:'reg1',name:'MAI NHAM',roster:[]},
 team2:{id:'team2',registrationId:'reg2',name:'VAN PHONG',roster:[]},
 team3:{id:'team3',registrationId:'reg3',name:'TRANG TRI',roster:[{name:'Already saved'}]},
 team4:{id:'team4',registrationId:'reg4',name:'PHOI THO'},
 manuallyAdded:{id:'manuallyAdded',name:'MANUAL',roster:[]}
};
const results=Array.from(audit(regs,teams)),byId=Object.fromEntries(results.map(r=>[r.teamId,r]));
assert.equal(byId.team1.status,'RESTORABLE');assert.equal(byId.team1.canRestore,true);
assert.equal(byId.team1.registrationCount,1);assert.equal(byId.team1.teamCount,0);
assert.equal(byId.team2.status,'MISSING_IN_REGISTRATION');assert.equal(byId.team2.canRestore,false);
assert.equal(byId.team3.status,'SAVED');assert.equal(byId.team3.canRestore,false);
assert.equal(byId.team4.status,'MISSING_IN_REGISTRATION');assert.equal(byId.team4.sourceFields.join(','),'members');
assert.equal(byId.manuallyAdded.status,'NO_APPROVED_LINK');
assert(!byId.team5,'Pending registration must not be counted as approved');
const missingLink=audit({x:regs.reg1},{team1:{...teams.team1,registrationId:'wrong'}})[0];
assert.equal(missingLink.canRestore,false);assert.equal(missingLink.status,'LINK_MISMATCH');
const unverified=audit({x:regs.reg1},{team1:{id:'team1',name:'MAI NHAM',roster:[]}})[0];
assert.equal(unverified.canRestore,false);assert.equal(unverified.status,'UNVERIFIED_LINK');
assert.match(source,/\.once\('value'\)/,'Audit must read Firebase, not claim local cache is saved');
assert.match(source,/T\.U\.confirmDanger\(/,'Recovery must require explicit confirmation');
assert.match(source,/T\.Data\.queueMulti\(/,'Recovery must write only on explicit action');
assert.match(source,/latestTeam\.registrationId!==row\.id/,'Recovery must recheck linkage before save');
assert.doesNotMatch(source,/firebase\.database\(\)\.ref\([^)]*\)\.set\(/,'No uncontrolled global Firebase writes');
console.log('PASS: registration-to-team saved state classification; only verified linked teams may recover and no viewer auto-write');
