const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','upgrade106.js'),'utf8');
const css=fs.readFileSync(path.join(root,'upgrade106.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const build=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8'));
const n=Number((String(build.build).match(/upgrade(\d+)/)||[])[1]||0);
const checks=[
  ['admin class hook',/u106-admin-scroll/.test(js)],
  ['public class hook',/u106-public-scroll/.test(js)],
  ['admin bounded scroll',/max-height:min\(64vh,680px\)/.test(css)&&/overflow:auto!important/.test(css)],
  ['public bounded scroll',/overflow-y:scroll!important/.test(css)],
  ['sticky table header',/thead th[\s\S]*position:sticky/.test(css)],
  ['sticky public day',/tk12-public-day[\s\S]*position:sticky/.test(css)],
  ['collapse still max-height zero',/tk105-collapsed[\s\S]*max-height:0!important/.test(css)],
  ['current bundle referenced',n>=109?(new RegExp('assets/u'+n+'/admin(?:-core)?\\.[a-f0-9]{12}\\.js').test(html)&&new RegExp('assets/u'+n+'/viewer\\.[a-f0-9]{12}\\.js').test(html)):n>=106&&new RegExp('assets/u'+n+'/app\\.[a-f0-9]{12}\\.js').test(html)&&new RegExp('assets/u'+n+'/app\\.[a-f0-9]{12}\\.css').test(html)]
];
for(const [n,ok] of checks){if(!ok){console.error('FAIL',n);process.exit(1)}}
console.log('PASS upgrade106 schedule internal scroll');
