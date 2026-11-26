#!/usr/bin/env node
/**
 * TOPKEY test IPC adapter for the official Chrome DevTools MCP server.
 *
 * This process is an MCP client. It starts the official server with
 * StdioClientTransport, completes initialize/tools/list, creates one page,
 * and routes every browser operation through Client.callTool (tools/call).
 * The local HTTP endpoint is only an IPC shim for the existing test shell;
 * it never connects to Chrome/CDP directly.
 */
import http from 'node:http';
import {appendFileSync, existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const ROOT = process.cwd();
const MCP_ROOT = path.join(ROOT, '.tools', 'chrome-devtools-mcp');
const SERVER = path.join(MCP_ROOT, 'out', 'Default', 'gen', 'src', 'bin', 'chrome-devtools-mcp.js');
const PORT = Number(process.env.TOPKEY_MCP_BRIDGE_PORT || 4174);
const HUB_URL = process.env.TOPKEY_MCP_START_URL || 'http://127.0.0.1:4173/';
const ARTIFACTS = path.join(ROOT, 'artifacts', 'chrome-devtools');
const CALL_LOG = path.join(ARTIFACTS, 'mcp-calls.jsonl');
let client;
let pageId;

function record(entry) {
  mkdirSync(ARTIFACTS, {recursive: true});
  appendFileSync(CALL_LOG, JSON.stringify({at: new Date().toISOString(), ...entry}) + '\n');
}

async function connectOfficialServer() {
  if (!existsSync(SERVER)) {
    throw new Error('Official MCP server build is missing: ' + SERVER);
  }

  // Resolve the SDK from the official server checkout. The server's lockfile
  // pins @modelcontextprotocol/client and its stdio transport compatibly.
  const requireFromMcp = createRequire(path.join(MCP_ROOT, 'package.json'));
  const clientUrl = pathToFileURL(requireFromMcp.resolve('@modelcontextprotocol/client'));
  const stdioUrl = pathToFileURL(requireFromMcp.resolve('@modelcontextprotocol/client/stdio'));
  const [{Client}, {StdioClientTransport}] = await Promise.all([
    import(clientUrl.href),
    import(stdioUrl.href),
  ]);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      SERVER,
      '--headless=true',
      '--isolated=true',
      '--no-usage-statistics',
      '--idleTimeout=45m',
      '--workspace=' + ROOT,
      '--chrome-arg=--no-sandbox',
      '--chrome-arg=--disable-setuid-sandbox',
    ],
    cwd: MCP_ROOT,
    env: {...process.env, CI: 'true', CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS: '1'},
    stderr: 'inherit',
  });

  client = new Client(
    {name: 'topkey-chrome-devtools-mcp-qa', version: '2.0.0'},
    {capabilities: {}},
  );
  await client.connect(transport);
  process.stdout.write('[MCP] initialize handshake: PASS\n');

  const listed = await client.listTools();
  const names = new Set(listed.tools.map(tool => tool.name));
  const required = [
    'new_page', 'list_pages', 'navigate_page', 'select_page',
    'take_snapshot', 'evaluate_script', 'take_screenshot', 'resize_page',
    'list_console_messages', 'list_network_requests',
  ];
  const missing = required.filter(name => !names.has(name));
  record({kind: 'tools/list', success: missing.length === 0, toolCount: names.size, required, missing});
  if (missing.length) throw new Error('MCP tools/list missing: ' + missing.join(', '));
  process.stdout.write('[MCP] tools/list: PASS (' + names.size + ' tools; required tools present)\n');

  const created = await client.callTool({name: 'new_page', arguments: {url: HUB_URL}});
  if (created.isError) {
    throw new Error('MCP new_page failed: ' + JSON.stringify(created.content));
  }
  pageId = extractPageId(created);
  if (!Number.isInteger(pageId)) {
    const pages = await client.callTool({name: 'list_pages', arguments: {}});
    if (pages.isError) throw new Error('MCP list_pages failed: ' + JSON.stringify(pages.content));
    pageId = extractPageId(pages, HUB_URL);
  }
  record({kind: 'tools/call', name: 'new_page', success: Number.isInteger(pageId), pageId});
  if (!Number.isInteger(pageId)) {
    throw new Error('Could not resolve pageId from new_page/list_pages: ' + JSON.stringify(created));
  }
  await client.callTool({name: 'select_page', arguments: {pageId}});
  process.stdout.write('[MCP] new_page/select_page: PASS (pageId=' + pageId + ')\n');
}

