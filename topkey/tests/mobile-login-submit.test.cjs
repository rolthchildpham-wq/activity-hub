/* Regression: mobile login submit must work before the heavy sport admin bundle loads.
 * Run: node topkey/tests/mobile-login-submit.test.cjs
 * Does not contact Firebase or write tournament data.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../topkey-platform-core.js'), 'utf8');
const listeners = {};
let loginCount = 0;
let coreLoadCount = 0;
let submitted = false;
const firebaseApp = { name: 'test' };
const auth = { currentUser: null };
const db = {};
const firebase = {
 apps: [firebaseApp],
 app: () => firebaseApp,
 auth: () => auth,
 database: () => db,
 initializeApp: () => firebaseApp
};
const doc = {
 addEventListener: (type, handler) => { (listeners[type] ||= []).push(handler); },
 getElementById: () => null,
 createElement: () => ({ dataset: {}, setAttribute() {}, textContent: '' })
};
const win = {
 firebase,
 Topkey: {SPORT: {key: 'badminton'}, ROOT: 'test'},
 TopkeySharedAuth: { create: () => ({
  init: async () => {},
  login: async (email, password) => { assert.equal(email, 'test@example.org'); assert.equal(password, 'secret'); loginCount++; },
  attachApp: async () => {}
 })},
 addEventListener: () => {}
};
const ctx = {window: win, document: doc, console, URL, URLSearchParams,
 location: { hash:'', search:'', href:'https://example.org/sports/badminton/index.html' },
 history: {replaceState() {}}, setTimeout, clearTimeout};
vm.runInNewContext(code, ctx, {filename: 'topkey-platform-core.js'});
const platform = win.TopkeyPlatform;
assert.ok(platform, 'Shared platform must initialize');
const controller = platform.startSport({config: {apiKey:'test',databaseURL:'https://example.org'},
 loadCore: async () => {coreLoadCount++; return win.Topkey;}
});
assert.ok(controller, 'Sport controller should initialize');
assert.equal(listeners.submit?.length, 1, 'Login submit must bind immediately without loading admin core');
const statuses = [];
const button = {type:'submit', textContent:'Đăng nhập an toàn', disabled:false};
const form = {
 id:'login-form',
 elements:{namedItem: name => ({value: name==='email'?'test@example.org':'secret'})},
 querySelector: selector => selector.includes('button')?button:null,
 append: node => statuses.push(node),
 reportValidity: () => true
};
const event = {target:form,preventDefault(){submitted=true},stopImmediatePropagation(){}};
(async()=>{
 await controller.ready;
 listeners.submit[0](event);
 for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.ok(submitted, 'Submit must be intercepted (prevent native page navigation)');
 assert.equal(loginCount,1,'Exactly one authentication must be attempted');
 assert.equal(coreLoadCount,0,'Heavy admin bundle must not be required to start signing in');
 assert.equal(button.disabled,false,'Button must be re-enabled after the attempt');
 console.log('PASS mobile-login-submit: bound early, intercepts submit, authenticates once, no admin hydration');
})().catch(e=>{console.error(e);process.exitCode=1});
