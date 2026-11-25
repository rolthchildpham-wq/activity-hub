const fs=require('node:fs');
const assert=require('node:assert/strict');
const hub=fs.readFileSync('topkey/index.html','utf8');
const vnext=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const css=fs.readFileSync('topkey/hub-dashboard-reference-h219.css','utf8');
const dash=fs.readFileSync('topkey/executive-dashboard.js','utf8');
assert.ok(hub.includes('hub-dashboard-reference-h219.css?v=h219-liberty-dashboard-20261125'),'Hub must load H219 visual system');
assert.ok(hub.includes('executive-dashboard.js?v=h219-calendar-20261125'),'Hub must bypass the stale dashboard script cache');
assert.ok(hub.includes('sports/vnext/index.html?sport=badminton&amp;v=h219-liberty-dashboard-20261125'),'Badminton must use the shared sport launcher');
assert.ok(!hub.includes('class="sport badminton"'),'Badminton must not be visually detached from the sport catalog');
assert.ok(hub.includes("const base='./sports/vnext/index.html'")&&hub.includes("sport});"),'Test Lab must use the shared sport launcher for every sport');
assert.ok(vnext.includes('tk219-badminton-unified-route')&&vnext.includes("params.get('sport')!=='badminton'"),'Shared VNext launcher must hand off to the existing badminton engine');
assert.ok(dash.includes('calendarEvents')&&dash.includes('match?.date')&&dash.includes('calendarMarkup(data.calendarEvents||[])'),'Dashboard calendar must be derived from saved match dates');
for(const token of ['#f6f3eb','#fff','#1d2d4d','#a63d32','#81502c','grid-template-columns:repeat(7,minmax(0,1fr))','@media(max-width:820px)','exec-calendar-day'])assert.ok(css.includes(token),'Missing H219 design contract: '+token);
function luminance(hex){const channels=hex.match(/[0-9a-f]{2}/gi).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]}
function contrast(foreground,background){const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05)}
for(const [foreground,background] of [['#1e293b','#ffffff'],['#566273','#ffffff'],['#ffffff','#1d2d4d'],['#ffffff','#a63d32'],['#745334','#faf7f1']])assert.ok(contrast(foreground,background)>=4.5,'WCAG AA failed '+foreground+' on '+background);
console.log('H219 Hub unified catalog, badminton handoff, data-backed calendar, responsive design and WCAG color contracts passed.');
