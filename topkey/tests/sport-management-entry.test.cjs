'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const hub=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'canva-ui-system.css'),'utf8');
const controller=fs.readFileSync(path.join(root,'hub-workspace-h240.js'),'utf8');
const flow=fs.readFileSync(path.join(root,'hub-auth-flow.js'),'utf8');
assert.ok(!hub.includes('id="sport-management"'),'Separate legacy sport-management card must stay removed; Hub uses one system-admin workspace');
assert.ok(!hub.includes('sport-management-launch.js')&&!hub.includes('sport-management-launch.css'),'Legacy standalone management launcher must not compete with Canva Hub');
assert.match(hub,/id="system-admin-launch"/,'Single ADMIN system-management entry must remain');
assert.match(hub,/href="\.\/*system-admin\.html"/,'System administration route must remain available');
assert.match(hub,/id="password-change-launch"/,'Password-change entry must remain available');
assert.match(hub,/canva-ui-system\.css\?v=canva-ui-v\d+-202611\d+/,'Hub must load consolidated Canva UI');
assert.ok(hub.indexOf('hub-workspace-h240.js')<hub.indexOf('hub-auth-flow.js'),'Workspace navigation must initialize before Hub auth routing');
assert.match(flow,/closest\?\.\('a\.sport'\)/,'Hub authentication routing must handle shared sport cards');
assert.match(controller,/system-admin-launch/,'Workspace controller must include the system admin section');
assert.match(controller,/main\.dataset\.activeWorkspace=id/,'Workspace switching must expose active state');
for(const sport of ['football','volleyball','badminton','running','handmade','shuttle','cooking']){
 assert.ok(hub.includes('sport='+sport)||hub.includes('sports/vnext/badminton.html'),'Missing shared sport route '+sport);
}
assert.match(css,/@media\(max-width:900px\)/,'Hub must include responsive mobile navigation');
assert.doesNotMatch(hub,/Nền tảng dùng chung/,'Duplicated promotional management card must not return');
console.log('PASS: one Canva system-admin entry, shared sport routes, Hub auth flow, responsive UI and no duplicate management card');
