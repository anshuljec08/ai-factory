sap.ui.define([
    "ai/factory/util/Constants"
], function (Constants) {
    "use strict";

    /**
     * ConversationManager
     * 
     * Manages conversation history, query lifecycle, metrics tracking,
     * and background summarization/compaction.
     */
    var ConversationManager = {

        // ─── State ───────────────────────────────────────────────────────────
        _aHistory: [],
        _iQueryStartIndex: 0,
        _bCompacting: false,
        _bStopRequested: false,
        _iToolIterations: 0,
        _iGeneration: 0,

        // Metrics for current query
        _aReasoningSteps: [],
        _dQueryStartTime: null,
        _iTotalInputTokens: 0,
        _iTotalOutputTokens: 0,

        // ─── History Management ──────────────────────────────────────────────

        /**
         * Get the current conversation history.
         * @returns {Array} Conversation messages
         */
        getHistory: function () {
            return this._aHistory;
        },

        /**
         * Set the conversation history (e.g., from storage restore).
         * @param {Array} aHistory - Array of message objects
         */
        setHistory: function (aHistory) {
            this._aHistory = aHistory || [];
        },

        /**
         * Clear all conversation state.
         */
        clear: function () {
            this._aHistory = [];
            this._iQueryStartIndex = 0;
            this._bCompacting = false;
            this._bStopRequested = false;
            this._iToolIterations = 0;
            this._aReasoningSteps = [];
            this._dQueryStartTime = null;
            this._iTotalInputTokens = 0;
            this._iTotalOutputTokens = 0;
        },

        // ─── Query Lifecycle ─────────────────────────────────────────────────

        /**
         * Start a new query. Resets metrics and adds user message.
         * @param {string} sUserMessage - The user's message
         */
        startQuery: function (sUserMessage) {
            // Increment generation to invalidate any in-flight compaction
            this._iGeneration++;

            // Reset query-level state
            this._iToolIterations = 0;
            this._bStopRequested = false;
            this._aReasoningSteps = [];
            this._dQueryStartTime = new Date();
            this._iTotalInputTokens = 0;
            this._iTotalOutputTokens = 0;

            // If compaction was in progress, cancel it
            if (this._bCompacting) {
                console.log("[ConversationManager] Compaction in progress, proceeding with current history");
                this._bCompacting = false;
            }

            // Mark where this query starts in history
            this._iQueryStartIndex = this._aHistory.length;

            // Add user message
            this._aHistory.push({
                role: "user",
                content: sUserMessage
            });
        },

        /**
         * Increment tool iteration counter.
         * @returns {number} Current iteration count after increment
         */
        incrementIteration: function () {
            this._iToolIterations++;
            return this._iToolIterations;
        },

        /**
         * Get current tool iteration count.
         * @returns {number}
         */
        getIterationCount: function () {
            return this._iToolIterations;
        },

        /**
         * Request stop of current processing.
         */
        requestStop: function () {
            console.log("[ConversationManager] Stop requested");
            this._bStopRequested = true;
        },

        /**
         * Check if stop was requested.
         * @returns {boolean}
         */
        isStopRequested: function () {
            return this._bStopRequested;
        },

        // ─── Message Appending ───────────────────────────────────────────────

        /**
         * Append an assistant message to history.
         * @param {Object} oMessage - Message with content and optional tool_calls
         */
        appendAssistant: function (oMessage) {
            this._aHistory.push({
                role: "assistant",
                content: oMessage.content || null,
                tool_calls: oMessage.tool_calls || undefined
            });
        },

        /**
         * Append a tool result to history.
         * @param {string} sToolCallId - The tool_call_id from the assistant message
         * @param {string} sContent - The tool result content
         */
        appendToolResult: function (sToolCallId, sContent) {
            this._aHistory.push({
                role: "tool",
                tool_call_id: sToolCallId,
                content: sContent
            });
        },

        /**
         * Remove the last message from history (e.g., on error rollback).
         */
        popLast: function () {
            if (this._aHistory.length > 0) {
                this._aHistory.pop();
            }
        },

        // ─── Incomplete Tool Call Patching ───────────────────────────────────

        /**
         * Patch any tool_calls in history that don't have corresponding tool results.
         * Adds "[Cancelled by user]" results for orphaned tool calls.
         */
        patchIncompleteToolCalls: function () {
            var aHistory = this._aHistory;
            var oExistingIds = {};

            // Collect all existing tool result IDs
            for (var i = 0; i < aHistory.length; i++) {
                if (aHistory[i].role === "tool" && aHistory[i].tool_call_id) {
                    oExistingIds[aHistory[i].tool_call_id] = true;
                }
            }

            // Find orphaned tool_calls and add placeholder results
            for (var j = 0; j < aHistory.length; j++) {
                if (aHistory[j].role === "assistant" && aHistory[j].tool_calls) {
                    for (var k = 0; k < aHistory[j].tool_calls.length; k++) {
                        var sId = aHistory[j].tool_calls[k].id;
                        if (!oExistingIds[sId]) {
                            aHistory.push({
                                role: "tool",
                                tool_call_id: sId,
                                content: "[Cancelled by user]"
                            });
                            oExistingIds[sId] = true;
                        }
                    }
                }
            }
        },

        // ─── Token & Metrics Tracking ────────────────────────────────────────

        /**
         * Add token usage from an LLM response.
         * @param {number} iInput - Input/prompt tokens
         * @param {number} iOutput - Output/completion tokens
         */
        addTokenUsage: function (iInput, iOutput) {
            this._iTotalInputTokens += iInput || 0;
            this._iTotalOutputTokens += iOutput || 0;
            console.log("[ConversationManager] Token usage - Input:", iInput, "Output:", iOutput);
        },

        /**
         * Add a reasoning step for the current query.
         * @param {Object} oStep - Step data (type, toolName, toolInput, toolResult, etc.)
         */
        addReasoningStep: function (oStep) {
            oStep.stepNumber = this._aReasoningSteps.length + 1;
            oStep.timestamp = oStep.timestamp || new Date().toISOString();
            this._aReasoningSteps.push(oStep);
        },

        /**
         * Get all reasoning steps for the current query.
         * @returns {Array}
         */
        getReasoningSteps: function () {
            return this._aReasoningSteps.slice();
        },

        /**
         * Build the final metrics object for a completed query.
         * @param {string} sModel - Model ID used
         * @param {string} sAgentId - Agent ID used
         * @returns {Object} Reasoning data object
         */
        buildReasoningData: function (sModel, sAgentId) {
            var dEndTime = new Date();
            var iTotalTime = this._dQueryStartTime ? (dEndTime - this._dQueryStartTime) : 0;

            return {
                steps: this._aReasoningSteps.slice(),
                totalSteps: this._aReasoningSteps.length,
                totalTime: (iTotalTime / 1000).toFixed(1) + "s",
                model: sModel,
                agent: sAgentId,
                inputTokens: this._iTotalInputTokens,
                outputTokens: this._iTotalOutputTokens
            };
        },

        // ─── Summarization / Compaction ──────────────────────────────────────

        /**
         * Check if there are old messages to summarize.
         * @returns {boolean}
         */
        canSummarize: function () {
            return this._iQueryStartIndex > 1;
        },

        /**
         * Check if compaction is currently in progress.
         * @returns {boolean}
         */
        isCompacting: function () {
            return this._bCompacting;
        },

        /**
         * Perform background summarization of old messages.
         * 
         * @param {string} sModel - Model to use for summarization
         * @param {Function} fnSendRequest - Function to send the summarization request
         *        Signature: fnSendRequest(oRequestBody) => Promise<string>
         */
        summarizeInBackground: function (sModel, fnSendRequest) {
            var that = this;

            if (this._iQueryStartIndex <= 1) {
                console.log("[ConversationManager] No old messages to summarize, skipping compaction");
                return;
            }

            this._bCompacting = true;
            var iGenAtStart = this._iGeneration;
            var aOldMessages = this._aHistory.slice(0, this._iQueryStartIndex);
            var aCurrentMessages = this._aHistory.slice(this._iQueryStartIndex);

            // Build text representation of old messages
            var sOldContent = aOldMessages.map(function (msg) {
                if (msg.role === "tool") {
                    return "Tool result (" + msg.tool_call_id + "): " + (msg.content || "").substring(0, 500);
                } else if (msg.role === "assistant" && msg.tool_calls) {
                    var sTools = msg.tool_calls.map(function (tc) { return tc["function"].name; }).join(", ");
                    return "Assistant called tools: " + sTools;
                }
                return msg.role + ": " + (msg.content || "");
            }).join("\n");

            var oRequestBody = {
                model: sModel,
                messages: [
                    {
                        role: "system",
                        content: "Summarize this conversation history concisely. Preserve all specific data: names, IDs, quantities, dates, statuses, key findings. Under 300 words."
                    },
                    { role: "user", content: sOldContent }
                ],
                max_tokens: 1000
            };

            // Handle GPT model token parameter difference
            if (sModel && sModel.indexOf("gpt") !== -1) {
                oRequestBody.max_completion_tokens = oRequestBody.max_tokens;
                delete oRequestBody.max_tokens;
            }

            console.log("[ConversationManager] Starting background summarization of " + aOldMessages.length + " old messages");

            fnSendRequest(oRequestBody).then(function (sSummary) {
                if (that._iGeneration !== iGenAtStart) {
                    console.log("[ConversationManager] Compaction result discarded — new query started during summarization");
                    that._bCompacting = false;
                    return;
                }
                if (sSummary) {
                    that._aHistory = [
                        { role: "user", content: "[Prior conversation summary]" },
                        { role: "assistant", content: sSummary }
                    ].concat(aCurrentMessages);
                    that._iQueryStartIndex = 2;
                    console.log("[ConversationManager] Compaction complete: " + aOldMessages.length + " messages → summary (" + sSummary.length + " chars)");
                }
                that._bCompacting = false;
            }).catch(function (sError) {
                console.warn("[ConversationManager] Background summarization failed:", sError);
                that._bCompacting = false;
            });
        },

        // ─── Message Building Helpers ────────────────────────────────────────

        /**
         * Build the messages array for an LLM request.
         * Prepends system prompt to conversation history.
         * 
         * @param {string} sSystemPrompt - Full system prompt
         * @returns {Array} Messages array for LLM request
         */
        buildMessagesForLLM: function (sSystemPrompt) {
            return [{ role: "system", content: sSystemPrompt }].concat(this._aHistory);
        }
    };

    return ConversationManager;
});