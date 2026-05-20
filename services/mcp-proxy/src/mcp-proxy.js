/**
 * MCP Proxy Handler
 * Proxies JSON-RPC requests to remote MCP servers, handling:
 *  - OAuth2 client_credentials token fetching
 *  - MCP session initialization (Streamable HTTP transport)
 *  - Session ID caching and auto-retry on expiry
 */

const https = require('https');
const http = require('http');
const { URL, URLSearchParams } = require('url');

// In-memory session store: mcpUrl -> { sessionId, lastUsed }
const mcpSessions = new Map();
const mcpInitPromises = new Map(); // mcpUrl -> Promise<sessionId> (dedup concurrent inits)
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of mcpSessions) {
    if (now - session.lastUsed > SESSION_TTL_MS) {
      mcpSessions.delete(key);
      console.log(`[MCP Proxy] Expired session for ${key}`);
    }
  }
}

/**
 * Low-level HTTPS/HTTP request that returns { statusCode, headers, body }
 */
function rawRequest(urlStr, options = {}, body = null, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: timeoutMs
    };
    if (body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// In-memory OAuth token cache: "tokenUrl|clientId" -> { token, expiresAt }
const oauthTokenCache = new Map();

async function fetchOAuthToken(authConfig) {
  if (!authConfig || !authConfig.tokenUrl) return null;

  // Check cache first
  const cacheKey = authConfig.tokenUrl + '|' + (authConfig.clientId || '');
  const cached = oauthTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: authConfig.clientId || '',
    client_secret: authConfig.clientSecret || ''
  }).toString();

  const result = await rawRequest(authConfig.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, params);

  if (result.statusCode >= 400) {
    throw new Error(`OAuth token fetch failed: ${result.statusCode}`);
  }

  const token = result.body.access_token;
  const expiresIn = (result.body.expires_in || 3600) * 1000;

  // Cache with 60s safety margin
  oauthTokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + expiresIn - 60000
  });
  console.log(`[MCP Proxy] OAuth token cached (expires in ${Math.round(expiresIn / 1000)}s)`);

  return token;
}

async function initializeMcpSession(mcpUrl, authHeaders) {
  const result = await rawRequest(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      ...authHeaders
    }
  }, JSON.stringify({
    jsonrpc: '2.0',
    id: 'init-' + Date.now(),
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'ai-factory-mcp-proxy', version: '1.0.0' }
    }
  }));

  if (result.statusCode >= 400) {
    throw new Error(`MCP initialize failed: ${result.statusCode} - ${JSON.stringify(result.body)}`);
  }

  const sessionId = result.headers['mcp-session-id'] || null;
  console.log(`[MCP Proxy] Session initialized: ${sessionId ? sessionId.substring(0, 20) + '...' : 'none'}`);

  // Send initialized notification (fire-and-forget)
  if (sessionId) {
    rawRequest(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Mcp-Session-Id': sessionId,
        ...authHeaders
      }
    }, JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    })).catch(err => console.warn('[MCP Proxy] Initialized notification failed:', err.message));
  }

  return sessionId;
}

async function getMcpSessionId(mcpUrl, authHeaders) {
  cleanExpiredSessions();

  const cached = mcpSessions.get(mcpUrl);
  if (cached && cached.sessionId) {
    cached.lastUsed = Date.now();
    return cached.sessionId;
  }

  // Dedup: if an init is already in-flight for this URL, wait for it
  if (mcpInitPromises.has(mcpUrl)) {
    return mcpInitPromises.get(mcpUrl);
  }

  const initPromise = initializeMcpSession(mcpUrl, authHeaders).then(sessionId => {
    if (sessionId) {
      mcpSessions.set(mcpUrl, { sessionId, lastUsed: Date.now() });
    }
    mcpInitPromises.delete(mcpUrl);
    return sessionId;
  }).catch(err => {
    mcpInitPromises.delete(mcpUrl);
    throw err;
  });

  mcpInitPromises.set(mcpUrl, initPromise);
  return initPromise;
}

async function forwardMcpRequest(mcpUrl, jsonrpcBody, authHeaders, sessionId, timeoutMs) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    ...authHeaders
  };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }

  return rawRequest(mcpUrl, { method: 'POST', headers }, JSON.stringify(jsonrpcBody), timeoutMs);
}

/**
 * Main proxy handler. Call from the HTTP server route.
 * @param {object} payload - Parsed JSON body: { mcpUrl, authConfig?, jsonrpc }
 * @returns {{ status: number, body: any }}
 */
