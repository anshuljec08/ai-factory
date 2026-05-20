sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/ui/core/Item",
    "ai/factory/util/Constants"
], function (BaseController, JSONModel, MessageToast, MessageBox, Dialog, Button, Input, Select, Label, VBox, List, StandardListItem, Item, Constants) {
    "use strict";

    return BaseController.extend("ai.factory.controller.tools.ToolManager", {

        onInit: function () {
            var oToolsModel = new JSONModel({
                tools: [],
                totalCount: 0,
                mcpCount: 0,
                apiCount: 0,
                otherCount: 0,
                filteredCount: 0,
                selectedCount: 0,
                filterType: "all",
                filterStatus: "all"
            });
            this.getView().setModel(oToolsModel, "tools");

            this._aAllTools = [];
            this._oAgentUsage = {};

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("toolManager").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadTools();
        },

        _loadTools: function () {
            var that = this;

            Promise.all([
                fetch(Constants.TOOLS_API_URL).then(function (r) { return r.json(); }),
                fetch(Constants.AGENTS_API_URL).then(function (r) { return r.json(); })
            ]).then(function (aResults) {
                var aTools = aResults[0].data || [];
                var aAgents = aResults[1].data || [];

                that._oAgentUsage = that._computeAgentUsage(aAgents);

                aTools.forEach(function (oTool) {
                    oTool.usedByCount = (that._oAgentUsage[oTool.id] || []).length;
                });

                that._aAllTools = aTools;
                that._updateToolCounts(aTools);
                that._applyFilters();
            }).catch(function (error) {
                console.error("[ToolManager] Failed to load tools:", error);
                MessageToast.show("Failed to load tools");
            });
        },

        _computeAgentUsage: function (aAgents) {
            var oUsage = {};
            aAgents.forEach(function (oAgent) {
                var aToolIds = oAgent.tools || [];
                aToolIds.forEach(function (sToolId) {
                    if (typeof sToolId === "string") {
                        if (!oUsage[sToolId]) { oUsage[sToolId] = []; }
                        oUsage[sToolId].push(oAgent.id);
                    }
                });
            });
            return oUsage;
        },

        _updateToolCounts: function (aTools) {
            var oModel = this.getView().getModel("tools");
            var iMcp = 0, iApi = 0, iOther = 0;
            aTools.forEach(function (t) {
                if (t.type === "mcp") { iMcp++; }
                else if (t.type === "api") { iApi++; }
                else { iOther++; }
            });
            oModel.setProperty("/totalCount", aTools.length);
            oModel.setProperty("/mcpCount", iMcp);
            oModel.setProperty("/apiCount", iApi);
            oModel.setProperty("/otherCount", iOther);
        },

        _applyFilters: function () {
            var oModel = this.getView().getModel("tools");
            var sTypeFilter = oModel.getProperty("/filterType");
            var sStatusFilter = oModel.getProperty("/filterStatus");
            var oSearchField = this.byId("toolSearchField");
            var sSearchQuery = oSearchField ? oSearchField.getValue() : "";

            var aFiltered = this._aAllTools.filter(function (oTool) {
                if (sTypeFilter !== "all" && oTool.type !== sTypeFilter) return false;
                if (sStatusFilter === "enabled" && !oTool.enabled) return false;
                if (sStatusFilter === "disabled" && oTool.enabled) return false;
                if (sSearchQuery) {
                    var sLower = sSearchQuery.toLowerCase();
                    if (!oTool.name.toLowerCase().includes(sLower) &&
                        !oTool.id.toLowerCase().includes(sLower) &&
                        !(oTool.description && oTool.description.toLowerCase().includes(sLower))) {
                        return false;
                    }
                }
                return true;
            });

            oModel.setProperty("/tools", aFiltered);
            oModel.setProperty("/filteredCount", aFiltered.length);
        },

        onRefresh: function () {
            this._loadTools();
            MessageToast.show("Tools refreshed");
        },

        onSearchTools: function () {
            this._applyFilters();
        },

        onFilterChange: function () {
            this._applyFilters();
        },

        onToolSelectionChange: function () {
            var oTable = this.byId("toolsTable");
            var oModel = this.getView().getModel("tools");
            oModel.setProperty("/selectedCount", oTable.getSelectedItems().length);
        },

        onEditTool: function (oEvent) {
            var oTool = oEvent.getSource().getBindingContext("tools").getObject();
            this._showToolDialog(oTool);
        },

        _showToolDialog: function (oTool) {
            var that = this;

            var oNameInput = new Input({
                value: oTool.name,
                placeholder: "e.g. SAP Digital Manufacturing",
                width: "100%"
            });

            var oIdInput = new Input({
                value: oTool.id,
                width: "100%",
                editable: false
            });

            var oTypeSelect = new Select({
                selectedKey: oTool.type,
                width: "100%",
                items: [
                    new Item({ key: "mcp", text: "MCP Server" }),
                    new Item({ key: "api", text: "REST API" }),
                    new Item({ key: "custom", text: "Custom" })
                ]
            });

            var oUrlInput = new Input({
                value: oTool.config && oTool.config.mcpUrl || "",
                placeholder: "https://your-mcp-server.com/mcp",
                width: "100%"
            });

            var oDescInput = new Input({
                value: oTool.description || "",
                placeholder: "Brief description of what this tool provides",
                width: "100%"
            });

            var aExistingFunctions = (oTool.functionFilter && oTool.functionFilter.functions) || [];

            var oFilterSelect = new Select({
                selectedKey: oTool.functionFilter && oTool.functionFilter.mode || "all",
                width: "100%",
                items: [
                    new Item({ key: "all", text: "All functions (no filter)" }),
                    new Item({ key: "include", text: "Include only listed" }),
                    new Item({ key: "exclude", text: "Exclude listed" })
                ],
                change: function () {
                    var bShowList = oFilterSelect.getSelectedKey() !== "all";
                    oFunctionListContainer.setVisible(bShowList);
                    if (bShowList && oFunctionList.getItems().length === 0) {
                        that._discoverFunctionsForDialog(oTool.id, oUrlInput.getValue().trim(), oFunctionList, aExistingFunctions);
                    }
                }
            });

            var oFunctionList = new List({
                mode: "MultiSelect",
                noDataText: "Click 'Discover' to load functions",
                growing: false
            });

            var oDiscoverBtn = new Button({
                text: "Discover Functions",
                icon: "sap-icon://refresh",
                press: function () {
                    that._discoverFunctionsForDialog(oTool.id, oUrlInput.getValue().trim(), oFunctionList, aExistingFunctions);
                }
            });

            var oFunctionListContainer = new VBox({
                visible: oTool.functionFilter && oTool.functionFilter.mode !== "all",
                items: [
                    oDiscoverBtn,
                    oFunctionList
                ]
            }).addStyleClass("sapUiTinyMarginTop");

            // Auto-load functions if active filter exists
            if (oTool.functionFilter && oTool.functionFilter.mode !== "all") {
                setTimeout(function () {
                    that._discoverFunctionsForDialog(oTool.id, null, oFunctionList, aExistingFunctions);
                }, 300);
            }

            var oDialog = new Dialog({
                title: "Edit Tool: " + oTool.name,
                contentWidth: "550px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Name", required: true }),
                            oNameInput,
                            new Label({ text: "ID", class: "sapUiSmallMarginTop" }),
                            oIdInput,
                            new Label({ text: "Type", class: "sapUiSmallMarginTop" }),
                            oTypeSelect,
                            new Label({ text: "Endpoint URL", class: "sapUiSmallMarginTop" }),
                            oUrlInput,
                            new Label({ text: "Description", class: "sapUiSmallMarginTop" }),
                            oDescInput,
                            new Label({ text: "Function Filter", class: "sapUiSmallMarginTop" }),
                            oFilterSelect,
                            oFunctionListContainer
                        ]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: "Save",
                    type: "Emphasized",
                    press: function () {
                        var sName = oNameInput.getValue().trim();
                        if (!sName) {
                            MessageToast.show("Name is required");
                            return;
                        }

                        var sFilterMode = oFilterSelect.getSelectedKey();
                        var aFilterFunctions = [];
                        if (sFilterMode !== "all") {
                            aFilterFunctions = oFunctionList.getSelectedItems().map(function (oItem) {
                                return oItem.getTitle();
                            });
                        }

                        var oToolData = {
                            id: oTool.id,
                            name: sName,
                            type: oTypeSelect.getSelectedKey(),
                            description: oDescInput.getValue().trim(),
                            config: {
                                mcpUrl: oUrlInput.getValue().trim(),
                                authType: oTool.config ? oTool.config.authType || "none" : "none",
                                authConfig: oTool.config ? oTool.config.authConfig : undefined
                            },
                            functionFilter: {
                                mode: sFilterMode,
                                functions: sFilterMode !== "all" ? aFilterFunctions : undefined
                            },
                            enabled: oTool.enabled
                        };

                        that._updateTool(oTool.id, oToolData);
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });

            oDialog.open();
        },

        _discoverFunctionsForDialog: function (sToolId, sMcpUrl, oFunctionList, aPreSelected) {
            oFunctionList.setBusy(true);
            oFunctionList.removeAllItems();

            var sUrl;
            if (sToolId) {
                sUrl = Constants.TOOLS_API_URL + "/" + encodeURIComponent(sToolId) + "/functions?raw=true";
            } else if (sMcpUrl) {
                sUrl = Constants.TOOLS_API_URL + "/discover?mcpUrl=" + encodeURIComponent(sMcpUrl);
            } else {
                oFunctionList.setBusy(false);
                MessageToast.show("Save the tool first or provide an endpoint URL");
                return;
            }

            fetch(sUrl)
                .then(function (r) { return r.json(); })
                .then(function (oData) {
                    oFunctionList.setBusy(false);
                    var aFunctions = (oData.data && oData.data.functions) || [];
                    if (aFunctions.length === 0) {
                        oFunctionList.setNoDataText("No functions found");
                        return;
                    }
                    aFunctions.forEach(function (oFunc) {
                        var sName = oFunc.name || oFunc;
                        var sDesc = oFunc.description || "";
                        var oItem = new StandardListItem({
                            title: sName,
                            description: sDesc.substring(0, 80),
                            selected: aPreSelected.indexOf(sName) !== -1
                        });
                        oFunctionList.addItem(oItem);
                    });
                })
                .catch(function (err) {
                    oFunctionList.setBusy(false);
                    oFunctionList.setNoDataText("Failed to discover: " + err.message);
                });
        },

        _updateTool: function (sId, oToolData) {
            var that = this;
            jQuery.ajax({
                url: Constants.TOOLS_API_URL + "/" + encodeURIComponent(sId),
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(oToolData),
                success: function () {
                    MessageToast.show("Tool updated: " + oToolData.name);
                    that._loadTools();
                },
                error: function (jqXHR) {
                    var sMsg = "Failed to update tool";
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        sMsg = jqXHR.responseJSON.error.message || sMsg;
                    }
                    MessageBox.error(sMsg);
                }
            });
        },

        onDeleteTool: function (oEvent) {
            var that = this;
            var oTool = oEvent.getSource().getBindingContext("tools").getObject();
            var aAgents = this._oAgentUsage[oTool.id] || [];

            var sMsg = "Delete tool '" + oTool.name + "'?";
            if (aAgents.length > 0) {
                sMsg += "\n\nUsed by " + aAgents.length + " agent(s): " + aAgents.join(", ");
            }

            MessageBox.confirm(sMsg, {
                title: "Delete Tool",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.DELETE) {
                        that._deleteTool(oTool.id);
                    }
                }
            });
        },

        _deleteTool: function (sId) {
            var that = this;
            jQuery.ajax({
                url: Constants.TOOLS_API_URL + "/" + encodeURIComponent(sId),
                method: "DELETE",
                success: function () {
                    MessageToast.show("Tool deleted");
                    that._loadTools();
                },
                error: function (jqXHR) {
                    var sMsg = "Failed to delete tool";
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        sMsg = jqXHR.responseJSON.error.message || sMsg;
                    }
                    MessageBox.error(sMsg);
                }
            });
        },

        onDeleteSelected: function () {
            var that = this;
            var oTable = this.byId("toolsTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageToast.show("No tools selected");
                return;
            }

            MessageBox.confirm("Delete " + aSelectedItems.length + " selected tool(s)?", {
                title: "Delete Tools",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.DELETE) {
                        var aToolIds = aSelectedItems.map(function (oItem) {
                            return oItem.getBindingContext("tools").getObject().id;
                        });
                        var aDeletes = aToolIds.map(function (sId) {
                            return new Promise(function (resolve) {
                                jQuery.ajax({
                                    url: Constants.TOOLS_API_URL + "/" + encodeURIComponent(sId),
                                    method: "DELETE",
                                    success: function () { resolve(true); },
                                    error: function () { resolve(false); }
                                });
                            });
                        });
                        Promise.all(aDeletes).then(function () {
                            oTable.removeSelections();
                            that.getView().getModel("tools").setProperty("/selectedCount", 0);
                            that._loadTools();
                            MessageToast.show(aToolIds.length + " tool(s) deleted");
                        });
                    }
                }
            });
        },

        onToolStatusChange: function (oEvent) {
            var bState = oEvent.getParameter("state");
            var oTool = oEvent.getSource().getBindingContext("tools").getObject();

            jQuery.ajax({
                url: Constants.TOOLS_API_URL + "/" + encodeURIComponent(oTool.id),
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify({ enabled: bState }),
                success: function () {
                    MessageToast.show("Tool " + (bState ? "enabled" : "disabled") + ": " + oTool.name);
                },
                error: function () {
                    MessageToast.show("Failed to update tool status");
                }
            });
        },

        onTestConnection: function (oEvent) {
            var oTool = oEvent.getSource().getBindingContext("tools").getObject();

            if (oTool.type !== "mcp") {
                MessageToast.show("Connection test only available for MCP tools");
                return;
            }

            var oBtn = oEvent.getSource();
            oBtn.setBusy(true);

            jQuery.ajax({
                url: Constants.TOOLS_API_URL + "/" + encodeURIComponent(oTool.id) + "/functions",
                method: "GET",
                success: function (oResponse) {
                    oBtn.setBusy(false);
                    var iCount = oResponse.data ? oResponse.data.count : 0;
                    var bFiltered = oResponse.data ? oResponse.data.filterApplied : false;
                    MessageBox.success(
                        "Connection successful!\n\n" +
                        "Functions discovered: " + iCount +
                        (bFiltered ? " (filter applied)" : ""),
                        { title: "Test: " + oTool.name }
                    );
                },
                error: function (jqXHR) {
                    oBtn.setBusy(false);
                    var sMsg = "Connection failed";
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        sMsg = jqXHR.responseJSON.error.message || sMsg;
                    }
                    MessageBox.error(sMsg, { title: "Test: " + oTool.name });
                }
            });
        },

        onNavigateToBuilder: function (oEvent) {
            var sRoute = oEvent.getSource().data("route");
            this.getOwnerComponent().getRouter().navTo(sRoute);
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("home");
        }
    });
});
