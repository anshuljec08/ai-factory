/**
 * Tool Routes
 * CRUD operations for tools
 */

const express = require('express');
const router = express.Router();

// In-memory tool storage (for MVP - will be replaced with proper storage)
let tools = [];

/**
 * GET /api/v1/tools
 * List all tools
 */
router.get('/', (req, res) => {
  const { type, search, limit = 50, offset = 0 } = req.query;
  
  let filtered = [...tools];
  
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      (t.description && t.description.toLowerCase().includes(searchLower))
    );
  }
  
  const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    data: paginated,
    pagination: {
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * GET /api/v1/tools/types
 * Get supported tool types
 */
router.get('/types', (req, res) => {
  res.json({
    data: [
      { id: 'mcp', name: 'MCP Server', description: 'Model Context Protocol server tools' },
      { id: 'rag', name: 'RAG', description: 'Retrieval Augmented Generation' },
      { id: 'graphrag', name: 'GraphRAG', description: 'Graph-based RAG' },
      { id: 'memory', name: 'Memory', description: 'Memory and context tools' },
      { id: 'api', name: 'REST API', description: 'REST API calls' },
      { id: 'database', name: 'Database', description: 'Database queries' },
      { id: 'code', name: 'Code Execution', description: 'Code execution sandbox' },
      { id: 'file', name: 'File Operations', description: 'File system operations' },
      { id: 'web', name: 'Web Scraping', description: 'Web scraping tools' },
      { id: 'browser', name: 'Browser', description: 'Browser automation' },
      { id: 'agent', name: 'Agent', description: 'Agent-as-tool' },
      { id: 'guardrails', name: 'Guardrails', description: 'Safety guardrails' },
      { id: 'custom', name: 'Custom', description: 'Custom tools' }
    ]
  });
});

/**
 * GET /api/v1/tools/:id
 * Get a single tool by ID
 */
router.get('/:id', (req, res) => {
  const tool = tools.find(t => t.id === req.params.id);
  
  if (!tool) {
    return res.status(404).json({
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Tool with ID '${req.params.id}' not found`
      }
    });
  }
  
  res.json({ data: tool });
});

/**
 * POST /api/v1/tools
 * Create a new tool
 */
router.post('/', (req, res) => {
  const toolData = req.body;
  
  if (!toolData.name) {
    return res.status(400).json({
      error: {
        code: 'MISSING_NAME',
        message: 'Tool name is required'
      }
    });
  }
  
  if (!toolData.type) {
    return res.status(400).json({
      error: {
        code: 'MISSING_TYPE',
        message: 'Tool type is required'
      }
    });
  }
  
  // Generate ID if not provided
  if (!toolData.id) {
    toolData.id = toolData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  
  // Check if tool already exists
  if (tools.find(t => t.id === toolData.id)) {
    return res.status(409).json({
      error: {
        code: 'TOOL_EXISTS',
        message: `Tool with ID '${toolData.id}' already exists`
      }
    });
  }
  
  // Add defaults
  const now = new Date().toISOString();
  const tool = {
    enabled: true,
    version: '1.0.0',
    timeout: 30000,
    ...toolData,
    metadata: {
      createdAt: now,
      updatedAt: now,
      ...toolData.metadata
    }
  };
  
  tools.push(tool);
  
  res.status(201).json({
    data: tool,
    message: 'Tool created successfully'
  });
});

/**
 * PUT /api/v1/tools/:id
 * Update a tool
 */
router.put('/:id', (req, res) => {
  const index = tools.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Tool with ID '${req.params.id}' not found`
      }
    });
  }
  
  const updatedTool = {
    ...tools[index],
    ...req.body,
    id: req.params.id,
    metadata: {
      ...tools[index].metadata,
      ...req.body.metadata,
      updatedAt: new Date().toISOString()
    }
  };
  
  tools[index] = updatedTool;
  
  res.json({
    data: updatedTool,
    message: 'Tool updated successfully'
  });
});

/**
 * DELETE /api/v1/tools/:id
 * Delete a tool
 */
router.delete('/:id', (req, res) => {
  const index = tools.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Tool with ID '${req.params.id}' not found`
      }
    });
  }
  
  tools.splice(index, 1);
  
  res.json({
    message: 'Tool deleted successfully',
    id: req.params.id
  });
});

module.exports = router;