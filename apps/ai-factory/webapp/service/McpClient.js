sap.ui.define([
    "ai/factory/util/Constants",
    "ai/factory/service/ToolSchemaAdapter"
], function (Constants, ToolSchemaAdapter) {
    "use strict";

    /**
     * McpClient
     * 
     * Handles all MCP (Model Context Protocol) proxy communication.
     * Supports single and batch tool calls with timeout handling.
     */
    var McpClient = {

        /**
         * Call a single MCP tool via the proxy.
         * 
         * @param {Object} oAgent - Agent configuration with mcpUrl, authType, authConfig, toolTimeout
         * @param {Object} oJsonRpc - JSON-RPC request object
         * @returns {Promise} Resolves with MCP response, rejects with error message
         */
        callProxy: function (oAgent, oJsonRpc) {
            var sProxyUrl = Constants.MCP_PROXY_URL;
            var oAuthConfig = null;

            if (oAgent.authType === "oauth2" && oAgent.authConfig) {
                oAuthConfig = oAgent.authConfig;
            }

            var iTimeout = (oAgent.toolTimeout || 30) * 1000;

            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: sProxyUrl,
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    timeout: iTimeout,
                    data: JSON.stringify({
                        mcpUrl: oAgent.mcpUrl,
                        authConfig: oAuthConfig,
                        jsonrpc: oJsonRpc,
                        timeoutMs: iTimeout
                    }),
                    success: function (oResponse) {
                        resolve(oResponse);
                    },
                    error: function (jqXHR, textStatus) {
                        var sMsg = "MCP proxy error";
                        if (textStatus === "timeout") {
                            sMsg = "Tool call timed out after " + (iTimeout / 1000) + "s";
                        } else if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                            sMsg = jqXHR.responseJSON.error;
                        }
                        reject(sMsg);
                    }
                });
            });
        },

        /**
         * Call multiple MCP tools in a single batch request.
         * 
         * @param {Object} oAgent - Agent configuration
         * @param {Array} aJsonRpcRequests - Array of JSON-RPC request objects
         * @returns {Promise} Resolves with array of responses, rejects with error message
         */
        callBatchProxy: function (oAgent, aJsonRpcRequests) {
            var sBatchUrl = Constants.MCP_BATCH_PROXY_URL;
            var oAuthConfig = null;

            if (oAgent.authType === "oauth2" && oAgent.authConfig) {
                oAuthConfig = oAgent.authConfig;
            }

            var iSingleTimeout = (oAgent.toolTimeout || 30) * 1000;
            var iTimeout = Math.round(iSingleTimeout * 1.5);

            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: sBatchUrl,
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    timeout: iTimeout,
                    data: JSON.stringify({
                        mcpUrl: oAgent.mcpUrl,
                        authConfig: oAuthConfig,
                        requests: aJsonRpcRequests
                    }),
                    success: function (oResponse) {
                        if (oResponse && oResponse.results) {
                            resolve(oResponse.results);
                        } else {
                            resolve([]);
                        }
                    },
                    error: function (jqXHR, textStatus) {
                        var sMsg = "MCP batch proxy error";
                        if (textStatus === "timeout") {
                            sMsg = "Batch call timed out after " + (iTimeout / 1000) + "s";
                        } else if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                            sMsg = jqXHR.responseJSON.error;
                        }
                        reject(sMsg);
                    }
                });
            });
        },

        /**
         * Load tools list from an MCP server.
         * 
         * @param {Object} oAgent - Agent configuration with mcpUrl
         * @returns {Promise} Resolves with array of tools in internal format
         */
        loadTools: function (oAgent) {
            var that = this;

            if (!oAgent || !oAgent.mcpUrl) {
                return Promise.resolve([]);
            }

            return this.callProxy(oAgent, {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/list",
                params: {}
            }).then(function (oResponse) {
                if (oResponse && oResponse.result && oResponse.result.tools) {
                    return oResponse.result.tools.map(function (tool) {
                        return {
                            name: tool.name,
                            description: tool.description,
                            input_schema: tool.inputSchema
                        };
                    });
                }
                return [];
            });
        },

        /**
         * Call a single MCP tool and extract the text result.
         * 
         * @param {Object} oAgent - Agent configuration
         * @param {string} sToolName - Name of the tool to call
         * @param {Object} oArgs - Tool arguments
         * @returns {Promise<string>} Resolves with tool result text
         */
        callTool: function (oAgent, sToolName, oArgs) {
            return this.callProxy(oAgent, {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: { name: sToolName, arguments: oArgs }
            }).then(function (oResponse) {
                return ToolSchemaAdapter.extractToolResultText(oResponse);
            });
        },

        /**
         * Build a JSON-RPC request for a tool call.
         * 
         * @param {string} sToolName - Tool name
         * @param {Object} oArgs - Tool arguments
         * @param {number} [iIndex] - Optional index for batch requests
         * @returns {Object} JSON-RPC request object
         */
        buildToolCallRequest: function (sToolName, oArgs, iIndex) {
            var sId = iIndex !== undefined
                ? "batch-" + iIndex + "-" + Date.now()
                : String(Date.now());

            return {
                jsonrpc: "2.0",
                id: sId,
                method: "tools/call",
                params: { name: sToolName, arguments: oArgs }
            };
        },

        /**
         * Extract text result from a batch response item.
         * 
         * @param {Object} oResponse - Single response from batch results array
         * @returns {Object} { text: string, isError: boolean }
         */
        extractBatchResultText: function (oResponse) {
            if (oResponse && oResponse.result && oResponse.result.content) {
                var aTexts = oResponse.result.content
                    .filter(function (c) { return c.type === "text" && c.text; })
                    .map(function (c) { return c.text; });
                return {
                    text: aTexts.length > 0 ? aTexts.join("\n") : JSON.stringify(oResponse),
                    isError: false
                };
            } else if (oResponse && oResponse.error) {
                return {
                    text: oResponse.error.message || JSON.stringify(oResponse.error),
                    isError: true
                };
            }
            return {
                text: JSON.stringify(oResponse),
                isError: false
            };
        }
    };

    return McpClient;
});