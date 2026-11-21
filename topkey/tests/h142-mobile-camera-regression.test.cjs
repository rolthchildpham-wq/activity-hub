'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('topkey/sports/vnext/src/app.js','utf8');
const bridge=fs.readFileSync('topkey/sports/vnext/src/mobile-camera-h142.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const badminton=fs.readFileSync('topkey/sports/badminton/src/upgrade80.js','utf8');

test('VNext mobile camera defaults rear and can switch to front',()=>{
 assert.match(app,/async acquireCameraStream\(facing=this\.cameraFacing\|\|'environment'\)/);
 assert.match(app,/facingMode:\{exact:desired\}/);
 assert.match(app,/facingMode:\{ideal:desired\}/);
 assert.match(app,/async switchCamera\(\)/);
 assert.match(app,/old\.getTracks\?\.\(\)\.forEach\(t=>t\.stop\(\)\)/);
 assert.match(app,/this\.localMedia=await this\.acquireCameraStream\(\)/);
 assert.doesNotMatch(app,/getUserMedia\(\{video:true,audio:true\}\)/);
});
test('Live camera switch does not write Firebase stream status',()=>{
 const start=app.indexOf('async switchCamera(){');
 const end=app.indexOf('async applyStream(){',start);
 const portion=app.slice(start,end);
 assert.ok(start>0 && end>start);
 assert.doesNotMatch(portion,/queue(Set|Multi)|\.db\.ref\(|location\.reload/);
 assert.match(portion,/this\.cameraFacing=previous/);
 assert.match(portion,/this\.acquireCameraStream\(previous\)/);
});
test('selector, switch button and source-specific hiding exist',()=>{
 assert.match(html,/id="tk142-camera-facing"/);
 assert.match(html,/<option value="environment" selected>/);
 assert.match(html,/<option value="user">/);
 assert.match(html,/id="tk142-camera-switch"/);
 assert.match(html,/mobile-camera-h142\.js/);
 assert.match(html,/#tk142-camera-control\[hidden\]\{display:none!important\}/);
 assert.match(bridge,/source\.value!=='CAMERA'/);
 assert.match(bridge,/app\(\)\.switchCamera/);
 assert.match(html,/aria-live="polite"/);
});
test('badminton existing front/rear choice is preserved',()=>{
 assert.match(badminton,/let facing='environment'/);
 assert.match(badminton,/tk80-camera-switch/);
 assert.match(badminton,/openPreferredCamera/);
});
