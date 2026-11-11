const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const tabs = ['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'];
for (const file of ['sports/badminton/src/upgrade9.js','sports/badminton/assets/u122/admin-core.h85full.js']) {
 const source = fs.readFileSync(path.join(__dirname,'..',file),'utf8');
 const body = source.match(/applyPermissionsDom\(\)\{([\s\S]*?)\},\s*\n/)[1];
 for (const status of ['OPEN','CLOSED']) {
  const dom = new JSDOM(tabs.map(t=>`<button data-tab="${t}" class="hidden"></button>`).join(''),{runScripts:'outside-only'});
  const w=dom.window;
  w.T={Auth:{user:{uid:'admin'},role:()=> 'ADMIN',can:()=>true}};
  w.App={state:{config:{tournamentStatus:status}},currentTab:'finance',showTab(){throw Error('ADMIN redirected away from finance');}};
  w.perm=()=> 'edit';
  const apply=w.Function(body);
  apply.call({renderSecurityCorner(){}});
  assert.equal(w.document.querySelectorAll('button:not(.hidden)').length,11,`${file}: ${status}`);
  apply.call({renderSecurityCorner(){}});
  assert.equal(w.App.currentTab,'finance');
  // Permission denial must still hide a tab, even for a stale DOM.
  w.T.Auth.can=tab=>tab!=='finance';
  apply.call({renderSecurityCorner(){}});
  assert(w.document.querySelector('[data-tab="finance"]').classList.contains('hidden'));
  if(status==='CLOSED') {
   w.T.Auth.role=()=> 'VIEWER';w.perm=()=> 'view';
   w.App.showTab=tab=>{w.App.currentTab=tab;};
   apply.call({renderSecurityCorner(){}});
   assert.equal(w.App.currentTab,'overview','Closed viewer returns to overview');
   assert(w.document.querySelector('[data-tab="finance"]').classList.contains('hidden'));
  }
  dom.window.close();
 }
 console.log('PASS',file,'ADMIN retains authorized tabs for OPEN/CLOSED; stale visibility restored; denied tab hidden');
}
