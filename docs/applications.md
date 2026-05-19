# AI Factory - Applications

> Detailed documentation for all 14 applications in the AI Factory platform.

---

## Table of Contents

1. [Agent Designer](#1-agent-designer)
2. [MCP Builder](#2-mcp-builder)
3. [LangGraph Builder](#3-langgraph-builder)
4. [MAF Builder](#4-maf-builder)
5. [Custom UI](#5-custom-ui)
6. [Joule Connector](#6-joule-connector)
7. [Open WebUI Connector](#7-openwebui-connector)
8. [A2A Designer - LangGraph](#8-a2a-designer-langgraph)
9. [A2A Designer - CrewAI](#9-a2a-designer-crewai)
10. [A2A Designer - MAF](#10-a2a-designer-maf)
11. [Scheduler](#11-scheduler)
12. [Dashboard](#12-dashboard)
13. [Logs & Monitor](#13-logs--monitor)
14. [Tool Manager](#14-tool-manager)

---

## 1. 📋 Agent Designer (01-agent-designer)

**Purpose:** Create and configure agent definitions (framework-agnostic)

**Features:**
- Visual agent configuration
- Tool/capability selection
- System prompt editor with templates
- MCP endpoint configuration
- Authentication setup (OAuth2, Basic, API Key)
- Export to any framework
- Version control for agent definitions
- Agent templates library

**Tech Stack:** UI5 + REST API

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT DESIGNER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent Name: [Production Assistant        ]                     │
│  Description: [Helps with production monitoring...]             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CAPABILITIES                                              │   │
│  │ ☑ Tool Calling    ☑ Streaming    ☐ Code Execution       │   │
│  │ ☑ Multi-turn      ☐ Human-in-loop                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TOOLS (MCP Endpoints)                                     │   │
│  │ + Add Tool                                                │   │
│  │ ├─ get_production_orders (DMC)                           │   │
│  │ ├─ get_alerts (DMC)                                      │   │
│  │ └─ update_priority (DMC)                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SYSTEM PROMPT                                             │   │
│  │ You are a Production Operations Assistant...              │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Save Draft]  [Export to MCP]  [Export to LangGraph]  [Deploy] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔧 MCP Builder (02-mcp-builder)

**Purpose:** Build agents using MCP framework (JavaScript)

**Features:**
- Import agent definition from Agent Designer
- Configure MCP server connections
- Test tool execution
- Agentic loop configuration (max steps, timeouts)
- Deploy to BTP Cloud Foundry
- Code generation for custom modifications

**Tech Stack:** UI5 + Node.js

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                       MCP BUILDER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent Definition ──▶ MCP Configuration ──▶ Deployment          │
│                                                                  │
│  Components:                                                     │
│  • ChatService.js      (Agentic loop)                           │
│  • LlmClient.js        (LLM API calls)                          │
│  • McpClient.js        (Tool execution)                         │
│  • ConversationManager (State management)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 🔧 LangGraph Builder (03-langgraph-builder)

**Purpose:** Build agents using LangGraph framework (Python)

**Features:**
- Visual graph designer (drag & drop nodes)
- Node configuration (model, tools, conditions)
- State schema editor
- Checkpoint configuration
- Human-in-the-loop setup
- Deploy to BTP/Kubernetes
- Code export for customization

**Tech Stack:** UI5 + Python (FastAPI)

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH BUILDER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent: Production Assistant                                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GRAPH CANVAS                           │   │
│  │                                                           │   │
│  │         ┌─────────┐                                      │   │
│  │         │  START  │                                      │   │
│  │         └────┬────┘                                      │   │
│  │              ▼                                           │   │
│  │         ┌─────────┐     tool_calls?     ┌─────────┐     │   │
│  │         │  MODEL  │────────YES─────────▶│  TOOLS  │     │   │
│  │         └────┬────┘                     └────┬────┘     │   │
│  │              │◀──────────────────────────────┘          │   │
│  │              │ no tool_calls                             │   │
│  │              ▼                                           │   │
│  │         ┌─────────┐                                      │   │
│  │         │   END   │                                      │   │
│  │         └─────────┘                                      │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  NODE PROPERTIES                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Selected: MODEL                                           │   │
│  │ Type: [LLM Call        ▼]                                │   │
│  │ Model: [claude-4-sonnet ▼]                               │   │
│  │ Tools: [✓] get_orders [✓] get_alerts [✓] update_priority │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Add Node]  [Add Edge]  [Test]  [Generate Code]  [Deploy]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 🔧 MAF Builder (04-maf-builder)

**Purpose:** Build agents using Microsoft Agent Framework

**Features:**
- Multi-agent configuration
- Orchestration patterns (sequential, parallel, hierarchical)
- A2A protocol setup
- Enterprise deployment options
- .NET and Python support

**Tech Stack:** UI5 + Python/.NET

---

## 5. 🖥️ Custom UI (05-custom-ui)

**Purpose:** Your existing AI Chatbot UI (enhanced)

**Features:**
- Based on AI_Chatbot_Standalone
- Connect to any framework backend (MCP, LangGraph, MAF)
- Agent switching
- Reasoning steps viewer
- Streaming support
- Follow-up suggestions

**Tech Stack:** UI5

**Source:** Port from `AI_Chatbot_Standalone/`

---

## 6. 🖥️ Joule Connector (06-joule-connector)

**Purpose:** Integrate agents with SAP Joule

**Features:**
- Joule plugin/extension
- A2A protocol bridge
- SAP context integration
- Seamless handoff between Joule and custom agents

**Tech Stack:** Joule SDK

---

## 7. 🖥️ Open WebUI Connector (07-openwebui-connector)

**Purpose:** Run agents in Open WebUI

**Features:**
- OpenAI-compatible API adapter
- Model registration (agents appear as models)
- Tool function mapping
- Streaming support
- Docker deployment

**Tech Stack:** Docker + Python adapter

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    OPEN WEBUI INTEGRATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Open WebUI ◀──────▶ AI Factory Adapter ◀──────▶ Agent Backend  │
│                                                                  │
│  Flow:                                                           │
│  1. User selects "Production Agent" in Open WebUI               │
│  2. Open WebUI sends OpenAI-format request                      │
│  3. Adapter translates to agent call                            │
│  4. Agent executes (MCP/LangGraph/MAF)                          │
│  5. Response translated back to OpenAI format                   │
│  6. Open WebUI displays response                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. ⚙️ A2A Designer - LangGraph (08-a2a-designer-langgraph)

**Purpose:** Design complex, structured A2A workflows using LangGraph

**Best For:** Complex workflows with explicit control flow, checkpointing, loops

**Features:**
- Visual graph editor (nodes and edges)
- Conditional routing
- Loops and cycles support
- State checkpointing
- Human-in-the-loop interrupts
- Code generation and export

**Tech Stack:** UI5 + Python (LangGraph)

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    A2A DESIGNER (LangGraph)                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Flow Name: [Production Issue Resolution  ]                                         │
│                                                                                      │
│  GRAPH CANVAS                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                               │   │
│  │         ┌─────────┐                                                          │   │
│  │         │  START  │                                                          │   │
│  │         └────┬────┘                                                          │   │
│  │              │                                                                │   │
│  │              ▼                                                                │   │
│  │         ┌─────────┐                                                          │   │
│  │         │  Router │  (LLM decides which agent)                               │   │
│  │         └────┬────┘                                                          │   │
│  │              │                                                                │   │
│  │    ┌─────────┼─────────┬─────────┐                                          │   │
│  │    │         │         │         │                                          │   │
│  │    ▼         ▼         ▼         ▼                                          │   │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                        │   │
│  │ │ DMC  │ │ HANA │ │ S4   │ │Reliab│                                        │   │
│  │ │Agent │ │Agent │ │Agent │ │Agent │                                        │   │
│  │ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘                                        │   │
│  │    │        │        │        │                                             │   │
│  │    └────────┴────────┴────────┘                                             │   │
│  │              │                                                                │   │
│  │              ▼                                                                │   │
│  │         ┌─────────┐                                                          │   │
│  │         │  Router │  (continue or end?)                                      │   │
│  │         └────┬────┘                                                          │   │
│  │              │                                                                │   │
│  │         ┌────┴────┐                                                          │   │
│  │         ▼         ▼                                                          │   │
│  │    [Loop back]  [END]                                                        │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  NODE PROPERTIES                          EDGE CONDITIONS                           │
│  ┌─────────────────────────┐             ┌─────────────────────────┐              │
│  │ Selected: Router        │             │ Router → DMC:           │              │
│  │ Type: [Conditional ▼]   │             │ Condition: "production" │              │
│  │ Model: [claude-4-sonnet]│             │                         │              │
│  └─────────────────────────┘             └─────────────────────────┘              │
│                                                                                      │
│  [Add Node]  [Add Edge]  [Test]  [View Code]  [Deploy]                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. ⚙️ A2A Designer - CrewAI (09-a2a-designer-crewai)

**Purpose:** Design simple, task-based A2A workflows using CrewAI

**Best For:** Role-based agents completing sequential tasks

**Features:**
- Define agents with roles, goals, backstories
- Create tasks with expected outputs
- Sequential or hierarchical process
- Simple, intuitive setup
- Task delegation

**Tech Stack:** UI5 + Python (CrewAI)

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    A2A DESIGNER (CrewAI)                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Crew Name: [Production Issue Resolution  ]                                         │
│                                                                                      │
│  AGENTS                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 🤖 Analyst                                                           │    │   │
│  │  │ Role: Production Analyst                                             │    │   │
│  │  │ Goal: Analyze production data and identify issues                    │    │   │
│  │  │ Backstory: Expert in manufacturing analytics                         │    │   │
│  │  │ Tools: [HANA Agent] [DMC Agent]                                      │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 🤖 Solver                                                            │    │   │
│  │  │ Role: Problem Solver                                                 │    │   │
│  │  │ Goal: Propose solutions for production issues                        │    │   │
│  │  │ Backstory: Experienced in lean manufacturing                         │    │   │
│  │  │ Tools: [Reliability Agent]                                           │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 🤖 Executor                                                          │    │   │
│  │  │ Role: Action Executor                                                │    │   │
│  │  │ Goal: Execute approved solutions in S4                               │    │   │
│  │  │ Backstory: SAP expert                                                │    │   │
│  │  │ Tools: [S4 Agent]                                                    │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  TASKS                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 1. [Analyze] → Analyst → "List of issues with root causes"                  │   │
│  │ 2. [Solve]   → Solver   → "Prioritized list of solutions"                   │   │
│  │ 3. [Execute] → Executor → "Confirmation of execution"                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  Process: [▼ Sequential]    [Test Crew]  [View Code]  [Deploy]                     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. ⚙️ A2A Designer - MAF (10-a2a-designer-maf)

**Purpose:** Design conversation-based A2A workflows using Microsoft AutoGen

**Best For:** Collaborative discussions, group chat, dynamic routing

**Features:**
- Group chat configuration
- Dynamic speaker selection (LLM-based or round-robin)
- Human participant support
- Conversation-style collaboration
- Flexible, emergent behavior

**Tech Stack:** UI5 + Python (AutoGen)

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    A2A DESIGNER (MAF/AutoGen)                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Group Chat: [Production Issue Resolution  ]                                        │
│                                                                                      │
│  PARTICIPANTS                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ ☑ DMC Agent       Role: [Data Provider    ▼]                                │   │
│  │ ☑ HANA Agent      Role: [Analyst          ▼]                                │   │
│  │ ☑ S4 Agent        Role: [Action Executor  ▼]                                │   │
│  │ ☑ Reliability     Role: [Expert           ▼]                                │   │
│  │ ☑ Human           Role: [Approver         ▼]                                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  SPEAKER SELECTION                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Method: [▼ LLM-based (auto)        ]                                        │   │
│  │         ├── LLM-based (auto)                                                │   │
│  │         ├── Round-robin                                                     │   │
│  │         └── Custom function                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  CONVERSATION PREVIEW                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Human: "Resolve production issues in Plant A"                            │   │
│  │ 🤖 DMC Agent: "Fetching production data..."                                 │   │
│  │ 🤖 HANA Agent: "Analyzing patterns..."                                      │   │
│  │ 🤖 Reliability: "Based on history..."                                       │   │
│  │ 🤖 S4 Agent: "I can update the priority..."                                 │   │
│  │ 👤 Human: "Approved"                                                        │   │
│  │ 🤖 S4 Agent: "Done."                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  SETTINGS                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Max Rounds: [10]    Human Input Mode: [▼ ALWAYS]    Timeout: [300]s        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  [Test Chat]  [View Code]  [Deploy]                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. ⚙️ Scheduler (11-scheduler)

**Purpose:** Schedule any agent or A2A flow execution

**Schedulable Targets:**
| Type | Example | Schedulable? |
|------|---------|--------------|
| Single Agent (MCP) | HANA Query Agent | ✅ Yes |
| Single Agent (LangGraph) | Production Agent | ✅ Yes |
| Single Agent (MAF) | Sales Agent | ✅ Yes |
| A2A Flow (LangGraph) | Issue Resolution Flow | ✅ Yes |
| A2A Flow (CrewAI) | Analysis Crew | ✅ Yes |
| A2A Flow (MAF) | Collaborative Chat | ✅ Yes |

**Schedule Types:**
- **Cron-based**: `0 8 * * *` (Daily at 8 AM)
- **Event-based**: On S4 order.created, on alert, on message
- **Webhook**: External trigger via POST /scheduler/jobs/{id}/run
- **Interval**: Every 15 minutes, every 4 hours

**Output Destinations:**
- Email, Slack, Teams, Webhook, Database, File, Dashboard

**Features:**
- Schedule any agent or A2A flow
- Multiple trigger types (cron, event, webhook, interval)
- Configurable input parameters
- Multiple output destinations
- Retry on failure with exponential backoff
- Execution history with logs
- Pause/resume jobs
- Run now (manual trigger)
- Notifications on success/failure

**Tech Stack:** UI5 + Node.js (Bull) or Python (Celery)

**Job Configuration Example:**
```json
{
  "id": "daily-production-report",
  "name": "Daily Production Report",
  "target": {
    "type": "agent",
    "id": "production-agent"
  },
  "input": {
    "message": "Generate yesterday's production summary"
  },
  "schedule": {
    "type": "cron",
    "expression": "0 8 * * *",
    "timezone": "Europe/Berlin"
  },
  "output": {
    "destination": "email",
    "recipients": ["team@company.com"]
  },
  "config": {
    "timeout": 300,
    "retries": 3
  }
}
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SCHEDULER                                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  [+ Create Job]  [Import]  [Export]                                                 │
│                                                                                      │
│  SCHEDULED JOBS                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 📅 Daily Production Report                                           │    │   │
│  │  │ Agent: Production Agent (LangGraph)                                  │    │   │
│  │  │ Schedule: Daily at 8:00 AM (Europe/Berlin)                          │    │   │
│  │  │ Next Run: Tomorrow, 8:00 AM                                         │    │   │
│  │  │ Status: ✅ Active                                                    │    │   │
│  │  │ [Edit] [Pause] [Run Now] [History]                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ ⚡ Alert Check                                                       │    │   │
│  │  │ Agent: Alert Agent (MCP)                                            │    │   │
│  │  │ Schedule: Every 15 minutes                                          │    │   │
│  │  │ Next Run: In 8 minutes                                              │    │   │
│  │  │ Status: ✅ Active                                                    │    │   │
│  │  │ [Edit] [Pause] [Run Now] [History]                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  EXECUTION HISTORY                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Time          │ Job                    │ Status  │ Duration │ Actions      │   │
│  │───────────────┼────────────────────────┼─────────┼──────────┼──────────────│   │
│  │ Today 8:00 AM │ Daily Production Report│ ✅ Done │ 45s      │ [View] [Logs]│   │
│  │ Today 7:45 AM │ Alert Check            │ ✅ Done │ 12s      │ [View] [Logs]│   │
│  │ Today 7:30 AM │ Alert Check            │ ✅ Done │ 8s       │ [View] [Logs]│   │
│  │ Today 7:15 AM │ Alert Check            │ ❌ Failed│ 30s      │ [View] [Logs]│   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Common Use Cases:**
| Use Case | Agent/Flow | Schedule |
|----------|------------|----------|
| Daily Reports | Production Agent | Cron: 8 AM daily |
| Alert Monitoring | Alert Agent | Interval: 15 min |
| Weekly Analysis | Analysis Crew (A2A) | Cron: Sunday 6 PM |
| Order Processing | Order Flow (A2A) | Event: order.created |
| Data Sync | Sync Agent | Cron: Every hour |
| On-demand | Any Agent | Webhook trigger |

---

## 12. ⚙️ Dashboard (12-dashboard)

**Purpose:** Analytics and metrics

**Features:**
- Agent usage metrics
- Token consumption tracking
- Response times
- Error rates
- Cost tracking
- Custom reports

**Tech Stack:** UI5 + Analytics backend

---

## 13. ⚙️ Logs & Monitor (13-logs-monitor)

**Purpose:** Centralized logging and monitoring

**Features:**
- Real-time log streaming
- Search and filter
- Trace visualization (request → tool calls → response)
- Alerting
- Log retention policies

**Tech Stack:** UI5 + ELK/Loki

---

## 14. 🔧 Tool Manager (14-tool-manager)

**Purpose:** Central tool registry and management

**Features:**
- Create and configure all tool types
- Import from MCP servers
- Import from OpenAPI specs
- Test tools
- Manage RAG document collections
- Tool usage analytics

**Tech Stack:** UI5 + REST API

See [Tool Management](./tool-management.md) for detailed documentation.

---

## Updated Apps List

```
apps/
├── 01-agent-designer/              # Create agents (simple: select tools)
├── 02-mcp-builder/                 # Build MCP agents
├── 03-langgraph-builder/           # Build LangGraph agents
├── 04-maf-builder/                 # Build MAF agents
├── 05-custom-ui/                   # Chat UI
├── 06-joule-connector/             # Joule integration
├── 07-openwebui-connector/         # Open WebUI integration
├── 08-a2a-designer-langgraph/      # A2A flows (LangGraph)
├── 09-a2a-designer-crewai/         # A2A flows (CrewAI)
├── 10-a2a-designer-maf/            # A2A flows (MAF)
├── 11-scheduler/                   # Agent scheduling
├── 12-dashboard/                   # Analytics
├── 13-logs-monitor/                # Logging
└── 14-tool-manager/                # Tool Management