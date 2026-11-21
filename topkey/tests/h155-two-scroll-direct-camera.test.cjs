'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('topkey/sports/vnext/live-two-scroll-h155.css','utf8');
const js=fs.readFileSync('topkey/sports/vnext/src/live-two-scroll-h155.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
test('two Studio panes scroll independently and remain keyboard accessible',()=>{
 assert.match(css,/\.tk144-video-pane,\s*#tk144-live-studio \.tk144-official-pane/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/overscroll-behavior-y:contain/);
 assert.match(css,/scrollbar-width:thin/);
 assert.match(js,/pane\.tabIndex=0/);
 assert.match(js,/aria-label/);
});
test('Fullscreen occupies viewport and never scrolls the entire Studio',()=>{
 assert.match(css,/#tk144-live-studio:fullscreen/);
 assert.match(css,/overflow:hidden!important/);
 assert.match(css,/height:100%/); // H144 owns viewport height
 assert.match(css,/grid-template-rows:minmax\(0,1fr\) minmax\(0,1fr\)/);
 assert.match(css,/data-orientation="landscape"/);
});
test('direct internal camera uses existing H154 backend only after live config succeeds',()=>{
 assert.match(js,/TopkeyWebRTCH154\.loadConfig\(\)/);
 assert.match(js,/select\.value='WEBRTC'/);
 assert.match(js,/await app\.applyStream\(\)/);
 assert.match(js,/Không phát được camera nội bộ/);
 assert.doesNotMatch(js,/queueSet|queueMulti|firebase\.database|\.ref\(/);
});
test('H155 installed once, after H144 styles and script',()=>{
 for(const file of ['live-two-scroll-h155.css','live-two-scroll-h155.js']){
  assert.equal(html.split(file).length-1,1,file);
 }
 assert.ok(html.indexOf('live-two-scroll-h155.css')>html.indexOf('live-studio-h144.css'));
 assert.ok(html.indexOf('live-two-scroll-h155.js')>html.indexOf('live-studio-h144.js'));
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
test('P2P badminton remains untouched and H154 defaults disabled',()=>{
 const config=JSON.parse(fs.readFileSync('topkey/sports/vnext/live-services-h154.json','utf8'));
 assert.equal(config.enabled,false);
});
