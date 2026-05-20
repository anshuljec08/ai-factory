# AI Factory - Deployment Model

> Documentation for deployment architecture, implementation phases, and technology stack.

---

## Table of Contents

1. [Deployment Model](#deployment-model)
2. [Implementation Phases](#implementation-phases)
3. [Technology Stack](#technology-stack)
4. [Fiori Launchpad](#fiori-launchpad)

---

## Deployment Model

### Key Principle: Single Deployment, Multiple Agents

**You do NOT need to deploy each agent separately.** Instead, deploy the Dual Execution Engine once (Node.js + Python), and agents are loaded dynamically from the Agent Registry at runtime.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SINGLE DEPLOYMENT MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │              NODE.JS ENGINE (port 3003) — Deploy Once                        │    │
│  │                                                                               │    │
│  │   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────────────┐    │    │
│  │   │   MCP    │   │ LangGraph JS │   │  MAF JS  │   │ Scheduler +      │    │    │
│  │   │ Runtime  │   │   Runtime    │   │ Runtime  │   │ Log Store        │    │    │
│  │   └──────────┘   └──────────────┘   └──────────┘   └──────────────────┘    │    │
│  │                                                                               │    │
│  │   Routes by agent.framework + agent.runtime                                  │    │
│  │   Proxies to Python engine when runtime = "python"                           │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                               │
│                        (proxy when runtime = "python")                               │
│                                      ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │              PYTHON ENGINE (port 3004) — Deploy Once                         │    │
│  │                                                                               │    │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐                │    │
│  │   │ LangGraph Py │   │  MAF Python  │   │   RAG Service    │                │    │
│  │   │   Runtime    │   │   Runtime    │   │ (vector search)  │                │    │
│  │   └──────────────┘   └──────────────┘   └──────────────────┘                │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                      ▲                                               │
│                                      │                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                    AGENT REGISTRY (port 3001)                                │    │
│  │                                                                               │    │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │    │
│  │   │ Production  │   │ HANA        │   │ Sales       │   │ Custom      │    │    │
│  │   │ Agent       │   │ Agent       │   │ Agent       │   │ Agent       │    │    │
│  │   │ (config)    │   │ (config)    │   │ (config)    │   │ (config)    │    │    │
│  │   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘    │    │
│  │                                                                               │    │
│  │   Stores: System prompts, tool IDs, model settings, framework, runtime       │    │
│  │                                                                               │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ✅ Deploy Dual Engine ONCE (Node.js + Python)                                      │
│  ✅ Add/modify agents via Agent Designer (no redeployment)                          │
│  ✅ Change prompts, tools, settings anytime                                         │
│  ✅ Switch between JS and Python runtimes per agent                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### What Gets Deployed vs What's Configurable

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

### Framework-Specific Deployment

| Framework | Node.js Engine (JS) | Python Engine | Deployment |
|-----------|---------------------|---------------|------------|
| **MCP (default)** | ✅ MCP Runtime | — | Node.js only |
| **LangGraph** | ✅ `@langchain/langgraph` | ✅ `langgraph` + `langchain-core` | Both engines |
| **MAF** | ✅ `autogen-agentchat` JS | ✅ `autogen-agentchat` + `autogen-ext` | Both engines |
| **RAG** | — | ✅ `chromadb` / HANA Vector | Python only |

**Runtime selection:** Agent config field `runtime: "node"` (default) or `"python"` determines which engine executes.

### Changing an Agent (No Redeployment)

**To modify an agent:**
1. Open Agent Designer
2. Edit system prompt, tools, or settings
3. Click Save
4. Done! Next request uses new configuration.

**No redeployment needed for:**
- Changing system prompts
- Adding/removing tools
- Switching models
- Adjusting max steps or timeouts
- Enabling/disabling capabilities

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4) ✅ Complete
- [x] Create unified single-app project structure (`apps/ai-factory/`)
- [x] Define shared agent schema (JSON Schema)
- [x] Implement Agent Designer (full CRUD, framework/model/tools/guardrails)
- [x] Implement MCP Builder (connect, discover, test, export, save)
- [x] Implement Chat UI (agent selection, streaming SSE, reasoning steps)
- [x] Create Agent Registry service (Express, port 3001)
- [x] Create Home (Launchpad) with live agent/tool counts
- [x] Implement Tool Manager (CRUD, search, filter, import/export)
- [x] Deploy to BTP Cloud Foundry

### Phase 2: Dual Execution Engine (Weeks 5-8) 🔄 In Progress
- [ ] Node.js Execution Engine (port 3003) — MCP runtime, framework router, SSE
- [ ] Python Engine (port 3004) — LangGraph Python, MAF Python, RAG service
- [ ] LangGraph JS + MAF JS runtimes in Node.js engine
- [ ] LangGraph Builder UI (cytoscape.js graph canvas)
- [ ] MAF Builder UI (team builder, handoff rules)
- [ ] RAG Builder UI (document upload, chunking, vector store, test)
- [ ] Context Providers (HTTP + RAG dynamic injection)
- [ ] Agent Scheduler (cron-based execution, schedule management)
- [ ] Lifecycle Hooks (preExecution, postToolCall, onError, postExecution)
- [ ] Dashboard (real metrics) + Logs (execution history)
- [ ] Tool Registry backend persistence (agents reference by ID)

### Phase 3: UI Integrations (Weeks 9-12)
- [ ] Implement Joule Connector (A2A protocol)
- [ ] Implement Open WebUI Connector (OpenAI-compatible adapter)
- [ ] Create unified API Gateway with adapter registry
- [ ] Add streaming support across all UIs

### Phase 4: A2A Orchestration (Weeks 13-16)
- [ ] Implement A2A Flow Designer
- [ ] Implement A2A Orchestrator service
- [ ] Multi-agent workflows (LangGraph + CrewAI + MAF)
- [ ] Metrics Collector service

### Phase 5: Polish & Deploy (Weeks 17-20)
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production hardening (PostgreSQL, Redis)

---

## Technology Stack

### Frontend
- **UI5/Fiori** - Single unified application (`apps/ai-factory/`)
- **sap.tnt.ToolPage** - Application shell with side navigation
- **cytoscape.js** - Graph visualization (LangGraph Builder)

### Backend
- **Node.js + Express** - Execution Engine gateway (port 3003), Agent Registry (port 3001)
- **Python + FastAPI** - Python Execution Engine (port 3004), RAG service
- **node-cron** - Agent Scheduler

### AI/ML
- **SAP AI Core** - LLM provider (via AI Proxy)
- **@langchain/langgraph** - LangGraph JS runtime
- **langgraph + langchain-core** - LangGraph Python runtime
- **autogen-agentchat** - MAF runtime (JS + Python)
- **chromadb / HANA Vector** - Vector store for RAG

### Infrastructure
- **SAP BTP Cloud Foundry** - Primary deployment
- **nodejs_buildpack** - Node.js engine + Agent Registry
- **python_buildpack** - Python engine
- **MTA (mta.yaml)** - Multi-target application deployment

### Data
- **JSON file store** - Agent registry, schedules (Phase 2 MVP)
- **SAP HANA Cloud** - Vector Engine for RAG (production)
- **PostgreSQL** - Future: metrics, execution logs

### Protocols
- **MCP** - Model Context Protocol (tool execution)
- **A2A** - Agent-to-Agent Protocol (Phase 3)
- **OpenAI API** - LLM interface (SAP AI Proxy compatible)
- **SSE** - Server-Sent Events (execution streaming)

---

## Fiori Launchpad

### Tile Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              🏭 AI FACTORY                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CREATE & BUILD                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ 📋          │  │ 🔧          │  │ 🔧          │  │ 🔧          │               │
│  │ Agent       │  │ MCP         │  │ LangGraph   │  │ MAF         │               │
│  │ Designer    │  │ Builder     │  │ Builder     │  │ Builder     │               │
│  │             │  │             │  │             │  │             │               │
│  │ 12 Agents   │  │ 8 Active    │  │ 3 Active    │  │ 1 Active    │               │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                                      │
│  RUN & INTERACT                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                │
│  │ 🖥️          │  │ 🖥️          │  │ 🖥️          │                                │
│  │ Custom      │  │ Joule       │  │ Open        │                                │
│  │ Chat UI     │  │ Connector   │  │ WebUI       │                                │
│  │             │  │             │  │             │                                │
│  │ Launch      │  │ Configure   │  │ Launch      │                                │
│  └─────────────┘  └─────────────┘  └─────────────┘                                │
│                                                                                      │
│  MANAGE & MONITOR                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ ⚙️          │  │ ⚙️          │  │ 📊          │  │ 📝          │               │
│  │ A2A Flow    │  │ Scheduler   │  │ Dashboard   │  │ Logs &      │               │
│  │ Designer    │  │             │  │             │  │ Monitor     │               │
│  │             │  │             │  │             │  │             │               │
│  │ 2 Flows     │  │ 5 Jobs      │  │ View        │  │ View        │               │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Tile Configuration

```json
{
  "tiles": [
    {
      "id": "agent-designer",
      "title": "Agent Designer",
      "subtitle": "Create & configure agents",
      "icon": "sap-icon://create",
      "info": "12 Agents",
      "infoState": "Neutral",
      "targetURL": "#AgentDesigner-display"
    },
    {
      "id": "mcp-builder",
      "title": "MCP Builder",
      "subtitle": "JavaScript framework",
      "icon": "sap-icon://wrench",
      "info": "8 Active",
      "infoState": "Success",
      "targetURL": "#MCPBuilder-display"
    },
    {
      "id": "langgraph-builder",
      "title": "LangGraph Builder",
      "subtitle": "Python framework",
      "icon": "sap-icon://wrench",
      "info": "3 Active",
      "infoState": "Success",
      "targetURL": "#LangGraphBuilder-display"
    },
    {
      "id": "maf-builder",
      "title": "MAF Builder",
      "subtitle": "Microsoft framework",
      "icon": "sap-icon://wrench",
      "info": "1 Active",
      "infoState": "Success",
      "targetURL": "#MAFBuilder-display"
    },
    {
      "id": "custom-ui",
      "title": "Custom Chat UI",
      "subtitle": "Chat with agents",
      "icon": "sap-icon://discussion",
      "info": "Launch",
      "infoState": "Neutral",
      "targetURL": "#CustomUI-display"
    },
    {
      "id": "joule-connector",
      "title": "Joule Connector",
      "subtitle": "SAP Joule integration",
      "icon": "sap-icon://connected",
      "info": "Configure",
      "infoState": "Neutral",
      "targetURL": "#JouleConnector-display"
    },
    {
      "id": "openwebui-connector",
      "title": "Open WebUI",
      "subtitle": "Open WebUI integration",
      "icon": "sap-icon://world",
      "info": "Launch",
      "infoState": "Neutral",
      "targetURL": "#OpenWebUI-display"
    },
    {
      "id": "a2a-designer",
      "title": "A2A Flow Designer",
      "subtitle": "Multi-agent workflows",
      "icon": "sap-icon://workflow-tasks",
      "info": "2 Flows",
      "infoState": "Neutral",
      "targetURL": "#A2ADesigner-display"
    },
    {
      "id": "scheduler",
      "title": "Scheduler",
      "subtitle": "Schedule agent runs",
      "icon": "sap-icon://calendar",
      "info": "5 Jobs",
      "infoState": "Success",
      "targetURL": "#Scheduler-display"
    },
    {
      "id": "dashboard",
      "title": "Dashboard",
      "subtitle": "Analytics & metrics",
      "icon": "sap-icon://business-objects-experience",
      "info": "View",
      "infoState": "Neutral",
      "targetURL": "#Dashboard-display"
    },
    {
      "id": "logs-monitor",
      "title": "Logs & Monitor",
      "subtitle": "Logging & monitoring",
      "icon": "sap-icon://monitor-payments",
      "info": "View",
      "infoState": "Neutral",
      "targetURL": "#LogsMonitor-display"
    },
    {
      "id": "tool-manager",
      "title": "Tool Manager",
      "subtitle": "Manage tools & RAG",
      "icon": "sap-icon://tools-opportunity",
      "info": "15 Tools",
      "infoState": "Neutral",
      "targetURL": "#ToolManager-display"
    }
  ]
}
```

---

## Project Structure

```
AI_Factory/
├── CLAUDE.md                           # Development context & project state
├── ARCHITECTURE.md                     # Main architecture (links to docs/)
├── IMPROVEMENTS.md                     # Future features & learnings
├── mta.yaml                            # BTP MTA deployment descriptor
│
├── docs/                               # Detailed documentation
│   ├── implementation-plan.md          # 20-week implementation plan
│   ├── services.md                     # Backend services (dual engine)
│   ├── deployment.md                   # This file
│   ├── phase1-deviations.md            # Active deviations + resolution
│   ├── ui-integration.md              # UI options (5 UIs)
│   ├── a2a-orchestration.md            # A2A architecture (Phase 3)
│   ├── design-principles.md            # Design patterns (Atomic Agents)
│   ├── scalability.md                  # Plugin architecture
│   ├── tool-management.md              # Tool types & RAG
│   └── interfaces.md                   # Interface definitions
│
├── apps/
│   └── ai-factory/                     # Single unified UI5 app
│       └── webapp/
│           ├── Component.js
│           ├── manifest.json
│           ├── view/
│           │   ├── App.view.xml        # Shell with side navigation
│           │   ├── Home.view.xml       # Launchpad tiles (live stats)
│           │   ├── agent/              # Agent Designer (full CRUD)
│           │   ├── mcp/                # MCP Builder
│           │   ├── chat/               # Chat UI
│           │   ├── tools/              # Tool Manager
│           │   ├── langgraph/          # LangGraph Builder (Phase 2)
│           │   ├── maf/                # MAF Builder (Phase 2)
│           │   ├── rag/                # RAG Builder (Phase 2)
│           │   ├── scheduler/          # Scheduler (Phase 2)
│           │   ├── dashboard/          # Dashboard (Phase 2)
│           │   └── logs/               # Logs & Monitor (Phase 2)
│           ├── controller/             # Mirrors view/ structure
│           ├── service/                # ChatService, LlmClient, McpClient, etc.
│           └── util/                   # Constants, helpers
│
├── services/
│   ├── agent-registry/                 # REST API (Express, port 3001)
│   ├── execution-engine/
│   │   ├── node/                       # Node.js engine (port 3003)
│   │   │   └── src/
│   │   │       ├── index.js            # Express gateway
│   │   │       ├── runtimes/           # mcp, langgraph-js, maf-js
│   │   │       ├── services/           # framework-router, llm-client, mcp-client
│   │   │       └── scheduler/          # Cron runner + schedule store
│   │   └── python/                     # Python engine (port 3004)
│   │       └── app/
│   │           ├── main.py             # FastAPI entry point
│   │           ├── runtimes/           # langgraph_runtime, maf_runtime
│   │           └── services/           # graph_builder, rag_service
│   └── mcp-proxy/                      # Dedicated MCP proxy (port 3002)
│
├── shared/
│   └── agent-schema/                   # JSON schemas & validators
│
└── approuter/                          # BTP App Router (auth routing)
```