'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
const js=fs.readFileSync('topkey/sports/vnext/src/live-two-scroll-h155.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
test('two Studio panes scroll independently and remain keyboard accessible',()=>{
 assert.ok(css.includes('#tk144-live-studio .tk144-video-pane'));
 assert.ok(css.includes('#tk144-live-studio .tk144-official-pane'));
 assert.ok(css.includes('overflow-y:auto'));
 assert.ok(css.includes('overscroll-behavior-y:contain'));
 assert.ok(css.includes('scrollbar-width:thin'));
 assert.match(js,/pane\.tabIndex=0/);assert.match(js,/aria-label/);
});
test('Fullscreen occupies viewport and never scrolls the entire Studio',()=>{
 assert.ok(css.includes('#tk144-live-studio:fullscreen'));
 assert.ok(css.includes('overflow:hidden!important'));
 assert.ok(css.includes('height:100%'));
 assert.ok(css.includes('grid-template-rows:minmax(0,1fr) minmax(0,1fr)'));
 assert.ok(css.includes('data-orientation="landscape"'));
});
test('direct internal camera uses existing H154 backend only after live config succeeds',()=>{
 assert.match(js,/TopkeyWebRTCH154\.loadConfig\(\)/);assert.match(js,/select\.value='WEBRTC'/);assert.match(js,/await app\.applyStream\(\)/);assert.match(js,/Không phát được camera nội bộ/);
 assert.doesNotMatch(js,/queueSet|queueMulti|firebase\.database|\.ref\(/);
});
test('H155 script is installed once and Canva stylesheet replaces its old CSS file',()=>{
 assert.equal(html.split('live-two-scroll-h155.js').length-1,1);
 assert.ok(/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/.test(html));
 assert.ok(!html.includes('live-two-scroll-h155.css'));
 assert.equal(css.split('{').length,css.split('}').length);
});
test('P2P badminton remains untouched and H154 defaults disabled',()=>{
 const config=JSON.parse(fs.readFileSync('topkey/sports/vnext/live-services-h154.json','utf8'));assert.equal(config.enabled,false);
});
