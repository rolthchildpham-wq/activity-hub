const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bad=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const vnext=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const css=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
const js=fs.readFileSync('topkey/sports/vnext/sport-identities-h132.js','utf8');
assert.ok(bad.includes("query.set('sport', 'badminton')"),'legacy badminton route must enter shared VNext');
assert.ok(bad.includes("../vnext/index.html"),'legacy badminton route must redirect to shared VNext');
assert.ok(vnext.indexOf('id="tk132-sport-prepaint"')<vnext.indexOf('canva-sports-ui.css'));
assert.ok(vnext.indexOf('canva-sports-ui.css')<vnext.indexOf('<body>'));
assert.ok(vnext.includes('sport-identities-h132.js?v=h132-20261113'));
assert.ok(!js.includes('firebase.database')&&!js.includes('location.reload')&&!js.includes('location.replace'));
const sports=['football','volleyball','running','handmade','shuttle','cooking'];
const palettes=new Set();
for(const name of sports){
 const re=new RegExp('html\\[data-tk-sport="'+name+'"\\]\\{([^}]+)\\}');
 const m=css.match(re);assert.ok(m,'profile '+name+' missing');
 const key=m[1].match(/--sport:([^;]+)/);assert.ok(key,'sport accent missing: '+name);
 palettes.add(key[1]);
}
assert.equal(palettes.size,6,'each sport must have unique palette');
const preboot=vnext.match(/<script id="tk132-sport-prepaint">([\s\S]*?)<\/script>/);
assert.ok(preboot,'prepaint initializer must be synchronous');
const node=tag=>({tag,id:'',children:[],textContent:'',className:'',dataset:{},append(...xs){this.children.push(...xs)},prepend(...xs){this.children.unshift(...xs)},setAttribute(k,v){this[k]=v}});
for(const sport of sports){
 const html={dataset:{}};const page=node('section'),hero=node('header'),container={};
 const mockdoc={documentElement:html,readyState:'complete',getElementById:id=>id==='page-overview'?page:null,createElement:node};
 const env={location:{search:'?sport='+sport},document:mockdoc,URLSearchParams};
 vm.runInNewContext(preboot[1],env);
 assert.equal(html.dataset.tkSport,sport);
 const w={__TOPKEY_PUBLIC_ROUTE:'',TopkeySportIdentity132:null};
 vm.runInNewContext(js,{window:w,document:mockdoc,console});
 assert.equal(w.TopkeySportIdentity132?.sport,sport);
 assert.equal(page.children.length,1,'hero should mount on visible page for '+sport);
 assert.equal(page.children[0].id,'tk-h132-hero');
 const text=page.children[0].children[0].children.map(x=>x.textContent).join(' ');
 assert.ok(text.length>35,'sport-specific copy missing '+sport);
}
const missing={location:{search:'?sport=hacker'},document:{documentElement:{dataset:{}}},URLSearchParams};
vm.runInNewContext(preboot[1],missing);
assert.equal(missing.document.documentElement.dataset.tkSport,'football','unknown sport defaults to official football engine');
console.log('H132: badminton no-flash prepaint and six sport-specific VNext dashboards verified.');
