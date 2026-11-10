const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src/upgrade87.js'),'utf8');
const css=fs.readFileSync(path.join(root,'upgrade87.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const readme=fs.readFileSync(path.join(root,'assets/audio/README.md'),'utf8');
const registry=JSON.parse(fs.readFileSync(path.join(root,'FEATURE_REGISTRY.json'),'utf8'));
const contract=JSON.parse(fs.readFileSync(path.join(root,'REGRESSION_CONTRACT.json'),'utf8'));
assert(html.indexOf('src/upgrade86.js')<html.indexOf('src/upgrade87.js'),'Upgrade87 must load after Upgrade86');
const cache=(html.match(/upgrade87\.css\?v=(u(\d+)-\d+)/)||[]);assert(cache[1]&&Number(cache[2])>=87&&html.includes(`src/upgrade87.js?v=${cache[1]}`),'Upgrade87 assets must remain loaded under current release cache >=87');
// Natural crowd: real field recording first, softened local assets only as fallback.
assert(src.includes('https://upload.wikimedia.org/wikipedia/commons/0/09/Applause_ii.ogg'),'natural public-domain crowd source missing');
assert(readme.includes('Public Domain')&&readme.includes('PDSounds'),'crowd provenance/license missing');
assert(src.includes("tieApplause:false"),'tie applause must default OFF');
assert(src.includes("if(kind==='TIE'&&!s.tieApplause)return true"),'tie suppression guard missing');
assert(sw.includes('CROWD_CACHE')&&sw.includes('isNaturalCrowd')&&sw.includes("r.type==='opaque'"),'runtime cache for natural crowd missing');
for(const name of ['applause-tie.ogg','applause-set.ogg','applause-match.ogg']){
  const f=path.join(root,'assets/audio',name);assert(fs.existsSync(f),`missing fallback ${name}`);const d=Number(cp.execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],{encoding:'utf8'}).trim());assert(d>0,`${name} must decode`);
}
// Voice profile: actual system male when available; tone fallback, never unknown-license male Piper.
for(const marker of ['data-tk87-voice="MALE"','data-tk87-voice="FEMALE"','isMaleVoice','MALE_TONED',"pitch.value='0.82'"])assert(src.includes(marker),`male/female voice profile missing ${marker}`);
assert(!src.includes('25hours_single'),'Upgrade87 must not ship/select unknown-license 25hours_single male model');
assert(src.includes('U49.localSystemVoices=function')&&src.includes('App.chooseVoice=function'),'voice transport must follow selected profile');
// Auto audio: manual activation only when browser blocks; ON/armed states are visibly disabled/dimmed.
for(const marker of ['forceAudioFromGesture','pointerdown','keydown','touchstart','browser đang chặn','Âm thanh tự động đã bật','Tự động · chờ trận LIVE'])assert(src.includes(marker),`auto-audio marker missing ${marker}`);
assert(src.includes('btn.disabled=true')&&css.includes('.tk87-state-on')&&css.includes('.tk87-state-wait'),'stateful disabled/dim button UI missing');
assert(src.includes('U78.saveSettings?.({userEnabled:true})'),'Auto BLV must default enabled');
// Reset scope menu must delegate to durable existing reset implementations, not invent a new score write path.
for(const marker of ['value="SET"','value="MATCH"','Reset hiệp đang tính điểm','Reset cả trận · về Chưa thi đấu'])assert(src.includes(marker),`reset scope choice missing ${marker}`);
assert(src.includes("return baseResetSet?.()"),'current-set reset must preserve existing reset contract');
assert(src.includes("U68.resetMatchResult?.(s.matchId,{status:'SCHEDULED',confirm:true,source:'UMPIRE_RESET_MENU_U87'})"),'full-match reset must use verified U68 admin reset');
assert(!/T\.Data\.(?:queueSet|queueMulti)\(/.test(src),'Upgrade87 must not create a competing reset Firebase write path');
assert(css.includes('.tk87-reset-choice')&&css.includes('.tk87-reset-danger'),'reset modal state styling missing');
for(const id of ['NATURAL_APPLAUSE_002','MALE_VOICE_PROFILE_001','AUTO_AUDIO_STATE_001','RESET_SCOPE_MENU_001']){
  assert(registry.features.some(x=>x.id===id),`registry missing ${id}`);assert(contract.tests.some(x=>x.id===id&&x.required),`contract missing ${id}`);
}
for(const f of ['./upgrade87.css','./src/upgrade87.js','./tests/upgrade87_audio_reset_regression.js'])assert(sw.includes(f),`SW missing ${f}`);
console.log('upgrade87 audio/reset regression: PASS · natural crowd + male profile + auto audio state + two-scope reset menu');
