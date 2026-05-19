# AI Factory - UI Integration

> Documentation for all 5 UI options supported by AI Factory.

---

## Table of Contents

1. [UI Strategy Overview](#ui-strategy-overview)
2. [Custom UI5](#1-custom-ui5-enterprise-production)
3. [Open WebUI](#2-open-webui-quick-team-deploy)
4. [Chainlit](#3-chainlit-developerdebug)
5. [Joule](#4-joule-sap-users)
6. [LobeChat](#5-lobechat-modern-look)
7. [UI Comparison Matrix](#ui-comparison-matrix)

---

## UI Strategy Overview

AI Factory supports **5 UI options** for different use cases, all connecting to the same Execution Engine:

| Use Case | Recommended UI | Why |
|----------|----------------|-----|
| **Enterprise Production** | Custom UI5 | Full control, SAP styling, BTP deployment |
| **Quick Team Deploy** | Open WebUI | Feature-rich, easy setup, multi-user |
| **Developer/Debug** | Chainlit | LangGraph native, reasoning steps visible |
| **SAP Users** | Joule | Native SAP experience, A2A protocol |
| **Modern Look** | LobeChat | Beautiful UI, plugin ecosystem |

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AI FACTORY - 5 UI OPTIONS                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ENTERPRISE                    QUICK DEPLOY                   DEVELOPER             │
│  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐     │
│  │  CUSTOM UI5     │          │  OPEN WEBUI     │          │  CHAINLIT       │     │
│  │  (SAP Fiori)    │          │  (Docker)       │          │  (Python)       │     │
│  │                 │          │                 │          │                 │     │
│  │  Full control   │          │  Multi-user     │          │  LangGraph      │     │
│  │  SAP styling    │          │  RAG built-in   │          │  native         │     │
│  │  BTP deploy     │          │  Voice support  │          │  Steps visible  │     │
│  └────────┬────────┘          └────────┬────────┘          └────────┬────────┘     │
│           │                            │                            │               │
│           │                            │                            │               │
│  SAP ECOSYSTEM                 MODERN LOOK                                          │
│  ┌─────────────────┐          ┌─────────────────┐                                  │
│  │  JOULE          │          │  LOBECHAT       │                                  │
│  │  (SAP)          │          │  (Next.js)      │                                  │
│  │                 │          │                 │                                  │
│  │  A2A protocol   │          │  Beautiful UI   │                                  │
│  │  SAP IAS auth   │          │  Plugin store   │                                  │
│  │  Native SAP     │          │  TTS/STT        │                                  │
│  └────────┬────────┘          └────────┬────────┘                                  │
│           │                            │                                            │
│           └────────────────────────────┴────────────────────────────────────────┐   │
│                                                                                  │   │
│                                        ▼                                         │   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│   │
│  │                    UNIFIED API LAYER                                         ││   │
│  │                                                                               ││   │
│  │   • Native API: POST /execute (Custom UI5)                                   ││   │
│  │   • OpenAI-Compatible: POST /v1/chat/completions (Open WebUI, LobeChat)     ││   │
│  │   • Chainlit Native: Python SDK (Chainlit)                                   ││   │
│  │   • A2A Protocol: POST /a2a/invoke (Joule)                                  ││   │
│  │                                                                               ││   │
│  └─────────────────────────────────────────────────────────────────────────────┘│   │
│                                        │                                         │   │
│                                        ▼                                         │   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│   │
│  │                    EXECUTION ENGINE                                          ││   │
│  │                    (Runs all agents - MCP, LangGraph, MAF)                   ││   │
│  └─────────────────────────────────────────────────────────────────────────────┘│   │
│                                                                                  │   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Custom UI5 (Enterprise Production) ⭐

**Use Case:** Enterprise production, full control, SAP ecosystem

**API Format:** Native `/execute` endpoint

**Why Choose:**
- Full control over UI/UX
- SAP Fiori design language
- BTP deployment with UAA auth
- Shows reasoning steps, follow-ups, agent switching
- Custom branding and styling

```
Custom UI5 → POST /execute → Execution Engine → Agent
```

**Request Example:**
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

**Features:**
- ✅ Full customization
- ✅ Reasoning steps viewer
- ✅ Follow-up suggestions
- ✅ Agent switching
- ✅ SAP Fiori styling
- ✅ BTP deployment

---

## 2. Open WebUI (Quick Team Deploy) ⭐

**Use Case:** Quick team deployment, multi-user, feature-rich

**API Format:** OpenAI-compatible `/v1/chat/completions`

**Why Choose:**
- Feature-rich out of the box
- Multi-user with built-in auth
- Built-in RAG support
- Voice support (TTS/STT)
- Plugin system
- Active community

```
Open WebUI → POST /v1/chat/completions → Adapter → Execution Engine → Agent
```

**Docker Setup:**
```yaml
# docker-compose.yml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    environment:
      - OPENAI_API_BASE_URLS=http://ai-factory-adapter:8080/v1
      - OPENAI_API_KEYS=sk-ai-factory-key
    depends_on:
      - ai-factory-adapter

  ai-factory-adapter:
    image: ai-factory-adapter:latest
    ports:
      - "8080:8080"
    environment:
      - EXECUTION_ENGINE_URL=https://execution-engine.cfapps.../
      - AGENT_REGISTRY_URL=https://agent-registry.cfapps.../
```

**How Agents Appear:**
```
Model Selector:
├── 🤖 Production Agent (LangGraph)
├── 🤖 HANA Query Agent (MCP)
├── 🤖 Sales Order Agent (MAF)
├── 🤖 Reliability Agent (LangGraph)
├── ─────────────────────────────
├── 🧠 claude-4-sonnet (raw model)
└── 🧠 gpt-4o (raw model)
```

**Features:**
- ✅ Multi-user with auth
- ✅ Built-in RAG
- ✅ Voice support
- ✅ Plugin system
- ✅ Easy Docker deployment
- ❌ Limited customization

---

## 3. Chainlit (Developer/Debug) ⭐

**Use Case:** Development, debugging, LangGraph native

**API Format:** Native Python SDK

**Why Choose:**
- Native LangGraph/LangChain support
- Shows reasoning steps clearly
- Easy to customize with Python
- Built-in authentication
- File upload support
- Copilot mode

```
Chainlit → Python SDK → LangGraph Agent → Tools
```

**Setup:**
```python
# app.py
import chainlit as cl
from langgraph.graph import StateGraph

@cl.on_message
async def main(message: cl.Message):
    # Your LangGraph agent here
    agent = create_agent()
    
    # Stream with steps visible
    async for event in agent.astream_events(message.content):
        if event["event"] == "on_chat_model_stream":
            await cl.Message(content=event["data"]["chunk"]).send()
        elif event["event"] == "on_tool_start":
            async with cl.Step(name=event["name"]) as step:
                step.input = event["data"]["input"]
        elif event["event"] == "on_tool_end":
            step.output = event["data"]["output"]
```

**Run:**
```bash
chainlit run app.py
```

**Features:**
- ✅ LangGraph native
- ✅ Reasoning steps visible
- ✅ Easy Python customization
- ✅ Built-in auth
- ✅ File upload
- ❌ Not SAP-styled

---

## 4. Joule (SAP Users) ⭐

**Use Case:** SAP ecosystem, native SAP experience

**API Format:** A2A (Agent-to-Agent) Protocol

**Why Choose:**
- Native SAP experience
- A2A protocol for agent discovery
- SAP IAS authentication
- Seamless SAP integration
- Enterprise-ready

```
Joule → A2A Protocol → Execution Engine → Agent
```

**A2A Agent Card:**
```json
{
  "name": "Production Agent",
  "description": "Handles production monitoring",
  "url": "https://ai-factory.cfapps.../a2a",
  "capabilities": {
    "streaming": true,
    "stateTransitionHistory": true
  },
  "skills": [
    {
      "id": "production-monitoring",
      "name": "Production Monitoring"
    }
  ]
}
```

**Features:**
- ✅ Native SAP experience
- ✅ A2A protocol
- ✅ SAP IAS auth
- ✅ Enterprise-ready
- ❌ Limited customization
- ❌ No reasoning steps

---

## 5. LobeChat (Modern Look) ⭐

**Use Case:** Modern UI, plugin ecosystem, beautiful design

**API Format:** OpenAI-compatible `/v1/chat/completions`

**Why Choose:**
- Beautiful modern UI
- Plugin marketplace
- TTS/STT support
- Vision support
- Multi-model support
- Active development

```
LobeChat → POST /v1/chat/completions → Adapter → Execution Engine → Agent
```

**Docker Setup:**
```yaml
# docker-compose.yml
services:
  lobe-chat:
    image: lobehub/lobe-chat:latest
    ports:
      - "3210:3210"
    environment:
      - OPENAI_API_KEY=sk-ai-factory-key
      - OPENAI_PROXY_URL=http://ai-factory-adapter:8080/v1
```

**Features:**
- ✅ Beautiful modern UI
- ✅ Plugin marketplace
- ✅ TTS/STT support
- ✅ Vision support
- ✅ Multi-model
- ❌ Not SAP-styled

---

## UI Comparison Matrix

| Feature | Custom UI5 | Open WebUI | Chainlit | Joule | LobeChat |
|---------|------------|------------|----------|-------|----------|
| **Use Case** | Enterprise | Quick Deploy | Developer | SAP Users | Modern Look |
| **Deployment** | BTP HTML5 | Docker | Python | SAP Cloud | Docker/Vercel |
| **Customization** | Full | Limited | High | Limited | Medium |
| **Reasoning Steps** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Follow-ups** | ✅ | ❌ | ⚠️ | ❌ | ❌ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tool Visibility** | ✅ | ⚠️ | ✅ | ❌ | ⚠️ |
| **Multi-user** | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Voice** | ❌ | ✅ | ⚠️ | ❌ | ✅ |
| **RAG Built-in** | ❌ | ✅ | ⚠️ | ❌ | ✅ |
| **Plugins** | ❌ | ✅ | ⚠️ | ❌ | ✅ |
| **SAP Styling** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Auth** | BTP UAA | Built-in | Built-in | SAP IAS | Built-in |
| **Setup Effort** | High | Low | Low | Medium | Low |
| **Best For** | Full control | Teams | Debugging | SAP ecosystem | Beautiful UI |

---

## Complete Architecture with All UIs

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
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
