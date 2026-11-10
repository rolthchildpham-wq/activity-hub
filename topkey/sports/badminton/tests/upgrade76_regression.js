const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const u67=fs.readFileSync(path.join(root,'src/upgrade67.js'),'utf8');
const u76=fs.readFileSync(path.join(root,'src/upgrade76.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert(u67.includes("if(window.TopkeyUpgrade76?.playApplause)return window.TopkeyUpgrade76.playApplause(kind)"),'Upgrade67 must delegate applause to Upgrade76');
assert(/new C\(\)/.test(u76)&&/createBufferSource/.test(u76),'Upgrade76 must use its own WebAudio buffer path');
assert(!/Piper\.ensureAudio/.test(u76),'Crowd FX must not steal Piper audio element');
for(const marker of ['Bật vỗ tay tự động','Âm lượng FX','Test ngắn','Test hết set','Test hết trận'])assert(u76.includes(marker),`missing UI ${marker}`);
const names=['applause-tie.ogg','applause-set.ogg','applause-match.ogg'];
const durations=[];
for(const name of names){const f=path.join(root,'assets/audio',name);assert(fs.existsSync(f),`missing ${name}`);assert(fs.statSync(f).size>10000,`${name} too small`);const out=cp.execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],{encoding:'utf8'}).trim();const d=Number(out);assert(d>0,`${name} not decodable`);durations.push(d);assert(sw.includes('./assets/audio/'+name),`${name} missing from SW cache`)}
assert(durations[0]<durations[1]&&durations[1]<durations[2],`expected tie < set < match durations, got ${durations}`);
assert(index.indexOf('src/upgrade75.js')<index.indexOf('src/upgrade76.js'),'Upgrade76 must load after Upgrade75');
assert(index.includes('upgrade76.css'),'Upgrade76 CSS marker missing');
const reg=JSON.parse(fs.readFileSync(path.join(root,'FEATURE_REGISTRY.json'),'utf8'));assert(reg.features.some(x=>x.id==='REAL_APPLAUSE_001'),'REAL_APPLAUSE_001 missing');
const contract=JSON.parse(fs.readFileSync(path.join(root,'REGRESSION_CONTRACT.json'),'utf8'));assert(contract.tests.some(x=>x.id==='REAL_APPLAUSE_001'&&x.required),'required applause regression missing');
console.log(`upgrade76 applause regression: PASS · durations ${durations.map(x=>x.toFixed(2)).join(' / ')}s`);
