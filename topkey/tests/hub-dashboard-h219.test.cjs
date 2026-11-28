const fs=require('node:fs');
const assert=require('node:assert/strict');
const hub=fs.readFileSync('topkey/index.html','utf8');
const vnext=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const css=fs.readFileSync('topkey/canva-ui-system.css','utf8');
const dash=fs.readFileSync('topkey/executive-dashboard.js','utf8');
assert.ok(/canva-ui-system\.css\?v=canva-ui-v\d+-202611\d+/.test(hub),'Hub must load the consolidated Canva design-system stylesheet');
assert.ok(!hub.includes('hub-dashboard-reference-h219.css'),'Legacy H219 stylesheet must not load');
assert.ok(/executive-dashboard\.js\?v=h\d+-[a-z0-9-]+-202611\d+/.test(hub),'Hub must bypass the stale dashboard script cache');
assert.ok(hub.includes('sports/vnext/badminton.html?sport=badminton&amp;__topkey_reload=h219-liberty-dashboard-20261125'),'Badminton must use the shared sport launcher');
assert.ok(!hub.includes('class="sport badminton"'),'Badminton must not be visually detached from the sport catalog');
assert.ok(hub.includes("const base=sport==='badminton'?'./sports/vnext/badminton.html':'./sports/vnext/index.html'"),'Test Lab must use the shared VNext launcher folder for every sport');
const badmintonEntry=fs.readFileSync('topkey/sports/vnext/badminton.html','utf8');
assert.ok(badmintonEntry.includes("new URL('./index.html', location.href)")&&badmintonEntry.includes("query.set('sport', 'badminton')"),'Badminton launcher must open the shared VNext workspace with the sport key');
assert.ok(!badmintonEntry.includes('../badminton/index.html'),'Badminton must not redirect to a separate legacy screen');
assert.ok(dash.includes('calendarEvents')&&dash.includes('match?.date')&&dash.includes('calendarMarkup(data.calendarEvents||[])'),'Dashboard calendar must be derived from saved match dates');
assert.ok(dash.includes('__liveCalendarEvents')&&dash.includes("db.ref(s.root+'/matches')"),'Dashboard calendar must include active sport schedules, not archive snapshots only');
for(const token of ['--tk-navy:#0B1F33','--tk-slate:#173A55','--tk-teal:#0AA6A6','grid-template-columns:repeat(7,minmax(0,1fr))','@media(max-width:680px)','exec-calendar-day'])assert.ok(css.includes(token),'Missing H219 design contract: '+token);
function luminance(hex){const channels=hex.match(/[0-9a-f]{2}/gi).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]}
function contrast(foreground,background){const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05)}
for(const [foreground,background] of [['#F5FAFD','#0B1F33'],['#B8C9D6','#102B43'],['#ffffff','#173A55'],['#052B35','#0AA6A6'],['#E7F3F8','#102B43']])assert.ok(contrast(foreground,background)>=4.5,'WCAG AA failed '+foreground+' on '+background);
console.log('H219 Hub catalog, shared badminton workspace, live schedule calendar, responsive design and WCAG color contracts passed.');
