# AI Factory - A2A Orchestration Architecture

> Documentation for Agent-to-Agent (A2A) orchestration using multiple frameworks.

---

## Table of Contents

1. [A2A Stack Overview](#a2a-stack-overview)
2. [Google A2A Protocol](#google-a2a-protocol)
3. [A2A Designer Options](#a2a-designer-options)
4. [When to Use Which](#when-to-use-which)
5. [A2A Comparison Table](#a2a-comparison-table)

---

## A2A Stack Overview

AI Factory provides **three A2A orchestration options** using different frameworks, all communicating via the **Google A2A Protocol**.

| Priority | Framework | Use Case | Best For |
|----------|-----------|----------|----------|
| **Primary** | LangGraph | Complex, structured workflows | Explicit control, checkpointing, loops |
| **Secondary** | CrewAI | Simple task-based flows | Role-based agents, sequential tasks |
| **Tertiary** | MAF (AutoGen) | Conversation-based collaboration | Group chat, dynamic routing |
| **Protocol** | Google A2A | Agent communication standard | Interoperability |

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    A2A ORCHESTRATION ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  INDIVIDUAL AGENTS (Built with any framework)                                       │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │ DMC Agent   │   │ HANA Agent  │   │ S4 Agent    │   │ Reliability │            │
│  │ (MCP)       │   │ (LangGraph) │   │ (MAF)       │   │ (LangGraph) │            │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘            │
│         │                 │                 │                 │                     │
│         └─────────────────┴─────────────────┴─────────────────┘                     │
│                                    │                                                 │
│                                    ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    GOOGLE A2A PROTOCOL                                       │   │
│  │                    (Standard communication layer)                            │   │
│  │                                                                               │   │
│  │   Agent Discovery:                                                           │   │
│  │   GET /a2a/agents → Returns Agent Cards with capabilities                    │   │
│  │                                                                               │   │
│  │   Task Invocation:                                                           │   │
│  │   POST /a2a/tasks → { agentId, message, context }                           │   │
│  │                                                                               │   │
│  │   Streaming:                                                                  │   │
│  │   POST /a2a/tasks/stream → Server-Sent Events                               │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                                 │
│                                    ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    A2A ORCHESTRATION OPTIONS                                 │   │
│  │                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │   │
│  │  │ A2A Designer    │  │ A2A Designer    │  │ A2A Designer    │             │   │
│  │  │ (LangGraph)     │  │ (CrewAI)        │  │ (MAF)           │             │   │
│  │  │                 │  │                 │  │                 │             │   │
│  │  │ • Graph-based   │  │ • Role-based    │  │ • Conversation  │             │   │
│  │  │ • Explicit flow │  │ • Task-driven   │  │ • Group chat    │             │   │
│  │  │ • Checkpointing │  │ • Simple setup  │  │ • Dynamic       │             │   │
│  │  │ • Complex logic │  │ • Intuitive     │  │ • Collaborative │             │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Google A2A Protocol

All A2A Designers use the **Google A2A Protocol** for agent communication.

### Agent Card (Discovery)

```json
{
  "name": "Production Agent",
  "description": "Handles production monitoring and management",
  "url": "https://execution-engine.cfapps.../a2a",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "authentication": {
    "schemes": ["bearer"]
  },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "skills": [
    {
      "id": "production-monitoring",
      "name": "Production Monitoring",
      "description": "Monitor production orders and alerts"
    }
  ]
}
```

### Task Request

```json
POST /a2a/tasks
{
  "id": "task-123",
  "sessionId": "session-456",
  "message": {
    "role": "user",
    "parts": [
      { "text": "Show production orders with issues in Plant A" }
    ]
  },
  "acceptedOutputModes": ["text"]
}
```

### Task Response

```json
{
  "id": "task-123",
  "sessionId": "session-456",
  "status": {
    "state": "completed"
  },
  "artifacts": [
    {
      "parts": [
        { "text": "Found 3 production orders with issues..." }
      ]
    }
  ]
}
```

### A2A Client (Used by All Orchestrators)

```python
class A2AClient:
    """Google A2A Protocol client for agent communication"""
    
    def __init__(self, registry_url: str):
        self.registry_url = registry_url
    
    def discover(self, agent_id: str) -> AgentCard:
        """Get agent capabilities via Agent Card"""
        response = requests.get(f"{self.registry_url}/a2a/agents/{agent_id}")
        return AgentCard(**response.json())
    
    def invoke(self, agent_id: str, message: str, context: dict = None) -> TaskResult:
        """Invoke agent via A2A Protocol"""
        response = requests.post(f"{self.registry_url}/a2a/tasks", json={
            "agentId": agent_id,
            "message": {"role": "user", "parts": [{"text": message}]},
            "context": context
        })
        return TaskResult(**response.json())
    
    async def stream(self, agent_id: str, message: str) -> AsyncIterator[TaskEvent]:
        """Stream agent response via SSE"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.registry_url}/a2a/tasks/stream",
                json={"agentId": agent_id, "message": message}
            ) as response:
                async for line in response.content:
                    yield TaskEvent.parse(line)
```

---

## A2A Designer Options

### LangGraph A2A Designer

**Best For:** Complex workflows with explicit control flow, checkpointing, loops

**Features:**
- Visual graph editor (nodes and edges)
- Conditional routing
- Loops and cycles support
- State checkpointing
- Human-in-the-loop interrupts
- Code generation and export

### CrewAI A2A Designer

**Best For:** Role-based agents completing sequential tasks

**Features:**
- Define agents with roles, goals, backstories
- Create tasks with expected outputs
- Sequential or hierarchical process
- Simple, intuitive setup
- Task delegation

### MAF (AutoGen) A2A Designer

**Best For:** Collaborative discussions, group chat, dynamic routing

**Features:**
- Group chat configuration
- Dynamic speaker selection (LLM-based or round-robin)
- Human participant support
- Conversation-style collaboration
- Flexible, emergent behavior

---

## When to Use Which

| Scenario | Recommended | Why |
|----------|-------------|-----|
| Complex workflow with branching | **LangGraph** | Explicit control, visual graph |
| Need checkpointing/resume | **LangGraph** | Built-in state persistence |
| Simple sequential tasks | **CrewAI** | Easy setup, intuitive |
| Role-based agent collaboration | **CrewAI** | Natural role/goal definition |
| Agents need to discuss/debate | **MAF** | Conversation-style |
| Human needs to participate in chat | **MAF** | UserProxyAgent support |
| Unpredictable flow, emergent behavior | **MAF** | Dynamic speaker selection |

---

## A2A Comparison Table

| Feature | LangGraph | CrewAI | MAF |
|---------|-----------|--------|-----|
| **Orchestration Style** | Graph-based | Task-based | Conversation |
| **Control Flow** | Explicit edges | Sequential/Hierarchical | LLM decides |
| **State Management** | Typed state schema | Task outputs | Message history |
| **Visualization** | Flow diagram | Task list | Chat transcript |
| **Human-in-loop** | Interrupt nodes | Manual | UserProxyAgent |
| **Checkpointing** | ✅ Built-in | ❌ No | ❌ No |
| **Loops/Cycles** | ✅ Yes | ❌ No | ✅ Yes |
| **Learning Curve** | Steep | Easy | Medium |
| **Best For** | Complex workflows | Simple tasks | Collaboration |