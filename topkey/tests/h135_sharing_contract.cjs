"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"sports/vnext/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"sports/vnext/share-contrast-h135.css"),"utf8");
const base=fs.readFileSync(path.join(root,"sports/vnext/styles.css"),"utf8");
const db=JSON.parse(fs.readFileSync(path.join(root,"firebase.database.rules.json"),"utf8"));
const storage=fs.readFileSync(path.join(root,"firebase.storage.rules"),"utf8");
const sports=["football","volleyball","running","handmade","shuttle","cooking"];
assert.match(html,/share-contrast-h135\.css/,"share style must be included");
assert.match(html,/id="page-settings"/,"settings page must exist");
assert.match(css,/#page-settings/,"share style scoped to settings");
assert.match(css,/input\[readonly\]/,"read-only share input must be legible");
assert.match(css,/-webkit-text-fill-color/,"WebKit input text-fill must be explicit");
assert.match(base,/--txt:/,"base design tokens must exist");
assert.equal(db.rules[".write"],false,"global Firebase writes must be denied by default");
for(const sport of sports){
 const key="topkey_"+sport+"_vnext_2026";
 assert.ok(db.rules[key],key+" db rules missing");
 assert.ok(storage.includes(key),key+" storage rules missing");
}
console.log("H135 static share UI + Firebase rules presence: PASS");
console.log("NOTE: this is source validation, NOT live role validation or visual-browser testing.");
