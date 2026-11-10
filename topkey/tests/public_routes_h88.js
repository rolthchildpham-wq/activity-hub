const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const vi=read('sports/vnext/index.html');
const va=read('topkey-shared-auth.js');
const vf=read('sports/vnext/src/firebase.js');
const vg=read('topkey-hub-guard-core.js');
const bi=read('sports/badminton/index.html');
const ba=read('topkey-shared-auth.js');
const bv=read('sports/badminton/assets/u122/viewer.56627d273293.js');
const checks=[
 ['vnext preboot all public hashes', /#spectator/.test(vi)&&/#register/.test(vi)&&/#judge/.test(vi)&&/__TOPKEY_PUBLIC_ROUTE/.test(vi)],
 ['vnext auth sdk conditional', /TopkeyPlatform\.loadFirebase/.test(vi)&&/auth:!window\.__TOPKEY_PUBLIC_ROUTE/.test(vi)],
 ['vnext auth bypass public route', /__TOPKEY_PUBLIC_ROUTE/.test(va)&&/TopkeyH88Judging/.test(va)],
 ['vnext firebase auth optional', /typeof\s+firebase\.auth\s*===\s*['"]function['"]/.test(vf)],
 ['vnext guard bypass judge', /#judge/.test(vg)&&/#spectator/.test(vg)&&/#register/.test(vg)],
 ['badminton preboot public routes', /#spectator/.test(bi)&&/#register/.test(bi)&&/__TOPKEY_IS_SPECTATOR/.test(bi)],
 ['badminton public register bypass', /_startPublic/.test(ba)&&/#register/.test(ba)],
 ['badminton viewer lazy public auth', /ensurePublicAuth/.test(bv)&&/signInAnonymously/.test(bv)&&/connectRtc/.test(bv)],
 ['badminton viewer db before auth', /waitFirebase/.test(bv)&&/firebase\.database/.test(bv)],
];
let bad=0; for(const [n,ok] of checks){console.log(ok?'PASS':'FAIL',n);if(!ok)bad++}
if(bad)process.exit(1);console.log('PUBLIC_ROUTES_H88_OK',checks.length)
