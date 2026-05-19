/**
 * AI Factory Schema Validator
 * Validates agent and tool configurations against JSON schemas
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Import schemas
const agentSchema = require('./agent.schema.json');
const toolSchema = require('./tool.schema.json');

// Initialize AJV with options
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  useDefaults: true
});

// Add format validators (date-time, uri, etc.)
addFormats(ajv);

// Compile schemas
const validateAgent = ajv.compile(agentSchema);
const validateTool = ajv.compile(toolSchema);

/**
 * Validate an agent configuration
 * @param {Object} agent - Agent configuration object
 * @returns {Object} - { valid: boolean, errors: Array|null, data: Object }
 */
function validateAgentConfig(agent) {
  const valid = validateAgent(agent);
  
  if (valid) {
    return {
      valid: true,
      errors: null,
      data: agent
    };
  }
  
  return {
    valid: false,
    errors: formatErrors(validateAgent.errors),
    data: agent
  };
}

/**
 * Validate a tool configuration
 * @param {Object} tool - Tool configuration object
 * @returns {Object} - { valid: boolean, errors: Array|null, data: Object }
 */
function validateToolConfig(tool) {
  const valid = validateTool(tool);
  
  if (valid) {
    return {
      valid: true,
      errors: null,
      data: tool
    };
  }
  
  return {
    valid: false,
    errors: formatErrors(validateTool.errors),
    data: tool
  };
}

/**
 * Format AJV errors into a more readable format
 * @param {Array} errors - AJV error array
 * @returns {Array} - Formatted errors
 */
function formatErrors(errors) {
  if (!errors) return [];
  
  return errors.map(error => ({
    path: error.instancePath || '/',
    property: error.params?.missingProperty || error.params?.additionalProperty || '',
    message: error.message,
    keyword: error.keyword,
    params: error.params,
    schemaPath: error.schemaPath
  }));
}

/**
 * Create a new agent with defaults applied
 * @param {Object} partialAgent - Partial agent configuration
 * @returns {Object} - Agent with defaults applied
 */
function createAgentWithDefaults(partialAgent) {
  const defaults = {
    framework: 'mcp',
    model: 'claude-4-sonnet',
    maxSteps: 30,
    timeout: 30000,
    version: '1.0.0',
    status: 'draft',
    capabilities: {
      streaming: true,
      humanInLoop: false,
      memory: false,
      codeExecution: false,
      fileAccess: false,
      webBrowsing: false
    },
    modelConfig: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1
    },
    guardrails: {
      inputFilter: true,
      outputFilter: true,
      contentPolicy: 'moderate'
    },
    tools: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    }
  };
  
  return deepMerge(defaults, partialAgent);
}

/**
 * Create a new tool with defaults applied
 * @param {Object} partialTool - Partial tool configuration
 * @returns {Object} - Tool with defaults applied
 */
function createToolWithDefaults(partialTool) {
  const defaults = {
    enabled: true,
    version: '1.0.0',
    timeout: 30000,
    retry: {
      maxRetries: 3,
      backoffMs: 1000,
      backoffMultiplier: 2
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 10000
    },
    authentication: {
      type: 'none'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    }
  };
  
  return deepMerge(defaults, partialTool);
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} - Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Generate a unique agent ID from name
 * @param {string} name - Agent name
 * @returns {string} - Generated ID
 */
function generateAgentId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Get the JSON schema for agents
 * @returns {Object} - Agent JSON schema
 */
function getAgentSchema() {
  return agentSchema;
}

/**
 * Get the JSON schema for tools
 * @returns {Object} - Tool JSON schema
 */
function getToolSchema() {
  return toolSchema;
}

/**
 * Get list of supported frameworks
 * @returns {Array} - Framework list
 */
function getSupportedFrameworks() {
  return ['mcp', 'langgraph', 'maf', 'crewai'];
}

/**
 * Get list of supported tool types
 * @returns {Array} - Tool type list
 */
function getSupportedToolTypes() {
  return [
    'mcp', 'rag', 'graphrag', 'memory', 'api', 
    'database', 'code', 'file', 'web', 'browser', 
    'agent', 'guardrails', 'custom'
  ];
}

/**
 * Get list of supported models
 * @returns {Array} - Model list with metadata
 */
function getSupportedModels() {
  return [
    { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', provider: 'anthropic', contextWindow: 200000 },
    { id: 'claude-4-opus', name: 'Claude 4 Opus', provider: 'anthropic', contextWindow: 200000 },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000 },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextWindow: 128000 },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', contextWindow: 1000000 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', contextWindow: 2000000 }
  ];
}

module.exports = {
  validateAgentConfig,
  validateToolConfig,
  createAgentWithDefaults,
  createToolWithDefaults,
  generateAgentId,
  getAgentSchema,
  getToolSchema,
  getSupportedFrameworks,
  getSupportedToolTypes,
  getSupportedModels,
  formatErrors,
  deepMerge
};