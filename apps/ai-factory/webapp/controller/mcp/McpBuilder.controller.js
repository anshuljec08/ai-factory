sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "ai/factory/service/McpClient"
], function (BaseController, JSONModel, MessageToast, MessageBox, McpClient) {
    "use strict";

    return BaseController.extend("ai.factory.controller.mcp.McpBuilder", {

        onInit: function () {
            var oMcpModel = new JSONModel({
                serverUrl: "",
                authType: "none",
                authConfig: {
                    username: "",
                    password: "",
                    token: ""
                },
                isConnected: false,
                isLoading: false,
                tools: [],
                toolCount: 0,
                selectedTools: [],
                selectedTool: null,
                testInput: "{}",
                testOutput: "",
                saveName: "",
                saveId: "",
                saveDescription: ""
            });
            this.getView().setModel(oMcpModel, "mcp");

            this._aAllTools = [];
        },
        
        /**
         * Connect to MCP server
         */
        onConnect: function () {
            var oModel = this.getView().getModel("mcp");
            var sUrl = oModel.getProperty("/serverUrl");
            
            if (!sUrl) {
                MessageToast.show("Please enter an MCP server URL");
                return;
            }
            
            var that = this;
            oModel.setProperty("/isLoading", true);
            
            // Get auth config
            var sAuthType = oModel.getProperty("/authType");
            var oAuthConfig = null;
            
            if (sAuthType !== "none") {
                oAuthConfig = {
                    type: sAuthType,
                    username: oModel.getProperty("/authConfig/username"),
                    password: oModel.getProperty("/authConfig/password"),
                    token: oModel.getProperty("/authConfig/token")
                };
            }
            
            // Try to discover tools
            this._discoverTools(sUrl, sAuthType, oAuthConfig)
                .then(function (aTools) {
                    that._aAllTools = aTools;
                    oModel.setProperty("/tools", aTools);
                    oModel.setProperty("/toolCount", aTools.length);
                    oModel.setProperty("/isConnected", true);
                    oModel.setProperty("/isLoading", false);
                    
                    MessageToast.show("Connected! Discovered " + aTools.length + " tools");
                })
                .catch(function (error) {
                    oModel.setProperty("/isLoading", false);
                    oModel.setProperty("/isConnected", false);
                    
                    MessageBox.error("Failed to connect to MCP server: " + error.message);
                });
        },
        
        /**
         * Discover tools from MCP server
         */
        _discoverTools: function (sUrl, sAuthType, oAuthConfig) {
            var oMcpConfig = {
                mcpUrl: sUrl,
                authType: (sAuthType !== "none") ? "oauth2" : "none",
                authConfig: oAuthConfig || {},
                toolTimeout: 30
            };

            var oToolEntry = { name: "mcp-builder-discovery", config: oMcpConfig };

            return McpClient.loadAllTools([oToolEntry]).then(function (aTools) {
                return aTools;
            });
        },
        
        
        /**
         * Disconnect from MCP server
         */
        onDisconnect: function () {
            var oModel = this.getView().getModel("mcp");
            oModel.setProperty("/isConnected", false);
            oModel.setProperty("/tools", []);
            oModel.setProperty("/toolCount", 0);
            oModel.setProperty("/selectedTool", null);
            this._aAllTools = [];
            
            MessageToast.show("Disconnected from MCP server");
        },
        
        /**
         * Refresh tools
         */
        onRefresh: function () {
            var oModel = this.getView().getModel("mcp");
            if (oModel.getProperty("/isConnected")) {
                this.onConnect();
            }
        },
        
        /**
         * Search tools
         */
        onSearchTools: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            var oModel = this.getView().getModel("mcp");
            
            if (!sQuery) {
                oModel.setProperty("/tools", this._aAllTools);
                return;
            }
            
            var sLower = sQuery.toLowerCase();
            var aFiltered = this._aAllTools.filter(function (oTool) {
                return oTool.name.toLowerCase().includes(sLower) ||
                       (oTool.description && oTool.description.toLowerCase().includes(sLower));
            });
            
            oModel.setProperty("/tools", aFiltered);
        },
        
        /**
         * Handle tool selection change
         */
        onToolSelectionChange: function (oEvent) {
            var oTable = this.byId("toolsTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("mcp");
            
            var aSelectedTools = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext("mcp").getObject();
            });
            
            oModel.setProperty("/selectedTools", aSelectedTools);
        },
        
        /**
         * View tool details
         */
        onViewToolDetails: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("mcp");
            var oTool = oContext.getObject();
            var oModel = this.getView().getModel("mcp");
            
            oModel.setProperty("/selectedTool", oTool);
            oModel.setProperty("/testInput", JSON.stringify(this._generateSampleInput(oTool), null, 2));
            oModel.setProperty("/testOutput", "");
        },
        
        /**
         * Generate sample input for tool
         */
        _generateSampleInput: function (oTool) {
            var oSample = {};
            
            if (oTool.inputSchema && oTool.inputSchema.properties) {
                var oProps = oTool.inputSchema.properties;
                for (var sKey in oProps) {
                    var oProp = oProps[sKey];
                    if (oProp.default !== undefined) {
                        oSample[sKey] = oProp.default;
                    } else if (oProp.enum && oProp.enum.length > 0) {
                        oSample[sKey] = oProp.enum[0];
                    } else if (oProp.type === "string") {
                        oSample[sKey] = "";
                    } else if (oProp.type === "number" || oProp.type === "integer") {
                        oSample[sKey] = 0;
                    } else if (oProp.type === "boolean") {
                        oSample[sKey] = false;
                    }
                }
            }
            
            return oSample;
        },
        
        /**
         * Test tool
         */
        onTestTool: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("mcp");
            var oTool = oContext.getObject();
            
            this.onViewToolDetails(oEvent);
        },
        
        /**
         * Execute tool
         */
        onExecuteTool: function () {
            var oModel = this.getView().getModel("mcp");
            var oTool = oModel.getProperty("/selectedTool");
            var sInput = oModel.getProperty("/testInput");
            
            if (!oTool) {
                MessageToast.show("No tool selected");
                return;
            }
            
            var oInput;
            try {
                oInput = JSON.parse(sInput);
            } catch (e) {
                MessageBox.error("Invalid JSON input: " + e.message);
                return;
            }
            
            var that = this;
            oModel.setProperty("/testOutput", "Executing...");
            
            // Execute tool via MCP
            this._executeTool(oTool.name, oInput)
                .then(function (oResult) {
                    oModel.setProperty("/testOutput", JSON.stringify(oResult, null, 2));
                })
                .catch(function (error) {
                    oModel.setProperty("/testOutput", "Error: " + error.message);
                });
        },
        
        /**
         * Execute tool via MCP proxy
         */
        _executeTool: function (sToolName, oInput) {
            var oModel = this.getView().getModel("mcp");
            var sUrl = oModel.getProperty("/serverUrl");
            var sAuthType = oModel.getProperty("/authType");

            var oMcpConfig = {
                mcpUrl: sUrl,
                authType: (sAuthType !== "none") ? "oauth2" : "none",
                authConfig: {},
                toolTimeout: 30
            };

            return McpClient.callTool(oMcpConfig, sToolName, oInput);
        },
        
        /**
         * Clear test input
         */
        onClearTestInput: function () {
            var oModel = this.getView().getModel("mcp");
            oModel.setProperty("/testInput", "{}");
            oModel.setProperty("/testOutput", "");
        },
        
        /**
         * Save current MCP server to Tool Registry via API.
         */
        onSaveToRegistry: function () {
            var oModel = this.getView().getModel("mcp");
            var sUrl = oModel.getProperty("/serverUrl");
            var sAuthType = oModel.getProperty("/authType");
            var sName = oModel.getProperty("/saveName");
            var sId = oModel.getProperty("/saveId");
            var sDescription = oModel.getProperty("/saveDescription");

            if (!sName) {
                MessageToast.show("Please enter a tool name");
                return;
            }

            if (!sId) {
                sId = sName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
            }

            var oToolData = {
                id: sId,
                name: sName,
                type: "mcp",
                description: sDescription || "",
                config: {
                    mcpUrl: sUrl,
                    authType: sAuthType !== "none" ? sAuthType : "none",
                    authConfig: sAuthType !== "none" ? oModel.getProperty("/authConfig") : undefined
                },
                functionFilter: { mode: "all" },
                enabled: true,
                metadata: {
                    tags: [],
                    category: "General"
                }
            };

            jQuery.ajax({
                url: "/api/v1/tools",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oToolData),
                success: function () {
                    MessageToast.show("Tool '" + sName + "' saved to registry");
                    oModel.setProperty("/saveName", "");
                    oModel.setProperty("/saveId", "");
                    oModel.setProperty("/saveDescription", "");
                },
                error: function (jqXHR) {
                    var sMsg = "Failed to save tool";
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        sMsg = jqXHR.responseJSON.error.message || sMsg;
                    }
                    MessageBox.error(sMsg);
                }
            });
        },
        
        /**
         * Export tools
         */
        onExportTools: function () {
            var oModel = this.getView().getModel("mcp");
            var aTools = oModel.getProperty("/tools");
            var sServerUrl = oModel.getProperty("/serverUrl");
            
            var oExport = {
                mcpServer: sServerUrl,
                exportedAt: new Date().toISOString(),
                tools: aTools
            };
            
            var sJson = JSON.stringify(oExport, null, 2);
            var oBlob = new Blob([sJson], { type: "application/json" });
            var sUrl = URL.createObjectURL(oBlob);
            
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "mcp-tools-export.json";
            oLink.click();
            
            URL.revokeObjectURL(sUrl);
            MessageToast.show("Tools exported successfully");
        },
        
        
        /**
         * Format JSON for display
         */
        formatJSON: function (oValue) {
            if (!oValue) return "";
            try {
                return JSON.stringify(oValue, null, 2);
            } catch (e) {
                return String(oValue);
            }
        },
        
        /**
         * Navigate back
         */
        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("home");
        }
    });
});