'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('topkey/sports/vnext/src/twitch-mobile-live-h161.js','utf8');
const viewer=fs.readFileSync('topkey/sports/vnext/src/public-viewer-h137.js','utf8');
const guard=fs.readFileSync('topkey/sports/vnext/src/live-state-h143.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
function api(){
 const window={__TOPKEY_PUBLIC_ROUTE:false,addEventListener(){}};
 const sandbox={window,document:{readyState:'loading',addEventListener(){}},URL};
 vm.runInNewContext(source,sandbox,{timeout:1000});
 return window.TopkeyTwitchH161;
}
test('Twitch public stream URL and username are canonical and domain-restricted',()=>{
 const a=api();
 assert.equal(a.channelFrom('https://www.twitch.tv/topkey_sports'),'topkey_sports');
 assert.equal(a.channelFrom('TOPKEY_SPORTS'),'topkey_sports');
 assert.equal(a.embedFor('topkey_sports','topkey-activity-management.edgeone.dev'),
  'https://player.twitch.tv/?channel=topkey_sports&parent=topkey-activity-management.edgeone.dev&autoplay=false');
});
test('URL parser rejects phishing, credentials and non-channel paths',()=>{
 const a=api();
 for(const input of ['http://twitch.tv/abcd','https://twitch.tv.evil.test/abcd',
  'https://twitch.tv@evil.test/abcd','https://www.twitch.tv/videos/123',
  'https://www.twitch.tv/directory','https://www.twitch.tv/abcd?token=abc',
  'javascript:alert(1)','abc','../secret']){
  assert.equal(a.channelFrom(input),null,input);
 }
});
test('Viewer reconstructs Twitch parent from actual Viewer host, not stored value',()=>{
 assert.match(viewer,/host==="player.twitch.tv"/);
 assert.match(viewer,/location\.hostname/);
 assert.match(viewer,/\^\[a-z0-9_\]\{4,25\}\$/);
 assert.match(viewer,/autoplay=false/);
});
test('Guard accepts official Twitch domain and preserves existing sources',()=>{
 assert.match(guard,/player\\\.twitch\\\.tv/);
 assert.match(guard,/youtube\\\.com/);
 assert.match(guard,/player\\\.vimeo\\\.com/);
 assert.match(guard,/kind==='CAMERA'/);
});
test('H161 source uses official embed and existing permission-aware stream flow',()=>{
 assert.match(source,/T\.Auth\?\.can\?\.\('live'\)/);
 assert.match(source,/source\.value='EMBED'/);
 assert.match(source,/await app\.applyStream\(\)/);
 assert.doesNotMatch(source,/firebase\.database|queueSet\(|queueMulti\(|stream_key|streamKey/);
 assert.match(html,/twitch-mobile-live-h161\.js/);
 assert.match(html,/twitch-mobile-live-h161\.css/);
});
test('H161 does not claim to mix local TOPKEY BLV into Twitch',()=>{
 assert.match(source,/không tự truyền vào Twitch/);
 assert.doesNotMatch(source,/livenow\.one/);
});
