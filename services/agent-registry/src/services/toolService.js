const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const DATA_FILE = path.join(__dirname, '../data/tools.json');

function loadTools() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveTools([]);
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading tools:', error);
    return [];
  }
}

function saveTools(tools) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(tools, null, 2));
  } catch (error) {
    console.error('Error saving tools:', error);
    throw error;
  }
}

function generateToolId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

async function listTools(filters = {}, pagination = {}) {
  const tools = loadTools();
  let filtered = [...tools];

  if (filters.type) {
    filtered = filtered.filter(t => t.type === filters.type);
  }

  if (filters.enabled !== undefined) {
    filtered = filtered.filter(t => t.enabled === filters.enabled);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      (t.description && t.description.toLowerCase().includes(searchLower)) ||
      t.id.toLowerCase().includes(searchLower)
    );
  }

  if (filters.category) {
    filtered = filtered.filter(t => t.metadata?.category === filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(t =>
      t.metadata?.tags?.some(tag => filters.tags.includes(tag))
    );
  }

  filtered.sort((a, b) =>
    new Date(b.metadata?.updatedAt || 0) - new Date(a.metadata?.updatedAt || 0)
  );

  const { limit = 50, offset = 0 } = pagination;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    tools: paginated,
    total: filtered.length
  };
}

async function getTool(id) {
  const tools = loadTools();
  return tools.find(t => t.id === id) || null;
}

async function createTool(toolData) {
  const tools = loadTools();

  if (!toolData.id) {
    toolData.id = generateToolId(toolData.name);
  }

  if (tools.find(t => t.id === toolData.id)) {
    const error = new Error(`Tool with ID '${toolData.id}' already exists`);
    error.code = 'TOOL_EXISTS';
    throw error;
  }

  const now = new Date().toISOString();
  const tool = {
    type: 'mcp',
    enabled: true,
    functionFilter: { mode: 'all' },
    ...toolData,
    metadata: {
      createdAt: now,
      updatedAt: now,
      tags: [],
      ...toolData.metadata
    }
  };

  tools.push(tool);
  saveTools(tools);

  return tool;
}

async function updateTool(id, toolData) {
  const tools = loadTools();
  const index = tools.findIndex(t => t.id === id);

  if (index === -1) {
    return { found: false, tool: null };
  }

  const existing = tools[index];
  const updated = {
    ...existing,
    ...toolData,
    id,
    metadata: {
      ...existing.metadata,
      ...toolData.metadata,
      updatedAt: new Date().toISOString()
    }
  };

  tools[index] = updated;
  saveTools(tools);

  return { found: true, tool: updated };
}

async function deleteTool(id) {
  const tools = loadTools();
  const index = tools.findIndex(t => t.id === id);

  if (index === -1) {
    return { found: false };
  }

  tools.splice(index, 1);
  saveTools(tools);

  return { found: true };
}

const tokenCache = {};

function fetchOAuthToken(authConfig) {
  const cacheKey = authConfig.tokenUrl + '|' + authConfig.clientId;
  const cached = tokenCache[cacheKey];
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return Promise.resolve(cached.token);
  }

  return new Promise((resolve, reject) => {
    const url = new URL(authConfig.tokenUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: authConfig.clientId,
      client_secret: authConfig.clientSecret
    }).toString();

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            tokenCache[cacheKey] = {
              token: parsed.access_token,
              expiresAt: Date.now() + ((parsed.expires_in || 3600) * 1000)
            };
            resolve(parsed.access_token);
          } else {
            reject(new Error('OAuth token response missing access_token'));
          }
        } catch (e) {
          reject(new Error('Failed to parse OAuth response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

function mcpRawRequest(mcpUrl, jsonrpcBody, authToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(mcpUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const body = JSON.stringify(jsonrpcBody);
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(body)
    };
    if (authToken) {
      headers['Authorization'] = 'Bearer ' + authToken;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers,
      timeout: 15000
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ body: JSON.parse(data), headers: res.headers, statusCode: res.statusCode });
        } catch (e) {
          reject(new Error('Invalid JSON from MCP server'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MCP request timed out'));
    });
    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

async function mcpRequest(mcpUrl, jsonrpcBody, authToken) {
  // First try direct request
  let result = await mcpRawRequest(mcpUrl, jsonrpcBody, authToken);

  // If session required, initialize and retry
  if (result.statusCode === 400 || (result.body?.error?.message && result.body.error.message.includes('session'))) {
    const initResult = await mcpRawRequest(mcpUrl, {
      jsonrpc: '2.0',
      id: 'init-' + Date.now(),
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'ai-factory-tool-discovery', version: '1.0.0' }
      }
    }, authToken);

    const sessionId = initResult.headers['mcp-session-id'];
    if (sessionId) {
      // Retry with session
      const retryResult = await new Promise((resolve, reject) => {
        const url = new URL(mcpUrl);
        const transport = url.protocol === 'https:' ? https : http;
        const body = JSON.stringify(jsonrpcBody);
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Content-Length': Buffer.byteLength(body),
          'Mcp-Session-Id': sessionId
        };
        if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

        const req = transport.request({
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'POST',
          headers,
          timeout: 15000
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error('Invalid JSON from MCP server')); }
          });
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('MCP request timed out')); });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
      return retryResult;
    }
  }

  return result.body;
}

async function discoverFunctions(toolId, options = {}) {
  const tool = await getTool(toolId);
  if (!tool) {
    const error = new Error(`Tool '${toolId}' not found`);
    error.code = 'TOOL_NOT_FOUND';
    throw error;
  }

  if (tool.type !== 'mcp') {
    return { tool, functions: [], message: 'Function discovery only supported for MCP tools' };
  }

  let token = null;
  if (tool.config.authType === 'oauth2' && tool.config.authConfig) {
    token = await fetchOAuthToken(tool.config.authConfig);
  }

  const jsonrpc = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  const response = await mcpRequest(tool.config.mcpUrl, jsonrpc, token);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message || JSON.stringify(response.error)}`);
  }

  let functions = response.result?.tools || [];

  if (!options.skipFilter && tool.functionFilter && tool.functionFilter.mode !== 'all') {
    const filterNames = tool.functionFilter.functions || [];
    if (tool.functionFilter.mode === 'include') {
      functions = functions.filter(f => filterNames.includes(f.name));
    } else if (tool.functionFilter.mode === 'exclude') {
      functions = functions.filter(f => !filterNames.includes(f.name));
    }
  }

  return { tool, functions };
}

module.exports = {
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  discoverFunctions,
  generateToolId
};