function extractPageId(result, preferredUrl) {
  const seen = new Set();
  function walk(value) {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      try {
        const parsed = JSON.parse(trimmed);
        const found = walk(parsed);
        if (found !== undefined) return found;
      } catch {}
      const match = trimmed.match(/(?:page\s*id|pageId|\bid)\s*[:=#]\s*["']?(\d+)/i);
      if (match) return Number(match[1]);
      return undefined;
    }
    if (typeof value !== 'object' || seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = walk(item);
        if (found !== undefined) return found;
      }
      return undefined;
    }
    if (Number.isInteger(value.pageId)) return value.pageId;
    if (Number.isInteger(value.id) && (!preferredUrl || value.url === preferredUrl || value.url?.startsWith(preferredUrl))) {
      return value.id;
    }
    for (const item of Object.values(value)) {
      const found = walk(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  return walk(result?.structuredContent) ?? walk(result?.content) ?? walk(result);
}

function parseLegacy(argv) {
  const [command, ...args] = argv;
  const positional = [];
  const flags = {};
  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      if (index + 1 < args.length && !args[index + 1].startsWith('--')) {
        flags[key] = args[++index];
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(value);
    }
  }

  // This workflow deliberately owns one browser page. Ignore the old CLI's
  // hard-coded "1" placeholder and route every call to the MCP-created ID.
  const targetPage = pageId;
  switch (command) {
    case 'navigate_page':
      return {name: 'navigate_page', arguments: {pageId: targetPage, type: 'url', url: flags.url}};
    case 'evaluate_script':
      return {name: 'evaluate_script', arguments: {
        pageId: targetPage, function: positional[0], format: 'function',
        ...(flags['wait-for-stable-dom'] ? {waitForStableDom: true} : {}),
      }};
    case 'take_snapshot':
      return {name: 'take_snapshot', arguments: {pageId: targetPage,
        ...(flags.filePath ? {filePath: path.resolve(ROOT, flags.filePath)} : {})}};
    case 'take_screenshot':
      return {name: 'take_screenshot', arguments: {pageId: targetPage,
        ...(flags.filePath ? {filePath: path.resolve(ROOT, flags.filePath)} : {}),
        format: 'png', ...(flags.fullPage ? {fullPage: true} : {})}};
    case 'resize_page':
      return {name: 'resize_page', arguments: {
        pageId: targetPage, width: Number(positional[1]), height: Number(positional[2]),
      }};
    case 'list_console_messages':
      return {name: 'list_console_messages', arguments: {
        pageId: targetPage, includePreservedMessages: true, includeStackTraces: true, pageSize: 200,
      }};
    case 'list_network_requests':
      return {name: 'list_network_requests', arguments: {
        pageId: targetPage, includePreservedRequests: true, pageSize: 200,
      }};
    default:
      throw new Error('Unsupported MCP test operation: ' + command);
  }
}

async function startBridge() {
  await connectOfficialServer();
  const server = http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, {'content-type': 'application/json'});
      response.end(JSON.stringify({ok: true, transport: 'official-mcp-stdio', pageId}));
      return;
    }
    if (request.method !== 'POST' || request.url !== '/call') {
      response.writeHead(404);
      response.end('not found');
      return;
    }

    let body = '';
    for await (const chunk of request) body += chunk;
    try {
      const input = JSON.parse(body);
      const toolCall = input.name ? input : parseLegacy(input.argv || []);
      const result = await client.callTool(toolCall);
      record({kind: 'tools/call', name: toolCall.name, arguments: toolCall.arguments, pageId, success: !result.isError});
      if (result.isError) {
        throw new Error((result.content || []).map(item => item.text || '').join('\n') || 'MCP tool returned isError');
      }
      response.writeHead(200, {'content-type': 'application/json'});
      response.end(JSON.stringify({result}));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      record({kind: 'tools/call', success: false, error: message});
      response.writeHead(500, {'content-type': 'application/json'});
      response.end(JSON.stringify({error: message}));
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
  process.stdout.write('[MCP] persistent MCP client IPC bridge listening on 127.0.0.1:' + PORT + '\n');

  const shutdown = async () => {
    server.close();
    await client.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function callOne(argv) {
  try {
    // Parse inside the daemon so every request uses the MCP-created pageId.
    const response = await fetch('http://127.0.0.1:' + PORT + '/call', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({argv}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'MCP bridge request failed');
    const result = payload.result;
    const output = (result.content || []).filter(item => item.type === 'text').map(item => item.text).join('\n');
    process.stdout.write(output ? output + '\n' : JSON.stringify(result) + '\n');
  } catch (error) {
    process.stderr.write('MCP_TOOL_ERROR: ' + (error instanceof Error ? error.stack : String(error)) + '\n');
    process.exitCode = 1;
  }
}

try {
  if (process.argv[2] === 'daemon') await startBridge();
  else if (process.argv[2] === 'call') await callOne(process.argv.slice(3));
  else throw new Error('Usage: chrome-devtools-mcp-client.mjs daemon|call <MCP operation>');
} catch (error) {
  process.stderr.write('MCP_BOOT_ERROR: ' + (error instanceof Error ? error.stack : String(error)) + '\n');
  process.exitCode = 1;
}
