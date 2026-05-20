sap.ui.define([
    "ai/factory/util/Constants",
    "ai/factory/service/McpClient"
], function (Constants, McpClient) {
    "use strict";

    var ToolRouter = {

        _oToolRegistry: {},
        _oFunctionToolMap: {},
        _aLoadedFunctions: [],

        getLoadedFunctions: function () {
            return this._aLoadedFunctions;
        },

        getConfigForFunction: function (sFunctionName) {
            var sToolId = this._oFunctionToolMap[sFunctionName];
            if (!sToolId) return null;
            var oTool = this._oToolRegistry[sToolId];
            return oTool ? oTool.config : null;
        },

        loadToolsForAgent: function (oAgent) {
            var that = this;

            this._oToolRegistry = {};
            this._oFunctionToolMap = {};
            this._aLoadedFunctions = [];

            var aToolIds = oAgent.tools || [];
            if (!aToolIds.length || typeof aToolIds[0] !== "string") {
                return Promise.resolve([]);
            }

            return this._fetchToolConfigs(aToolIds).then(function (aTools) {
                aTools.forEach(function (oTool) {
                    that._oToolRegistry[oTool.id] = oTool;
                });

                var aMcpTools = aTools.filter(function (t) {
                    return t.type === "mcp" && t.enabled !== false && t.config && t.config.mcpUrl;
                });

                if (aMcpTools.length === 0) {
                    return [];
                }

                var iTimeout = Math.round((oAgent.timeout || 30000) / 1000);
                var aMcpConfigs = aMcpTools.map(function (oTool) {
                    return {
                        name: oTool.id,
                        type: "mcp",
                        enabled: true,
                        config: Object.assign({ toolTimeout: iTimeout }, oTool.config)
                    };
                });

                return McpClient.loadAllTools(aMcpConfigs).then(function (aRawFunctions) {
                    var aFiltered = that._applyFilters(aRawFunctions, aTools, oAgent);

                    that._oFunctionToolMap = {};
                    aFiltered.forEach(function (oFunc) {
                        var oMcpConfig = McpClient.getConfigForTool(oFunc.name);
                        if (oMcpConfig) {
                            var sToolId = aMcpTools.find(function (t) {
                                return t.config.mcpUrl === oMcpConfig.mcpUrl;
                            });
                            if (sToolId) {
                                that._oFunctionToolMap[oFunc.name] = sToolId.id;
                            }
                        }
                    });

                    that._aLoadedFunctions = aFiltered;
                    console.log("[ToolRouter] Loaded " + aFiltered.length + " functions from " + aMcpTools.length + " tool(s)");
                    return aFiltered;
                });
            }).catch(function (sError) {
                console.warn("[ToolRouter] Failed to load tools:", sError);
                that._aLoadedFunctions = [];
                return [];
            });
        },

        callFunction: function (sFunctionName, oArgs) {
            var oMcpConfig = McpClient.getConfigForTool(sFunctionName);
            if (!oMcpConfig) {
                return Promise.reject("No tool found for function: " + sFunctionName);
            }
            return McpClient.callTool(oMcpConfig, sFunctionName, oArgs);
        },

        canBatch: function (aFunctionNames) {
            if (aFunctionNames.length <= 1) return false;
            var oFirst = McpClient.getConfigForTool(aFunctionNames[0]);
            if (!oFirst) return false;
            return aFunctionNames.every(function (name) {
                var oConf = McpClient.getConfigForTool(name);
                return oConf && oConf.mcpUrl === oFirst.mcpUrl;
            });
        },

        getBatchConfig: function (sFunctionName) {
            return McpClient.getConfigForTool(sFunctionName);
        },

        _fetchToolConfigs: function (aToolIds) {
            var sBaseUrl = Constants.TOOLS_API_URL;

            var aPromises = aToolIds.map(function (sId) {
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        url: sBaseUrl + "/" + encodeURIComponent(sId),
                        method: "GET",
                        dataType: "json",
                        success: function (oResponse) {
                            resolve(oResponse.data || oResponse);
                        },
                        error: function (jqXHR) {
                            console.warn("[ToolRouter] Tool not found in registry:", sId);
                            resolve(null);
                        }
                    });
                });
            });

            return Promise.all(aPromises).then(function (aResults) {
                return aResults.filter(function (t) { return t !== null; });
            });
        },

        _applyFilters: function (aFunctions, aTools, oAgent) {
            var aFiltered = aFunctions;

            var oToolFilterMap = {};
            aTools.forEach(function (oTool) {
                if (oTool.functionFilter && oTool.functionFilter.mode !== "all") {
                    oToolFilterMap[oTool.config.mcpUrl] = oTool.functionFilter;
                }
            });

            if (Object.keys(oToolFilterMap).length > 0) {
                aFiltered = aFiltered.filter(function (oFunc) {
                    var oMcpConfig = McpClient.getConfigForTool(oFunc.name);
                    if (!oMcpConfig) return true;
                    var oFilter = oToolFilterMap[oMcpConfig.mcpUrl];
                    if (!oFilter) return true;
                    var aNames = oFilter.functions || [];
                    if (oFilter.mode === "include") return aNames.indexOf(oFunc.name) !== -1;
                    if (oFilter.mode === "exclude") return aNames.indexOf(oFunc.name) === -1;
                    return true;
                });
            }

            var oAgentFilters = oAgent.toolFilters || {};
            if (Object.keys(oAgentFilters).length > 0) {
                var oToolUrlMap = {};
                aTools.forEach(function (oTool) {
                    oToolUrlMap[oTool.config.mcpUrl] = oTool.id;
                });

                aFiltered = aFiltered.filter(function (oFunc) {
                    var oMcpConfig = McpClient.getConfigForTool(oFunc.name);
                    if (!oMcpConfig) return true;
                    var sToolId = oToolUrlMap[oMcpConfig.mcpUrl];
                    if (!sToolId) return true;
                    var oFilter = oAgentFilters[sToolId];
                    if (!oFilter) return true;
                    if (oFilter.include) return oFilter.include.indexOf(oFunc.name) !== -1;
                    if (oFilter.exclude) return oFilter.exclude.indexOf(oFunc.name) === -1;
                    return true;
                });
            }

            return aFiltered;
        }
    };

    return ToolRouter;
});
