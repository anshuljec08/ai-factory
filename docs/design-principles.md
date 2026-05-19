# AI Factory - Design Principles

> Design principles inspired by Atomic Agents framework for building modular, predictable AI agents.

---

## Table of Contents

1. [Schema-First Design](#1-schema-first-design)
2. [Structured System Prompts](#2-structured-system-prompts)
3. [Context Providers](#3-context-providers)
4. [Hooks System](#4-hooks-system)
5. [Agent Chaining via Schema Alignment](#5-agent-chaining-via-schema-alignment)
6. [Complete Agent Definition Example](#6-complete-agent-definition-example)
7. [Design Principles Summary](#design-principles-summary)

---

## 1. Schema-First Design

Every agent has strictly defined input and output schemas using JSON Schema:

```json
{
  "id": "production-agent",
  "name": "Production Assistant",
  
  "inputSchema": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "description": "User message" },
      "plant": { "type": "string", "default": "all" },
      "context": { "type": "object" }
    },
    "required": ["message"]
  },
  
  "outputSchema": {
    "type": "object",
    "properties": {
      "response": { "type": "string", "description": "Agent response" },
      "suggestedQuestions": { 
        "type": "array", 
        "items": { "type": "string" },
        "description": "Follow-up questions"
      },
      "dataUsed": { 
        "type": "array", 
        "items": { "type": "string" },
        "description": "Data sources used"
      },
      "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
    },
    "required": ["response"]
  }
}
```

**Benefits:**
- Predictable outputs
- Easy agent chaining (output schema of one = input schema of another)
- Validation at design time
- Type safety across frameworks

---

## 2. Structured System Prompts

Instead of free-form prompts, use structured prompt components:

```json
{
  "systemPrompt": {
    "background": [
      "You are a Production Operations Assistant.",
      "You help users monitor and manage production orders.",
      "You have access to DMC and HANA data."
    ],
    "steps": [
      "Analyze the user's request to understand intent",
      "Fetch relevant data using available tools",
      "Formulate a helpful, data-driven response",
      "Suggest relevant follow-up questions"
    ],
    "outputInstructions": [
      "Be concise and data-driven",
      "Always cite the data sources used",
      "Include 2-3 suggested follow-up questions",
      "Format numbers and dates appropriately"
    ],
    "constraints": [
      "Never make up data - only use tool results",
      "If unsure, ask for clarification",
      "Respect data access permissions"
    ]
  }
}
```

**Benefits:**
- Consistent prompt structure across agents
- Easy to modify specific sections
- Version control friendly
- Reusable prompt templates

---

## 3. Context Providers

Dynamic context injection at runtime:

```json
{
  "contextProviders": [
    {
      "name": "currentShift",
      "title": "Current Shift Information",
      "type": "dynamic",
      "source": "shift-service",
      "refreshInterval": 300
    },
    {
      "name": "recentAlerts",
      "title": "Recent Production Alerts",
      "type": "dynamic",
      "source": "alert-service",
      "maxItems": 5
    },
    {
      "name": "userProfile",
      "title": "User Context",
      "type": "static",
      "fields": ["name", "role", "plant", "permissions"]
    }
  ]
}
```

**How it works:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT INJECTION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  System Prompt (static)                                         │
│  + Background                                                    │
│  + Steps                                                         │
│  + Output Instructions                                           │
│                                                                  │
│  Context Providers (dynamic, injected at runtime)               │
│  + Current Shift: "Day shift, Plant A, 8 hours remaining"       │
│  + Recent Alerts: "3 critical alerts in last hour"              │
│  + User Profile: "John, Supervisor, Plant A"                    │
│                                                                  │
│  = Complete System Prompt sent to LLM                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Hooks System

Lifecycle hooks for monitoring, error handling, and customization:

```json
{
  "hooks": {
    "preExecution": [
      { "type": "log", "level": "info" },
      { "type": "validate", "schema": "inputSchema" },
      { "type": "rateLimit", "maxPerMinute": 60 }
    ],
    "postToolCall": [
      { "type": "log", "level": "debug" },
      { "type": "metrics", "track": ["duration", "tokenCount"] }
    ],
    "onError": [
      { "type": "retry", "maxAttempts": 3, "backoff": "exponential" },
      { "type": "fallback", "agent": "simple-responder" },
      { "type": "notify", "channel": "slack" }
    ],
    "postExecution": [
      { "type": "log", "level": "info" },
      { "type": "metrics", "track": ["totalDuration", "toolCalls", "tokens"] },
      { "type": "validate", "schema": "outputSchema" }
    ]
  }
}
```

---

## 5. Agent Chaining via Schema Alignment

Agents can be chained by aligning their schemas:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT CHAINING                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Query Generator Agent                                          │
│  ├── Input: { message: string }                                 │
│  └── Output: { queries: string[] }  ◀─┐                        │
│                                        │ Schema alignment       │
│  Search Agent                          │                        │
│  ├── Input: { queries: string[] }  ◀──┘                        │
│  └── Output: { results: SearchResult[] }  ◀─┐                  │
│                                              │                   │
│  Summarizer Agent                            │                   │
│  ├── Input: { results: SearchResult[] }  ◀──┘                  │
│  └── Output: { summary: string, sources: string[] }            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Easy to swap agents (just match schemas)
- Visual chaining in A2A Designer
- Automatic compatibility checking

---

## 6. Complete Agent Definition Example

```json
{
  "id": "production-agent",
  "name": "Production Assistant",
  "version": "2.0.0",
  "framework": "langgraph",
  "model": "claude-4-sonnet",
  
  "inputSchema": {
    "type": "object",
    "properties": {
      "message": { "type": "string" },
      "plant": { "type": "string", "default": "all" }
    },
    "required": ["message"]
  },
  
  "outputSchema": {
    "type": "object",
    "properties": {
      "response": { "type": "string" },
      "suggestedQuestions": { "type": "array", "items": { "type": "string" } },
      "dataUsed": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["response"]
  },
  
  "systemPrompt": {
    "background": [
      "You are a Production Operations Assistant.",
      "You help users monitor and manage production orders."
    ],
    "steps": [
      "Analyze the user's request",
      "Fetch relevant data using tools",
      "Formulate a helpful response"
    ],
    "outputInstructions": [
      "Be concise and data-driven",
      "Always suggest follow-up questions"
    ]
  },
  
  "contextProviders": [
    {
      "name": "currentShift",
      "type": "dynamic",
      "source": "shift-service"
    },
    {
      "name": "recentAlerts",
      "type": "dynamic",
      "source": "alert-service"
    }
  ],
  
  "tools": [
    {
      "name": "get_production_orders",
      "mcpUrl": "https://dmc-mcp-server.cfapps.../mcp-proxy",
      "inputSchema": { "type": "object", "properties": { "plant": { "type": "string" } } },
      "outputSchema": { "type": "array", "items": { "$ref": "#/definitions/Order" } }
    },
    {
      "name": "get_alerts",
      "mcpUrl": "https://dmc-mcp-server.cfapps.../mcp-proxy"
    }
  ],
  
  "hooks": {
    "preExecution": [{ "type": "log" }, { "type": "validate" }],
    "onError": [{ "type": "retry", "maxAttempts": 3 }],
    "postExecution": [{ "type": "metrics" }]
  },
  
  "config": {
    "maxSteps": 30,
    "toolTimeout": 30,
    "streaming": true,
    "humanInLoop": false
  }
}
```

---

## Design Principles Summary

| Principle | Description | Benefit |
|-----------|-------------|---------|
| **Schema-First** | Define I/O schemas for all agents | Predictability, type safety |
| **Structured Prompts** | Background, steps, instructions | Consistency, maintainability |
| **Context Providers** | Dynamic context injection | Flexibility, real-time data |
| **Hooks System** | Lifecycle callbacks | Monitoring, error handling |
| **Schema Alignment** | Chain agents via matching schemas | Modularity, swappability |
| **Atomicity** | Single-purpose components | Reusability, testability |