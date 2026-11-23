const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'sports/badminton/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'sports/badminton/operations-contrast-h206.css'),'utf8');

function contrast(foreground,background){
 const luminance=hex=>{
  const components=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
   .map(v=>v<=0.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
  return components[0]*.2126+components[1]*.7152+components[2]*.0722;
 };
 const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
 return (values[0]+.05)/(values[1]+.05);
}
test('H206 overrides H203 after legacy CSS in actual badminton HTML',()=>{
 const h203=html.indexOf('visual-contrast-h203.css');
 const h206=html.indexOf('operations-contrast-h206.css?v=h206-20261123');
 assert.ok(h203>0 && h206>h203);
 assert.equal(html.match(/operations-contrast-h206\.css/g)?.length,1);
 assert.ok(fs.existsSync(path.join(root,'sports/badminton/operations-contrast-h206.css')));
});
test('H206 scopes to authenticated badminton page rather than viewer or other sports',()=>{
 assert.ok(css.includes('body.tk-smooth-admin #app-shell #page-teams'));
 assert.doesNotMatch(css,/\bdisplay\s*:\s*none\b/);
 assert.doesNotMatch(css,/pointer-events\s*:\s*none/);
 assert.doesNotMatch(css,/position\s*:\s*fixed/);
 assert.doesNotMatch(css,/\.tk-public-boot/);
});
test('H206 fixes dark-on-dark inputs and pale text in screenshot',()=>{
 assert.match(css,/--tk206-input:#f7fbfa/);
 assert.match(css,/--tk206-ink:#173943/);
 assert.match(css,/color-scheme:light!important/);
 assert.match(css,/::placeholder/);
 assert.match(css,/--tk206-dark-ink:#f0f8ff/);
 assert.match(css,/\.list-card/);
});
test('white card ink/labels, dark card ink and buttons reach WCAG AA contrast',()=>{
 const pairs=[
  ['field','#173943','#f7fbfa'],
  ['label','#405b66','#ffffff'],
  ['placeholder','#526b74','#f7fbfa'],
  ['dark card','#f0f8ff','#0e2940'],
  ['green button','#ffffff','#087c60'],
  ['blue button','#ffffff','#165ca8']
 ];
 for(const [name,fg,bg] of pairs){
  assert.ok(contrast(fg,bg)>=4.5,name+' '+contrast(fg,bg).toFixed(2)+':1 below 4.5');
 }
});
test('H206 leaves existing modules, QR links, scoring and auth scripts intact',()=>{
 for(const id of ['id="page-teams"','id="team-form"','id="registration-qr"','id="checkin-list"','id="registration-list"']){
  assert.ok(html.includes(id),'Missing '+id);
 }
 assert.ok(html.includes('topkey-shared-auth.js'));
 assert.ok(html.includes('data-tab="umpire"'));
 assert.ok(html.includes('data-tab="finance"'));
});
