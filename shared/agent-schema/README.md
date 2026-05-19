# AI Factory Agent Schema

JSON schemas and validation utilities for AI Factory agents and tools.

## Overview

This package provides:
- **Agent Schema** (`agent.schema.json`) - Defines the structure for AI agents
- **Tool Schema** (`tool.schema.json`) - Defines the structure for tools
- **Validator** (`validator.js`) - Validation utilities and helpers
- **Sample Agents** - Example agent configurations

## Installation

```bash
cd shared/agent-schema
npm install
```

## Usage

### Validate an Agent Configuration

```javascript
const { validateAgentConfig } = require('@ai-factory/agent-schema');

const agent = {
  id: 'my-agent',
  name: 'My Agent',
  framework: 'mcp',
  systemPrompt: 'You are a helpful assistant.',
  model: 'claude-4-sonnet'
};

const result = validateAgentConfig(agent);

if (result.valid) {
  console.log('Agent is valid!');
} else {
  console.log('Validation errors:', result.errors);
}
```

### Create Agent with Defaults

```javascript
const { createAgentWithDefaults } = require('@ai-factory/agent-schema');

const agent = createAgentWithDefaults({
  id: 'my-agent',
  name: 'My Agent',
  systemPrompt: 'You are a helpful assistant.'
});

// Agent now has all default values applied
console.log(agent.framework);  // 'mcp'
console.log(agent.model);      // 'claude-4-sonnet'
console.log(agent.maxSteps);   // 30
```

### Validate a Tool Configuration

```javascript
const { validateToolConfig } = require('@ai-factory/agent-schema');

const tool = {
  id: 'my-api-tool',
  name: 'My API Tool',
  type: 'api',
  config: {
    baseUrl: 'https://api.example.com'
  }
};

const result = validateToolConfig(tool);
console.log(result.valid);  // true or false
```

### Get Supported Values

```javascript
const { 
  getSupportedFrameworks, 
  getSupportedToolTypes,
  getSupportedModels 
} = require('@ai-factory/agent-schema');

console.log(getSupportedFrameworks());
// ['mcp', 'langgraph', 'maf', 'crewai']

console.log(getSupportedToolTypes());
// ['mcp', 'rag', 'graphrag', 'memory', 'api', 'database', ...]

console.log(getSupportedModels());
// [{ id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', provider: 'anthropic', ... }, ...]
```

## Agent Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase, alphanumeric, hyphens) |
| `name` | string | Human-readable name |
| `framework` | enum | `mcp`, `langgraph`, `maf`, `crewai` |
| `systemPrompt` | string | System prompt defining agent behavior |
| `model` | string | LLM model identifier |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | - | Agent description |
| `modelConfig` | object | - | Temperature, maxTokens, etc. |
| `tools` | array | `[]` | Tools available to the agent |
| `maxSteps` | integer | `30` | Maximum execution steps |
| `timeout` | integer | `30000` | Timeout in milliseconds |
| `capabilities` | object | - | Streaming, memory, etc. |
| `guardrails` | object | - | Safety configuration |
| `version` | string | `1.0.0` | Semantic version |
| `status` | enum | `draft` | `draft`, `active`, `inactive`, `archived` |
| `metadata` | object | - | Tags, category, timestamps |

### Capabilities

```json
{
  "capabilities": {
    "streaming": true,
    "humanInLoop": false,
    "memory": false,
    "codeExecution": false,
    "fileAccess": false,
    "webBrowsing": false
  }
}
```

### Model Configuration

```json
{
  "modelConfig": {
    "temperature": 0.7,
    "maxTokens": 4096,
    "topP": 1,
    "stopSequences": []
  }
}
```

## Tool Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Human-readable name |
| `type` | enum | Tool type (see below) |

### Tool Types

| Type | Description |
|------|-------------|
| `mcp` | MCP Server tools |
| `rag` | RAG/Vector search |
| `graphrag` | Graph-based RAG |
| `memory` | Memory/context tools |
| `api` | REST API calls |
| `database` | Database queries |
| `code` | Code execution |
| `file` | File operations |
| `web` | Web scraping |
| `browser` | Browser automation |
| `agent` | Agent-as-tool |
| `guardrails` | Safety guardrails |
| `custom` | Custom tools |

### Tool Configuration Examples

#### MCP Tool
```json
{
  "type": "mcp",
  "config": {
    "serverUrl": "https://mcp-server.example.com",
    "tools": ["get_data", "update_data"],
    "transport": "http"
  }
}
```

#### RAG Tool
```json
{
  "type": "rag",
  "config": {
    "vectorStore": "hana-vector",
    "embeddingModel": "text-embedding-3-small",
    "topK": 5,
    "scoreThreshold": 0.7,
    "namespace": "my-docs"
  }
}
```

#### API Tool
```json
{
  "type": "api",
  "config": {
    "baseUrl": "https://api.example.com",
    "endpoint": "/data",
    "method": "GET",
    "headers": {
      "Accept": "application/json"
    }
  }
}
```

#### Database Tool
```json
{
  "type": "database",
  "config": {
    "type": "hana",
    "schema": "MY_SCHEMA",
    "allowedOperations": ["SELECT"],
    "maxRows": 100
  }
}
```

## Sample Agents

### Production Agent
```bash
cat samples/production-agent.json
```

A production operations assistant for SAP Digital Manufacturing with:
- MCP tools for production orders and alerts
- RAG for production documentation
- Memory enabled for conversation context

### Sales Agent
```bash
cat samples/sales-agent.json
```

A sales order assistant for SAP S/4HANA with:
- API tools for sales orders and customers
- RAG for product catalog
- Database tool for sales analytics
- Human-in-loop enabled

## Validation

### Validate Sample Agents

```bash
npm run validate:samples
```

### Programmatic Validation

```javascript
const { validateAgentConfig, formatErrors } = require('@ai-factory/agent-schema');

const result = validateAgentConfig(myAgent);

if (!result.valid) {
  result.errors.forEach(error => {
    console.log(`${error.path}: ${error.message}`);
  });
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `validateAgentConfig(agent)` | Validate agent configuration |
| `validateToolConfig(tool)` | Validate tool configuration |
| `createAgentWithDefaults(partial)` | Create agent with defaults |
| `createToolWithDefaults(partial)` | Create tool with defaults |
| `generateAgentId(name)` | Generate ID from name |
| `getAgentSchema()` | Get agent JSON schema |
| `getToolSchema()` | Get tool JSON schema |
| `getSupportedFrameworks()` | Get framework list |
| `getSupportedToolTypes()` | Get tool type list |
| `getSupportedModels()` | Get model list |
| `formatErrors(errors)` | Format AJV errors |
| `deepMerge(target, source)` | Deep merge objects |

## License

MIT