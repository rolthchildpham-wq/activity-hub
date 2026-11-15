'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../sports/diy-vlog/index.html'),'utf8');
for(const field of ['entry-views','entry-likes','entry-shares']){
 const match=html.match(new RegExp('<input id="'+field+'"[^>]+>'));assert.ok(match,'Missing '+field);assert.match(match[0],/value="0"/,'Empty metrics should default to 0');assert.doesNotMatch(match[0],/\srequired\b/,'Name and TikTok URL alone must be enough');
}
assert.match(html,/id="entry-save-status"/);assert.match(html,/id="weights-save-status"/);
assert.match(html,/const saved=\(await db\.ref\(root\+'\/entries\/'\+id\)\.once\('value'\)\)\.val\(\)/,'A saved entry must be read back');
assert.match(html,/remote\.entries=entrySnapshot\.val\(\)/,'Saved entry must refresh rankings');
assert.match(html,/Đã lưu và đọc lại bài dự thi từ Firebase thành công/,'Save success only after readback');assert.match(html,/Đã lưu và xác minh hệ số trên Firebase thành công/);assert.match(html,/weightsDraft=null/);assert.match(html,/if\(!weightsDraft\)/);assert.match(html,/\.once\('value'\)\)\.val\(\)/);assert.match(html,/const safeLink=s=>/);assert.match(html,/Tạo mới và lưu/);assert.doesNotMatch(html,/\$\('clear-form'\)\.addEventListener\('click',\(\)=>\{\$\('entry-form'\)\.reset\(\)/);assert.match(html,/form\.requestSubmit\(\)/,'Create-new button must save without clearing');assert.match(html,/permission-denied/);
assert.match(html,/isHandmadeScope=\['handmade','diy','diy \/ handmade','🧶 diy \/ handmade'\]\.includes\(scope\)/,'BTC editor must recognize supported DIY scope labels');
const rules=JSON.parse((await tools.mcp__GitHub__fetch_file({repository_full_name:repo,path:'topkey/firebase.database.rules.json',ref:'main'})).result.content);
const writeRule=rules.rules.topkey_vlog2026['.write'];
assert.match(writeRule,/assignedSport/,'Vlog write rule must accept the profile assignedSport field');
assert.match(writeRule,/=== 'diy'/,'Vlog write rule must accept the canonical DIY alias');
assert.match(html,/await db\.ref\(root\+'\/entries\/'\+id\)\.set\(obj\)/,'Persist entry with Firebase');
assert.match(html,/btn\.disabled=true/);
const linkSource=html.match(/const link=s=>\{[^\n]+\};/);assert.ok(linkSource,'URL helper missing');
const link=vm.runInNewContext(linkSource[0].replace('const link=','(').replace(/;$/,'')+')',{URL});
assert.equal(link('https://www.tiktok.com/@test/video/1234567890123456789'),'https://www.tiktok.com/@test/video/1234567890123456789');
assert.equal(link('https://vm.tiktok.com/ZMabcdefg/'),'https://vm.tiktok.com/ZMabcdefg/');
assert.throws(()=>link('https://example.com/video/123'),/TikTok/);
assert.throws(()=>link('not-a-link'),/TikTok/);
const metricSource=html.match(/function positiveInt\(x\)\{[^\n]+?return n\}/);assert.ok(metricSource);
const positiveInt=vm.runInNewContext('('+metricSource[0]+')');
assert.equal(positiveInt(''),0);assert.equal(positiveInt('0'),0);assert.equal(positiveInt('23'),23);assert.throws(()=>positiveInt('-1'));
console.log('PASS Vlog entry creation: blank metric defaults, valid TikTok URLs, reject invalid links, visible save result');
