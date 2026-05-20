# AI Factory - Interface Definitions

> Complete interface definitions for all pluggable components in AI Factory.
> Interfaces are defined in **both Python (for the Python engine)** and **JavaScript (for the Node.js engine)**. Both engines follow the same conceptual contract.

---

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [JavaScript Equivalents (Node.js Engine)](#javascript-equivalents-nodejs-engine)
3. [Future-Proof Interfaces](#future-proof-interfaces)
4. [All Registries](#all-registries)

---

## Core Interfaces

### 1. FrameworkRuntime Interface

Standard interface for all AI framework runtimes:

```python
# shared/interfaces/framework_runtime.py

from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, List, Any
from dataclasses import dataclass

@dataclass
class AgentDefinition:
    """Framework-agnostic agent definition"""
    id: str
    name: str
    framework: str
    system_prompt: str
    tools: List[Dict]
    config: Dict[str, Any]

@dataclass
class ExecutionInput:
    """Standard execution input"""
    message: str
    conversation_id: str
    context: Dict[str, Any]
    stream: bool = False

@dataclass
class ExecutionResult:
    """Standard execution result"""
    response: str
    tool_calls: List[Dict]
    metadata: Dict[str, Any]

@dataclass
class ExecutionEvent:
    """Streaming event"""
    type: str  # "text", "tool_call", "tool_result", "done"
    data: Any

@dataclass
class RuntimeCapabilities:
    """What this runtime supports"""
    streaming: bool
    tool_calling: bool
    human_in_loop: bool
    checkpointing: bool
    multi_agent: bool

class FrameworkRuntime(ABC):
    """
    Standard interface for all AI framework runtimes.
    
    To add a new framework:
    1. Create a class that implements this interface
    2. Register it with RuntimeRegistry
    3. Done! No changes to Execution Engine needed.
    """
    
    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """Initialize the runtime with configuration"""
        pass
    
    @abstractmethod
    def create_agent(self, definition: AgentDefinition) -> Any:
        """Create an agent instance from framework-agnostic definition"""
        pass
    
    @abstractmethod
    def execute(self, agent: Any, input: ExecutionInput) -> ExecutionResult:
        """Execute the agent synchronously"""
        pass
    
    @abstractmethod
    async def execute_async(self, agent: Any, input: ExecutionInput) -> ExecutionResult:
        """Execute the agent asynchronously"""
        pass
    
    @abstractmethod
    async def stream(self, agent: Any, input: ExecutionInput) -> AsyncIterator[ExecutionEvent]:
        """Stream execution events"""
        pass
    
    @abstractmethod
    def get_capabilities(self) -> RuntimeCapabilities:
        """Return what this runtime supports"""
        pass
    
    @abstractmethod
    def validate_definition(self, definition: AgentDefinition) -> List[str]:
        """Validate agent definition, return list of errors (empty if valid)"""
        pass
```

### 2. UIAdapter Interface

Standard interface for UI adapters:

```python
# shared/interfaces/ui_adapter.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from dataclasses import dataclass

@dataclass
class UIFeatures:
    """What features this UI supports"""
    streaming: bool
    tool_visibility: bool
    reasoning_steps: bool
    follow_up_suggestions: bool
    multi_agent_switching: bool
    file_upload: bool
    image_display: bool

class UIAdapter(ABC):
    """
    Standard interface for UI adapters.
    
    To add a new UI:
    1. Create a class that implements this interface
    2. Register it with AdapterRegistry
    3. Done! No changes to API Gateway needed.
    """
    
    @abstractmethod
    def translate_request(self, request: Any) -> ExecutionInput:
        """Translate UI-specific request to standard ExecutionInput."""
        pass
    
    @abstractmethod
    def translate_response(self, result: ExecutionResult) -> Any:
        """Translate standard ExecutionResult to UI-specific format."""
        pass
    
    @abstractmethod
    def translate_stream_event(self, event: ExecutionEvent) -> Any:
        """Translate streaming event to UI-specific format"""
        pass
    
    @abstractmethod
    def get_supported_features(self) -> UIFeatures:
        """Return what features this UI supports"""
        pass
    
    @abstractmethod
    def list_agents_as_models(self, agents: List[AgentDefinition]) -> Any:
        """Format agent list for UI's model selector."""
        pass
```

### 3. ToolProvider Interface

Standard interface for tool providers:

```python
# shared/interfaces/tool_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from dataclasses import dataclass

@dataclass
class ToolDefinition:
    """Standard tool definition"""
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any] = None

@dataclass
class ToolResult:
    """Standard tool execution result"""
    success: bool
    data: Any
    error: str = None

class ToolProvider(ABC):
    """
    Standard interface for tool providers.
    
    To add a new tool protocol:
    1. Create a class that implements this interface
    2. Register it with ToolRegistry
    3. Done! Agents can use tools from any provider.
    """
    
    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """Initialize the provider with configuration"""
        pass
    
    @abstractmethod
    def list_tools(self) -> List[ToolDefinition]:
        """List all available tools"""
        pass
    
    @abstractmethod
    def get_tool(self, name: str) -> ToolDefinition:
        """Get a specific tool definition"""
        pass
    
    @abstractmethod
    async def execute_tool(self, name: str, args: Dict[str, Any]) -> ToolResult:
        """Execute a tool with given arguments"""
        pass
    
    @abstractmethod
    def get_provider_type(self) -> str:
        """Return provider type (e.g., 'mcp', 'openapi', 'langchain')"""
        pass
```

---

## JavaScript Equivalents (Node.js Engine)

The Node.js engine (port 3003) implements the same contracts as the Python engine but in JavaScript. These are used by `mcp-runtime.js`, `langgraph-runtime.js`, and `maf-runtime.js`.

### 4. FrameworkRuntime (JavaScript)

```javascript
// services/execution-engine/node/src/runtimes/base-runtime.js

/**
 * Base interface for all JS framework runtimes.
 * Each runtime (MCP, LangGraph JS, MAF JS) implements these methods.
 */
class BaseRuntime {
  /**
   * Initialize the runtime with configuration.
   * @param {Object} config - Runtime configuration
   */
  async initialize(config) {
    throw new Error('Not implemented');
  }

  /**
   * Execute an agent with streaming SSE events.
   * @param {Object} agentConfig - Agent definition from registry
   * @param {string} message - User message
   * @param {Object} context - Execution context (conversationId, etc.)
   * @param {Function} emit - SSE event emitter: emit(eventType, data)
   *   Event types: 'token', 'tool_call', 'tool_result', 'step', 'handoff', 'done', 'error'
   */
  async execute(agentConfig, message, context, emit) {
    throw new Error('Not implemented');
  }

  /**
   * Stop a running execution.
   * @param {string} executionId - Execution to stop
   */
  async stop(executionId) {
    throw new Error('Not implemented');
  }

  /**
   * Return what this runtime supports.
   * @returns {Object} { streaming, toolCalling, humanInLoop, checkpointing, multiAgent }
   */
  getCapabilities() {
    return {
      streaming: false,
      toolCalling: false,
      humanInLoop: false,
      checkpointing: false,
      multiAgent: false
    };
  }
}

module.exports = BaseRuntime;
```

### 5. FrameworkRouter (JavaScript)

```javascript
// services/execution-engine/node/src/services/framework-router.js

/**
 * Routes execution requests to the appropriate runtime
 * based on agent.framework and agent.runtime.
 */
class FrameworkRouter {
  constructor(runtimes, pythonEngineUrl) {
    this.runtimes = runtimes;  // { mcp: MCPRuntime, langgraph: LangGraphJSRuntime, maf: MAFJSRuntime }
    this.pythonEngineUrl = pythonEngineUrl;
  }

  /**
   * Route and execute an agent request.
   * @param {Object} agentConfig - Agent definition (includes framework, runtime)
   * @param {string} message - User message
   * @param {Object} context - Execution context
   * @param {Function} emit - SSE event emitter
   */
  async execute(agentConfig, message, context, emit) {
    const { framework = 'default', runtime = 'node' } = agentConfig;

    // MCP always runs in Node.js
    if (framework === 'default') {
      return this.runtimes.mcp.execute(agentConfig, message, context, emit);
    }

    // If runtime is "python", proxy to Python engine
    if (runtime === 'python') {
      return this.proxyToPython(agentConfig, message, context, emit);
    }

    // Default: execute in Node.js
    const rt = this.runtimes[framework];
    if (!rt) throw new Error(`Unknown framework: ${framework}`);
    return rt.execute(agentConfig, message, context, emit);
  }

  async proxyToPython(agentConfig, message, context, emit) {
    // Forward request to Python engine and relay SSE events
    // POST http://<pythonEngineUrl>/execute/stream
  }
}

module.exports = FrameworkRouter;
```

### 6. SSE Event Contract (Both Engines)

Both Node.js and Python engines emit the same SSE event types:

```javascript
// SSE Event Types (shared contract)
const EventTypes = {
  TOKEN:       'token',       // { content: "..." }
  TOOL_CALL:   'tool_call',   // { name, input, id }
  TOOL_RESULT: 'tool_result', // { id, result }
  STEP:        'step',        // { node, state }         (LangGraph graph step)
  HANDOFF:     'handoff',     // { from, to }            (MAF agent handoff)
  DONE:        'done',        // { reasoningData }
  ERROR:       'error'        // { message }
};
```

**Mapping to Python interface:**

| Python Interface | JavaScript Equivalent |
|-----------------|----------------------|
| `FrameworkRuntime` ABC | `BaseRuntime` class |
| `RuntimeRegistry.register()` | `FrameworkRouter` constructor with runtime map |
| `ExecutionEvent` dataclass | SSE `emit(eventType, data)` callback |
| `ExecutionInput` dataclass | `(agentConfig, message, context)` params |
| `RuntimeCapabilities` dataclass | `getCapabilities()` return object |

---

## Future-Proof Interfaces

### 7. LLM Provider Interface

```python
# shared/interfaces/llm_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, AsyncIterator
from dataclasses import dataclass
from enum import Enum

class MessageRole(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"

@dataclass
class Message:
    role: MessageRole
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None
    tool_calls: Optional[List[Dict]] = None

@dataclass
class ChatResponse:
    content: str
    tool_calls: Optional[List[Dict]] = None
    finish_reason: str = "stop"
    usage: Optional[Dict[str, int]] = None

@dataclass
class ModelInfo:
    id: str
    name: str
    provider: str
    context_window: int
    supports_tools: bool
    supports_vision: bool
    supports_streaming: bool

class LLMProvider(ABC):
    """Interface for LLM providers (SAP AI Core, OpenAI, Anthropic, etc.)"""
    
    @abstractmethod
    def chat(self, messages: List[Message], tools: List[Dict] = None) -> ChatResponse:
        pass
    
    @abstractmethod
    async def stream(self, messages: List[Message], tools: List[Dict] = None) -> AsyncIterator:
        pass
    
    @abstractmethod
    def get_model_info(self) -> ModelInfo:
        pass
    
    @abstractmethod
    def count_tokens(self, text: str) -> int:
        pass
```

### 8. Memory Provider Interface

```python
# shared/interfaces/memory_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class MemoryEntry:
    id: str
    content: str
    metadata: Dict[str, Any]
    timestamp: datetime
    importance: float = 0.5

@dataclass
class MemoryQuery:
    query: str
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    top_k: int = 10

class MemoryProvider(ABC):
    """Interface for long-term memory providers (Mem0, Zep, Custom)"""
    
    @abstractmethod
    def store(self, content: str, metadata: Dict[str, Any], user_id: str = None) -> str:
        pass
    
    @abstractmethod
    def retrieve(self, query: MemoryQuery) -> List[MemoryEntry]:
        pass
    
    @abstractmethod
    def forget(self, memory_id: str) -> bool:
        pass
    
    @abstractmethod
    def get_summary(self, user_id: str = None) -> str:
        pass
```

### 9. Knowledge Graph Provider Interface

```python
# shared/interfaces/knowledge_graph_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

@dataclass
class Entity:
    id: str
    name: str
    type: str
    properties: Dict[str, Any]

@dataclass
class Relationship:
    id: str
    source_id: str
    target_id: str
    type: str
    properties: Dict[str, Any]

@dataclass
class GraphResult:
    entities: List[Entity]
    relationships: List[Relationship]
    context: str

class KnowledgeGraphProvider(ABC):
    """Interface for knowledge graph providers (Neo4j, HANA Graph, Custom)"""
    
    @abstractmethod
    def add_entities(self, entities: List[Entity]) -> List[str]:
        pass
    
    @abstractmethod
    def query(self, query: str, max_depth: int = 2) -> GraphResult:
        pass
    
    @abstractmethod
    def get_neighbors(self, entity_id: str, depth: int = 1) -> GraphResult:
        pass
    
    @abstractmethod
    def build_from_documents(self, documents: List[str]) -> Dict[str, int]:
        pass
```

### 10. Observability Provider Interface

```python
# shared/interfaces/observability_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class SpanKind(Enum):
    AGENT = "agent"
    LLM_CALL = "llm_call"
    TOOL_CALL = "tool_call"
    RETRIEVAL = "retrieval"

@dataclass
class Span:
    id: str
    name: str
    kind: SpanKind
    start_time: datetime
    end_time: datetime = None
    attributes: Dict[str, Any] = None

class ObservabilityProvider(ABC):
    """Interface for observability providers (OpenTelemetry, LangSmith, Custom)"""
    
    @abstractmethod
    def start_trace(self, name: str, attributes: Dict[str, Any] = None) -> str:
        pass
    
    @abstractmethod
    def start_span(self, name: str, kind: SpanKind, parent_id: str = None) -> Span:
        pass
    
    @abstractmethod
    def end_span(self, span: Span, attributes: Dict[str, Any] = None) -> None:
        pass
    
    @abstractmethod
    def log_llm_call(self, model: str, messages: List[Dict], response: str, tokens_in: int, tokens_out: int) -> None:
        pass
```

### 11. Guardrails Provider Interface

```python
# shared/interfaces/guardrails_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class ValidationResult(Enum):
    PASS = "pass"
    FAIL = "fail"
    WARN = "warn"

@dataclass
class GuardrailCheck:
    name: str
    result: ValidationResult
    message: str
    fixed_content: Optional[str] = None

class GuardrailsProvider(ABC):
    """Interface for guardrails providers (Guardrails AI, NeMo, Custom)"""
    
    @abstractmethod
    def validate_input(self, content: str) -> List[GuardrailCheck]:
        pass
    
    @abstractmethod
    def validate_output(self, content: str, context: str = None) -> List[GuardrailCheck]:
        pass
    
    @abstractmethod
    def check_prompt_injection(self, content: str) -> GuardrailCheck:
        pass
    
    @abstractmethod
    def check_pii(self, content: str) -> GuardrailCheck:
        pass
    
    @abstractmethod
    def sanitize(self, content: str) -> str:
        pass
```

### 12. Browser Automation Provider Interface

```python
# shared/interfaces/browser_provider.py

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from dataclasses import dataclass

@dataclass
class BrowserPage:
    url: str
    title: str
    content: str

@dataclass
class BrowserAction:
    success: bool
    message: str
    screenshot: bytes = None

class BrowserProvider(ABC):
    """Interface for browser automation (Playwright, Browser Use, Puppeteer)"""
    
    @abstractmethod
    async def navigate(self, url: str) -> BrowserPage:
        pass
    
    @abstractmethod
    async def click(self, selector: str) -> BrowserAction:
        pass
    
    @abstractmethod
    async def type(self, selector: str, text: str) -> BrowserAction:
        pass
    
    @abstractmethod
    async def extract_text(self, selector: str = None) -> str:
        pass
    
    @abstractmethod
    async def screenshot(self, full_page: bool = False) -> bytes:
        pass
    
    @abstractmethod
    async def close(self) -> None:
        pass
```

---

## All Registries

```python
# shared/registries/__init__.py

# Core registries
from .runtime_registry import RuntimeRegistry
from .adapter_registry import AdapterRegistry
from .tool_registry import ToolRegistry

# RAG registries
from .chunking_registry import ChunkingRegistry
from .embedding_registry import EmbeddingRegistry
from .vector_store_registry import VectorStoreRegistry
from .retrieval_registry import RetrievalRegistry
from .reranker_registry import RerankerRegistry

# Future-proof registries
from .llm_registry import LLMRegistry
from .memory_registry import MemoryRegistry
from .knowledge_graph_registry import KnowledgeGraphRegistry
from .observability_registry import ObservabilityRegistry
from .guardrails_registry import GuardrailsRegistry
from .browser_registry import BrowserRegistry
from .evaluation_registry import EvaluationRegistry
```

---

## Interface Summary

| Interface | Purpose | Engine | Implementations |
|-----------|---------|--------|-----------------|
| `FrameworkRuntime` (Python) | AI framework runtimes | Python (3004) | LangGraph Py, MAF Py |
| `BaseRuntime` (JavaScript) | AI framework runtimes | Node.js (3003) | MCP, LangGraph JS, MAF JS |
| `FrameworkRouter` (JavaScript) | Request routing | Node.js (3003) | Routes by framework + runtime |
| `UIAdapter` | UI adapters | API Gateway | Custom, OpenAI, A2A, Chainlit |
| `ToolProvider` | Tool protocols | Both | MCP, OpenAPI, LangChain |
| `LLMProvider` | LLM providers | Both | SAP AI Core, OpenAI, Anthropic |
| `MemoryProvider` | Long-term memory | Future | Mem0, Zep, Custom |
| `KnowledgeGraphProvider` | Knowledge graphs | Future | Neo4j, HANA Graph |
| `ObservabilityProvider` | Tracing/metrics | Future | OpenTelemetry, LangSmith |
| `GuardrailsProvider` | Safety/validation | Future | Guardrails AI, NeMo |
| `BrowserProvider` | Browser automation | Future | Playwright, Browser Use |