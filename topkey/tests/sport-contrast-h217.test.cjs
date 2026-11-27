const fs=require('node:fs');
const assert=require('node:assert/strict');
const vhtml=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const bhtml=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const vcss=fs.readFileSync('topkey/sports/vnext/contrast-global-h217.css','utf8');
const bcss=fs.readFileSync('topkey/sports/badminton/contrast-global-h217.css','utf8');
assert.ok(vhtml.includes('contrast-global-h217.css?v=h217-20261124'),'VNext must load H217');
assert.ok(bhtml.includes('contrast-global-h217.css?v=h217-20261124'),'Badminton must load H217');
for(const [name,css] of [['VNext',vcss],['Badminton',bcss]]){
 for(const token of ['#f8fbff','#d2e0ec','#e8f2fa','#102a43','#7897b0','@media(max-width:690px)','prefers-reduced-motion:reduce']){
  assert.ok(css.includes(token),name+' missing contrast/mobile contract '+token);
 }
 assert.ok(css.includes('.page .card'),'cards must have explicit surface/text colors');
 assert.ok(css.includes('.page .table-wrap'),'tables must have explicit container colors');
}
function lum(hex){const c=hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function ratio(a,b){const [hi,lo]=[lum(a),lum(b)].sort((x,y)=>y-x);return(hi+.05)/(lo+.05)}
for(const [fg,bg] of [['#f8fbff','#12283b'],['#d2e0ec','#12283b'],['#e8f2fa','#12283b'],['#f7fbff','#102a43']])assert.ok(ratio(fg,bg)>=4.5,'WCAG AA failed '+fg+'/'+bg);
assert.ok(vcss.includes('!important') && bcss.includes('!important'),'H217 must override legacy low-contrast theme rules');
console.log('H217 global sport contrast passed for VNext six-sport engine and Badminton; WCAG AA color pairs verified.');

const scheduleContrast=fs.readFileSync('topkey/sports/vnext/workspace-contrast-h234.css','utf8');
assert.ok(scheduleContrast.includes('html body #app-shell #page-schedule :is(b,span,small,p,label,li,td,th,strong,em)'),'Legacy schedule rows must receive explicit readable foregrounds without depending on page state classes');
assert.ok(scheduleContrast.includes('-webkit-text-fill-color:#29465b!important'),'Schedule text must override WebKit/inline text fill');
assert.ok(vhtml.includes('workspace-contrast-h234.css?v=h242-settings-aa-20261127'),'VNext must load the cache-busted H237 schedule contrast layer');
const scheduleRuntime=fs.readFileSync('topkey/sports/vnext/workspace-contrast-runtime-h238.js','utf8');
assert.ok(vhtml.includes('workspace-contrast-runtime-h238.js?v=h239-global-workspace-dynamic-aa-20261127'),'VNext must load the H237 schedule runtime guard');
assert.ok(scheduleRuntime.includes(`node.style.setProperty('color',SAFE,'important')`),'H239 runtime must apply WCAG-safe foregrounds');
assert.ok(scheduleRuntime.includes("const ROOT = '#app-shell';"),'H239 runtime must cover every workspace page');
assert.ok(scheduleRuntime.includes('characterData:true'),'H239 runtime must observe text-node changes');
assert.ok(scheduleRuntime.includes('new MutationObserver(schedule)'),'H239 runtime must track dynamic workspace content');
console.log('H239 global workspace contrast regression contract passed.');

const settingsContrast=fs.readFileSync('topkey/sports/vnext/workspace-contrast-h234.css','utf8');
assert.ok(settingsContrast.includes('html body #app-shell #page-settings b:not(button *):not(.btn *)'), 'H242 must cover unclassed live clock/status labels across settings surfaces, not only descendants of .card');
assert.ok(settingsContrast.includes('-webkit-text-fill-color:#29465b!important'), 'H242 must enforce a dark WebKit text fill on light settings surfaces');
assert.ok(settingsContrast.includes('workspace-contrast-h234.css?v=h242-settings-aa-20261127')===false, 'Cache-busting belongs to the HTML entrypoint, not the stylesheet');
console.log('H242 settings live-label contrast contract passed.');
