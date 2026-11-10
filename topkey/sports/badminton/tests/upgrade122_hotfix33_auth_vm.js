const fs=require('fs'),path=require('path'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../src/auth.js'),'utf8');
assert(src.includes('ensureAuth(){'),'ensureAuth missing');assert(src.includes('const auth=this.ensureAuth();'),'login must use deterministic ensureAuth');assert(!src.includes('Date.now()-started<8000'),'polling login loop must be removed');
const fb=fs.readFileSync(path.join(__dirname,'../src/firebase.js'),'utf8');assert(fb.includes('if(this._initPromise)return this._initPromise'),'Data.init single-flight missing');assert(fb.includes("if(!this._networkBound)"),'network listeners guard missing');assert(fb.includes("if(this.db&&!this._connectionBound)"),'connection listener guard missing');
console.log('PASS Hotfix33 auth/data single-authority VM');
