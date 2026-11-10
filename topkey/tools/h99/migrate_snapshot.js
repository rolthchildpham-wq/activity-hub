#!/usr/bin/env node
'use strict';
// Offline, read-only migration planner. Never connects to Firebase.
const fs=require('fs'),crypto=require('crypto');
const [,,input,output]=process.argv;
if(!input||!output){console.error('Usage: node migrate_snapshot.js backup.json output.json');process.exit(2)}
const data=JSON.parse(fs.readFileSync(input,'utf8'));
const source=data.tournament||data;
const branches=['teams','matches','finance'];
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const normalized={schemaVersion:2,sourceDigest:hash(source),collections:{},indexes:{},manifest:{}};
for(const branch of branches){const records=source[branch]||{};if(!records||typeof records!=='object'||Array.isArray(records))throw Error('Invalid '+branch);
 const keys=Object.keys(records).sort();normalized.collections[branch]={};normalized.indexes[branch]={};
 for(const key of keys){if(!/^[^.#$\[\]/]+$/.test(key))throw Error('Invalid Firebase key: '+key);const record=records[key];if(record===null||typeof record!=='object'||Array.isArray(record))throw Error('Invalid record '+branch+'/'+key);
 normalized.collections[branch][key]=record;
 const category=String(record.category||'uncategorized'),status=String(record.status||'unknown');
 normalized.indexes[branch][key]={category,status,createdAt:Number(record.createdAt)||0,updatedAt:Number(record.updatedAt)||0,date:String(record.date||'')};
 }
 normalized.manifest[branch]={count:keys.length,hash:hash(normalized.collections[branch])};
}
const check=branches.every(b=>normalized.manifest[b].count===Object.keys(normalized.collections[b]).length && normalized.manifest[b].hash===hash(normalized.collections[b]));
if(!check)throw Error('Migration validation failed');
fs.writeFileSync(output,JSON.stringify(normalized,null,2));
console.log(JSON.stringify({validated:true,sourceDigest:normalized.sourceDigest,manifest:normalized.manifest},null,2));
