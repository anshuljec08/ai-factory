const express = require('express');
const router = express.Router();
const toolService = require('../services/toolService');

router.get('/', async (req, res) => {
  try {
    const { type, search, enabled, category, tags, limit = 50, offset = 0 } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (search) filters.search = search;
    if (enabled !== undefined) filters.enabled = enabled === 'true';
    if (category) filters.category = category;
    if (tags) filters.tags = tags.split(',');

    const result = await toolService.listTools(filters, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      data: result.tools,
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/types', (req, res) => {
  res.json({
    data: [
      { id: 'mcp', name: 'MCP Server', description: 'Model Context Protocol server' },
      { id: 'api', name: 'REST API', description: 'REST API endpoints' },
      { id: 'rag', name: 'RAG', description: 'Retrieval Augmented Generation' },
      { id: 'database', name: 'Database', description: 'Database queries' },
      { id: 'custom', name: 'Custom', description: 'Custom tool implementation' }
    ]
  });
});

router.get('/:id', async (req, res) => {
  try {
    const tool = await toolService.getTool(req.params.id);
    if (!tool) {
      return res.status(404).json({
        error: { code: 'TOOL_NOT_FOUND', message: `Tool '${req.params.id}' not found` }
      });
    }
    res.json({ data: tool });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/:id/functions', async (req, res) => {
  try {
    const raw = req.query.raw === 'true';
    const result = await toolService.discoverFunctions(req.params.id, { skipFilter: raw });
    res.json({
      data: {
        toolId: result.tool.id,
        toolName: result.tool.name,
        type: result.tool.type,
        functions: result.functions,
        count: result.functions.length,
        filterApplied: !raw && result.tool.functionFilter?.mode !== 'all'
      }
    });
  } catch (err) {
    if (err.code === 'TOOL_NOT_FOUND') {
      return res.status(404).json({ error: { code: err.code, message: err.message } });
    }
    res.status(502).json({ error: { code: 'DISCOVERY_FAILED', message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const toolData = req.body;

    if (!toolData.name) {
      return res.status(400).json({
        error: { code: 'MISSING_NAME', message: 'Tool name is required' }
      });
    }
    if (!toolData.type) {
      return res.status(400).json({
        error: { code: 'MISSING_TYPE', message: 'Tool type is required' }
      });
    }

    const tool = await toolService.createTool(toolData);
    res.status(201).json({ data: tool, message: 'Tool created successfully' });
  } catch (err) {
    if (err.code === 'TOOL_EXISTS') {
      return res.status(409).json({ error: { code: err.code, message: err.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await toolService.updateTool(req.params.id, req.body);
    if (!result.found) {
      return res.status(404).json({
        error: { code: 'TOOL_NOT_FOUND', message: `Tool '${req.params.id}' not found` }
      });
    }
    res.json({ data: result.tool, message: 'Tool updated successfully' });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await toolService.deleteTool(req.params.id);
    if (!result.found) {
      return res.status(404).json({
        error: { code: 'TOOL_NOT_FOUND', message: `Tool '${req.params.id}' not found` }
      });
    }
    res.json({ message: 'Tool deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
