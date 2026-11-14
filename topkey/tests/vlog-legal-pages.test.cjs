"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
for(const name of ["terms","privacy"]){
 const html=fs.readFileSync(path.join(root,name+".html"),"utf8");
 assert.match(html,/<!doctype html>/i);
 assert.match(html,/<html lang="vi">/);
 assert.match(html,/TOPKEY Vlog 2026/);
 assert.match(html,/<meta name="viewport"/);
 assert.match(html,/TikTok/);
 assert.match(html,/thu hồi|Thu hồi/i);
 assert.match(html,/Đồng bộ|đồng bộ/);
 assert.match(html,/href="\.\/sports\/diy-vlog\/index\.html"/);
 assert.match(html,/href="\.\/terms\.html"/);
 assert.match(html,/href="\.\/privacy\.html"/);
 assert.doesNotMatch(html,/Client Secret:|TIKTOK_CLIENT_SECRET|accessToken=|refreshToken=/);
}
const vlog=fs.readFileSync(path.join(root,"sports/diy-vlog/index.html"),"utf8");
assert.ok(vlog.includes('href="../../terms.html"'));
assert.ok(vlog.includes('href="../../privacy.html"'));
assert.ok(vlog.includes('id="tiktok-connect"'),"Vlog automatic sync controls remain unchanged");
assert.ok(vlog.includes('id="admin-login-form"'),"Admin login remains accessible");
console.log("PASS TOPKEY public TikTok terms/privacy pages, links, metadata and no exposed secrets");
