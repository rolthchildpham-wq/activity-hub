const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'sports/badminton/production-loader.js');
assert(fs.existsSync(file), 'production loader must exist');
const index = fs.readFileSync(path.join(root, 'sports/badminton/index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sports/badminton/sw.js'), 'utf8');
const vnextIndex = fs.readFileSync(path.join(root, 'sports/vnext/index.html'), 'utf8');
const vnextBundle = fs.readFileSync(path.join(root, 'sports/vnext/h97-vnext.bundle.js'), 'utf8');
const vnextServiceWorker = fs.readFileSync(path.join(root, 'sports/vnext/sw.js'), 'utf8');
assert(index.includes('./production-loader.js'), 'Badminton boot must install the production loader');
for (const eager of ['h106-final-report-pdf.js', 'vendor/jszip.min.js', 'h112-ppt-template.js', 'h116-report-integrity.js', 'h116-custom-ppt.js', 'h113-finance-report.js']) {
  assert(!new RegExp(`<script[^>]+${eager.replaceAll('.', '\\.')}`).test(index), eager + ' must not be an eager script');
}
assert(index.includes("window.addEventListener('topkey:admin-ready',schedule"), 'indexed runtime must wait for verified admin-ready');
assert(serviceWorker.includes("'./production-loader.js?v="), 'service worker shell must include the loader');
assert(!serviceWorker.includes("'../../h113-finance-report.js?v="), 'service worker must not prefetch optional finance reports');
assert(vnextIndex.includes('../badminton/production-loader.js'), 'VNext must share the production loader');
for (const eager of ['qrcode.min.js', 'jszip.min.js', 'hls.js@1', 'h106-final-report-pdf.js', 'h112-ppt-template.js', 'h113-finance-report.js']) {
  assert(!new RegExp(`<script[^>]+src=["'][^"']*${eager.replaceAll('.', '\\.')}`).test(vnextIndex), 'VNext eager dependency: ' + eager);
}
assert(vnextIndex.includes("window.addEventListener('topkey:admin-ready',schedule"), 'VNext indexed runtime must wait for verified admin-ready');
assert(fs.readFileSync(path.join(root, 'topkey-shared-auth.js'), 'utf8').includes("'topkey:admin-ready'"), 'Shared verified Auth must emit admin-ready');
assert(!vnextServiceWorker.includes("'../../h113-finance-report.js?v="), 'VNext service worker must not prefetch optional reports');

function makeHarness() {
  const appended = [];
  const listeners = {};
  const nodes = [];
  const document = {
    hidden: false,
    head: {
      appendChild(node) {
        nodes.push(node);
        if (node.tagName === 'SCRIPT') appended.push(node.src);
        Promise.resolve().then(() => node.onload?.());
        return node;
      }
    },
    body: {appendChild(node) { return document.head.appendChild(node); }},
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        dataset: {},
        remove() {},
        set rel(value) { this._rel = value; },
        get rel() { return this._rel; }
      };
    },
    querySelector(selector) {
      const match = selector.match(/data-topkey-src="([^"]+)"/);
      return match ? nodes.find(node => node.dataset?.topkeySrc === match[1]) || null : null;
    },
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); }
  };
  const window = {
    document,
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
    requestIdleCallback(callback) { callback({didTimeout: false, timeRemaining: () => 50}); return 1; },
    setTimeout,
    clearTimeout,
    console
  };
  const context = {window, document, console, Promise, URL, setTimeout, clearTimeout};
  window.window = window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  return {api: window.TopkeyProductionLoader, appended, listeners};
}

(async () => {
  const {api, appended} = makeHarness();
  assert(api, 'loader API missing');
  assert.strictEqual(appended.length, 0, 'loader evaluation must not request optional scripts');

  const firstRuntime = api.loadRuntime(['./one.js', './two.js']);
  const secondRuntime = api.loadRuntime(['./ignored.js']);
  assert.strictEqual(firstRuntime, secondRuntime, 'runtime calls must share one promise');
  await firstRuntime;
  assert.deepStrictEqual(appended.slice(0, 2), ['./one.js', './two.js'], 'runtime scripts must execute in declared order');

  const beforeFeatures = appended.length;
  const firstFeature = api.loadFeature('reports');
  const secondFeature = api.loadFeature('reports');
  assert.strictEqual(firstFeature, secondFeature, 'feature calls must share one promise');
  await firstFeature;
  const reportLoads = appended.slice(beforeFeatures);
  assert(reportLoads.some(src => src.includes('jszip.min.js')), 'report intent must load JSZip');
  assert(reportLoads.some(src => src.includes('h112-ppt-template.js')), 'report intent must load PPT support');
  assert(reportLoads.some(src => src.includes('h106-final-report-pdf.js')), 'report intent must load PDF support');
  assert.strictEqual(new Set(reportLoads).size, reportLoads.length, 'each heavy dependency must load once');

  console.log('H117_PRODUCTION_LOADER_OK', JSON.stringify({runtime: 2, reports: reportLoads.length}));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
