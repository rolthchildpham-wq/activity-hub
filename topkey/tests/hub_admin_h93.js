const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
function ok(n,c){if(!c)throw new Error(n);console.log('PASS',n)}
const idx=fs.readFileSync(path.join(R,'index.html'),'utf8'), css=fs.readFileSync(path.join(R,'hub-layout94.css'),'utf8'), js=fs.readFileSync(path.join(R,'hub-layout94.js'),'utf8'), sa=fs.readFileSync(path.join(R,'system-admin.html'),'utf8'), saj=fs.readFileSync(path.join(R,'system-admin.js'),'utf8'), cp=fs.readFileSync(path.join(R,'club-planning.js'),'utf8'), sw=fs.readFileSync(path.join(R,'sw.js'),'utf8');
ok('compact CSS 7 columns',/repeat\(7,minmax/.test(css));
ok('sport descriptions hidden',/\.sport p.*display:none/.test(css));
ok('compact layout linked',idx.includes('./hub-layout94.css?v=u122h96-20261108')&&idx.includes('./hub-layout94.js?v=u122h96-20261108'));
ok('Hub appearance DB path',js.includes('associationDashboard/hubAppearance'));
ok('System admin Hub appearance card',sa.includes('id="hubAppearance"')&&sa.includes('id="hubTitle"')&&sa.includes('id="hubBgFile"'));
ok('System admin club plan host',sa.includes('id="club-plan-admin"')&&sa.includes('./club-planning.js?v=u122h96-20261108'));
ok('Club plan editor only targets admin host',cp.includes("let ed=$('#club-plan-admin')")&&!cp.includes("ed.id='club-plan-btc'"));
ok('Hub no editor auto-mount',!cp.includes("const pass=$('#password-change-launch')"));
ok('Appearance upload compressed',saj.includes("toDataURL('image/webp',.72)")&&saj.includes('max=1600'));
ok('Appearance save centralized',saj.includes('associationDashboard/hubAppearance')&&saj.includes('saveHubAppearance'));
ok('Hub SW caches H94 assets',sw.includes("'./hub-layout94.css'")&&sw.includes("'./hub-layout94.js'"));
console.log('HUB_ADMIN_H94_OK');
