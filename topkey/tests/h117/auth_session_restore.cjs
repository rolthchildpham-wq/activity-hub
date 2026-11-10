const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
const platformSource = fs.readFileSync(path.join(root, 'topkey-platform-core.js'), 'utf8');
const bundle = fs.readFileSync(path.join(root, 'sports/badminton/assets/u122/admin-core.h85full.js'), 'utf8');
const start = bundle.indexOf('/* SOURCE: ./src/auth.js */');
const end = bundle.indexOf('/* SOURCE: ./src/app.js */');
assert(start >= 0 && end > start, 'active auth source not found in admin bundle');
const badmintonAuthSource = bundle.slice(start, end);
const vnextAuthSource = fs.readFileSync(path.join(root, 'sports/vnext/src/auth.js'), 'utf8');

function node(hidden = true) {
  const values = new Set(hidden ? ['hidden'] : []);
  return {
    classList: {
      add: value => values.add(value),
      remove: value => values.delete(value),
      contains: value => values.has(value)
    }
  };
}

async function restoredSessionScenario(label, authSource) {
  const user = {uid: 'uid-admin', email: 'admin@example.invalid', isAnonymous: false};
  const profile = {uid: user.uid, role: 'ADMIN', active: true, displayName: 'Admin'};
  const elements = {
    'app-shell': node(true),
    'login-screen': node(false),
    'public-spectator': node(true)
  };
  let signOuts = 0;
  let profileReads = 0;
  let authenticatedMarks = 0;
  const auth = {
    currentUser: user,
    onAuthStateChanged(callback) {
      Promise.resolve().then(() => callback(user));
      return () => {};
    },
    async signOut() {
      signOuts += 1;
    }
  };
  const db = {
    ref(refPath) {
      return {
        async once() {
          if (refPath.endsWith('/users/' + user.uid)) {
            profileReads += 1;
            return {val: () => profile};
          }
          return {val: () => ({ready: true})};
        },
        on() {},
        off() {},
        limitToFirst() { return this; }
      };
    }
  };
  const Topkey = {
    ROOT: 'topkey_badminton_vnext_2026',
    AUTH_ROOT: 'topkey_badminton_vnext_2026',
    SPORT: {key: 'badminton'},
    ROLES: {ADMIN: ['overview'], VIEWER: ['overview']},
    U: {toast() {}},
    Data: {auth, db, tid: '__testlab_h117', flushQueue: async () => {}},
    App: {afterLogin() {}, applyRole() {}, subscribe() {}, renderAll() {}, heartbeat() {}}
  };
  const context = {
    window: null,
    Topkey,
    location: {
      pathname: '/sports/badminton/index.html',
      search: '?entry=hub&sport=badminton',
      hash: '',
      href: 'https://example.invalid/sports/badminton/index.html?entry=hub&sport=badminton',
      replace() {}
    },
    document: {
      readyState: 'complete',
      getElementById: id => elements[id] || null,
      documentElement: {classList: node(false).classList}
    },
    localStorage: {getItem() { return null; }, setItem() {}},
    sessionStorage: {getItem() { return null; }, setItem() {}, removeItem() {}},
    firebase: {auth: {Auth: {Persistence: {LOCAL: 'LOCAL'}}}},
    URL,
    URLSearchParams,
    Promise,
    Date,
    JSON,
    String,
    Number,
    Math,
    encodeURIComponent,
    setTimeout,
    clearTimeout,
    dispatchEvent() {},
    CustomEvent: class CustomEvent {
      constructor(type, options) { this.type = type; this.detail = options?.detail; }
    },
    console
  };
  context.window = context;
  context.TopkeyHubSession = {
    needsFreshLogin: () => true,
    markAuthenticated: () => { authenticatedMarks += 1; },
    normalizeSportScope: value => value?.sportScope || '',
    canProfileAccess: value => value?.active !== false
  };

  vm.createContext(context);
  vm.runInContext(platformSource, context);
  vm.runInContext(fs.readFileSync(path.join(root, 'topkey-shared-auth.js'), 'utf8'), context);
  vm.runInContext(authSource, context);
  await context.Topkey.Auth.init();
  await new Promise(resolve => setTimeout(resolve, 25));

  assert.strictEqual(signOuts, 0, label + ': a valid persisted Firebase user must not be signed out by a fresh Hub ticket');
  assert.strictEqual(profileReads, 1, label + ': the server-side profile must be verified exactly once');
  assert.strictEqual(context.Topkey.Auth._profileVerifiedUid, user.uid);
  assert.strictEqual(authenticatedMarks, 1, 'the verified Hub session must be marked authenticated');
  assert.strictEqual(elements['app-shell'].classList.contains('hidden'), false, 'protected app shell must open');
  assert.strictEqual(elements['login-screen'].classList.contains('hidden'), true, 'login screen must stay hidden');
}

Promise.resolve()
  .then(() => restoredSessionScenario('badminton', badmintonAuthSource))
  .then(() => restoredSessionScenario('vnext', vnextAuthSource))
  .then(() => console.log('H117_AUTH_SESSION_RESTORE_OK'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
