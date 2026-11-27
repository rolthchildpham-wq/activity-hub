'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('topkey/sports/vnext/src/youtube-live-h157.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
function api(){
 const window={__TOPKEY_PUBLIC_ROUTE:false,addEventListener(){}};
 const context={window,URL,document:{readyState:'loading',addEventListener(){}},console};
 vm.runInNewContext(source,context,{timeout:1000});
 return window.TopkeyYouTubeH157;
}
test('accepts YouTube share, watch, live and embed links from official domains',()=>{
 const {parseVideoId,canonical}=api(),id='M7lc1UVf-VE';
 for(const url of [
  'https://www.youtube.com/watch?v='+id,
  'https://youtube.com/live/'+id,
  'https://youtu.be/'+id,
  'https://m.youtube.com/watch?v='+id,
  'https://www.youtube-nocookie.com/embed/'+id,
  id
 ]) {
  assert.equal(parseVideoId(url),id,url);
  assert.equal(canonical(url),'https://www.youtube-nocookie.com/embed/'+id+'?playsinline=1&rel=0');
 }
});
test('rejects phishing hosts, non-HTTPS, credentials and invalid video IDs',()=>{
 const {parseVideoId}=api();
 for(const url of [
  'http://youtube.com/watch?v=M7lc1UVf-VE',
  'https://youtube.com.evil.test/watch?v=M7lc1UVf-VE',
  'https://youtube.com@evil.test/watch?v=M7lc1UVf-VE',
  'https://www.youtube.com/live/invalid',
  'https://youtube.com/playlist?list=M7lc1UVf-VE',
  'javascript:alert(1)'
 ])assert.equal(parseVideoId(url),null,url);
});
test('OAuth is strictly read-only, opt-in and never stores bearer tokens',()=>{
 assert.match(source,/youtube\.readonly/);
 assert.match(source,/google\.accounts\.oauth2\.initTokenClient/);
 assert.match(source,/https:\/\/www\.googleapis\.com\/youtube\/v3\/channels/);
 assert.doesNotMatch(source,/localStorage|sessionStorage|youtube\.force-ssl|client_secret/);
});
test('source management retains existing Firebase rules and per-court app method',()=>{
 assert.match(source,/source\.value='EMBED'/);
 assert.match(source,/await app\.applyStream\(\)/);
 assert.match(source,/T\.Auth\?\.can\?\.\('live'\)/);
 assert.doesNotMatch(source,/queueSet\(|firebase\.database|\.ref\(/);
 assert.match(html,/youtube-live-h157\.js\?v=h157-20261121/);
 assert.ok(html.includes('canva-sports-ui.css?v=canva-sports-v1-20261127'));
});
test('OAuth client is disabled until provisioned by channel owner',()=>{
 const config=JSON.parse(fs.readFileSync('topkey/sports/vnext/youtube-oauth-h157.json','utf8'));
 assert.equal(config.clientId,'');
});

test('account switching requests Google account chooser and revokes stale token',()=>{
 assert.match(source,/id="tk158-switch-account"/);
 assert.match(source,/google\.accounts\.oauth2\.revoke\(previousToken/);
 assert.match(source,/prompt:switchAccount\?'select_account consent':'select_account'/);
 assert.match(source,/readonlyToken=null/);
 assert.match(source,/channelName=''/);
 assert.match(source,/connectReadOnly\(\{switchAccount:true\}\)/);
});


test('H159 removes Live Now app UI and provides official camera + YouTube Studio path',()=>{
 assert.doesNotMatch(source,/livenow\.one|Live Now/);
 assert.match(source,/id="tk159-camera-check"/);
 assert.match(source,/id="tk159-camera-stop"/);
 assert.match(source,/id="tk159-youtube-webcam"/);
 assert.match(source,/https:\/\/studio\.youtube\.com\//);
 assert.match(source,/navigator\.mediaDevices\.getUserMedia/);
 assert.match(source,/previewStream\.getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
 assert.match(source,/watch URL|liên kết xem|liên kết video Live/i);
});
test('H159 webcam path never exposes credentials or uploads local stream through Firebase',()=>{
 assert.doesNotMatch(source,/streamKey|stream_key|rtmps:\/\//i);
 assert.doesNotMatch(source,/queueMulti\(|queueSet\(/);
 assert.match(source,/source\.value='EMBED'/);
});
