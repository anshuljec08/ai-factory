# AI Factory - Development Context

## Project Overview

AI Factory is a comprehensive platform for designing, deploying, and managing AI agents on SAP BTP. It provides a unified interface for creating agents using multiple frameworks (Default, LangGraph, MAF, CrewAI) with tools, guardrails, and memory capabilities.

## Current Status: Phase 2 In Progress

### Phase 1 (Complete)

| Component | Status | Notes |
|-----------|--------|-------|
| **Agent Designer** (List/Detail/Create) | Done | Full CRUD, framework/model/tools/guardrails config |
| **Chat View** | Done | Agent selection, streaming SSE, reasoning steps, copy, follow-ups, stop |
| **Service Layer** | Done | ChatService (agentic loop), LlmClient, McpClient, ConversationManager, HistoryManager, ToolSchemaAdapter, AgentManager |
| **MCP Builder** | Done | Connect to servers, discover tools, test execution, export, save |
| **Tool Manager** | Done | CRUD, search, filter, enable/disable, import/export, pending tools |
| **Agent Registry API** | Done | Express + CRUD + LLM proxy + MCP proxy + health check |
| **Home (Launchpad)** | Done | Tiles with live agent/tool counts from API |
| **Navigation** | Done | sap.tnt.ToolPage with collapsible side nav |
| **Deployment Config** | Done | mta.yaml, approuter, xs-app.json, deploy scripts |

### Phase 2 (In Progress)

| Component | Status | Notes |
|-----------|--------|-------|
| **Execution Engine (Node.js)** | Planned | Server-side agentic loop, MCP + LangGraph JS + MAF JS runtimes |
| **Execution Engine (Python)** | Planned | LangGraph Python + MAF Python + RAG service |
| **LangGraph Builder** | Planned | Visual graph builder UI (cytoscape.js) |
| **MAF Builder** | Planned | Agent team builder with handoff rules |
| **RAG Builder** | Planned | Document upload, chunking, vector store, test retrieval |
| **Agent Scheduler** | Planned | Cron-based agent execution, schedule management UI |
| **Dashboard** | Planned | Real metrics (executions, tokens, response time, errors) |
| **Logs & Monitor** | Planned | Execution history with reasoning steps drill-down |
| **Hooks System** | Planned | Lifecycle hooks (preExecution, postToolCall, onError) |
| **Context Providers** | Planned | Dynamic context injection (HTTP, RAG) into system prompt |
| **Structured Prompts** | Planned | Agent Designer structured prompt object |
| **Tool Registry** | Planned | Centralized tool persistence, agents reference by ID |

---

## Project Structure

```
AI_Factory/
├── apps/
│   └── ai-factory/                  # Single unified UI5 app
│       └── webapp/
│           ├── Component.js
│           ├── manifest.json
│           ├── view/
│           │   ├── App.view.xml              # Shell with side navigation
│           │   ├── Home.view.xml             # Launchpad tiles (live stats)
│           │   ├── agent/                    # Agent Designer (full CRUD)
│           │   ├── mcp/                      # MCP Builder (full)
│           │   ├── chat/                     # Chat UI (full)
│           │   ├── tools/                    # Tool Manager (full)
│           │   ├── langgraph/                # LangGraph Builder (Phase 2)
│           │   ├── maf/                      # MAF Builder (Phase 2)
│           │   ├── rag/                      # RAG Builder (Phase 2)
│           │   ├── scheduler/                # Agent Scheduler (Phase 2)
│           │   ├── dashboard/                # Dashboard (Phase 2)
│           │   └── logs/                     # Logs & Monitor (Phase 2)
│           ├── controller/                   # Mirrors view/ structure
│           ├── service/
│           │   ├── ChatService.js            # Agentic loop orchestrator
│           │   ├── LlmClient.js              # LLM calls + streaming
│           │   ├── McpClient.js              # MCP tool calls + batching
│           │   ├── ConversationManager.js    # History, metrics, compaction
│           │   ├── HistoryManager.js         # localStorage persistence
│           │   ├── AgentManager.js           # Agent loading + custom agents
│           │   └── ToolSchemaAdapter.js      # Provider schema mapping
│           ├── util/
│           │   └── Constants.js              # API URLs, defaults, system prompt builder
│           └── css/style.css
├── services/
│   ├── agent-registry/              # REST API (Express, port 3001)
│   │   └── src/
│   │       ├── index.js             # Server entry point
│   │       ├── routes/
│   │       │   ├── agents.js        # CRUD for agents
│   │       │   ├── tools.js         # CRUD for tools
│   │       │   ├── llm-proxy.js     # Proxy to SAP AI Proxy
│   │       │   └── mcp-proxy.js     # Proxy to MCP servers
│   │       └── data/agents.json     # Agent definitions
│   ├── execution-engine/            # ── PHASE 2 ──
│   │   ├── node/                    # Node.js engine (port 3003)
│   │   │   └── src/
│   │   │       ├── index.js         # Express gateway + framework router
│   │   │       ├── runtimes/
│   │   │       │   ├── mcp-runtime.js       # MCP agentic loop (server-side)
│   │   │       │   ├── langgraph-runtime.js # LangGraph JS
│   │   │       │   └── maf-runtime.js       # MAF/AutoGen JS
│   │   │       ├── services/
│   │   │       │   ├── framework-router.js  # Route by framework + runtime
│   │   │       │   ├── llm-client.js
│   │   │       │   ├── mcp-client.js
│   │   │       │   └── log-store.js
│   │   │       └── scheduler/
│   │   │           ├── scheduler.js         # Cron runner
│   │   │           └── schedule-store.js
│   │   └── python/                  # Python engine (port 3004)
│   │       └── app/
│   │           ├── main.py          # FastAPI entry point
│   │           ├── runtimes/
│   │           │   ├── langgraph_runtime.py # LangGraph Python
│   │           │   └── maf_runtime.py       # MAF/AutoGen Python
│   │           └── services/
│   │               ├── graph_builder.py
│   │               ├── maf_builder.py
│   │               └── rag_service.py       # Vector search + embeddings
│   └── mcp-proxy/                   # Dedicated MCP proxy (port 3002)
├── shared/
│   └── agent-schema/                # JSON schemas & validators
├── approuter/                       # BTP App Router
├── mta.yaml                         # Multi-target application config
└── docs/                            # Architecture docs
```

