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

## Execution Engine Service (Dual Engine)

Runs agents server-side using a dual-engine architecture. Both engines support LangGraph and MAF via their respective JS/Python SDKs.

### Node.js Engine (port 3003) — Gateway + MCP + LangGraph JS + MAF JS

The primary entry point. Routes requests by `agent.framework` and `agent.runtime`.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/execute` | Execute agent (blocking) |
| `POST` | `/execute/stream` | Execute agent (SSE streaming) |
| `GET` | `/executions/{id}` | Get execution status |
| `POST` | `/executions/{id}/stop` | Stop execution |
| `GET` | `/api/v1/schedules` | List schedules |
| `POST` | `/api/v1/schedules` | Create schedule |
| `PUT` | `/api/v1/schedules/{id}` | Update schedule |
| `DELETE` | `/api/v1/schedules/{id}` | Delete schedule |
| `GET` | `/api/v1/schedules/{id}/runs` | Schedule execution history |
| `GET` | `/health` | Health check |

**Runtimes:**
- `mcp-runtime.js` — MCP agentic loop (ported from ChatService.js)
- `langgraph-runtime.js` — `@langchain/langgraph` StateGraph builder + executor
- `maf-runtime.js` — AutoGen JS agent teams

### Python Engine (port 3004) — LangGraph Python + MAF Python + RAG

Called by Node.js engine when `agent.runtime === "python"`. Also hosts RAG service.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/execute` | Execute LangGraph/MAF agent |
| `POST` | `/execute/stream` | Execute with SSE streaming |
| `POST` | `/rag/ingest` | Ingest documents into vector store |
| `POST` | `/rag/query` | Semantic search query |
| `GET` | `/health` | Health check |

**Runtimes:**
- `langgraph_runtime.py` — `langgraph` + `langchain-core` StateGraph
- `maf_runtime.py` — `autogen-agentchat` + `autogen-ext` teams

### Execute Request
```json
POST /execute/stream
{
  "agentId": "production-agent",
  "message": "Show production orders with issues",
  "conversationId": "conv-123",
  "stream": true
}
```

### SSE Response Events
```
event: token
data: { "content": "Here are the..." }

event: tool_call
data: { "name": "get_orders", "input": {...}, "id": "call_123" }

event: tool_result
data: { "id": "call_123", "result": "..." }

event: step
data: { "node": "analyzer", "state": {...} }

event: handoff
data: { "from": "supervisor", "to": "worker1" }

event: done
data: { "reasoningData": { "steps": 5, "totalTime": "3.2s", "inputTokens": 1500 } }
```

### Framework Routing Logic
```
Request → Node.js Engine (port 3003)
  ├── framework = "default" → MCP Runtime (always local)
  ├── framework = "langgraph", runtime = "node" → LangGraph JS Runtime (local)
  ├── framework = "langgraph", runtime = "python" → proxy to Python :3004
  ├── framework = "maf", runtime = "node" → MAF JS Runtime (local)
  └── framework = "maf", runtime = "python" → proxy to Python :3004
```

### Execution Flow
```
1. Frontend sends POST /execute/stream
           │
           ▼
2. Node.js Engine receives request
           │
           ▼
3. Framework Router checks agent.framework + agent.runtime
           │
           ├── "default" → MCP Runtime (local agentic loop)
           ├── "langgraph" + "node" → LangGraph JS Runtime
           ├── "langgraph" + "python" → proxy to Python Engine
           ├── "maf" + "node" → MAF JS Runtime
           └── "maf" + "python" → proxy to Python Engine
           │
           ▼
4. Runtime executes agent, streams SSE events back
           │
           ▼
5. Log Store records execution metrics
```

---

## Scheduler Service

Embedded in the Node.js Execution Engine. Runs agents on cron schedules.

**Schedule Config:**
```json
{
  "id": "daily-production-report",
  "name": "Daily Production Report",
  "agentId": "production-agent",
  "schedule": {
    "type": "cron",
    "expression": "0 8 * * 1-5",
    "timezone": "Europe/Berlin"
  },
  "input": { "message": "Generate daily production status report" },
  "enabled": true,
  "notifications": {
    "onSuccess": ["webhook"],
    "onFailure": ["webhook"]
  }
}
```

---

## RAG Service

Embedded in the Python Engine. Provides document ingestion and semantic search.

