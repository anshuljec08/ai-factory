sap.ui.define([
    "ai/factory/util/Constants"
], function (Constants) {
    "use strict";

    /**
     * LlmClient
     * 
     * Handles LLM API communication, request building, and response normalization.
     * Supports OpenAI-compatible endpoints with model-specific adaptations.
     */
    var LlmClient = {

        // Current XHR reference for abort support
        _oCurrentXHR: null,

        // OAuth token cache
        _oTokenCache: {},

        // ─── Model Loading ───────────────────────────────────────────────────

        /**
         * Load available models from the API.
         * @param {Function} fnCallback - Callback with array of model objects
         */
        loadModels: function (fnCallback) {
            jQuery.ajax({
                url: Constants.MODELS_URL,
                method: "GET",
                dataType: "json",
                success: function (oResponse) {
                    var aModels = [];
                    if (oResponse && oResponse.data && Array.isArray(oResponse.data)) {
                        aModels = oResponse.data
                            .filter(function (model) {
                                return Constants.UNSUPPORTED_MODELS.indexOf(model.id) === -1;
                            })
                            .map(function (model) {
                                return { id: model.id, name: model.id };
                            });
                        console.log("[LlmClient] Loaded models:", aModels.length);
                    }
                    if (fnCallback) fnCallback(aModels);
                },
                error: function (oError) {
                    console.warn("[LlmClient] Failed to load models:", oError);
                    var aFallback = [{ id: Constants.DEFAULT_MODEL, name: Constants.DEFAULT_MODEL }];
                    if (fnCallback) fnCallback(aFallback);
                }
            });
        },

        // ─── Request Building ────────────────────────────────────────────────

        /**
         * Build a chat completion request body.
         * 
         * @param {Object} oParams - Request parameters
         * @param {string} oParams.model - Model ID
         * @param {Array} oParams.messages - Messages array
         * @param {Array} [oParams.tools] - Optional tools array (OpenAI format)
         * @param {number} [oParams.maxTokens] - Max tokens for response
         * @returns {Object} Request body for the API
         */
        buildRequestBody: function (oParams) {
            var oRequestBody = {
                model: oParams.model,
                messages: oParams.messages
            };

            var iMaxTokens = oParams.maxTokens || 4096;

            // GPT models use max_completion_tokens instead of max_tokens
            if (oParams.model && oParams.model.startsWith("gpt")) {
                oRequestBody.max_completion_tokens = iMaxTokens;
            } else {
                oRequestBody.max_tokens = iMaxTokens;
            }

            // Add tools if provided
            if (oParams.tools && oParams.tools.length > 0) {
                oRequestBody.tools = oParams.tools;
            }

            return oRequestBody;
        },

        // ─── API Calls ───────────────────────────────────────────────────────

        /**
         * Send a chat completion request.
         * 
         * @param {Object} oRequestBody - The request body
         * @param {Object} oCallbacks - Callback functions
         * @param {Function} oCallbacks.onSuccess - Called with (choice, usage)
         * @param {Function} oCallbacks.onError - Called with (errorMessage, statusCode, jqXHR)
         * @param {Function} [oCallbacks.onAbort] - Called when request is aborted
         * @returns {Object} The XHR object (for abort support)
         */
        sendChatRequest: function (oRequestBody, oCallbacks) {
            var that = this;

            this._oCurrentXHR = jQuery.ajax({
                url: Constants.OPENAI_API_URL,
                method: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(oRequestBody),
                success: function (oResponse) {
                    that._oCurrentXHR = null;
                    try {
                        var choice = oResponse.choices && oResponse.choices[0];
                        var oUsage = {
                            input_tokens: oResponse.usage ? oResponse.usage.prompt_tokens : 0,
                            output_tokens: oResponse.usage ? oResponse.usage.completion_tokens : 0
                        };
                        if (oCallbacks.onSuccess) {
                            oCallbacks.onSuccess(choice, oUsage);
                        }
                    } catch (e) {
                        console.error("[LlmClient] Error processing response:", e);
                        if (oCallbacks.onError) {
                            oCallbacks.onError("Error processing response: " + e.message, 0, null);
                        }
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    that._oCurrentXHR = null;

                    if (textStatus === "abort") {
                        console.log("[LlmClient] Request aborted");
                        if (oCallbacks.onAbort) oCallbacks.onAbort();
                        return;
                    }

                    console.error("[LlmClient] API call failed:", textStatus, errorThrown);
                    var oNormalized = that.normalizeError(jqXHR, textStatus, errorThrown);
                    if (oCallbacks.onError) {
                        oCallbacks.onError(oNormalized.message, oNormalized.status, jqXHR);
                    }
                }
            });

            return this._oCurrentXHR;
        },

        /**
         * Send a simple request and return a promise (for summarization, etc.).
         * 
         * @param {Object} oRequestBody - The request body
         * @returns {Promise<string>} Resolves with response text content
         */
        sendSimpleRequest: function (oRequestBody) {
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: Constants.OPENAI_API_URL,
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oRequestBody),
                    success: function (oResponse) {
                        var sContent = "";
                        if (oResponse.choices && oResponse.choices[0] && oResponse.choices[0].message) {
                            sContent = oResponse.choices[0].message.content || "";
                        }
                        resolve(sContent);
                    },
                    error: function (jqXHR, textStatus) {
                        reject(textStatus);
                    }
                });
            });
        },

        // ─── Streaming Support ────────────────────────────────────────────────

        // AbortController for streaming requests
        _oStreamController: null,

        /**
         * Send a streaming chat completion request.
         * Uses fetch() with ReadableStream to process SSE chunks.
         * 
         * @param {Object} oRequestBody - The request body (stream: true will be added)
         * @param {Object} oCallbacks - Callback functions
         * @param {Function} oCallbacks.onChunk - Called with (textDelta) for each text chunk
         * @param {Function} oCallbacks.onToolCall - Called with (toolCallDelta) for tool call chunks
         * @param {Function} oCallbacks.onComplete - Called with (fullChoice, usage) when done
         * @param {Function} oCallbacks.onError - Called with (errorMessage) on error
         * @param {Function} [oCallbacks.onAbort] - Called when request is aborted
         */
        sendStreamingRequest: function (oRequestBody, oCallbacks) {
            var that = this;

            // Add stream flag
            oRequestBody.stream = true;

            // Create abort controller
            this._oStreamController = new AbortController();

            // Accumulated state
            var sAccumulatedContent = "";
            var aToolCalls = [];
            var oUsage = { input_tokens: 0, output_tokens: 0 };
            var sFinishReason = null;

            fetch(Constants.OPENAI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oRequestBody),
                signal: this._oStreamController.signal
            })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().then(function (errData) {
                        var sMsg = errData.error && errData.error.message ? errData.error.message : "Request failed";
                        throw new Error(sMsg);
                    });
                }

                var reader = response.body.getReader();
                var decoder = new TextDecoder();
                var sBuffer = "";

                function processStream() {
                    return reader.read().then(function (result) {
                        if (result.done) {
                            // Stream complete
                            that._oStreamController = null;
                            var oChoice = {
                                message: {
                                    role: "assistant",
                                    content: sAccumulatedContent
                                },
                                finish_reason: sFinishReason
                            };
                            if (aToolCalls.length > 0) {
                                oChoice.message.tool_calls = aToolCalls;
                            }
                            if (oCallbacks.onComplete) {
                                oCallbacks.onComplete(oChoice, oUsage);
                            }
                            return;
                        }

                        sBuffer += decoder.decode(result.value, { stream: true });

                        // Process complete SSE lines
                        var aLines = sBuffer.split("\n");
                        sBuffer = aLines.pop(); // Keep incomplete line in buffer

                        for (var i = 0; i < aLines.length; i++) {
                            var sLine = aLines[i].trim();
                            if (!sLine || sLine === "data: [DONE]") continue;
                            if (!sLine.startsWith("data: ")) continue;

                            try {
                                var oChunk = JSON.parse(sLine.substring(6));
                                var oDelta = oChunk.choices && oChunk.choices[0] && oChunk.choices[0].delta;

                                if (oDelta) {
                                    // Text content
                                    if (oDelta.content) {
                                        sAccumulatedContent += oDelta.content;
                                        if (oCallbacks.onChunk) {
                                            oCallbacks.onChunk(oDelta.content, sAccumulatedContent);
                                        }
                                    }

                                    // Tool calls
                                    if (oDelta.tool_calls) {
                                        for (var j = 0; j < oDelta.tool_calls.length; j++) {
                                            var oTcDelta = oDelta.tool_calls[j];
                                            var iIdx = oTcDelta.index || 0;

                                            if (!aToolCalls[iIdx]) {
                                                aToolCalls[iIdx] = {
                                                    id: oTcDelta.id || "",
                                                    type: "function",
                                                    "function": { name: "", arguments: "" }
                                                };
                                            }

                                            if (oTcDelta.id) aToolCalls[iIdx].id = oTcDelta.id;
                                            if (oTcDelta["function"]) {
                                                if (oTcDelta["function"].name) {
                                                    aToolCalls[iIdx]["function"].name = oTcDelta["function"].name;
                                                }
                                                if (oTcDelta["function"].arguments) {
                                                    aToolCalls[iIdx]["function"].arguments += oTcDelta["function"].arguments;
                                                }
                                            }

                                            if (oCallbacks.onToolCall) {
                                                oCallbacks.onToolCall(aToolCalls[iIdx], iIdx);
                                            }
                                        }
                                    }
                                }

                                // Finish reason
                                if (oChunk.choices && oChunk.choices[0] && oChunk.choices[0].finish_reason) {
                                    sFinishReason = oChunk.choices[0].finish_reason;
                                }

                                // Usage (some providers send at end)
                                if (oChunk.usage) {
                                    oUsage.input_tokens = oChunk.usage.prompt_tokens || 0;
                                    oUsage.output_tokens = oChunk.usage.completion_tokens || 0;
                                }
                            } catch (e) {
                                console.warn("[LlmClient] Error parsing SSE chunk:", e, sLine);
                            }
                        }

                        return processStream();
                    });
                }

                return processStream();
            })
            .catch(function (error) {
                that._oStreamController = null;
                if (error.name === "AbortError") {
                    console.log("[LlmClient] Streaming request aborted");
                    if (oCallbacks.onAbort) oCallbacks.onAbort();
                } else {
                    console.error("[LlmClient] Streaming error:", error);
                    if (oCallbacks.onError) oCallbacks.onError(error.message || "Streaming request failed");
                }
            });
        },

        /**
         * Abort the current in-flight request.
         */
        abort: function () {
            // Abort streaming request
            if (this._oStreamController) {
                this._oStreamController.abort();
                this._oStreamController = null;
            }
            if (this._oCurrentXHR) {
                this._oCurrentXHR.abort();
                this._oCurrentXHR = null;
            }
        },

        /**
         * Check if there's a request in flight.
         * @returns {boolean}
         */
        isRequestInFlight: function () {
            return this._oCurrentXHR !== null;
        },

        // ─── Error Normalization ─────────────────────────────────────────────

        /**
         * Normalize an error response into a consistent format.
         * 
         * @param {Object} jqXHR - jQuery XHR object
         * @param {string} textStatus - Status text
         * @param {string} errorThrown - Error message
         * @returns {Object} { message: string, status: number, isRetryable: boolean }
         */
        normalizeError: function (jqXHR, textStatus, errorThrown) {
            var iStatus = jqXHR ? jqXHR.status : 0;
            var sMessage = "Sorry, something went wrong. Please try again.";
            var bRetryable = false;

            // Extract message from response
            if (jqXHR && jqXHR.responseJSON) {
                if (jqXHR.responseJSON.error && jqXHR.responseJSON.error.message) {
                    sMessage = jqXHR.responseJSON.error.message;
                } else if (jqXHR.responseJSON.message) {
                    sMessage = jqXHR.responseJSON.message;
                } else if (typeof jqXHR.responseJSON.error === "string") {
                    sMessage = jqXHR.responseJSON.error;
                }
            }

            // Status-specific handling
            switch (iStatus) {
                case 401:
                case 403:
                    sMessage = "Authorization failed — check your credentials or re-login.";
                    bRetryable = false;
                    break;
                case 413:
                    sMessage = "Conversation too large — clearing old messages and retrying.";
                    bRetryable = true;
                    break;
                case 429:
                    sMessage = "Rate limited — please wait a moment and try again.";
                    bRetryable = true;
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    sMessage = "AI provider temporarily unavailable — please try again.";
                    bRetryable = true;
                    break;
                case 0:
                    if (textStatus === "timeout") {
                        sMessage = "Request timed out — check your connection.";
                        bRetryable = true;
                    } else if (textStatus === "error") {
                        sMessage = "Network error — check your connection.";
                        bRetryable = true;
                    }
                    break;
            }

            return {
                message: sMessage,
                status: iStatus,
                isRetryable: bRetryable
            };
        },

        // ─── OAuth Token Management ──────────────────────────────────────────

        /**
         * Get auth headers for an agent (handles OAuth2 token fetch).
         * 
         * @param {Object} oAgent - Agent configuration
         * @returns {Promise<Object>} Resolves with headers object
         */
        getAuthHeaders: function (oAgent) {
            var that = this;
            return new Promise(function (resolve) {
                var sAuthType = oAgent.authType || "none";
                var oConfig = oAgent.authConfig || {};

                if (sAuthType === "basic") {
                    var sEncoded = btoa((oConfig.username || "") + ":" + (oConfig.password || ""));
                    resolve({ "Authorization": "Basic " + sEncoded });
                } else if (sAuthType === "oauth2") {
                    var sCacheKey = oConfig.tokenUrl + "|" + oConfig.clientId;
                    var oCached = that._oTokenCache[sCacheKey];

                    if (oCached && oCached.expiresAt > Date.now()) {
                        resolve({ "Authorization": "Bearer " + oCached.token });
                        return;
                    }

                    jQuery.ajax({
                        url: oConfig.tokenUrl,
                        method: "POST",
                        contentType: "application/x-www-form-urlencoded",
                        data: jQuery.param({
                            grant_type: "client_credentials",
                            client_id: oConfig.clientId || "",
                            client_secret: oConfig.clientSecret || ""
                        }),
                        success: function (oTokenResponse) {
                            var sToken = oTokenResponse.access_token;
                            var iExpiresIn = (oTokenResponse.expires_in || 3600) * 1000;
                            that._oTokenCache[sCacheKey] = {
                                token: sToken,
                                expiresAt: Date.now() + iExpiresIn - 60000
                            };
                            console.log("[LlmClient] OAuth token fetched for agent:", oAgent.name);
                            resolve({ "Authorization": "Bearer " + sToken });
                        },
                        error: function (oError) {
                            console.error("[LlmClient] OAuth token fetch failed:", oError);
                            resolve({});
                        }
                    });
                } else {
                    resolve({});
                }
            });
        },

        /**
         * Clear the OAuth token cache.
         */
        clearTokenCache: function () {
            this._oTokenCache = {};
        }
    };

    return LlmClient;
});