---

## Routes

| Route | View | Status |
|-------|------|--------|
| `home` | Home | Done |
| `agentList` | agent/AgentList | Done |
| `agentDetail/{agentId}` | agent/AgentDetail | Done |
| `agentCreate` | agent/AgentCreate | Done |
| `chat` | chat/Chat | Done |
| `mcpBuilder` | mcp/McpBuilder | Done |
| `toolManager` | tools/ToolManager | Done |
| `langGraphBuilder` | langgraph/LangGraphBuilder | Phase 2 |
| `mafBuilder` | maf/MafBuilder | Phase 2 |
| `ragBuilder` | rag/RagBuilder | Phase 2 |
| `scheduler` | scheduler/Scheduler | Phase 2 |
| `dashboard` | dashboard/Dashboard | Phase 2 |
| `logs` | logs/Logs | Phase 2 |

---

## Architecture Decisions

1. **Single App** with `sap.tnt.ToolPage` + SideNavigation (not 14 separate apps)
2. **Dual Execution Engine** — Node.js (MCP + LangGraph JS + MAF JS) + Python (LangGraph + MAF + RAG)
3. **Framework = "default"** for MCP-based agents; "mcp" is a tool type
4. **Runtime selection** — agents specify `runtime: "node"` (default) or `runtime: "python"`
5. **Provider-specific schema adaptation** via ToolSchemaAdapter (Claude, GPT, Gemini, Sonar)
6. **Batch tool calls** — McpClient batches multiple tool calls to same MCP server
7. **MTA deployment** to Cloud Foundry with approuter for auth routing
7. **Agent config from API** — AgentManager loads from `/api/v1/agents`, falls back to hardcoded defaults

---

## Service Layer Architecture

### Phase 1 (Client-Side — current)
```
Chat.controller.js
  └── ChatService.callAPI(message, agent, model, callbacks)
        ├── ConversationManager (history, metrics, compaction)
        ├── LlmClient.sendRequest() / .sendStreamingRequest()
        │     └── SAP AI Proxy (or direct LLM endpoint)
        ├── McpClient.callTools() / .callToolsBatch()
        │     └── MCP Server(s) via JSON-RPC
        └── ToolSchemaAdapter.convertTools(tools, provider)
```

### Phase 2 (Server-Side Dual Execution Engine)
```
Chat.controller.js
  └── ChatService.callAPI() → POST /execute/stream (SSE)
        │
        ▼
Node.js Engine (port 3003)
  ├── Framework Router
  │     ├── "default" → MCP Runtime (agentic loop, server-side)
  │     ├── "langgraph" (runtime=node) → LangGraph JS Runtime
  │     ├── "maf" (runtime=node) → MAF JS Runtime
  │     └── (runtime=python) → proxy to Python Engine
  ├── Scheduler (cron jobs → triggers agent executions)
  └── Log Store (execution history, metrics)
        │
        ▼ (when runtime = "python")
Python Engine (port 3004)
  ├── LangGraph Python Runtime (StateGraph)
  ├── MAF Python Runtime (AutoGen teams)
  └── RAG Service (vector search, embeddings)
```

---

## API Endpoints

### Agent Registry (port 3001)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/:id` | Get agent by ID |
| POST | `/api/v1/agents` | Create agent |
| PUT | `/api/v1/agents/:id` | Update agent |
| DELETE | `/api/v1/agents/:id` | Delete agent |
| GET | `/api/v1/tools` | List all tools |
| POST | `/api/v1/tools` | Create tool |
| POST | `/api/v1/chat/completions` | LLM proxy (OpenAI-compatible) |
| POST | `/api/v1/models` | List available models |
| GET | `/health` | Health check |