**Ingest Request:**
```json
POST /rag/ingest
{
  "documents": [{ "content": "...", "metadata": { "source": "manual.pdf" } }],
  "vectorStore": "hana",
  "embeddingModel": "text-embedding-ada-002",
  "chunkSize": 512,
  "chunkOverlap": 50
}
```

**Query Request:**
```json
POST /rag/query
{
  "query": "What is the maintenance procedure for line 2?",
  "vectorStore": "hana",
  "topK": 5
}
```

**Vector Store Options:**
- SAP HANA Cloud Vector Engine (production)
- ChromaDB (local development)

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
│   │ UI (UI5) │    │ WebUI    │    │ (future) │                                     │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                                     │
│        │               │               │                                            │
│        │ /execute      │ /v1/chat/     │ /a2a/invoke                               │
│        │ /stream       │ completions   │                                            │
│        ▼               ▼               ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                    APPROUTER / API GATEWAY                                    │  │
│   │   /execute/*     → Execution Engine (Node.js :3003)                          │  │
│   │   /api/v1/*      → Agent Registry (:3001)                                    │  │
│   │   /schedules/*   → Execution Engine (Node.js :3003)                          │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                              │
│              ┌───────────────────────┼───────────────────┐                         │
│              ▼                       ▼                   ▼                         │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐              │
│   │  Agent Registry  │   │ Node.js Engine   │   │ Python Engine    │              │
│   │  (port 3001)     │   │ (port 3003)      │   │ (port 3004)      │              │
│   │                  │   │                  │   │                  │              │
│   │  - Agent CRUD    │   │  - Framework     │   │  - LangGraph Py  │              │
│   │  - Tool CRUD     │   │    Router        │   │  - MAF Python    │              │
│   │  - LLM Proxy     │   │  - MCP Runtime   │   │  - RAG Service   │              │
│   │  - MCP Proxy     │   │  - LangGraph JS  │   │                  │              │
│   │                  │   │  - MAF JS        │   │                  │              │
│   │                  │   │  - Scheduler     │   │                  │              │
│   │                  │   │  - Log Store     │   │                  │              │
│   └──────────────────┘   └────────┬─────────┘   └──────────────────┘              │
│                                   │                       ▲                         │
│                                   │  (proxy when          │                         │
│                                   │   runtime="python")   │                         │
│                                   └───────────────────────┘                         │
│                                      │                                              │
│                    ┌─────────────────┼─────────────────┐                           │
│                    ▼                 ▼                 ▼                           │
│             ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│             │ SAP AI   │      │ MCP      │      │ Vector   │                      │
│             │ Proxy    │      │ Servers  │      │ Store    │                      │
│             │ (LLMs)   │      │ (Tools)  │      │ (HANA)   │                      │
│             └──────────┘      └──────────┘      └──────────┘                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Framework-Specific Deployment

| Framework | Node.js Engine (JS) | Python Engine | Deployment |
|-----------|---------------------|---------------|------------|
| **MCP (default)** | ✅ MCP Runtime | — | Node.js only |
| **LangGraph** | ✅ `@langchain/langgraph` | ✅ `langgraph` + `langchain-core` | Both engines |
| **MAF** | ✅ `autogen-agentchat` JS | ✅ `autogen-agentchat` + `autogen-ext` | Both engines |
| **RAG** | — | ✅ `chromadb` / HANA Vector | Python only |

**Runtime selection:** Agent config field `runtime: "node"` (default) or `"python"` determines which engine executes.

---

## What Gets Deployed vs What's Configurable

| Component | Deployed? | Configurable at Runtime? |
|-----------|-----------|--------------------------|
| **Node.js Engine** | ✅ Yes (once) | ❌ No |
| **Python Engine** | ✅ Yes (once) | ❌ No |
| **Scheduler** | ✅ Yes (part of Node engine) | ✅ Schedules are CRUD |
| **Agent Definitions** | ❌ No | ✅ Yes |
| **System Prompts** | ❌ No | ✅ Yes |
| **Tool Configurations** | ❌ No | ✅ Yes |
| **Model Selection** | ❌ No | ✅ Yes |
| **Max Steps, Timeouts** | ❌ No | ✅ Yes |
| **Context Providers** | ❌ No | ✅ Yes (per agent) |
| **Hooks** | ❌ No | ✅ Yes (per agent) |