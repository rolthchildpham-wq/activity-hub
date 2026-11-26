#!/usr/bin/env node
/**
 * TOPKEY browser-test adapter. All browser operations go through the official
 * Chrome DevTools MCP server over MCP stdio using the MCP TypeScript client.
 * The HTTP listener is only a local IPC bridge for existing shell test steps;
 * it never talks to Chrome/CDP directly.
 */
import http from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const ROOT=process.cwd();
const MCP_ROOT=path.join(ROOT,'.tools','chrome-devtools-mcp');
const SERVER=path.join(MCP_ROOT,'out','Default','gen','src','bin','chrome-devtools-mcp.js');
const PORT=Number(process.env.TOPKEY_MCP_BRIDGE_PORT||4174);
const require=createRequire(path.join(ROOT,'__topkey_mcp_loader.cjs'));
const importPackage=async name=>import(pathToFileURL(require.resolve(name,{paths:[ROOT]})).href);

async function connectMcp(){
  if(!existsSync(SERVER))throw new Error('Official Chrome DevTools MCP server build not found: '+SERVER);
  const [{Client},{StdioClientTransport}]=await Promise.all([
    importPackage('@modelcontextprotocol/client'),
    importPackage('@modelcontextprotocol/client/stdio')
  ]);
  const transport=new StdioClientTransport({
    command:process.execPath,
    args:[SERVER,'--headless=true','--isolated=true','--usageStatistics=false',
      '--idleTimeout=45m','--filesystem-root='+ROOT],
    cwd:MCP_ROOT,
    env:{...process.env,CI:'true',CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS:'1',
      CHROME_DEVTOOLS_MCP_NO_CONFIG_DISCOVERY:'1'},
    stderr:'inherit'
  });
  const client=new Client({name:'topkey-sports-hub-ui-verifier',version:'1.0.0'},
    {capabilities:{},openTelemetry:false});
  await client.connect(transport);
  const listed=await client.listTools();
  const names=new Set(listed.tools.map(t=>t.name));
  const required=['navigate_page','evaluate_script','take_screenshot','resize_page',
    'list_console_messages','list_network_requests'];
  const missing=required.filter(name=>!names.has(name));
  if(missing.length)throw new Error('MCP server missing required tools: '+missing.join(', '));
  process.stdout.write('[MCP] initialize handshake complete; server tools/list returned '+names.size+' tools\n');
  process.stdout.write('[MCP] verified tools: '+required.join(', ')+'\n');
  return client;
}

function parseLegacy(argv){
  const [command,...args]=argv;
  const positional=[],flags={};
  for(let i=0;i<args.length;i++){
    const value=args[i];
    if(value.startsWith('--')){
      const key=value.slice(2);
      if(i+1<args.length&&!args[i+1].startsWith('--'))flags[key]=args[++i];
      else flags[key]=true;
    }else positional.push(value);
  }
  const pageId=Number(flags.pageId??positional[0]??1);
  switch(command){
    case 'navigate_page':
      return {name:'navigate_page',arguments:{pageId,type:'url',url:flags.url}};
    case 'evaluate_script':
      return {name:'evaluate_script',arguments:{pageId,function:positional[0],
        format:'function',...(flags['wait-for-stable-dom']?{waitForStableDom:true}:{})}};
    case 'take_screenshot':
      return {name:'take_screenshot',arguments:{pageId,
        ...(flags.filePath?{filePath:path.resolve(ROOT,flags.filePath)}:{}),
        format:'png',...(flags.fullPage?{fullPage:true}:{})}};
    case 'resize_page':
      return {name:'resize_page',arguments:{pageId,width:Number(positional[1]),height:Number(positional[2])}};
    case 'list_console_messages':
      return {name:'list_console_messages',arguments:{pageId,includePreservedMessages:true,
        includeStackTraces:true,pageSize:200}};
    case 'list_network_requests':
      return {name:'list_network_requests',arguments:{pageId,includePreservedRequests:true,pageSize:200}};
    default: throw new Error('Unsupported legacy test operation: '+command);
  }
}

async function daemon(){
  const client=await connectMcp();
  const server=http.createServer(async(req,res)=>{
    if(req.method==='GET'&&req.url==='/health'){
      res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,transport:'mcp-stdio'}));return;
    }
    if(req.method!=='POST'||req.url!=='/call'){
      res.writeHead(404);res.end('not found');return;
    }
    let body='';
    for await(const chunk of req)body+=chunk;
    try{
      const request=JSON.parse(body);
      if(!request?.name||typeof request.arguments!=='object')throw new Error('Invalid MCP call payload');
      const result=await client.callTool({name:request.name,arguments:request.arguments});
      if(result.isError)throw new Error((result.content||[]).map(x=>x.text||'').join('\n')||'MCP tool call failed');
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({result}));
    }catch(error){
      res.writeHead(500,{'content-type':'application/json'});
      res.end(JSON.stringify({error:error instanceof Error?error.message:String(error)}));
    }
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve)});
  process.stdout.write('[MCP] persistent MCP client bridge listening on 127.0.0.1:'+PORT+'\n');
  const close=async()=>{server.close();await client.close().catch(()=>{});process.exit(0)};
  process.on('SIGTERM',close);process.on('SIGINT',close);
}

async function call(argv){
  const request=parseLegacy(argv);
  const response=await fetch('http://127.0.0.1:'+PORT+'/call',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)
  });
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||'MCP bridge request failed');
  const result=payload.result;
  const text=(result.content||[]).filter(item=>item.type==='text').map(item=>item.text).join('\n');
  if(text)process.stdout.write(text+'\n');
  else process.stdout.write(JSON.stringify(result)+'\n');
}

try{
  if(process.argv[2]==='daemon')await daemon();
  else if(process.argv[2]==='call')await call(process.argv.slice(3));
  else throw new Error('Usage: chrome-devtools-mcp-client.mjs daemon|call <legacy-operation>');
}catch(error){console.error(error instanceof Error?error.stack:String(error));process.exitCode=1;}
