const assert=require('assert'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const rootBuild=JSON.parse(read('build.json')),release=JSON.parse(read('release.json')),bad=JSON.parse(read('sports/badminton/build.json')),vn=JSON.parse(read('sports/vnext/build.json'));
const cacheTag='u122h108-20261109',version='2026.11.09-vnext-upgrade122-hotfix108-auth-stability';
for(const o of [rootBuild,release,bad,vn]){assert.equal(o.cacheTag,cacheTag);assert.equal(o.version,version)}
assert.equal(release.releaseId,'H108');assert.equal(release.hub,rootBuild.build);assert.equal(release.badminton,bad.build);assert.equal(release.vnext,vn.build);
for(const f of ['hub-auth-flow.js','release-coordinator.js','sports/badminton/hub-entry-guard.js','sports/vnext/hub-entry-guard.js','sports/badminton/upgrade122-hotfix85.js','sports/vnext/h97-vnext.bundle.js'])assert(read(f).includes(cacheTag),f+' has stale build tag');
for(const f of ['index.html','sports/badminton/index.html','sports/vnext/index.html'])assert(!read(f).includes('u122h107-20261108'),f+' references H107');
for(const f of ['sports/badminton/index.html','sports/vnext/index.html']){const s=read(f);assert(s.includes('h108-auth-guard.js?v='+cacheTag),f+' login hook missing');assert(s.includes('id="login-form"'));assert(s.includes('type="submit">Đăng nhập an toàn'))}
for(const f of ['sw.js','sports/badminton/sw.js','sports/vnext/sw.js'])assert(read(f).includes('topkey-h108'),f+' stale cache');
const authGuard=read('h108-auth-guard.js');assert(!/bypass|fakeAdmin|localStorage\.setItem\(/i.test(authGuard),'client-side admin bypass prohibited');
const matches=['badminton','football','volleyball','running','handmade','shuttle','cooking'];assert(matches.every(s=>read('index.html').includes('value="'+s+'"')||read('index.html').includes('sport='+s)||read('hub-auth-flow.js').includes(s)),'missing sports');
console.log('H108 RELEASE PARITY PASS: Hub / Badminton / VNext / 7 sports / auth hook / cache / no admin bypass');
