# AI Factory - Backend Services

> Documentation for all backend services in the AI Factory platform.

---

## Table of Contents

1. [Agent Registry Service](#agent-registry-service)
2. [Execution Engine Service](#execution-engine-service)
3. [A2A Orchestrator Service](#a2a-orchestrator-service)
4. [Metrics Collector Service](#metrics-collector-service)

---

## Agent Registry Service

Central service for managing agent definitions.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/agents` | List all agents |
| `GET` | `/agents/{id}` | Get agent by ID |
| `POST` | `/agents` | Create agent |
| `PUT` | `/agents/{id}` | Update agent |
| `DELETE` | `/agents/{id}` | Delete agent |
| `GET` | `/agents/{id}/versions` | Get agent versions |

**Example Response:**
```json
{
  "id": "production-agent",
  "name": "Production Assistant",
  "framework": "langgraph",
  "systemPrompt": "You are a Production Operations Assistant...",
  "model": "claude-4-sonnet",
  "tools": [
    {
      "name": "get_production_orders",
      "mcpUrl": "https://dmc-mcp-server.cfapps.../mcp-proxy"
    },
    {
      "name": "get_alerts",
      "mcpUrl": "https://dmc-mcp-server.cfapps.../mcp-proxy"
    }
  ],
  "maxSteps": 30,
  "capabilities": {
    "streaming": true,
    "humanInLoop": false
  }
}
```

---

## Execution Engine Service

Runs agents and handles tool calls.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/execute` | Execute agent with input |
| `POST` | `/execute/stream` | Execute with streaming |
| `GET` | `/executions/{id}` | Get execution status |
| `POST` | `/executions/{id}/stop` | Stop execution |

**Execute Request:**
```json
POST /execute
{
  "agentId": "production-agent",
  "message": "Show production orders with issues",
  "stream": true,
  "context": {
    "conversationId": "conv-123"
  }
}
```

**Execution Flow:**
```
1. User sends message to "Production Agent"
           │
           ▼
2. Execution Engine receives request
           │
           ▼
3. Loads agent config from Registry
   {
     "framework": "langgraph",
     "systemPrompt": "...",
     "tools": [...]
   }
           │
           ▼
4. Dynamically creates agent instance
   with the loaded configuration
           │
           ▼
5. Executes agent and returns response
```

---

## A2A Orchestrator Service

Manages agent-to-agent communication.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/flows` | Create A2A flow |
| `POST` | `/flows/{id}/execute` | Execute flow |
| `GET` | `/flows/{id}/status` | Get flow status |

**A2A Protocol Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/a2a/agents` | List available agents (Agent Cards) |
| `GET` | `/a2a/agents/{id}` | Get agent card |
| `POST` | `/a2a/tasks` | Invoke agent task |
| `POST` | `/a2a/tasks/stream` | Stream agent response |

---

## Metrics Collector Service

Collects and stores metrics.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/metrics` | Record metrics |
| `GET` | `/metrics/agents/{id}` | Get agent metrics |
| `GET` | `/metrics/summary` | Get summary |

**Metrics Tracked:**
- Token consumption (input/output)
- Response times
- Tool call counts
- Error rates
- Cost tracking

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SERVICES ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                                     │
│   │ Custom   │    │ Open     │    │ Joule    │                                     │
│   │ UI (UI5) │    │ WebUI    │    │          │                                     │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                                     │
│        │               │               │                                            │
│        │ /execute      │ /v1/chat/     │ /a2a/invoke                               │
│        │               │ completions   │                                            │
│        ▼               ▼               ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                         API GATEWAY                                          │  │
│   │                                                                               │  │
│   │   Routes:                                                                    │  │
│   │   /execute/*           → Execution Engine                                    │  │
│   │   /v1/chat/completions → OpenAI Adapter → Execution Engine                   │  │
│   │   /v1/models           → Agent Registry (list agents as models)             │  │
│   │   /a2a/*               → A2A Orchestrator                                    │  │
│   │   /agents/*            → Agent Registry                                      │  │
│   │                                                                               │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                              │
│                                      ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                      EXECUTION ENGINE                                        │  │
│   │                                                                               │  │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                       │  │
│   │   │ MCP Runtime │   │ LangGraph   │   │ MAF Runtime │                       │  │
│   │   │             │   │ Runtime     │   │             │                       │  │
│   │   └─────────────┘   └─────────────┘   └─────────────┘                       │  │
│   │                                                                               │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                              │
│                    ┌─────────────────┼─────────────────┐                           │
│                    ▼                 ▼                 ▼                           │
│             ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│             │ SAP AI   │      │ MCP      │      │ Agent    │                      │
│             │ Proxy    │      │ Servers  │      │ Registry │                      │
│             │ (LLMs)   │      │ (Tools)  │      │ (Config) │                      │
│             └──────────┘      └──────────┘      └──────────┘                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Framework-Specific Deployment

| Framework | Where Agent Logic Runs | Deployment Required |
|-----------|------------------------|---------------------|
| **MCP** | Browser (JavaScript) | ❌ None (UI only) |
| **LangGraph** | Execution Engine (Python) | ✅ Execution Engine |
| **MAF** | Execution Engine (Python/.NET) | ✅ Execution Engine |

---

## What Gets Deployed vs What's Configurable

| Component | Deployed? | Configurable at Runtime? |
|-----------|-----------|--------------------------|
| **Execution Engine** | ✅ Yes (once) | ❌ No |
| **LangGraph Runtime** | ✅ Yes (part of engine) | ❌ No |
| **MAF Runtime** | ✅ Yes (part of engine) | ❌ No |
| **Agent Definitions** | ❌ No | ✅ Yes |
| **System Prompts** | ❌ No | ✅ Yes |
| **Tool Configurations** | ❌ No | ✅ Yes |
| **Model Selection** | ❌ No | ✅ Yes |
| **Max Steps, Timeouts** | ❌ No | ✅ Yes |