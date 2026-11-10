const fs=require('node:fs');const assert=require('node:assert/strict');
for(const sport of ['badminton','vnext']){
 const html=fs.readFileSync('topkey/sports/'+sport+'/index.html','utf8');
 const sw=fs.readFileSync('topkey/sports/'+sport+'/sw.js','utf8');
 const version='topkey-shared-auth.js?v=u122h120-auth-p5-20261110';
 assert.ok(html.includes(version),sport+' page must request P5 auth');
 assert.ok(sw.includes(version),sport+' service worker must cache P5 auth');
 assert.ok(sw.includes('auth-p5-20261110'),sport+' cache must invalidate previous release');
}
console.log('TOPKEY P5 auth asset version regression passed');
