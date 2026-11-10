const fs=require('fs'),assert=require('assert');
const j=JSON.parse(fs.readFileSync('firebase.database.rules.json','utf8'));
const roots={badminton:'topkey_badminton_vnext_2026',football:'topkey_football_vnext_2026',volleyball:'topkey_volleyball_vnext_2026',running:'topkey_running_vnext_2026',handmade:'topkey_handmade_vnext_2026',shuttle:'topkey_shuttle_vnext_2026',cooking:'topkey_cooking_vnext_2026'};
for(const [sport,root] of Object.entries(roots)){
 const n=j.rules[root]?.clubPlan;assert(n,root+' clubPlan rule missing');
 assert(String(n['.read']).includes(`sportScope').val() === '${sport}'`),root+' read scope missing');
 assert(String(n['.write']).includes(`sportScope').val() === '${sport}'`),root+' write scope missing');
 assert(String(n['.write']).includes("child('role').val() === 'ADMIN'"),root+' admin write missing');
}
console.log('CLUB_PLAN_RULES_H93_OK');
