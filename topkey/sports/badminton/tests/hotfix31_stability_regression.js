const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const idx=read('index.html'),idb=read('src/idb.js'),data=read('src/firebase.js'),auth=read('src/auth.js'),app=read('src/app.js'),sw=read('sw.js'),h31=read('upgrade122-hotfix31.js');
const build=JSON.parse(read('build.json'));
assert.equal(build.cacheTag,'u122h31-20261103');
assert.equal(build.version,'2026.11.03-vnext-upgrade122-hotfix31-stability-consolidation');
assert(idx.includes("window.__TOPKEY_CONSOLIDATED_H31=true"),'consolidation preboot flag missing');
assert(idx.includes('Đang xác thực…'),'resilient preboot login authority missing');
assert(!idx.includes("e.stopImmediatePropagation();window.__TOPKEY_PENDING_LOGIN=true;const b=e.target.querySelector"),'old indefinite login guard still present');
assert(idb.includes("IndexedDB open timeout"),'IDB timeout missing');
assert(idb.includes('r.onblocked'),'IDB blocked handling missing');
assert(data.includes('continuing without blocking login'),'Data boot fail-safe missing');
assert(app.indexOf('this.bindStatic(); this.registerSW();') < app.indexOf('await T.Data.init()'),'login/static binding must happen before Data init');
assert(app.includes('if(this.__staticBound)return'),'bindStatic idempotence missing');
assert(auth.includes('Auth restore timeout'),'Auth restore timeout missing');
assert(auth.includes('profile timeout'),'profile timeout missing');
assert(auth.includes("Promise.resolve(T.App?.afterLogin?.())"),'afterLogin should not block auth init');
assert(sw.includes('topkey-vnext-2026-upgrade122-hotfix31-stability-consolidation'),'SW cache not h31');
assert(sw.includes('./upgrade122-hotfix31.js'),'h31 not precached');
assert(h31.includes('STABILITY_CONSOLIDATION_001'),'h31 contract missing');
const scripts=[...idx.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1].split('?')[0]).filter(x=>x.startsWith('./'));
for(const src of scripts){const p=path.join(root,src.slice(2));assert(fs.existsSync(p),`missing script ${src}`)}
// Every loaded post-u122 hotfix must agree on the current version/tag if it declares one.
for(const f of fs.readdirSync(root).filter(x=>/^upgrade122-hotfix\d+\.js$/.test(x))){const s=read(f);const vers=[...s.matchAll(/2026\.11\.0[23]-vnext-upgrade122-hotfix\d+[-a-z0-9]*/g)].map(x=>x[0]);for(const v of vers)assert.equal(v,build.version,`${f} stale version ${v}`);const tags=[...s.matchAll(/u122h\d+-2026110[23]/g)].map(x=>x[0]);for(const t of tags)assert.equal(t,build.cacheTag,`${f} stale tag ${t}`)}
console.log('Hotfix31 stability regression PASS');
