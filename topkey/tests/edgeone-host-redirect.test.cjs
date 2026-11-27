/* EdgeOne Pages uses deployment-specific hosts: no static entrypoint may force an unavailable canonical host. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
for(const path of ['topkey/index.html','topkey/sports/badminton/index.html','topkey/sports/vnext/index.html']){
 const s=fs.readFileSync(path,'utf8');
 assert.match(s,/<html/i,path+': HTML entrypoint exists');
 assert.doesNotMatch(s,/id=["']tk81-canonical-host["']/,path+': no forced canonical host');
 assert.doesNotMatch(s,/topkey-activity-management\.edgeone\.dev/,path+': no hardcoded dead host');
}
console.log('EdgeOne deployment-host redirect regression passed for Hub, Badminton, VNext');

const edgeone=JSON.parse(fs.readFileSync('topkey/edgeone.json','utf8'));
assert.ok(edgeone.rewrites?.some(rule=>rule.source==='/'&&rule.destination==='/index.html'), 'EdgeOne root URL must rewrite to the published Hub index.html entrypoint');
assert.ok(!edgeone.rewrites?.some(rule=>rule.source==='/*'), 'Do not rewrite all multi-page sport routes to the Hub index');
console.log('EdgeOne root entrypoint rewrite contract passed; multi-page sports routes remain intact.');
