const fs=require('fs'),assert=require('assert');
const j=fs.readFileSync('sports/vnext/src/upgrade122-hotfix88-judging.js','utf8');
const idx=fs.readFileSync('sports/vnext/index.html','utf8');
const auth=fs.readFileSync('topkey-shared-auth.js','utf8');
const guard=fs.readFileSync('topkey-hub-guard-core.js','utf8');
const rules=JSON.parse(fs.readFileSync('firebase.database.rules.json','utf8')).rules;
for(const x of ["['cooking','handmade']",'PUBLIC_DEVICE','JUDGE_CODE','crypto.subtle.digest','judgingVotes/public','judgingVotes/judges','judgeAccessCodes','Tổng trọng số','Điểm TB /100','tk88j-rank1','tk88j-rank2','tk88j-rank3'])assert(j.includes(x),'missing '+x);
assert(j.includes("sum!==100")||j.includes("!==100"),'100% criteria guard missing');
assert(j.includes("topkey_public_device_v1"),'browser/device identity missing');
assert(j.includes("Mỗi mã giám khảo được chấm mỗi đội đúng 1 lần"),'judge once-per-team UX missing');
assert(j.includes("thiết bị/trình duyệt")||j.includes("trình duyệt/thiết bị"),'best-effort device disclosure missing');
assert(idx.includes("h.startsWith('#judge')")&&idx.includes('tk-public-boot'),'judge public preboot missing');
assert(idx.includes('TopkeyPlatform.loadFirebase')&&idx.includes('auth:!window.__TOPKEY_PUBLIC_ROUTE'),'VNext public route must skip Firebase Auth SDK through shared loader');
assert(auth.includes('_startPublic()')&&auth.includes('TopkeyH88Judging'),'VNext public auth bypass missing');
assert(guard.includes("startsWith('#judge')")||guard.includes("location.hash==='#judge'"),'judge hub guard bypass missing');
for(const root of ['topkey_cooking_vnext_2026','topkey_handmade_vnext_2026']){
 const t=rules[root].tournaments['$tid']; assert(t.judgingVotes&&t.judgeAccessCodes,root+' judging rules missing');
 const pub=t.judgingVotes.public['$deviceHash']; assert(pub['.write'].includes('!data.exists()')&&pub['.write'].includes('PUBLIC_DEVICE'),root+' public create-only missing');
 assert(pub['.validate'].includes("total').val() <= 100"),root+' public score bounds missing');
 const jc=t.judgingVotes.judges['$codeHash']['$teamId']; assert(jc['.write'].includes('!data.exists()')&&jc['.write'].includes('JUDGE_CODE'),root+' judge create-only missing');
 assert(jc['.validate'].includes("teamId').val() === $teamId"),root+' judge team path validation missing');
}
console.log('JUDGING_CONTRACT_H88_OK');
