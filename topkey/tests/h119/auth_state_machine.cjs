'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const platform = fs.readFileSync(path.join(ROOT, 'topkey-platform-core.js'), 'utf8');
const sharedAuth = fs.readFileSync(path.join(ROOT, 'topkey-shared-auth.js'), 'utf8');
const adapter = fs.readFileSync(path.join(ROOT, 'sports/badminton/src/auth.js'), 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function element(hidden = false) {
  const classes = new Set(hidden ? ['hidden'] : []);
  return {
    hidden,
    textContent: '',
    dataset: {},
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
      toggle(value, on) { on ? classes.add(value) : classes.delete(value); }
    },
    addEventListener() {}
  };
}

function harness({readDelay = 0} = {}) {
  const user = {uid: 'admin', email: 'admin@example.invalid', isAnonymous: false};
  const profiles = {admin: {uid: 'admin', role: 'ADMIN', active: true, displayName: 'Admin'}};
  const stats = {reads: 0, ready: 0, afterLogin: 0, signOut: 0, transitions: []};
  const watchers = [];
  const elements = {
    'app-shell': element(true),
    'login-screen': element(false),
    'auth-retry-profile': element(true),
    'topkey-auth-hint': element(false)
  };
  const authListeners = [];
  const auth = {
    currentUser: user,
    onAuthStateChanged(callback) {
      authListeners.push(callback);
      queueMicrotask(() => callback(this.currentUser));
      return () => {};
    },
    async signOut() { stats.signOut++; this.currentUser = null; },
    async setPersistence() {},
    async signInWithEmailAndPassword() { this.currentUser = user; return {user}; }
  };
  const db = {
    ref(refPath) {
      return {
        async once() {
          stats.reads++;
          if (readDelay) await wait(readDelay);
          return {val: () => profiles[refPath.split('/').pop()] ?? null};
        },
        on(_event, callback) { watchers.push(callback); },
        off() {},
        limitToFirst() { return this; }
      };
    }
  };
  const Topkey = {
    ROOT: 'topkey_badminton_vnext_2026',
    AUTH_ROOT: 'topkey_badminton_vnext_2026',
    SPORT: {key: 'badminton', name: 'Cầu lông'},
    ROLES: {ADMIN: ['overview'], BTC: ['overview'], VIEWER: ['overview']},
    U: {toast() {}},
    Data: {auth, db, tid: '__testlab_h119'},
    App: {offs: [], afterLogin() { stats.afterLogin++; }, applyRole() {}, subscribe() {}, renderAll() {}}
  };
  const context = {
    window: null,
    Topkey,
    console,
    document: {readyState: 'complete', getElementById: id => elements[id] || null},
    location: {hash: '', search: '?tid=__testlab_h119', href: 'https://example.invalid/sports/badminton/index.html', replace() {}},
    sessionStorage: {setItem() {}, getItem() { return null; }, removeItem() {}},
    localStorage: {setItem() {}, getItem() { return ''; }},
    history: {replaceState() {}, state: null},
    URL,
    URLSearchParams,
    Date,
    Math,
    Promise,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    encodeURIComponent,
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    firebase: {auth: {Auth: {Persistence: {LOCAL: 'LOCAL'}}}},
    dispatchEvent(event) { if (event.type === 'topkey:admin-ready') stats.ready++; if (event.type === 'topkey:auth-state') stats.transitions.push(event.detail?.state); },
    TopkeyHubSession: {
      canProfileAccess: profile => profile?.active !== false,
      normalizeSportScope: profile => profile?.sportScope || '',
      adoptFirebaseUser() {}, markAuthenticated() {}, markLoggedOut() {}, beginLogin() {}, loginFailed() {}, invalidate() {}
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(platform, context);
  vm.runInContext(sharedAuth, context);
  vm.runInContext(adapter, context);
  return {service: Topkey.Auth, auth, user, profiles, stats, watchers, elements};
}

async function openVerifiedApp(options) {
  const h = harness(options);
  await h.service.init();
  await wait(10);
  assert.strictEqual(h.service._profileVerifiedUid, 'admin');
  assert.strictEqual(h.elements['app-shell'].classList.contains('hidden'), false);
  return h;
}

async function run() {
  const transientAuth = await openVerifiedApp();
  transientAuth.auth.currentUser = null;
  const staleNull = transientAuth.service._h108HandleState(null);
  setTimeout(() => { transientAuth.auth.currentUser = transientAuth.user; }, 25);
  await staleNull;
  await wait(20);
  assert.strictEqual(transientAuth.service._profileVerifiedUid, 'admin', 'transient Auth null must preserve verified UID');
  assert.strictEqual(transientAuth.elements['login-screen'].classList.contains('hidden'), true, 'transient Auth null must never reopen login');
  assert.strictEqual(transientAuth.stats.ready, 1, 'revalidation must not republish admin-ready');

  const transientProfile = await openVerifiedApp();
  transientProfile.watchers[0]({val: () => null});
  await wait(350);
  assert.strictEqual(transientProfile.service._profileVerifiedUid, 'admin', 'transient profile null must recover from confirmed server profile');
  assert.strictEqual(transientProfile.elements['login-screen'].classList.contains('hidden'), true, 'transient profile null must not flash login');

  const logout = await openVerifiedApp();
  logout.auth.currentUser = null;
  await logout.service._h108HandleState(null);
  await wait(350);
  assert.strictEqual(logout.service._profileVerifiedUid, '', 'confirmed logout clears verified UID');
  assert.strictEqual(logout.elements['login-screen'].classList.contains('hidden'), false, 'confirmed logout shows login');

  const revoked = await openVerifiedApp();
  revoked.profiles.admin = null;
  revoked.watchers[0]({val: () => null});
  await wait(350);
  assert.strictEqual(revoked.service._profileVerifiedUid, '', 'confirmed profile removal clears verified UID');
  assert.strictEqual(revoked.elements['app-shell'].classList.contains('hidden'), true, 'confirmed profile removal closes app');

  const concurrent = harness({readDelay: 40});
  const first = concurrent.service.verifyProfile(concurrent.user);
  const second = concurrent.service.verifyProfile(concurrent.user);
  await Promise.all([first, second]);
  assert.strictEqual(concurrent.stats.reads, 1, 'concurrent verification shares one Firebase profile read');
  assert.strictEqual(concurrent.stats.ready, 1, 'concurrent verification opens app once');
  assert(concurrent.stats.transitions.includes('AUTHENTICATED'), 'state contract publishes AUTHENTICATED');

  console.log('H119_AUTH_STATE_MACHINE 12/12 PASS');
}

run().catch(error => { console.error(error); process.exit(1); });
