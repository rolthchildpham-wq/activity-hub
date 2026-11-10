const fs=require('fs');const src=fs.readFileSync(require('path').join(__dirname,'../src/upgrade88.js'),'utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(src.includes("String(st.status||'').toUpperCase()==='LIVE'"),'viewer must discover a streaming court without requiring active match');
ok(src.includes("stream?.getVideoTracks?.().some(t=>t.readyState==='live')"),'WebRTC button must detect current camera stream');
ok(src.includes("publishSharedCamera(court,stream)"),'WebRTC button must reuse current MediaStream');
ok(src.includes("Viewer sẽ tự kết nối"),'shared-camera publish must advertise viewer auto-connect');
console.log('upgrade88a viewer autolive regression: PASS');
