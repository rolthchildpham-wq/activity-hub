const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const src=read('src/upgrade98.js'),css=read('upgrade98.css'),u97=read('src/upgrade97.js'),build=JSON.parse(read('build.json'));
const n=Number((String(build.build).match(/upgrade(\d+)/)||[])[1]||0);
assert(src.includes('isPortraitTrack'),'must detect portrait-sized WebRTC track');
assert(src.includes('tk98-rot90'),'must retain portrait-track rotation');
assert(src.includes('tk98-public-rotate'),'must retain manual rotate fallback');
assert(!src.includes('getUserMedia'),'Viewer orientation layer must never open camera/mic');
assert(css.includes('--tk70-score:clamp(44px,14dvh,64px)'),'referee landscape score must remain enlarged');
assert(css.includes('min-height:44px!important'),'referee phone touch targets must remain at least 44px');
assert(css.includes('width:44px!important;height:44px!important'),'referee fullscreen exit target must remain 44x44');
if(n>=100){
  assert(!src.includes("screen.orientation?.lock?.('landscape')"),'U100 supersedes U98: no orientation lock');
  assert(src.includes('shouldAutoCorrect'),'U100 must auto-correct portrait WebRTC inline');
  assert(css.includes('object-fit:cover!important'),'U100 corrected track must cover horizontal player');
  assert(u97.includes('TopkeyUpgrade100?.viewerNativeFullscreen===true'),'U97 must yield fullscreen lifecycle to U100');
}else{
  assert(src.includes("screen.orientation?.lock?.('landscape')"),'legacy U98 must request landscape lock');
  assert(src.includes('requestFullscreen'),'legacy U98 must use native fullscreen');
}
console.log('PASS upgrade98 referee readability + orientation contract (U100 supersession aware)');
