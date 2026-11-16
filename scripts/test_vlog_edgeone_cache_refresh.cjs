/* Regression: Vlog HTML must reference the current sync script revision to avoid stale EdgeOne CDN cache. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/index.html'),'utf8');
const sync=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/tiktok-automation.js'),'utf8');
assert.match(html,/TOPKEY_VLOG_BUILD: vlog-sync-errors-20261116-093b3b3/);
assert.match(html,/tiktok-automation\.js\?v=vlog-sync-errors-20261116-093b3b3/);
assert.match(sync,/retry\.hidden=!testMode/);
assert.match(sync,/if\(!all\.length\)\{report\.hidden=true/);
console.log('PASS: release marker, refreshed Vlog JS URL and production failure report present');
