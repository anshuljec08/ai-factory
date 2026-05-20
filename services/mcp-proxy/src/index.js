/**
 * MCP Proxy Service
 * 
 * Express server that provides MCP proxy endpoints for the AI Factory.
 * Handles OAuth2 authentication, MCP session management, and request forwarding.
 */

const express = require('express');
const cors = require('cors');
const { handleMcpProxy, handleMcpProxyBatch } = require('./mcp-proxy');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-proxy', timestamp: new Date().toISOString() });
});

// Single MCP proxy endpoint
app.post('/mcp-proxy', async (req, res) => {
  try {
    console.log('[MCP Proxy] Request received for:', req.body.mcpUrl);
    const result = await handleMcpProxy(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[MCP Proxy] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Batch MCP proxy endpoint
app.post('/mcp-proxy-batch', async (req, res) => {
  try {
    console.log('[MCP Proxy Batch] Request received for:', req.body.mcpUrl, 'with', req.body.requests?.length, 'requests');
    const result = await handleMcpProxyBatch(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[MCP Proxy Batch] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[MCP Proxy] Service running on port ${PORT}`);
  console.log(`[MCP Proxy] Endpoints:`);
  console.log(`  POST /mcp-proxy       - Single MCP request`);
  console.log(`  POST /mcp-proxy-batch - Batch MCP requests`);
  console.log(`  GET  /health          - Health check`);
});