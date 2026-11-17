/* TOPKEY read-only audit runner; never contacts Firebase or starts deployment. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const testDir=path.join(root,'topkey/sports/badminton/tests');
const files=fs.readdirSync(testDir).filter(n=>/\.js$/.test(n)).sort();
const build=JSON.parse(fs.readFileSync(path.join(root,'topkey/sports/badminton/build.json'),'utf8'));
const timeout=Number(process.env.TOPKEY_TEST_TIMEOUT_MS||15000);
const rows=files.map(file=>{
 const source=fs.readFileSync(path.join(testDir,file),'utf8');
 const pinned=/u122h\d+-20\d{6}|build\.(?:cacheTag|version|build)[^\n]{0,100}|assets\/u118\/|hotfix\d+-20\d{6}/.test(source);
 const proc=cp.spawnSync(process.execPath,[path.join(testDir,file)],{cwd:testDir,encoding:'utf8',timeout,maxBuffer:1024*1024});
 const output=(proc.stderr||'')+'\n'+(proc.stdout||'');
 return {file,status:proc.status===0?'PASS':'FAIL',category:proc.status===0?'passed':proc.error?.code==='ETIMEDOUT'?'timeout':pinned?'legacy-contract-candidate':'unclassified-failure',exit:proc.status,detail:output.slice(-1000)};
});
const summary={build,tests:rows.length,pass:rows.filter(x=>x.status==='PASS').length,fail:rows.filter(x=>x.status==='FAIL').length,categories:Object.fromEntries([...new Set(rows.map(x=>x.category))].map(c=>[c,rows.filter(x=>x.category===c).length]))};
const report={summary,rows};
const destination=process.argv[2];
if(destination)fs.writeFileSync(destination,JSON.stringify(report,null,2));
console.log(JSON.stringify(summary,null,2));
for(const row of rows.filter(r=>r.status==='FAIL'))console.log(row.category,row.file,row.detail.trim().split('\n').slice(-2).join(' | '));
if(summary.fail)process.exitCode=1;
