'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const corePath = path.join(ROOT, 'topkey-platform-core.js');

async function run() {
  assert(fs.existsSync(corePath), 'H119 platform core must exist');
  const source = fs.readFileSync(corePath, 'utf8');
  const events = [];
  const listeners = [];
  const firebase = {
    apps: [],
    initializeApp(config) {
      events.push(['initialize', config.projectId]);
      this.apps.push({config});
      return this.apps[0];
    },
    app() { return this.apps[0]; }
  };
  const initializeApp = firebase.initializeApp.bind(firebase);
  const document = {
    documentElement: {classList: {remove() {}}},
    addEventListener(type, handler, capture) { listeners.push({type, handler, capture}); },
    getElementById() { return null; },
    createElement() { return {dataset: {}, setAttribute() {}, textContent: ''}; }
  };
  const context = {
    window: null,
    document,
    location: {hash: '', href: 'https://example.invalid/sports/badminton/index.html'},
    history: {state: null, replaceState() {}},
    firebase,
    console,
    Promise,
    Date,
    URL,
    setTimeout,
    clearTimeout,
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    dispatchEvent() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);

  let appReadyAt = 0;
  const starts = {};
  const loader = src => new Promise(resolve => {
    const module = src.includes('firebase-app-compat') ? 'app'
      : src.includes('firebase-auth-compat') ? 'auth' : 'database';
    starts[module] = Date.now();
    events.push(['start', module]);
    setTimeout(() => {
      if (module === 'app') {
        firebase.initializeApp = initializeApp;
        appReadyAt = Date.now();
      } else if (module === 'auth') {
        firebase.auth = () => ({currentUser: null});
      } else {
        firebase.database = () => ({ref() {}});
      }
      events.push(['end', module]);
      resolve(src);
    }, module === 'app' ? 12 : 24);
  });

  delete firebase.initializeApp;
  const config = {apiKey: 'test', databaseURL: 'https://example.invalid', projectId: 'h119'};
  const first = context.TopkeyPlatform.loadFirebase(config, {loadScript: loader});
  const second = context.TopkeyPlatform.loadFirebase(config, {loadScript: loader});
  assert.strictEqual(first, second, 'rapid Firebase calls must share the exact same promise');
  await first;
  assert(starts.app, 'Firebase App must be loaded');
  assert(starts.auth >= appReadyAt && starts.database >= appReadyAt, 'Auth and Database must wait for Firebase App');
  assert(Math.abs(starts.auth - starts.database) < 8, 'Auth and Database must start in parallel');
  assert.strictEqual(events.filter(event => event[0] === 'start' && event[1] === 'app').length, 1, 'Firebase App loads once');
  assert.strictEqual(events.filter(event => event[0] === 'initialize').length, 1, 'default Firebase app initializes once');

  let logins = 0;
  const service = {login: async () => { logins++; }};
  context.TopkeyPlatform.bindLogin({ensureCore: async () => ({Auth: service})});
  context.TopkeyPlatform.bindLogin({ensureCore: async () => ({Auth: service})});
  const submitListeners = listeners.filter(listener => listener.type === 'submit');
  assert.strictEqual(submitListeners.length, 1, 'login controller binds one submit listener');

  const button = {disabled: false, textContent: 'Đăng nhập an toàn'};
  const form = {
    id: 'login-form',
    elements: {namedItem: name => ({value: name === 'email' ? 'admin@example.invalid' : 'password123'})},
    querySelector(selector) {
      if (selector.includes('button')) return button;
      if (selector === '[name="email"]') return {value: 'admin@example.invalid'};
      if (selector === '[name="password"]') return {value: 'password123'};
      return null;
    },
    append() {},
    reportValidity: () => true
  };
  const event = {target: form, preventDefault() {}, stopImmediatePropagation() {}};
  submitListeners[0].handler(event);
  submitListeners[0].handler(event);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.strictEqual(logins, 1, 'rapid duplicate submit must perform one login');

  console.log('H119_PLATFORM_BOOTSTRAP 10/10 PASS');
}

run().catch(error => { console.error(error); process.exit(1); });
