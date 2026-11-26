const fs=require('node:fs');
const assert=require('node:assert/strict');
const hub=fs.readFileSync('topkey/index.html','utf8');
const vnext=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const css=fs.readFileSync('topkey/hub-dashboard-reference-h219.css','utf8');
const dash=fs.readFileSync('topkey/executive-dashboard.js','utf8');
assert.ok(hub.includes('hub-dashboard-reference-h219.css?v='),'Hub must load the H219 visual-system stylesheet with an explicit versioned cache key');
assert.ok(hub.includes('executive-dashboard.js?v=h232-live-schedule-20261126'),'Hub must bypass the stale dashboard script cache');
assert.ok(hub.includes('sports/vnext/badminton.html?sport=badminton&amp;__topkey_reload=h219-liberty-dashboard-20261125'),'Badminton must use the shared sport launcher');
assert.ok(!hub.includes('class="sport badminton"'),'Badminton must not be visually detached from the sport catalog');
assert.ok(hub.includes("const base=sport==='badminton'?'./sports/vnext/badminton.html':'./sports/vnext/index.html'"),'Test Lab must use the shared VNext launcher folder for every sport');
const badmintonEntry=fs.readFileSync('topkey/sports/vnext/badminton.html','utf8');
assert.ok(badmintonEntry.includes("new URL('./index.html', location.href)")&&badmintonEntry.includes("query.set('sport', 'badminton')"),'Badminton launcher must open the shared VNext workspace with the sport key');
assert.ok(!badmintonEntry.includes('../badminton/index.html'),'Badminton must not redirect to a separate legacy screen');
assert.ok(dash.includes('calendarEvents')&&dash.includes('match?.date')&&dash.includes('calendarMarkup(data.calendarEvents||[])'),'Dashboard calendar must be derived from saved match dates');
assert.ok(dash.includes('__liveCalendarEvents')&&dash.includes("db.ref(s.root+'/matches')"),'Dashboard calendar must include active sport schedules, not archive snapshots only');
for(const token of ['#f6f3eb','#fff','#1d2d4d','#a63d32','#81502c','grid-template-columns:repeat(7,minmax(0,1fr))','@media(max-width:820px)','exec-calendar-day'])assert.ok(css.includes(token),'Missing H219 design contract: '+token);
function luminance(hex){const channels=hex.match(/[0-9a-f]{2}/gi).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]}
function contrast(foreground,background){const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05)}
for(const [foreground,background] of [['#1e293b','#ffffff'],['#566273','#ffffff'],['#ffffff','#1d2d4d'],['#ffffff','#a63d32'],['#745334','#faf7f1']])assert.ok(contrast(foreground,background)>=4.5,'WCAG AA failed '+foreground+' on '+background);
console.log('H219 Hub catalog, shared badminton workspace, live schedule calendar, responsive design and WCAG color contracts passed.');
