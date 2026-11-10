const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const build=JSON.parse(read('build.json'));const bn=Number((String(build.build).match(/upgrade(\d+)/)||[])[1]||0);assert(bn>=112);
const dir='assets/u'+bn,m=JSON.parse(read(dir+'/bundle-manifest.json'));
const v=read(dir+'/'+m.viewer.js);
assert(!v.includes("listenMap('matches'"),'Viewer must not subscribe full matches tree');
assert(!v.includes("listenMap('teams'"),'Viewer must not subscribe full teams tree');
assert(v.includes("orderByChild('date').endAt(today).limitToLast(W.pastLimit)"));
assert(v.includes("orderByChild('date').startAt(today).limitToFirst(W.scheduleLimit)"));
assert(v.includes("orderByChild('status').equalTo(st)"));
assert(v.includes("S.db.ref(path('teams/'+id))"),'teams must be on-demand by id');
assert(v.includes("orderByChild('createdAt').limitToLast(1)"),'announcement must be latest-only');
assert(/scheduleLimit:60,pastLimit:20/.test(v));
for(const f of ['firebase.database.rules.json','../../firebase.database.rules.json']){
  const r=JSON.parse(read(f));const n=r.rules.topkey_badminton_vnext_2026.tournaments['$tid'];
  assert.deepStrictEqual(n.matches['.indexOn'],['date','status']);
  assert.deepStrictEqual(n.announcements['.indexOn'],['createdAt']);
}
console.log('upgrade112 Viewer Firebase Window regression: PASS');
