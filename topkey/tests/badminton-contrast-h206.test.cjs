const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const legacy=fs.readFileSync(path.join(root,'sports/badminton/index.html'),'utf8');
const shared=fs.readFileSync(path.join(root,'sports/vnext/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'sports/vnext/canva-sports-ui.css'),'utf8');

test('legacy badminton URL hands off to the shared VNext engine',()=>{
 assert.match(legacy,/query\\.set\\('sport', 'badminton'\\)/);
 assert.match(legacy,/new URL\\('\.\.\\/vnext\\/index\\.html', location\\.href\\)/);
 assert.doesNotMatch(legacy,/operations-contrast-h206\\.css|styles\\.css/);
});
test('shared badminton workspace preserves operational modules and navigation',()=>{
 for(const id of ['id="page-teams"','id="team-form"','id="registration-qr"','id="checkin-list"','id="registration-list"','data-tab="umpire"','data-tab="finance"']){
  assert.ok(shared.includes(id),'Missing shared VNext module: '+id);
 }
 assert.match(shared,/firebase-auth-compat\\.js/);
 assert.match(shared,/firebase-database-compat\\.js/);
});
test('Canva component layer retains roster, check-in and mobile contrast surfaces',()=>{
 for(const token of ['.checkin-row','.list-card','.field :is(input,select,textarea)','#app-shell','@media(max-width:700px)','--tk-navy:#0B1F33','--tk-teal:#0AA6A6']){
  assert.ok(css.includes(token),'Missing Canva component contract: '+token);
 }
 assert.doesNotMatch(css,/pointer-events\\s*:\\s*none/);
 assert.equal((css.match(/\\{/g)||[]).length,(css.match(/\\}/g)||[]).length);
});
console.log('Badminton shared VNext + Canva UI route contract passed.');
