const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const linkTags = html.match(/<link\b[^>]*>/gi) || [];
const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
const styles = linkTags.filter(tag => /\brel=["']stylesheet["']/i.test(tag)).map(tag => tag.match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean).map(src => path.basename(new URL(src,'https://topkey.invalid/').pathname));
const scripts = scriptTags.map(tag => tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]).filter(src => src && src.startsWith('./')).map(src => path.basename(new URL(src,'https://topkey.invalid/').pathname));
for (const tag of linkTags.filter(tag => /\brel=["']stylesheet["']/i.test(tag))) {
 const src=tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
 if(!src || !src.startsWith('./')) continue;
 const target=path.resolve(root,src.split('?')[0].slice(2));
 assert.ok(target.startsWith(root+path.sep),'stylesheet escapes Hub root: '+src);
 assert.ok(fs.existsSync(target),'missing stylesheet: '+src);
}
const expectedScripts=['release-runtime.js','hub-workspace-h240.js','upgrade30.js','upgrade53.js','executive-sport-insights.js','executive-dashboard.js','club-planning.js','hub-layout94.js','release-coordinator.js','hub-auth-flow.js','topkey-dynamic-i18n.js','collapsible-panels-h141.js'];
assert.deepEqual(styles,['canva-ui-system.css'],'Hub must load only the consolidated Canva UI stylesheet');
assert.deepEqual(scripts,expectedScripts,'Hub script order/inventory changed; review runtime dependencies before changing');
assert.equal(new Set(styles).size,styles.length,'duplicate Hub stylesheet import');
assert.equal(new Set(scripts).size,scripts.length,'duplicate Hub script import');
assert.ok(!/href=["'][^"']*(?:upgrade|hub-|contrast|visual|dashboard-reference).*\.css/i.test(html),'legacy Hub visual stylesheet must not be loaded');
console.log(JSON.stringify({status:'PASS',stylesheetCount:styles.length,scriptCount:scripts.length,activeDesignSystem:styles[0]},null,2));