### Execution Engine — Node.js (port 3003) — Phase 2

| Method | Path | Description |
|--------|------|-------------|
| POST | `/execute` | Execute agent (blocking) |
| POST | `/execute/stream` | Execute agent (SSE streaming) |
| GET | `/executions/:id` | Get execution status |
| POST | `/executions/:id/stop` | Stop execution |
| GET | `/api/v1/schedules` | List schedules |
| POST | `/api/v1/schedules` | Create schedule |
| PUT | `/api/v1/schedules/:id` | Update schedule |
| DELETE | `/api/v1/schedules/:id` | Delete schedule |
| GET | `/health` | Health check |

### Execution Engine — Python (port 3004) — Phase 2

| Method | Path | Description |
|--------|------|-------------|
| POST | `/execute` | Execute LangGraph/MAF agent |
| POST | `/execute/stream` | Execute with SSE streaming |
| POST | `/rag/ingest` | Ingest documents into vector store |
| POST | `/rag/query` | Semantic search query |
| GET | `/health` | Health check |

---

## Local Development

```bash
# Start Agent Registry API (port 3001)
cd AI_Factory/services/agent-registry && node src/index.js

# Start MCP Proxy (port 3002) — if testing MCP tools locally
cd AI_Factory/services/mcp-proxy && node src/index.js

# Start Node.js Execution Engine (port 3003) — Phase 2
cd AI_Factory/services/execution-engine/node && node src/index.js

# Start Python Execution Engine (port 3004) — Phase 2
cd AI_Factory/services/execution-engine/python && uvicorn app.main:app --port 3004

# Start AI Factory UI (port 8080)
cd AI_Factory/apps/ai-factory && npx ui5 serve --port 8080

# Deploy to BTP
cd AI_Factory && mbt build && cf deploy mta_archives/ai-factory_1.0.0.mtar

# Test API
curl http://localhost:3001/api/v1/agents | jq
curl http://localhost:3001/health
```

---

## Key Configuration

**Constants.js:**
- `AGENTS_API_URL`: `/api/v1/agents`
- `OPENAI_API_URL`: `/api/v1/chat/completions`
- `MCP_PROXY_URL`: `http://localhost:3002/mcp-proxy` (local) / `/mcp-proxy` (prod)
- `DEFAULT_MODEL`: `claude-opus-4-6`
- `DEFAULT_AGENT`: `production-agent`

**Agent Schema (Phase 2):**
```json
{
  "id": "my-agent",
  "name": "My Agent",
  "framework": "default",
  "runtime": "node",
  "systemPrompt": "You are...",
  "model": "claude-opus-4-6",
  "modelConfig": { "temperature": 0.7, "maxTokens": 4096 },
  "tools": ["tool-id-1", "tool-id-2"],
  "maxSteps": 30,
  "capabilities": { "streaming": true, "memory": false },
  "guardrails": { "inputFilter": true, "contentPolicy": "moderate" },
  "contextProviders": [{ "type": "http", "url": "...", "field": "shift_info" }],
  "hooks": [{ "event": "postToolCall", "action": "log" }],
  "status": "active"
}
```

**Framework + Runtime options:**
- `framework`: `"default"` | `"langgraph"` | `"maf"`
- `runtime`: `"node"` (default) | `"python"`
- MCP agents always run in Node.js regardless of runtime setting

---

## Phase 2 — Dual Execution Engine (In Progress)

**4-Week Sprint:**
1. **Week 1:** Node.js Execution Engine + MCP runtime (server-side agentic loop)
2. **Week 2:** LangGraph + MAF runtimes in both JS and Python engines
3. **Week 3:** RAG tools + Context Providers + MAF Builder UI
4. **Week 4:** Agent Scheduler + Hooks + Dashboard + Logs

**Resolves all 5 Phase 1 deviations:**

| # | Deviation | Resolution (Week) |
|---|-----------|-------------------|
| 1 | Inline tool config | Tool Registry backend persistence (Week 4) |
| 2 | Client-side agentic loop | Execution Engine replaces ChatService loop (Week 1) |
| 3 | Plain string prompts | Structured prompt support in Agent Designer (Week 4) |
| 4 | No context providers | Context provider framework + RAG as context (Week 3) |
| 5 | No hooks | Lifecycle hooks in Execution Engine (Week 4) |

---

## Documentation

- `ARCHITECTURE.md` — Full architecture (security, API docs, error handling, deployment)
- `IMPROVEMENTS.md` — Future features (Tool Maker, Daemons, Goals, Plugin Store)
- `docs/implementation-plan.md` — 20-week implementation plan
- `docs/phase1-deviations.md` — 5 active deviations with resolution timeline
- `docs/services.md` — Backend services (Agent Registry, Execution Engine, Scheduler, RAG)
