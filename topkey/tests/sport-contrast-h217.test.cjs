const fs=require('node:fs');
const assert=require('node:assert/strict');
const vhtml=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const bhtml=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const vcss=fs.readFileSync('topkey/sports/vnext/contrast-global-h217.css','utf8');
const bcss=fs.readFileSync('topkey/sports/badminton/contrast-global-h217.css','utf8');
assert.ok(/canva-sports-ui\\.css\\?v=canva-sports-v\\d+-202611\\d+/.test(vhtml),'VNext must load the consolidated Canva sports UI');
assert.ok(!vhtml.includes('contrast-global-h217.css'),'Legacy H217 visual stylesheet must not load in VNext');
assert.ok(bhtml.includes("query.set('sport', 'badminton')"),'Legacy badminton route must hand off to shared VNext workspace');
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
assert.ok(!vhtml.includes('workspace-contrast-h234.css'),'Legacy H234 visual stylesheet must not load in VNext');
const scheduleRuntime=fs.readFileSync('topkey/sports/vnext/workspace-contrast-runtime-h238.js','utf8');
assert.ok(vhtml.includes('workspace-contrast-runtime-h238.js?v=h252-settings-clock-targeted-aa-20261128'),'VNext must load the H251 unconditional podium runtime guard');
assert.ok(scheduleRuntime.includes(`node.style.setProperty('color',SAFE,'important')`),'H244 runtime must apply WCAG-safe foregrounds');
assert.ok(scheduleRuntime.includes("const ROOT = 'body';"),'H243 runtime must cover every document-mounted workspace page');
assert.ok(scheduleRuntime.includes('characterData:true'),'H245 runtime must inspect wrapper text content');
assert.ok(!scheduleRuntime.includes("const settingsClock = node.tagName === 'B'"),'H252 must not force dark ink on every bold settings label');
assert.ok(scheduleRuntime.includes("const settingsDarkSurface = node.closest('#page-settings')"),'H248 must force light text on every dynamically rendered dark settings surface');
assert.ok(scheduleRuntime.includes("window.__TOPKEY_WORKSPACE_CONTRAST_H251={"),'H248 runtime must expose its versioned verification handle');
assert.ok(scheduleRuntime.includes('new MutationObserver(schedule)'),'H244 runtime must track dynamic workspace content');
assert.ok(scheduleContrast.includes('#tk79-prize-editor :is(div,p,small,label,strong,b,span,em,li,td,th)'), 'H247 must preserve readable text inside the dark prize editor');
console.log('H247 global workspace contrast regression contract passed.');

const settingsContrast=fs.readFileSync('topkey/sports/vnext/workspace-contrast-h234.css','utf8');
assert.ok(settingsContrast.includes('html body #page-settings b:not(button *):not(.btn *)'), 'H243 must cover unclassed live clock/status labels across settings surfaces, not only descendants of .card');
assert.ok(settingsContrast.includes('-webkit-text-fill-color:#29465b!important'), 'H242 must enforce a dark WebKit text fill on light settings surfaces');
assert.ok(settingsContrast.includes('workspace-contrast-h234.css?v=h242-settings-aa-20261127')===false, 'Cache-busting belongs to the HTML entrypoint, not the stylesheet');
console.log('H242 settings live-label contrast contract passed.');

assert.ok(settingsContrast.includes('html body #page-settings #tk79-prize-editor :is(h1,h2,h3,h4,p,small,label,strong,b,span,em,li,td,th)'), 'H243 must restore readable light text on the dark prize editor');
assert.ok(!vhtml.includes('workspace-contrast-h234.css'), 'Legacy H234 settings contrast stylesheet must remain unloaded');

assert.ok(scheduleRuntime.includes("const ROOT = 'body';"), 'Dynamic contrast guard must cover legacy pages mounted outside #app-shell');

assert.ok(!scheduleRuntime.includes('settingsClock') && scheduleRuntime.includes('luminance(bg) < 0.72'), 'H252 must choose dark text only for light surfaces and light text for dark settings surfaces');
assert.ok(scheduleRuntime.includes("node.style.setProperty('color',SAFE,'important')"), 'H252 must retain dark foreground for text on light settings surfaces');
console.log('H249 settings clock priority regression contract passed.');

const overviewContrast=fs.readFileSync('topkey/sports/vnext/workspace-contrast-h234.css','utf8');
assert.ok(overviewContrast.includes('html body #app-shell #page-overview .tk9-podium .tk9-medal'), 'H250 must set a readable foreground for podium medal glyphs on dark medal discs');
assert.ok(overviewContrast.includes('-webkit-text-fill-color:#f8fbff!important'), 'H250 must override inherited WebKit text fill on medal glyphs');
assert.ok(vhtml.includes('canva-sports-ui.css?v=canva-sports-v1-20261127'), 'VNext must use the consolidated Canva visual layer instead of legacy H250/H251 layers');
console.log('H250 overview podium medal WCAG AA regression contract passed.');

assert.ok(scheduleRuntime.includes("const podiumMedal = node.classList.contains('tk9-medal')"), 'H250 must detect podium medal text on dark discs');
assert.ok(scheduleRuntime.includes("node.style.setProperty('color','#f8fbff','important')"), 'H250 must override inline/inherited dark medal text');
assert.ok(scheduleRuntime.includes("window.__TOPKEY_WORKSPACE_CONTRAST_H251={"), 'H250 runtime must expose its versioned verification handle');
console.log('H250 dynamic podium medal contrast regression contract passed.');

assert.ok(scheduleRuntime.includes("const podiumMedal = node.classList.contains('tk9-medal');"), 'H251 must force white foreground on all medal glyphs without relying on ancestor background detection');
assert.ok(scheduleRuntime.includes("window.__TOPKEY_WORKSPACE_CONTRAST_H251={"), 'H251 runtime handle must be versioned');
console.log('H251 unconditional podium medal contrast regression contract passed.');
