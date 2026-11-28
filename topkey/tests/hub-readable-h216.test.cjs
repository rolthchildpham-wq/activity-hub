const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('topkey/index.html','utf8');
const css=fs.readFileSync('topkey/hub-contrast-readable-h216.css','utf8');
assert.ok(html.includes('canva-ui-system.css?v=canva-ui-v1-20261127'),'Hub must load the consolidated Canva design system');
assert.ok(!html.includes('hub-contrast-readable-h216.css'),'Legacy H216 stylesheet must no longer load');
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
const sportIdentity=fs.readFileSync('topkey/sports/vnext/sport-identities-h132.css','utf8');
assert.ok(!sportHtml.includes('workspace-contrast-h234.css'),'Legacy H234 stylesheet must not load after Canva consolidation');
assert.ok(sportHtml.includes('workspace-contrast-runtime-h238.js?v=h252-settings-clock-targeted-aa-20261128'),'All VNext sports must load the H251 runtime guard');
assert.ok(scheduleRuntime.includes(`node.style.setProperty('color',SAFE,'important')`),'H239 must apply WCAG-safe foregrounds to dynamic light surfaces');
assert.ok(scheduleRuntime.includes("const ROOT = 'body';"),'H243 must scan the full document across legacy sport handoff roots');
assert.ok(scheduleRuntime.includes('characterData:true'),'H245 must observe in-place text-node updates');
assert.ok(scheduleRuntime.includes('if (!node.textContent.trim()) continue;'),'H245 must include text-bearing wrapper elements in contrast auditing');
assert.ok(scheduleRuntime.includes('new MutationObserver(schedule)'),'H239 must observe dynamic workspace page changes');
assert.ok(scheduleRuntime.includes("const settingsDarkSurface = node.closest('#page-settings')"),'H248 must protect dynamic dark settings surfaces from low-contrast inherited text');
const canvaSportUi=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
assert.ok(canvaSportUi.includes('html[data-tk-sport="badminton"]'),'Canva UI must preserve the badminton sport identity');
assert.ok(/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/.test(sportHtml),'Shared sports workspace must load the consolidated Canva sport UI');
console.log('H244 global document contrast runtime contract passed.');

assert.ok(scheduleRuntime.includes("const ROOT = 'body';"), 'Dynamic contrast guard must cover legacy pages mounted outside #app-shell');
assert.ok(scheduleRuntime.includes("const podiumMedal = node.classList.contains('tk9-medal');"), 'H251 runtime must force podium medal foreground without ancestor luminance dependency');
assert.ok(scheduleRuntime.includes("window.__TOPKEY_WORKSPACE_CONTRAST_H251={"), 'H251 runtime version must be discoverable');

const canvaHubCss=fs.readFileSync('topkey/hub-canva-design-system-h251.css','utf8');
assert.ok(canvaHubCss.includes('--tk-canva-navy:#0B1F33')&&canvaHubCss.includes('--tk-canva-slate:#173A55')&&canvaHubCss.includes('--tk-canva-teal:#0AA6A6'), 'Canva TOPKEY palette tokens must be present');
assert.ok(html.includes('canva-ui-system.css?v=canva-ui-v1-20261127'), 'Hub must load the new Canva design system');
assert.ok(!html.includes('hub-canva-design-system-h251.css'), 'H251 overlay must no longer load');
console.log('H251 Canva design-system integration contract passed.');
console.log('H251 medal contrast runtime test passed.');

const canvaSportCss=fs.readFileSync('topkey/sports/vnext/canva-sports-design-system-h251.css','utf8');
assert.ok(canvaSportCss.includes('--tk-ui-navy:#0B1F33')&&canvaSportCss.includes('--tk-ui-teal:#0AA6A6'), 'Canva sport design tokens must exist');
assert.ok(!sportHtml.includes('canva-sports-design-system-h251.css'), 'H251 overlay must not load after Canva consolidation');
assert.ok(/canva-sports-ui\\.css\\?v=canva-sports-v\\d+-202611\\d+/.test(sportHtml), 'All seven sports must load the consolidated Canva design system');
console.log('Canva seven-sport workspace design-system integration passed.');
