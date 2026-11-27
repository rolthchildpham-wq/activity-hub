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

function luminance(hex){
 const c=hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrast(a,b){const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+.05)/(lo+.05)}
for(const [fg,bg] of [['#f7fbff','#14283a'],['#d8e5ef','#14283a'],['#ffffff','#087e70'],['#f7fbff','#102a43'],['#d1dfeb','#091522']]){
 assert.ok(contrast(fg,bg)>=4.5,'WCAG AA contrast failed '+fg+' on '+bg+': '+contrast(fg,bg).toFixed(2));
}
console.log('H216 WCAG AA color pairs passed.');

console.log('H216 Hub readability contract passed: explicit foregrounds, controls, sport-card typography, 2-column mobile and narrow-phone fallback.');

const sharedContrast=fs.readFileSync('topkey/sports/vnext/workspace-contrast-h234.css','utf8');
for(const token of ['#29465b','#075c43','#124d83','#8b1f2d','tk12-status-badge.finished','#526d80'])assert.ok(sharedContrast.includes(token),'Missing shared contrast token: '+token);
const sportHtml=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const scheduleRuntime=fs.readFileSync('topkey/sports/vnext/workspace-contrast-runtime-h238.js','utf8');
assert.ok(sportHtml.includes('workspace-contrast-h234.css?v=h237-schedule-aa-20261127'),'All VNext sports must load the cache-busted H237 schedule contrast layer');
assert.ok(sportHtml.includes('workspace-contrast-runtime-h238.js?v=h239-global-workspace-dynamic-aa-20261127'),'All VNext sports must load the H237 runtime guard');
assert.ok(scheduleRuntime.includes(`node.style.setProperty('color',SAFE,'important')`),'H239 must apply WCAG-safe foregrounds to dynamic light surfaces');
assert.ok(scheduleRuntime.includes("const ROOT = '#app-shell';"),'H239 must scan all workspace pages, including hidden pages before activation');\nassert.ok(scheduleRuntime.includes('characterData:true'),'H239 must observe in-place text-node updates');\nassert.ok(scheduleRuntime.includes('new MutationObserver(schedule)'),'H239 must observe dynamic workspace page changes');
console.log('H239 global workspace contrast runtime contract passed.');
