const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('topkey/index.html','utf8');
const css=fs.readFileSync('topkey/hub-contrast-readable-h216.css','utf8');
assert.ok(html.includes('hub-contrast-readable-h216.css?v=h216-readable-20261124'),'Hub must load H216 cache key');
for(const token of ['#f7fbff','#d8e5ef','#102a43','#7897b0','font-size:13px','grid-template-columns:repeat(2,minmax(0,1fr))','@media(max-width:360px)','prefers-reduced-motion:reduce']){
 assert.ok(css.includes(token),'H216 missing readability/responsive contract: '+token);
}
assert.ok(css.includes('#topkey-sports .sport p'),'sport descriptions must have explicit readable color');
assert.ok(css.includes('#topkey-sports .sport h3'),'sport titles must have explicit readable color');
assert.ok(css.includes('#topkey-sports .sport .open'),'sport actions must have explicit readable color');
assert.ok(!css.includes('display:none!important'),'H216 must not hide content');
console.log('H216 Hub readability contract passed: explicit foregrounds, controls, sport-card typography, 2-column mobile and narrow-phone fallback.');
