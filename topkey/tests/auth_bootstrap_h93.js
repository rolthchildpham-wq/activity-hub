const fs=require('fs'),assert=require('assert'),vm=require('vm');
const src=fs.readFileSync('sports/badminton/index.html','utf8');
assert(src.includes('function ensureDefaultFirebaseApp()'),'missing default-app initializer');
const admin=src.match(/async function ensureAdmin\(\)\{[\s\S]*?return adminPromise\}/)?.[0]||'';
assert(admin.includes("loadScript('./src/config.js?v=u122h96-20261108'"),'config is not loaded before bootstrap');
assert(admin.indexOf("loadScript('./src/config.js")<admin.indexOf('await ensureFirebase()'),'config must load before Firebase bootstrap');
const ef=src.match(/async function ensureFirebase\(mode='full'\)\{[\s\S]*?\n\}/)?.[0]||'';
const appIdx=ef.indexOf("firebase-app-compat.min.js"), initIdx=ef.indexOf('ensureDefaultFirebaseApp();',appIdx), dbIdx=ef.indexOf('firebase-database-compat.min.js');
assert(appIdx>=0&&initIdx>appIdx&&dbIdx>initIdx,'DEFAULT app must initialize after App SDK and before Database/Auth');
const ea=src.match(/async function ensurePublicAuth\(\)\{[\s\S]*?\n\}/)?.[0]||'';
assert(ea.trim().startsWith('async function ensurePublicAuth(){\n ensureDefaultFirebaseApp();'),'Auth must verify DEFAULT app before firebase.auth()');
// Execute the exact initializer function from the page against a Firebase compat mock.
const f=src.match(/function ensureDefaultFirebaseApp\(\)\{[\s\S]*?\n\}/)?.[0]; assert(f);
const ctx={window:{Topkey:{FIREBASE_CONFIG:{apiKey:'x',databaseURL:'https://x'}}},firebase:{apps:[],initializeApp(cfg){this.apps.push({cfg});return this.apps[0]},app(){if(!this.apps.length)throw new Error("No Firebase App '[DEFAULT]' has been created");return this.apps[0]}}};ctx.window.firebase=ctx.firebase;vm.createContext(ctx);vm.runInContext(f+';window.__test=ensureDefaultFirebaseApp;',ctx);const app=ctx.window.__test();assert(app&&ctx.firebase.apps.length===1);ctx.window.__test();assert.equal(ctx.firebase.apps.length,1,'initializer must be idempotent');
console.log('AUTH_BOOTSTRAP_H93_OK');
