sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Select",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/ui/core/Item"
], function (BaseController, JSONModel, MessageToast, MessageBox, Dialog, Button, Input, TextArea, Select, Label, VBox, Item) {
    "use strict";

    var TOOLS_STORAGE_KEY = "aifactory_tools";

    return BaseController.extend("ai.factory.controller.tools.ToolManager", {
        
        _sApiUrl: "/api/v1",
        
        onInit: function () {
            // Initialize tools model
            var oToolsModel = new JSONModel({
                tools: [],
                totalCount: 0,
                mcpCount: 0,
                apiCount: 0,
                customCount: 0,
                filteredCount: 0,
                selectedCount: 0,
                filterType: "all",
                filterStatus: "all"
            });
            this.getView().setModel(oToolsModel, "tools");
            
            // Store all tools for filtering
            this._aAllTools = [];
            
            // Load tools when view is displayed
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("toolManager").attachPatternMatched(this._onRouteMatched, this);
        },
        
        _onRouteMatched: function () {
            this._loadTools();
            this._checkPendingTools();
        },
        
        /**
         * Check for pending tools from MCP Builder
         */
        _checkPendingTools: function () {
            var sPendingTools = sessionStorage.getItem("aifactory_pending_tools");
            if (sPendingTools) {
                try {
                    var aPendingTools = JSON.parse(sPendingTools);
                    if (aPendingTools.length > 0) {
                        this._showImportPendingDialog(aPendingTools);
                    }
                } catch (e) {
                    console.error("Failed to parse pending tools:", e);
                }
            }
        },
        
        /**
         * Show dialog to import pending tools
         */
        _showImportPendingDialog: function (aPendingTools) {
            var that = this;
            
            MessageBox.confirm(
                "You have " + aPendingTools.length + " tools from MCP Builder ready to import. Would you like to add them now?",
                {
                    title: "Import Tools",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            that._importTools(aPendingTools);
                        }
                        // Clear pending tools
                        sessionStorage.removeItem("aifactory_pending_tools");
                    }
                }
            );
        },
        
        /**
         * Load tools from agents
         */
        _loadTools: function () {
            var that = this;
            var oModel = this.getView().getModel("tools");
            
            // Load tools from all agents
            fetch(this._sApiUrl + "/agents")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load agents");
                    }
                    return response.json();
                })
                .then(function (oData) {
                    var aAgents = oData.data || oData || [];
                    var aTools = that._extractToolsFromAgents(aAgents);
                    
                    // Also load locally stored tools
                    var aLocalTools = that._loadLocalTools();
                    
                    // Merge tools (avoid duplicates)
                    var oToolMap = {};
                    aTools.forEach(function (t) { oToolMap[t.id] = t; });
                    aLocalTools.forEach(function (t) { 
                        if (!oToolMap[t.id]) {
                            oToolMap[t.id] = t;
                        }
                    });
                    
                    var aMergedTools = Object.values(oToolMap);
                    that._aAllTools = aMergedTools;
                    
                    that._updateToolCounts(aMergedTools);
                    that._applyFilters();
                })
                .catch(function (error) {
                    console.error("Error loading tools:", error);
                    
                    // Load local tools as fallback
                    var aLocalTools = that._loadLocalTools();
                    that._aAllTools = aLocalTools;
                    that._updateToolCounts(aLocalTools);
                    that._applyFilters();
                });
        },
        
        /**
         * Extract tools from agents
         */
        _extractToolsFromAgents: function (aAgents) {
            var oToolMap = {};
            
            aAgents.forEach(function (oAgent) {
                if (oAgent.tools && oAgent.tools.length > 0) {
                    oAgent.tools.forEach(function (oTool) {
                        var sToolId = oTool.name || oTool.id;
                        if (!oToolMap[sToolId]) {
                            oToolMap[sToolId] = {
                                id: sToolId,
                                name: oTool.name,
                                type: oTool.type || "custom",
                                description: oTool.description || "",
                                enabled: oTool.enabled !== false,
                                config: oTool.config || {},
                                inputSchema: oTool.inputSchema || oTool.config?.inputSchema || {},
                                usedByAgents: [oAgent.id],
                                usedByCount: 1
                            };
                        } else {
                            // Tool already exists, add agent reference
                            if (!oToolMap[sToolId].usedByAgents.includes(oAgent.id)) {
                                oToolMap[sToolId].usedByAgents.push(oAgent.id);
                                oToolMap[sToolId].usedByCount++;
                            }
                        }
                    });
                }
            });
            
            return Object.values(oToolMap);
        },
        
        /**
         * Load locally stored tools
         */
        _loadLocalTools: function () {
            try {
                var sStored = localStorage.getItem(TOOLS_STORAGE_KEY);
                return sStored ? JSON.parse(sStored) : [];
            } catch (e) {
                return [];
            }
        },
        
        /**
         * Save tools to local storage
         */
        _saveLocalTools: function (aTools) {
            try {
                localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(aTools));
            } catch (e) {
                console.error("Failed to save tools:", e);
            }
        },
        
        /**
         * Update tool counts
         */
        _updateToolCounts: function (aTools) {
            var oModel = this.getView().getModel("tools");
            
            var iMcpCount = aTools.filter(function (t) { return t.type === "mcp"; }).length;
            var iApiCount = aTools.filter(function (t) { return t.type === "api"; }).length;
            var iCustomCount = aTools.filter(function (t) { return t.type === "custom"; }).length;
            
            oModel.setProperty("/totalCount", aTools.length);
            oModel.setProperty("/mcpCount", iMcpCount);
            oModel.setProperty("/apiCount", iApiCount);
            oModel.setProperty("/customCount", iCustomCount);
        },
        
        /**
         * Apply filters
         */
        _applyFilters: function () {
            var oModel = this.getView().getModel("tools");
            var sTypeFilter = oModel.getProperty("/filterType");
            var sStatusFilter = oModel.getProperty("/filterStatus");
            var sSearchQuery = this.byId("toolSearchField")?.getValue() || "";
            
            var aFiltered = this._aAllTools.filter(function (oTool) {
                // Type filter
                if (sTypeFilter !== "all" && oTool.type !== sTypeFilter) {
                    return false;
                }
                
                // Status filter
                if (sStatusFilter === "enabled" && !oTool.enabled) {
                    return false;
                }
                if (sStatusFilter === "disabled" && oTool.enabled) {
                    return false;
                }
                
                // Search filter
                if (sSearchQuery) {
                    var sLower = sSearchQuery.toLowerCase();
                    if (!oTool.name.toLowerCase().includes(sLower) &&
                        !(oTool.description && oTool.description.toLowerCase().includes(sLower))) {
                        return false;
                    }
                }
                
                return true;
            });
            
            oModel.setProperty("/tools", aFiltered);
            oModel.setProperty("/filteredCount", aFiltered.length);
        },
        
        /**
         * Refresh tools
         */
        onRefresh: function () {
            this._loadTools();
            MessageToast.show("Tools refreshed");
        },
        
        /**
         * Search tools
         */
        onSearchTools: function () {
            this._applyFilters();
        },
        
        /**
         * Filter change
         */
        onFilterChange: function () {
            this._applyFilters();
        },
        
        /**
         * Tool selection change
         */
        onToolSelectionChange: function () {
            var oTable = this.byId("toolsTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("tools");
            
            oModel.setProperty("/selectedCount", aSelectedItems.length);
        },
        
        /**
         * Create new tool
         */
        onCreateTool: function () {
            this._showToolDialog(null);
        },
        
        /**
         * Edit tool
         */
        onEditTool: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("tools");
            var oTool = oContext.getObject();
            this._showToolDialog(oTool);
        },
        
        /**
         * Show tool dialog
         */
        _showToolDialog: function (oTool) {
            var that = this;
            var bIsEdit = !!oTool;
            
            var oNameInput = new Input({
                value: bIsEdit ? oTool.name : "",
                placeholder: "Tool name (e.g., get-orders)"
            });
            
            var oTypeSelect = new Select({
                selectedKey: bIsEdit ? oTool.type : "custom",
                items: [
                    new Item({ key: "mcp", text: "MCP Tool" }),
                    new Item({ key: "api", text: "API Tool" }),
                    new Item({ key: "custom", text: "Custom Tool" })
                ]
            });
            
            var oDescInput = new TextArea({
                value: bIsEdit ? oTool.description : "",
                placeholder: "Tool description",
                rows: 3,
                width: "100%"
            });
            
            var oSchemaInput = new TextArea({
                value: bIsEdit ? JSON.stringify(oTool.inputSchema || {}, null, 2) : "{}",
                placeholder: "Input schema (JSON)",
                rows: 8,
                width: "100%"
            });
            
            var oDialog = new Dialog({
                title: bIsEdit ? "Edit Tool" : "Create Tool",
                contentWidth: "500px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Name", required: true }),
                            oNameInput,
                            new Label({ text: "Type", class: "sapUiSmallMarginTop" }),
                            oTypeSelect,
                            new Label({ text: "Description", class: "sapUiSmallMarginTop" }),
                            oDescInput,
                            new Label({ text: "Input Schema (JSON)", class: "sapUiSmallMarginTop" }),
                            oSchemaInput
                        ]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: bIsEdit ? "Save" : "Create",
                    type: "Emphasized",
                    press: function () {
                        var sName = oNameInput.getValue().trim();
                        if (!sName) {
                            MessageToast.show("Name is required");
                            return;
                        }
                        
                        var oInputSchema;
                        try {
                            oInputSchema = JSON.parse(oSchemaInput.getValue());
                        } catch (e) {
                            MessageBox.error("Invalid JSON in input schema");
                            return;
                        }
                        
                        var oNewTool = {
                            id: bIsEdit ? oTool.id : sName.toLowerCase().replace(/\s+/g, "-"),
                            name: sName,
                            type: oTypeSelect.getSelectedKey(),
                            description: oDescInput.getValue(),
                            enabled: bIsEdit ? oTool.enabled : true,
                            inputSchema: oInputSchema,
                            usedByAgents: bIsEdit ? oTool.usedByAgents : [],
                            usedByCount: bIsEdit ? oTool.usedByCount : 0
                        };
                        
                        if (bIsEdit) {
                            that._updateTool(oNewTool);
                        } else {
                            that._addTool(oNewTool);
                        }
                        
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            
            oDialog.open();
        },
        
        /**
         * Add new tool
         */
        _addTool: function (oTool) {
            // Check if tool already exists
            var bExists = this._aAllTools.some(function (t) { return t.id === oTool.id; });
            if (bExists) {
                MessageBox.error("A tool with this name already exists");
                return;
            }
            
            this._aAllTools.push(oTool);
            this._saveLocalTools(this._aAllTools);
            this._updateToolCounts(this._aAllTools);
            this._applyFilters();
            
            MessageToast.show("Tool created: " + oTool.name);
        },
        
        /**
         * Update existing tool
         */
        _updateTool: function (oTool) {
            var iIndex = this._aAllTools.findIndex(function (t) { return t.id === oTool.id; });
            if (iIndex >= 0) {
                this._aAllTools[iIndex] = oTool;
                this._saveLocalTools(this._aAllTools);
                this._applyFilters();
                
                MessageToast.show("Tool updated: " + oTool.name);
            }
        },
        
        /**
         * Duplicate tool
         */
        onDuplicateTool: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("tools");
            var oTool = oContext.getObject();
            
            var oNewTool = JSON.parse(JSON.stringify(oTool));
            oNewTool.id = oTool.id + "-copy";
            oNewTool.name = oTool.name + " (Copy)";
            oNewTool.usedByAgents = [];
            oNewTool.usedByCount = 0;
            
            this._addTool(oNewTool);
        },
        
        /**
         * Delete tool
         */
        onDeleteTool: function (oEvent) {
            var that = this;
            var oContext = oEvent.getSource().getBindingContext("tools");
            var oTool = oContext.getObject();
            
            MessageBox.confirm(
                "Delete tool '" + oTool.name + "'?\n\nThis tool is used by " + oTool.usedByCount + " agent(s).",
                {
                    title: "Delete Tool",
                    actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.DELETE,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.DELETE) {
                            that._deleteTool(oTool.id);
                        }
                    }
                }
            );
        },
        
        /**
         * Delete tool by ID
         */
        _deleteTool: function (sToolId) {
            this._aAllTools = this._aAllTools.filter(function (t) { return t.id !== sToolId; });
            this._saveLocalTools(this._aAllTools);
            this._updateToolCounts(this._aAllTools);
            this._applyFilters();
            
            MessageToast.show("Tool deleted");
        },
        
        /**
         * Delete selected tools
         */
        onDeleteSelected: function () {
            var that = this;
            var oTable = this.byId("toolsTable");
            var aSelectedItems = oTable.getSelectedItems();
            
            if (aSelectedItems.length === 0) {
                MessageToast.show("No tools selected");
                return;
            }
            
            MessageBox.confirm(
                "Delete " + aSelectedItems.length + " selected tool(s)?",
                {
                    title: "Delete Tools",
                    actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.DELETE,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.DELETE) {
                            var aToolIds = aSelectedItems.map(function (oItem) {
                                return oItem.getBindingContext("tools").getObject().id;
                            });
                            
                            that._aAllTools = that._aAllTools.filter(function (t) {
                                return !aToolIds.includes(t.id);
                            });
                            
                            that._saveLocalTools(that._aAllTools);
                            that._updateToolCounts(that._aAllTools);
                            that._applyFilters();
                            
                            oTable.removeSelections();
                            that.getView().getModel("tools").setProperty("/selectedCount", 0);
                            
                            MessageToast.show(aToolIds.length + " tool(s) deleted");
                        }
                    }
                }
            );
        },
        
        /**
         * Enable selected tools
         */
        onEnableSelected: function () {
            this._setSelectedToolsStatus(true);
        },
        
        /**
         * Disable selected tools
         */
        onDisableSelected: function () {
            this._setSelectedToolsStatus(false);
        },
        
        /**
         * Set status for selected tools
         */
        _setSelectedToolsStatus: function (bEnabled) {
            var oTable = this.byId("toolsTable");
            var aSelectedItems = oTable.getSelectedItems();
            
            aSelectedItems.forEach(function (oItem) {
                var oTool = oItem.getBindingContext("tools").getObject();
                oTool.enabled = bEnabled;
            });
            
            this._saveLocalTools(this._aAllTools);
            this._applyFilters();
            
            MessageToast.show(aSelectedItems.length + " tool(s) " + (bEnabled ? "enabled" : "disabled"));
        },
        
        /**
         * Tool status change
         */
        onToolStatusChange: function (oEvent) {
            var bState = oEvent.getParameter("state");
            var oContext = oEvent.getSource().getBindingContext("tools");
            var oTool = oContext.getObject();
            
            oTool.enabled = bState;
            this._saveLocalTools(this._aAllTools);
            
            MessageToast.show("Tool " + (bState ? "enabled" : "disabled") + ": " + oTool.name);
        },
        
        /**
         * Test tool
         */
        onTestTool: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("tools");
            var oTool = oContext.getObject();
            
            // Navigate to MCP Builder with tool selected
            MessageToast.show("Navigate to MCP Builder to test tool: " + oTool.name);
            this.getOwnerComponent().getRouter().navTo("mcpBuilder");
        },
        
        /**
         * Export tools
         */
        onExportTools: function () {
            var oModel = this.getView().getModel("tools");
            var aTools = oModel.getProperty("/tools");
            
            var oExport = {
                exportedAt: new Date().toISOString(),
                toolCount: aTools.length,
                tools: aTools
            };
            
            var sJson = JSON.stringify(oExport, null, 2);
            var oBlob = new Blob([sJson], { type: "application/json" });
            var sUrl = URL.createObjectURL(oBlob);
            
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "tools-export.json";
            oLink.click();
            
            URL.revokeObjectURL(sUrl);
            MessageToast.show("Tools exported successfully");
        },
        
        /**
         * Import tools
         */
        onImportTools: function () {
            var that = this;
            
            var oFileInput = document.createElement("input");
            oFileInput.type = "file";
            oFileInput.accept = ".json";
            oFileInput.onchange = function (oEvent) {
                var oFile = oEvent.target.files[0];
                if (oFile) {
                    var oReader = new FileReader();
                    oReader.onload = function (e) {
                        try {
                            var oData = JSON.parse(e.target.result);
                            var aTools = oData.tools || oData;
                            if (Array.isArray(aTools)) {
                                that._importTools(aTools);
                            } else {
                                MessageBox.error("Invalid tools file format");
                            }
                        } catch (err) {
                            MessageBox.error("Failed to parse file: " + err.message);
                        }
                    };
                    oReader.readAsText(oFile);
                }
            };
            oFileInput.click();
        },
        
        /**
         * Import tools array
         */
        _importTools: function (aTools) {
            var iImported = 0;
            var that = this;
            
            aTools.forEach(function (oTool) {
                var bExists = that._aAllTools.some(function (t) { return t.id === oTool.id || t.name === oTool.name; });
                if (!bExists) {
                    that._aAllTools.push({
                        id: oTool.id || oTool.name.toLowerCase().replace(/\s+/g, "-"),
                        name: oTool.name,
                        type: oTool.type || "custom",
                        description: oTool.description || "",
                        enabled: oTool.enabled !== false,
                        inputSchema: oTool.inputSchema || oTool.config?.inputSchema || {},
                        config: oTool.config || {},
                        usedByAgents: [],
                        usedByCount: 0
                    });
                    iImported++;
                }
            });
            
            this._saveLocalTools(this._aAllTools);
            this._updateToolCounts(this._aAllTools);
            this._applyFilters();
            
            MessageToast.show(iImported + " tool(s) imported");
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