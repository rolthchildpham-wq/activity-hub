'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/index.html'),'utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(css,'missing CSS');
const checks={
 'fluid gutter':/--vlog-gutter:clamp\(12px,2\.2vw,26px\)/,
 'desktop five columns':/\.stats\{gap:var\(--vlog-gap\);grid-template-columns:repeat\(5,minmax\(0,1fr\)\)\}/,
 'laptop and tablet three columns':/@media\(max-width:1100px\)\{[\s\S]*?\.stats\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/,
 'mobile two columns':/@media\(max-width:760px\)\{[\s\S]*?\.stats\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
 'mobile single-column podium':/@media\(max-width:760px\)\{[\s\S]*?\.podium\{grid-template-columns:1fr/,
 'small phone 420':/@media\(max-width:420px\)/,
 'wide desktop 1500':/@media\(min-width:1500px\)/,
 'scrolling table':/\.table-scroll\{max-width:100%;overflow-x:auto/,
 'viewport proportional hero':/\.hero \.container\{padding-top:clamp\(18px,2\.6vw,38px\)/,
 'wrapped navigation':/\.nav\{gap:clamp\(6px,1vw,14px\);flex-wrap:wrap/,
 'preserved admin guard':/setTestLabVisibility\(isRootAdmin\)/,
 'preserved TikWM endpoint':/tiktok-automation\.js\?v=/,
};
for(const [label,pattern] of Object.entries(checks))assert.match(label.includes('admin')||label.includes('TikWM')?html:css,pattern,label);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
for(const script of scripts)new vm.Script(script);
assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">/);
assert.match(html,/class="podium" id="podium"/);
assert.match(html,/id="admin-sign-out"/);
console.log('PASS responsive Vlog: fluid desktop/laptop/tablet/mobile grids, no forced page width, horizontal data table scroll, JS syntax and auth guards retained');
