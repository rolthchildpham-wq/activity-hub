const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function localAssets(regex, label) {
  return [...html.matchAll(regex)].map(([, asset]) => {
    const pathname = decodeURIComponent(new URL(asset, 'https://topkey.invalid/').pathname);
    const target = path.resolve(root, '.' + pathname);
    assert.ok(target.startsWith(root + path.sep), label + ' escapes Hub root: ' + asset);
    assert.ok(fs.existsSync(target) && fs.statSync(target).isFile(), 'Missing ' + label + ': ' + asset);
    return path.basename(pathname);
  });
}

const styles = localAssets(/<link\\b(?=[^>]*\\brel=["']stylesheet["'])[^>]*\\bhref=["']\\.\\/([^"'?#]+\\.css)(?:\\?[^"']*)?["'][^>]*>/gi, 'stylesheet');
const scripts = localAssets(/<script\\b[^>]*\\bsrc=["']\\.\\/([^"'?#]+\\.js)(?:\\?[^"']*)?["'][^>]*>/gi, 'script');
const expectedScripts = [
  'release-runtime.js','hub-workspace-h240.js','upgrade30.js','upgrade53.js',
  'executive-sport-insights.js','executive-dashboard.js','club-planning.js',
  'hub-layout94.js','release-coordinator.js','hub-auth-flow.js',
  'topkey-dynamic-i18n.js','hub-compact-h130.js','collapsible-panels-h141.js'
];

assert.deepEqual(styles, ['canva-ui-system.css'], 'Hub must load only the consolidated Canva UI stylesheet');
assert.deepEqual(scripts, expectedScripts, 'Hub script order/inventory changed; review runtime dependencies before changing');
assert.equal(new Set(styles).size, styles.length, 'Duplicate Hub stylesheet import');
assert.equal(new Set(scripts).size, scripts.length, 'Duplicate Hub script import');
assert.ok(!/href=["'][^"']*(?:upgrade|hub-|contrast|visual|dashboard-reference).*\\.css/i.test(html),
  'Legacy Hub visual stylesheet must not be loaded by the entrypoint');

console.log(JSON.stringify({
  status: 'PASS',
  stylesheetCount: styles.length,
  scriptCount: scripts.length,
  activeDesignSystem: styles[0],
  policy: 'One Canva design-system stylesheet; legacy business scripts are preserved'
}, null, 2));
