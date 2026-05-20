sap.ui.define([
    "ai/factory/util/Constants",
    "ai/factory/service/ToolSchemaAdapter"
], function (Constants, ToolSchemaAdapter) {
    "use strict";

    var McpClient = {

        _oToolServerMap: {},
        _aAllTools: [],

        /**
         * Load tools from multiple MCP server configs and build routing map.
         * DEVIATION: Inline routing map; replaces with centralized ToolRegistry service (Week 8+) — see docs/phase1-deviations.md
         * @param {Array} aToolConfigs - Array of { name, config: { mcpUrl, authType, authConfig, maxResultChars, maxRecords } }
         * @returns {Promise<Array>} Resolves with merged tools array in internal format
         */
        loadAllTools: function (aToolConfigs) {
            var that = this;

            if (!aToolConfigs || aToolConfigs.length === 0) {
                this._oToolServerMap = {};
                this._aAllTools = [];
                return Promise.resolve([]);
            }

            var aPromises = aToolConfigs.map(function (oToolConfig) {
                return that._loadToolsFromServer(oToolConfig).catch(function (sError) {
                    console.warn("[McpClient] Failed to load tools from", oToolConfig.config.mcpUrl, ":", sError);
                    return [];
                });
            });

            return Promise.all(aPromises).then(function (aResults) {
                var aMergedTools = [];
                that._oToolServerMap = {};

                aResults.forEach(function (aTools, iIdx) {
                    var oConfig = aToolConfigs[iIdx];
                    aTools.forEach(function (oTool) {
                        that._oToolServerMap[oTool.name] = oConfig.config;
                        aMergedTools.push(oTool);
                    });
                });

                that._aAllTools = aMergedTools;
                console.log("[McpClient] Loaded " + aMergedTools.length + " tools from " + aToolConfigs.length + " MCP server(s)");
                return aMergedTools;
            });
        },

        /**
         * Get the MCP config that owns a given tool.
         * @param {string} sToolName
         * @returns {Object|null} MCP config { mcpUrl, authType, authConfig, maxResultChars, maxRecords }
         */
        getConfigForTool: function (sToolName) {
            return this._oToolServerMap[sToolName] || null;
        },

        /**
         * Get all loaded tools.
         * @returns {Array}
         */
        getAllTools: function () {
            return this._aAllTools;
        },

        /**
         * Load tools from a single MCP server.
         * @param {Object} oToolConfig - { name, config: { mcpUrl, authType, authConfig } }
         * @returns {Promise<Array>}
         * @private
         */
        _loadToolsFromServer: function (oToolConfig) {
            var oMcpConfig = oToolConfig.config;

            if (!oMcpConfig || !oMcpConfig.mcpUrl) {
                return Promise.resolve([]);
            }

            return this.callProxy(oMcpConfig, {
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
         * Call a single MCP tool via the proxy.
         * @param {Object} oMcpConfig - { mcpUrl, authType, authConfig } or full agent with those fields
         * @param {string} sToolName - Name of the tool to call
         * @param {Object} oArgs - Tool arguments
         * @returns {Promise<string>} Resolves with tool result text
         */
        callTool: function (oMcpConfig, sToolName, oArgs) {
            return this.callProxy(oMcpConfig, {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: { name: sToolName, arguments: oArgs }
            }).then(function (oResponse) {
                return ToolSchemaAdapter.extractToolResultText(oResponse);
            });
        },

        /**
         * Call the MCP proxy endpoint.
         * @param {Object} oMcpConfig - { mcpUrl, authType, authConfig }
         * @param {Object} oJsonRpc - JSON-RPC request object
         * @returns {Promise}
         */
        callProxy: function (oMcpConfig, oJsonRpc) {
            var sProxyUrl = Constants.MCP_PROXY_URL;
            var oAuthConfig = null;

            if (oMcpConfig.authType === "oauth2" && oMcpConfig.authConfig) {
                oAuthConfig = oMcpConfig.authConfig;
            }

            var iTimeout = (oMcpConfig.toolTimeout || 30) * 1000;

            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: sProxyUrl,
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    timeout: iTimeout,
                    data: JSON.stringify({
                        mcpUrl: oMcpConfig.mcpUrl,
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
         * Call multiple MCP tools in a batch (must all belong to same server).
         * @param {Object} oMcpConfig - { mcpUrl, authType, authConfig }
         * @param {Array} aJsonRpcRequests - Array of JSON-RPC request objects
         * @returns {Promise<Array>}
         */
        callBatchProxy: function (oMcpConfig, aJsonRpcRequests) {
            var sBatchUrl = Constants.MCP_BATCH_PROXY_URL;
            var oAuthConfig = null;

            if (oMcpConfig.authType === "oauth2" && oMcpConfig.authConfig) {
                oAuthConfig = oMcpConfig.authConfig;
            }

            var iSingleTimeout = (oMcpConfig.toolTimeout || 30) * 1000;
            var iTimeout = Math.round(iSingleTimeout * 1.5);

            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: sBatchUrl,
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    timeout: iTimeout,
                    data: JSON.stringify({
                        mcpUrl: oMcpConfig.mcpUrl,
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
         * Build a JSON-RPC request for a tool call.
         * @param {string} sToolName
         * @param {Object} oArgs
         * @param {number} [iIndex]
         * @returns {Object}
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
         * Extract text from a batch response item.
         * @param {Object} oResponse
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
