'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/index.html'),'utf8');
for(const [name,expected] of [
 ['container width','.container{max-width:1320px'],
 ['hero top','.hero .container{padding-top:29px;padding-bottom:25px}'],
 ['content padding','.content{padding-top:17px;padding-bottom:36px}'],
 ['stats card','.stat{padding:11px 13px}'],
 ['section spacing','.section{margin-top:28px}'],
 ['podium spacing','.section.podium-section{margin-top:20px}'],
 ['mobile padding','.hero .container{padding-top:22px;padding-bottom:20px}']]){
 assert(html.includes(expected),name);
}
assert(!html.includes('min-height:212px'),'Tall podium regression');
for(const script of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean))new vm.Script(script);
assert(html.includes('topkey_vlog2026_test'), 'TEST LAB preserved');
assert(html.includes('setTestLabVisibility(isRootAdmin)'), 'Admin permissions preserved');
console.log('PASS: compact 100% layout, responsive CSS, inline JS, production/test guards');
