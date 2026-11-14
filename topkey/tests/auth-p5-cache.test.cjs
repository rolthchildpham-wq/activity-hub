"use strict";
const fs=require("node:fs"), assert=require("node:assert/strict");
for(const sport of ["badminton","vnext"]){
 const html=fs.readFileSync("topkey/sports/"+sport+"/index.html","utf8");
 const sw=fs.readFileSync("topkey/sports/"+sport+"/sw.js","utf8");
 const match=html.match(/topkey-shared-auth\.js\?v=([\w-]+)/);
 assert.ok(match,sport+" HTML missing auth asset");
 const version=match[1];
 assert.ok(sw.includes("topkey-shared-auth.js?v="+version),sport+" SW must use same auth version as HTML; HTML "+version);
 assert.ok(sw.includes("topkey-h136-"+sport+"-shell"),sport+" SW cache must rotate to H136");
 const library="../../vendor/qrcode.min.js?v=h136-20261114";
 assert.ok(html.includes(library),sport+" must load local QR library");
 assert.ok(sw.includes(library),sport+" must precache local QR library");
}
console.log("PASS H136 auth assets match service worker + QR vendor cache");
