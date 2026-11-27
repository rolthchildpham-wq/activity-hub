const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// This is an inventory guard, not a claim that every layer is still needed.
// Remove entries only in a later migration that proves visual + behavior parity.
const expectedStyles = [
  'styles.css',
  'upgrade30.css',
  'upgrade53.css',
  'executive-dashboard.css',
  'executive-sport-insights.css',
  'club-planning.css',
  'hub-layout94.css',
  'sports-hub-bi.css',
  'hub-compact-h130.css',
  'hub-single-row.css',
  'contrast-unified-h140.css',
  'collapsible-panels-h141.css',
  'hub-visual-h200.css',
  'visual-contrast-h203.css',
  'hub-unslop-h206.css',
  'hub-animal-polish-h208.css',
  'hub-layout-h209.css',
  'hub-contrast-readable-h216.css',
  'hub-dashboard-reference-h219.css',
  'hub-ecc-design-system.css',
  'hub-workspace-nav-h231.css',
  'hub-redesign-h240.css',
  'hub-canva-design-system-h251.css'
];
const expectedScripts = [
  'release-runtime.js',
  'hub-workspace-h240.js',
  'upgrade30.js',
  'upgrade53.js',
  'executive-sport-insights.js',
  'executive-dashboard.js',
  'club-planning.js',
  'hub-layout94.js',
  'release-coordinator.js',
  'hub-auth-flow.js',
  'topkey-dynamic-i18n.js',
  'hub-compact-h130.js',
  'collapsible-panels-h141.js'
];

function localAssets(regex, label) {
  return [...html.matchAll(regex)].map(([, asset]) => {
    const pathname = decodeURIComponent(new URL(asset, 'https://topkey.invalid/').pathname);
    const target = path.resolve(root, '.' + pathname);
    assert.ok(target.startsWith(root + path.sep), label + ' escapes Hub root: ' + asset);
    assert.ok(fs.existsSync(target) && fs.statSync(target).isFile(), 'Missing ' + label + ': ' + asset);
    return path.basename(pathname);
  });
}

const styles = localAssets(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']\.\/([^"'?#]+\.css)(?:\?[^"']*)?["'][^>]*>/gi, 'stylesheet');
const scripts = localAssets(/<script\b[^>]*\bsrc=["']\.\/([^"'?#]+\.js)(?:\?[^"']*)?["'][^>]*>/gi, 'script');

assert.deepEqual(styles, expectedStyles, 'Hub stylesheet order/inventory changed; review as an explicit migration');
assert.deepEqual(scripts, expectedScripts, 'Hub script order/inventory changed; review runtime dependencies before changing');
assert.equal(new Set(styles).size, styles.length, 'Duplicate Hub stylesheet import');
assert.equal(new Set(scripts).size, scripts.length, 'Duplicate Hub script import');
assert.equal(styles.at(-2), 'hub-workspace-nav-h231.css', 'Legacy workspace style layer must remain before H240');
assert.equal(styles.at(-2), 'hub-redesign-h240.css', 'H240 workspace architecture layer must remain before Canva visual tokens');
assert.equal(styles.at(-1), 'hub-canva-design-system-h251.css', 'Canva design system must be the final Hub visual layer');
assert.equal(scripts.includes('hub-workspace-nav-h231.js'), false, 'Legacy H231 controller must not compete with H240');

console.log(JSON.stringify({
  status: 'PASS',
  stylesheetCount: styles.length,
  scriptCount: scripts.length,
  finalDesignLayer: styles.at(-2),
  finalWorkspaceLayer: styles.at(-2),
  finalCanvaLayer: styles.at(-1),
  policy: 'Inventory is intentionally frozen until each removal has parity evidence'
}, null, 2));