async function handleMcpProxy(payload) {
  const { mcpUrl, authConfig, jsonrpc, timeoutMs: reqTimeout } = payload;
  const timeoutMs = reqTimeout || 30000;

  if (!mcpUrl || !jsonrpc) {
    return { status: 400, body: { error: 'Missing required fields: mcpUrl, jsonrpc' } };
  }

  // Get OAuth token if auth config provided
  let authHeaders = {};
  if (authConfig && authConfig.tokenUrl) {
    try {
      const token = await fetchOAuthToken(authConfig);
      if (token) {
        authHeaders = { 'Authorization': `Bearer ${token}` };
      }
    } catch (err) {
      console.error('[MCP Proxy] OAuth error:', err.message);
      return { status: 401, body: { error: 'OAuth token fetch failed: ' + err.message } };
    }
  }

  // Get or create MCP session
  let sessionId;
  try {
    sessionId = await getMcpSessionId(mcpUrl, authHeaders);
  } catch (err) {
    console.error('[MCP Proxy] Session init error:', err.message);
    return { status: 502, body: { error: 'MCP session initialization failed: ' + err.message } };
  }

  // Forward the actual request
  let result = await forwardMcpRequest(mcpUrl, jsonrpc, authHeaders, sessionId, timeoutMs);

  // If session expired, retry once with a fresh session
  if (result.statusCode === 400 || (result.body && result.body.error &&
      typeof result.body.error.message === 'string' &&
      result.body.error.message.toLowerCase().includes('session'))) {
    console.log('[MCP Proxy] Session may be expired, reinitializing...');
    mcpSessions.delete(mcpUrl);
    try {
      sessionId = await getMcpSessionId(mcpUrl, authHeaders);
      result = await forwardMcpRequest(mcpUrl, jsonrpc, authHeaders, sessionId, timeoutMs);
    } catch (retryErr) {
      return { status: 502, body: { error: 'MCP retry failed: ' + retryErr.message } };
    }
  }

  return { status: result.statusCode || 200, body: result.body };
}

/**
 * Batch proxy handler. Executes multiple JSON-RPC calls with a single OAuth token + session.
 * @param {object} payload - { mcpUrl, authConfig?, requests: [jsonrpc1, jsonrpc2, ...] }
 * @returns {{ status: number, body: { results: any[] } }}
 */
async function handleMcpProxyBatch(payload) {
  const { mcpUrl, authConfig, requests } = payload;

  if (!mcpUrl || !requests || !Array.isArray(requests) || requests.length === 0) {
    return { status: 400, body: { error: 'Missing required fields: mcpUrl, requests (array)' } };
  }

  // Fetch OAuth token ONCE
  let authHeaders = {};
  if (authConfig && authConfig.tokenUrl) {
    try {
      const token = await fetchOAuthToken(authConfig);
      if (token) {
        authHeaders = { 'Authorization': `Bearer ${token}` };
      }
    } catch (err) {
      console.error('[MCP Proxy Batch] OAuth error:', err.message);
      return { status: 401, body: { error: 'OAuth token fetch failed: ' + err.message } };
    }
  }

  // Get MCP session ONCE
  let sessionId;
  try {
    sessionId = await getMcpSessionId(mcpUrl, authHeaders);
  } catch (err) {
    console.error('[MCP Proxy Batch] Session init error:', err.message);
    return { status: 502, body: { error: 'MCP session initialization failed: ' + err.message } };
  }

  console.log(`[MCP Proxy Batch] Executing ${requests.length} calls in parallel`);

  // Execute all in parallel
  const results = await Promise.all(requests.map(async (jsonrpc) => {
    try {
      let result = await forwardMcpRequest(mcpUrl, jsonrpc, authHeaders, sessionId, 120000);

      // Retry on session expiry
      if (result.statusCode === 400 || (result.body && result.body.error &&
          typeof result.body.error.message === 'string' &&
          result.body.error.message.toLowerCase().includes('session'))) {
        mcpSessions.delete(mcpUrl);
        sessionId = await getMcpSessionId(mcpUrl, authHeaders);
        result = await forwardMcpRequest(mcpUrl, jsonrpc, authHeaders, sessionId, 120000);
      }

      return result.body;
    } catch (err) {
      return { error: { message: err.message } };
    }
  }));

  return { status: 200, body: { results } };
}

module.exports = { handleMcpProxy, handleMcpProxyBatch };