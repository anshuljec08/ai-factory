sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
    "use strict";

    return UIComponent.extend("ai.factory.agentdesigner.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Set device model
            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            // Set app model with initial data
            var oAppModel = new JSONModel({
                agents: [],
                selectedAgent: null,
                isLoading: false,
                // Framework options for dropdowns (without "All")
                frameworks: [
                    { key: "default", text: "Default Agent" },
                    { key: "langgraph", text: "LangGraph" },
                    { key: "maf", text: "MAF (Microsoft Agent Framework)" },
                    { key: "crewai", text: "CrewAI" }
                ],
                // Framework filter options (with "All")
                frameworkFilters: [
                    { key: "", text: "All Frameworks" },
                    { key: "default", text: "Default" },
                    { key: "langgraph", text: "LangGraph" },
                    { key: "maf", text: "MAF" },
                    { key: "crewai", text: "CrewAI" }
                ],
                models: [
                    { key: "claude-4-sonnet", text: "Claude 4 Sonnet", provider: "Anthropic" },
                    { key: "claude-4-opus", text: "Claude 4 Opus", provider: "Anthropic" },
                    { key: "gpt-4o", text: "GPT-4o", provider: "OpenAI" },
                    { key: "gpt-4o-mini", text: "GPT-4o Mini", provider: "OpenAI" },
                    { key: "gemini-2.0-flash", text: "Gemini 2.0 Flash", provider: "Google" }
                ],
                // Status options for dropdowns (without "All")
                statuses: [
                    { key: "draft", text: "Draft" },
                    { key: "active", text: "Active" },
                    { key: "inactive", text: "Inactive" },
                    { key: "archived", text: "Archived" }
                ],
                // Status filter options (with "All")
                statusFilters: [
                    { key: "", text: "All Statuses" },
                    { key: "active", text: "Active" },
                    { key: "draft", text: "Draft" },
                    { key: "inactive", text: "Inactive" },
                    { key: "archived", text: "Archived" }
                ]
            });
            this.setModel(oAppModel);

            // Initialize the router
            this.getRouter().initialize();
        },

        /**
         * Get content density class based on device
         */
        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!sap.ui.Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        },

        /**
         * Get the API base URL
         * In local development, use the full URL to the API server
         * In production (BTP), use relative path through approuter
         */
        getApiBaseUrl: function () {
            // Check if running locally (UI5 serve on port 8080)
            if (window.location.port === "8080") {
                return "http://localhost:3001/api/v1";
            }
            // Production: use relative path through approuter
            return "/api/v1";
        },

        /**
         * Load agents from the registry
         */
        loadAgents: function () {
            var oModel = this.getModel();
            oModel.setProperty("/isLoading", true);

            return fetch(this.getApiBaseUrl() + "/agents")
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    oModel.setProperty("/agents", data.data || []);
                    oModel.setProperty("/isLoading", false);
                    return data.data;
                })
                .catch(function (error) {
                    console.error("Error loading agents:", error);
                    oModel.setProperty("/isLoading", false);
                    throw error;
                });
        },

        /**
         * Get a single agent by ID
         */
        getAgent: function (sAgentId) {
            return fetch(this.getApiBaseUrl() + "/agents/" + sAgentId)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Agent not found");
                    }
                    return response.json();
                })
                .then(function (data) {
                    return data.data;
                });
        },

        /**
         * Create a new agent
         */
        createAgent: function (oAgentData) {
            return fetch(this.getApiBaseUrl() + "/agents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oAgentData)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    return data.data;
                });
        },

        /**
         * Update an existing agent
         */
        updateAgent: function (sAgentId, oAgentData) {
            return fetch(this.getApiBaseUrl() + "/agents/" + sAgentId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oAgentData)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    return data.data;
                });
        },

        /**
         * Delete an agent
         */
        deleteAgent: function (sAgentId) {
            return fetch(this.getApiBaseUrl() + "/agents/" + sAgentId, {
                method: "DELETE"
            })
                .then(function (response) {
                    return response.json();
                });
        }
    });
});