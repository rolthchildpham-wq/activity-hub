const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const u16=fs.readFileSync(path.join(root,'src','upgrade16.js'),'utf8');
const u107=fs.readFileSync(path.join(root,'src','upgrade107.js'),'utf8');
const checks=[
 ['safe helper present',/function safeInsertBefore\(fallback,node,ref\)/.test(u16)],
 ['admin uses safe helper',/safeInsertBefore\(card,bar,wrap\)/.test(u16)],
 ['public uses safe helper',/safeInsertBefore\(card,bar,sched\)/.test(u16)],
 ['legacy unsafe admin insert removed',!/card\.insertBefore\(bar,wrap\)/.test(u16)],
 ['legacy unsafe public insert removed',!/card\.insertBefore\(bar,sched\)/.test(u16)],
 ['u107 repair helper exists',/function repairSearchParents\(\)/.test(u107)],
 ['u107 build authority',/BUILD='upgrade107'/.test(u107)]
];
for(const [n,ok] of checks){if(!ok){console.error('FAIL',n);process.exit(1)}}
console.log('PASS upgrade107 schedule DOM parent safety');
