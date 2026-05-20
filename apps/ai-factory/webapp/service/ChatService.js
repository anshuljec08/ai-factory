sap.ui.define([
    "ai/factory/util/Constants",
    "ai/factory/service/AgentManager",
    "ai/factory/service/LlmClient",
    "ai/factory/service/McpClient",
    "ai/factory/service/ToolRouter",
    "ai/factory/service/ConversationManager",
    "ai/factory/service/ToolSchemaAdapter"
], function (Constants, AgentManager, LlmClient, McpClient, ToolRouter, ConversationManager, ToolSchemaAdapter) {
    "use strict";

    /**
     * ChatService
     * 
     * Orchestrates the agentic chat loop by coordinating:
     * - LlmClient for model API calls
     * - McpClient for tool execution
     * - ConversationManager for history and metrics
     * - ToolSchemaAdapter for schema conversion
     * 
     * This is a thin orchestration layer that delegates implementation
     * details to the specialized service modules.
     */
    var ChatService = {

        // ─── Tool State ──────────────────────────────────────────────────────
        _aTools: [],           // Raw MCP tools (provider-agnostic)
        _aAvailableModels: [],

        // ─── Public API (unchanged for backward compatibility) ───────────────

        /**
         * Get the current conversation history.
         * @returns {Array}
         */
        getConversationHistory: function () {
            return ConversationManager.getHistory();
        },

        /**
         * Set the conversation history.
         * @param {Array} aHistory
         */
        setConversationHistory: function (aHistory) {
            ConversationManager.setHistory(aHistory);
        },

        /**
         * Clear the conversation history.
         */
        clearConversationHistory: function () {
            ConversationManager.clear();
        },

        /**
         * Get loaded tools (internal format).
         * @returns {Array}
         */
        getTools: function () {
            return this._aTools;
        },

        /**
         * Get available models.
         * @returns {Array}
         */
        getAvailableModels: function () {
            return this._aAvailableModels;
        },

        /**
         * Check if stop was requested.
         * @returns {boolean}
         */
        isStopRequested: function () {
            return ConversationManager.isStopRequested();
        },

        /**
         * Load available models from the API.
         * @param {Function} fnCallback
         */
        loadModels: function (fnCallback) {
            var that = this;
            LlmClient.loadModels(function (aModels) {
                that._aAvailableModels = aModels;
                if (fnCallback) fnCallback(aModels);
            });
        },

        /**
         * Load tools for an agent via ToolRouter (resolves tool IDs from registry, discovers functions, applies filters).
         * @param {string} sAgentId
         * @returns {Promise}
         */
        loadTools: function (sAgentId) {
            var that = this;
            var oAgent = AgentManager.getAgentById(sAgentId);

            if (!oAgent) {
                this._aTools = [];
                console.log("[ChatService] Agent not found, tools cleared");
                return Promise.resolve();
            }

            return ToolRouter.loadToolsForAgent(oAgent).then(function (aFunctions) {
                that._aTools = aFunctions;
                console.log("[ChatService] Loaded functions for agent:", oAgent.name, "count:", aFunctions.length);
            }).catch(function (sError) {
                that._aTools = [];
                console.warn("[ChatService] Failed to load tools for agent:", oAgent.name, sError);
            });
        },

        /**
         * Get provider name from model ID for schema adaptation.
         * @param {string} sModel - Model ID
         * @returns {string} Provider name ("gemini", "sonar", "claude", "gpt", or "openai")
         * @private
         */
        _getProviderFromModel: function (sModel) {
            if (!sModel) return "openai";
            var sLower = sModel.toLowerCase();
            if (sLower.indexOf("gemini") !== -1) return "gemini";
            if (sLower.indexOf("sonar") !== -1) return "sonar";  // Perplexity Sonar Pro
            if (sLower.indexOf("claude") !== -1) return "claude";
            if (sLower.indexOf("gpt") !== -1) return "gpt";
            return "openai";
        },

        /**
         * Get tools converted for the specified model/provider.
         * @param {string} sModel - Model ID
         * @returns {Array} OpenAI-format tools with provider-specific sanitization
         * @private
         */
        _getToolsForModel: function (sModel) {
            var sProvider = this._getProviderFromModel(sModel);
            return ToolSchemaAdapter.convertToolsToOpenAI(this._aTools, { provider: sProvider });
        },

        /**
         * Call a single function, routed to the correct tool/server via ToolRouter.
         * @param {string} sToolName
         * @param {Object} oArgs
         * @param {string} sAgentId
         * @returns {Promise<string>}
         */
        callMCPTool: function (sToolName, oArgs, sAgentId) {
            return ToolRouter.callFunction(sToolName, oArgs);
        },

        /**
         * Truncate a tool result to fit within limits.
         * @param {string} sResult
         * @param {string} sAgentId
         * @param {string} [sToolName] - If provided, uses per-tool limits from routing map
         * @returns {string}
         */
        truncateToolResult: function (sResult, sAgentId, sToolName) {
            var oMcpConfig = sToolName ? ToolRouter.getConfigForFunction(sToolName) : null;
            var iMaxLength = (oMcpConfig && oMcpConfig.maxResultChars) ? oMcpConfig.maxResultChars : 40000;
            var iMaxRecords = (oMcpConfig && oMcpConfig.maxRecords) ? oMcpConfig.maxRecords : 50;

            if (!sResult || sResult.length <= iMaxLength) {
                return sResult;
            }

            try {
                var oData = JSON.parse(sResult);
                if (oData && oData.value && Array.isArray(oData.value)) {
                    var iOriginalCount = oData.value.length;
                    var iTruncateAt = Math.min(iMaxRecords, iOriginalCount);
                    oData.value = oData.value.slice(0, iTruncateAt);
                    oData._truncated = true;
                    oData._originalCount = iOriginalCount;
                    oData._keptRecords = iTruncateAt;
                    return JSON.stringify(oData, null, 2);
                }
            } catch (e) {
                // Not JSON, truncate as string
            }

            return sResult.substring(0, iMaxLength) + "\n...[truncated]";
        },

        /**
         * Stop current processing.
         */
        stopProcessing: function () {
            console.log("[ChatService] Stop requested by user");
            ConversationManager.requestStop();
            LlmClient.abort();
            ConversationManager.patchIncompleteToolCalls();
        },

        /**
         * Send a user message and start the agentic loop.
         * @param {string} sUserMessage
         * @param {string} sAgentId
         * @param {string} sModel
         * @param {boolean} bFollowupEnabled
         * @param {Object} oCallbacks
         * @param {boolean} [bStreamingEnabled] - Whether to use streaming mode
         */
        callAPI: function (sUserMessage, sAgentId, sModel, bFollowupEnabled, oCallbacks, bStreamingEnabled) {
            ConversationManager.startQuery(sUserMessage);
            this._sendToLLM(sAgentId, sModel, bFollowupEnabled, oCallbacks, bStreamingEnabled);
        },

        /**
         * Parse follow-up questions from response text.
         * @param {string} sText
         * @returns {Object} { text: string, followups: Array }
         */
        parseFollowupQuestions: function (sText) {
            var oResult = { text: sText, followups: [] };

            var oMatch = sText.match(/\[FOLLOWUP\]([\s\S]*?)\[\/FOLLOWUP\]/i);
            if (oMatch && oMatch[1]) {
                var sFollowups = oMatch[1].trim();
                oResult.followups = sFollowups.split('|').map(function (s) {
                    return s.trim();
                }).filter(function (s) {
                    return s.length > 0;
                });
                oResult.text = sText.replace(/\[FOLLOWUP\][\s\S]*?\[\/FOLLOWUP\]/i, '').trim();
                console.log("[ChatService] Parsed follow-up questions:", oResult.followups);
            }

            return oResult;
        },

        // ─── Internal: Agentic Loop ──────────────────────────────────────────
        // DEVIATION: Agentic loop runs client-side; moves to Execution Engine POST /execute (Week 5+) — see docs/phase1-deviations.md

        /**
         * Send conversation to LLM.
         * @param {boolean} [bStreamingEnabled] - Whether to use streaming mode
         * @private
         */
        _sendToLLM: function (sAgentId, sModel, bFollowupEnabled, oCallbacks, bStreamingEnabled) {
            var that = this;
            var oAgent = AgentManager.getAgentById(sAgentId);

            // Check stop condition
            if (ConversationManager.isStopRequested()) {
                console.log("[ChatService] Processing stopped by user");
                if (oCallbacks.onStop) oCallbacks.onStop();
                return;
            }

            // Check iteration limit
            var iMaxSteps = oAgent ? oAgent.maxSteps : 30;
            var iIteration = ConversationManager.incrementIteration();

            if (iIteration > iMaxSteps) {
                console.log("[ChatService] Max iterations reached (" + iMaxSteps + "), forcing summary");
                ConversationManager.patchIncompleteToolCalls();
                if (oCallbacks.onResponse) {
                    oCallbacks.onResponse(
                        "I've gathered data from multiple sources. Please ask a more specific question if you need additional details.",
                        null
                    );
                }
                this._triggerSummarization(sModel);
                return;
            }

            // Update typing indicator
            if (iIteration > 1 && oCallbacks.onTypingUpdate) {
                oCallbacks.onTypingUpdate("Processing... (step " + iIteration + ")");
            }

            // DEVIATION: Plain string systemPrompt; structured prompt object (background/steps/outputInstructions) comes with Agent Designer (Week 3) — see docs/phase1-deviations.md
            var sSystemPrompt = oAgent ? oAgent.systemPrompt : "You are a helpful AI assistant.";
            var sFullSystemPrompt = Constants.buildSystemPrompt(sSystemPrompt, bFollowupEnabled);
            var aMessages = ConversationManager.buildMessagesForLLM(sFullSystemPrompt);

            // Convert tools at request time with provider-specific sanitization
            var aToolsForModel = this._getToolsForModel(sModel);

            var iMaxTokens = (oAgent && oAgent.modelConfig && oAgent.modelConfig.maxTokens) || 4096;

            var oRequestBody = LlmClient.buildRequestBody({
                model: sModel,
                messages: aMessages,
                tools: aToolsForModel,
                maxTokens: iMaxTokens
            });

            // Send request (streaming or non-streaming)
            if (bStreamingEnabled) {
                this._sendStreamingRequest(oRequestBody, sAgentId, sModel, bFollowupEnabled, oCallbacks);
            } else {
                LlmClient.sendChatRequest(oRequestBody, {
                    onSuccess: function (choice, oUsage) {
                        if (ConversationManager.isStopRequested()) {
                            console.log("[ChatService] Response received but stop was requested");
                            return;
                        }
                        that._handleLLMResponse(choice, oUsage, sAgentId, sModel, bFollowupEnabled, oCallbacks, bStreamingEnabled);
                    },
                    onError: function (sErrorMsg, iStatus, jqXHR) {
                        ConversationManager.popLast(); // Remove the user message we added
                        if (oCallbacks.onError) oCallbacks.onError(sErrorMsg);
                    },
                    onAbort: function () {
                        console.log("[ChatService] Request aborted");
                    }
                });
            }
        },

        /**
         * Send a streaming request to the LLM.
         * @private
         */
        _sendStreamingRequest: function (oRequestBody, sAgentId, sModel, bFollowupEnabled, oCallbacks) {
            var that = this;

            LlmClient.sendStreamingRequest(oRequestBody, {
                onChunk: function (sTextDelta, sAccumulatedText) {
                    // Update typing indicator with streamed text
                    if (oCallbacks.onStreamChunk) {
                        oCallbacks.onStreamChunk(sTextDelta, sAccumulatedText);
                    }
                },
                onToolCall: function (oToolCall, iIndex) {
                    // Tool call being built - show status
                    if (oCallbacks.onTypingUpdate && oToolCall["function"] && oToolCall["function"].name) {
                        oCallbacks.onTypingUpdate("Preparing to call: " + oToolCall["function"].name + "...");
                    }
                },
                onComplete: function (choice, oUsage) {
                    if (ConversationManager.isStopRequested()) {
                        console.log("[ChatService] Streaming response received but stop was requested");
                        return;
                    }
                    that._handleLLMResponse(choice, oUsage, sAgentId, sModel, bFollowupEnabled, oCallbacks, true);
                },
                onError: function (sErrorMsg) {
                    ConversationManager.popLast();
                    if (oCallbacks.onError) oCallbacks.onError(sErrorMsg);
                },
                onAbort: function () {
                    console.log("[ChatService] Streaming request aborted");
                }
            });
        },

        /**
         * Handle LLM response - either tool calls or final text.
         * @private
         */
        _handleLLMResponse: function (choice, oUsage, sAgentId, sModel, bFollowupEnabled, oCallbacks) {
            var that = this;

            console.log("[ChatService] _handleLLMResponse called with choice:", JSON.stringify(choice, null, 2));

            if (!choice) {
                console.error("[ChatService] No choice in response");
                if (oCallbacks.onError) oCallbacks.onError("No response received from model.");
                return;
            }

            // Track token usage
            if (oUsage) {
                ConversationManager.addTokenUsage(oUsage.input_tokens, oUsage.output_tokens);
            }

            // Handle truncated response
            if (choice.finish_reason === "length") {
                console.warn("[ChatService] Response truncated — finish_reason: length");
                var sPartialText = choice.message && choice.message.content ? choice.message.content : "";
                var sErrorMsg = "⚠️ The agent's response was truncated (output limit reached). It tried to do too much in a single step. Please try again — the agent should now use smaller batches.";
                if (sPartialText.trim()) {
                    sErrorMsg = sPartialText + "\n\n---\n\n" + sErrorMsg;
                }
                ConversationManager.appendAssistant({ content: sErrorMsg });

                var oReasoningData = ConversationManager.buildReasoningData(sModel, sAgentId);
                if (oCallbacks.onResponse) {
                    oCallbacks.onResponse(sErrorMsg, oReasoningData, []);
                }
                return;
            }

            var oMessage = choice.message;

            // Handle tool calls
            if (oMessage.tool_calls && oMessage.tool_calls.length > 0) {
                this._handleToolCalls(oMessage, sAgentId, sModel, bFollowupEnabled, oCallbacks);
            } else {
                // Final text response
                this._handleFinalResponse(oMessage, sAgentId, sModel, oCallbacks);
            }
        },

        /**
         * Handle tool calls from LLM response.
         * @private
         */
        _handleToolCalls: function (oMessage, sAgentId, sModel, bFollowupEnabled, oCallbacks) {
            var that = this;
            var oAgent = AgentManager.getAgentById(sAgentId);

            // Show intermediate text if present
            var sIntermediateText = oMessage.content || "";
            if (sIntermediateText.trim() && oCallbacks.onIntermediateText) {
                oCallbacks.onIntermediateText(sIntermediateText);
            }

            // Add assistant message with tool_calls to history
            ConversationManager.appendAssistant({
                content: oMessage.content || null,
                tool_calls: oMessage.tool_calls
            });

            // Extract tool info for execution
            var aToolUses = oMessage.tool_calls.map(function (tc) {
                var oInput = {};
                try { oInput = JSON.parse(tc["function"].arguments); } catch (e) { oInput = {}; }
                return { id: tc.id, name: tc["function"].name, input: oInput };
            });

            var sToolNames = aToolUses.map(function (t) { return t.name; }).join(", ");
            if (oCallbacks.onTypingUpdate) {
                oCallbacks.onTypingUpdate("Fetching data: " + sToolNames + "...");
            }
            console.log("[ChatService] Executing " + aToolUses.length + " tool(s): " + sToolNames);

            var dBatchStartTime = new Date();

            // Check if all functions belong to the same tool/server (required for batching)
            var aFuncNames = aToolUses.map(function (t) { return t.name; });
            var bCanBatch = ToolRouter.canBatch(aFuncNames);
            var oFirstConfig = bCanBatch ? ToolRouter.getBatchConfig(aToolUses[0].name) : null;

            if (bCanBatch && oFirstConfig) {
                var aJsonRpcRequests = aToolUses.map(function (oTool, idx) {
                    return McpClient.buildToolCallRequest(oTool.name, oTool.input, idx);
                });

                console.log("[ChatService] Using batch endpoint for " + aToolUses.length + " tools");

                McpClient.callBatchProxy(oFirstConfig, aJsonRpcRequests).then(function (aResponses) {
                    var dBatchEndTime = new Date();
                    console.log("[ChatService] Batch completed in " + (dBatchEndTime - dBatchStartTime) + "ms");

                    aToolUses.forEach(function (oTool, idx) {
                        var oResp = aResponses[idx];
                        var oExtracted = McpClient.extractBatchResultText(oResp);
                        var sTruncatedResult = that.truncateToolResult(oExtracted.text, sAgentId, oTool.name);

                        ConversationManager.addReasoningStep({
                            type: oExtracted.isError ? "tool_error" : "tool_call",
                            toolName: oTool.name,
                            toolInput: oTool.input,
                            toolResult: sTruncatedResult.substring(0, Constants.REASONING_PREVIEW_CHARS) + (sTruncatedResult.length > Constants.REASONING_PREVIEW_CHARS ? "..." : ""),
                            fullResult: sTruncatedResult,
                            error: oExtracted.isError ? oExtracted.text : undefined,
                            duration: (dBatchEndTime - dBatchStartTime) + "ms (batch)"
                        });

                        ConversationManager.appendToolResult(oTool.id, sTruncatedResult);
                    });

                    if (oCallbacks.onTypingUpdate) { oCallbacks.onTypingUpdate("Analyzing results..."); }
                    that._sendToLLM(sAgentId, sModel, bFollowupEnabled, oCallbacks);
                }).catch(function (sBatchError) {
                    ConversationManager.popLast();
                    ConversationManager.appendAssistant({
                        content: oMessage.content || null,
                        tool_calls: oMessage.tool_calls
                    });
                    console.warn("[ChatService] Batch failed, falling back to individual calls:", sBatchError);
                    that._executeToolCallsIndividually(aToolUses, sAgentId, sModel, bFollowupEnabled, oCallbacks);
                });
            } else {
                that._executeToolCallsIndividually(aToolUses, sAgentId, sModel, bFollowupEnabled, oCallbacks);
            }
        },

        /**
         * Execute tool calls one by one.
         * @private
         */
        _executeToolCallsIndividually: function (aToolUses, sAgentId, sModel, bFollowupEnabled, oCallbacks) {
            var that = this;

            var aPromises = aToolUses.map(function (oTool) {
                var dToolStartTime = new Date();

                return ToolRouter.callFunction(oTool.name, oTool.input).then(function (sResult) {
                    var sTruncatedResult = that.truncateToolResult(sResult, sAgentId, oTool.name);

                    ConversationManager.addReasoningStep({
                        type: "tool_call",
                        toolName: oTool.name,
                        toolInput: oTool.input,
                        toolResult: sTruncatedResult.substring(0, Constants.REASONING_PREVIEW_CHARS) + (sTruncatedResult.length > Constants.REASONING_PREVIEW_CHARS ? "..." : ""),
                        fullResult: sTruncatedResult,
                        duration: (new Date() - dToolStartTime) + "ms"
                    });

                    return { tool_call_id: oTool.id, content: sTruncatedResult };
                }).catch(function (sError) {
                    ConversationManager.addReasoningStep({
                        type: "tool_error",
                        toolName: oTool.name,
                        toolInput: oTool.input,
                        error: sError,
                        duration: (new Date() - dToolStartTime) + "ms"
                    });

                    return { tool_call_id: oTool.id, content: String(sError) };
                });
            });

            Promise.all(aPromises).then(function (aResults) {
                aResults.forEach(function (r) {
                    ConversationManager.appendToolResult(r.tool_call_id, r.content);
                });
                if (oCallbacks.onTypingUpdate) { oCallbacks.onTypingUpdate("Analyzing results..."); }
                that._sendToLLM(sAgentId, sModel, bFollowupEnabled, oCallbacks);
            });
        },

        /**
         * Handle final text response from LLM.
         * @private
         */
        _handleFinalResponse: function (oMessage, sAgentId, sModel, oCallbacks) {
            var that = this;

            console.log("[ChatService] Final response received");

            var sResponseText = oMessage.content || "";
            if (!sResponseText) {
                sResponseText = "Sorry, I could not process your request.";
            }

            var oParsedResponse = this.parseFollowupQuestions(sResponseText);
            var sCleanText = oParsedResponse.text;
            var aFollowups = oParsedResponse.followups;

            ConversationManager.appendAssistant({ content: sCleanText });

            ConversationManager.addReasoningStep({
                type: "final_response",
                content: sCleanText.substring(0, 200) + (sCleanText.length > 200 ? "..." : "")
            });

            var oReasoningData = ConversationManager.buildReasoningData(sModel, sAgentId);

            if (oCallbacks.onResponse) {
                oCallbacks.onResponse(sCleanText, oReasoningData, aFollowups);
            }

            this._triggerSummarization(sModel);
        },

        /**
         * Trigger background summarization.
         * @private
         */
        _triggerSummarization: function (sModel) {
            ConversationManager.summarizeInBackground(sModel, function (oRequestBody) {
                return LlmClient.sendSimpleRequest(oRequestBody);
            });
        }
    };

    return ChatService;
});