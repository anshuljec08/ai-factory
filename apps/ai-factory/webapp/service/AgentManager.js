sap.ui.define([
    "ai/factory/util/Constants"
], function (Constants) {
    "use strict";

    var AGENTS = [];
    var AGENTS_LOADED = false;

    var AgentManager = {

        getAgents: function () {
            return AGENTS;
        },

        isLoaded: function () {
            return AGENTS_LOADED;
        },

        getAgentById: function (sAgentId) {
            for (var i = 0; i < AGENTS.length; i++) {
                if (AGENTS[i].id === sAgentId) {
                    return AGENTS[i];
                }
            }
            return AGENTS[0] || null;
        },

        loadAgentsConfig: function (fnCallback) {
            var sAgentsUrl = sap.ui.require.toUrl("ai/factory/models/agents.json");

            jQuery.ajax({
                url: sAgentsUrl,
                method: "GET",
                dataType: "json",
                success: function (oResponse) {
                    if (oResponse && oResponse.agents && Array.isArray(oResponse.agents)) {
                        AGENTS = oResponse.agents;
                        console.log("[Chatbot] Loaded agents from JSON:", AGENTS.length);
                        AgentManager.mergeCustomAgents();
                        AGENTS_LOADED = true;
                        if (fnCallback) fnCallback();
                    }
                },
                error: function (oError) {
                    console.warn("[Chatbot] Failed to load agents.json, using defaults:", oError);
                    AGENTS = [
                        {
                            id: "production",
                            name: "Production Agent",
                            description: "SAP Digital Manufacturing assistant for orders, SFCs, and production data",
                            mcpUrl: "https://sapdme-order-mcp-wacky-fox-bm.cfapps.eu10-004.hana.ondemand.com/mcp",
                            maxSteps: 30,
                            systemPrompt: "You are an AI assistant for SAP Digital Manufacturing (SAP DM). You help production operators and managers with order management, production status, and shop floor operations.",
                            authType: "none",
                            authConfig: {},
                            isDefault: true,
                            isEditable: false
                        },
                        {
                            id: "general",
                            name: "General Assistant",
                            description: "General purpose AI assistant without specialized tools",
                            mcpUrl: "",
                            maxSteps: 10,
                            systemPrompt: "You are a helpful AI assistant. Answer questions clearly and concisely.",
                            authType: "none",
                            authConfig: {},
                            isDefault: false,
                            isEditable: false
                        }
                    ];
                    AgentManager.mergeCustomAgents();
                    AGENTS_LOADED = true;
                    if (fnCallback) fnCallback();
                }
            });
        },

        mergeCustomAgents: function () {
            try {
                var sCustomAgents = localStorage.getItem(Constants.CUSTOM_AGENTS_KEY);
                if (sCustomAgents) {
                    var aCustomAgents = JSON.parse(sCustomAgents);
                    if (Array.isArray(aCustomAgents)) {
                        for (var i = 0; i < aCustomAgents.length; i++) {
                            aCustomAgents[i].isEditable = true;
                            aCustomAgents[i].isCustom = true;
                            AGENTS.push(aCustomAgents[i]);
                        }
                        console.log("[Chatbot] Merged custom agents:", aCustomAgents.length);
                    }
                }
            } catch (e) {
                console.warn("[Chatbot] Error loading custom agents:", e);
            }
        },

        saveCustomAgents: function () {
            try {
                var aCustomAgents = AGENTS.filter(function (agent) {
                    return agent.isCustom === true;
                });
                localStorage.setItem(Constants.CUSTOM_AGENTS_KEY, JSON.stringify(aCustomAgents));
                console.log("[Chatbot] Saved custom agents:", aCustomAgents.length);
            } catch (e) {
                console.warn("[Chatbot] Error saving custom agents:", e);
            }
        },

        restoreSelectedAgent: function () {
            try {
                var sSavedAgent = sessionStorage.getItem(Constants.AGENT_STORAGE_KEY);
                if (sSavedAgent) {
                    var oAgent = AgentManager.getAgentById(sSavedAgent);
                    if (oAgent) {
                        console.log("[Chatbot] Restored selected agent:", sSavedAgent);
                        return sSavedAgent;
                    }
                }
            } catch (e) {
                console.warn("[Chatbot] Error restoring selected agent:", e);
            }
            return Constants.DEFAULT_AGENT;
        },

        saveSelectedAgent: function (sAgentId) {
            try {
                sessionStorage.setItem(Constants.AGENT_STORAGE_KEY, sAgentId);
                console.log("[Chatbot] Saved selected agent:", sAgentId);
            } catch (e) {
                console.warn("[Chatbot] Error saving selected agent:", e);
            }
        },

        addAgent: function (oAgentData) {
            var sNewId = "custom_" + Date.now();
            var oNewAgent = {
                id: sNewId,
                name: oAgentData.name,
                description: oAgentData.description || "Custom agent",
                mcpUrl: oAgentData.mcpUrl || "",
                maxSteps: oAgentData.maxSteps || 30,
                systemPrompt: oAgentData.systemPrompt,
                authType: oAgentData.authType || "none",
                authConfig: oAgentData.authConfig || {},
                isDefault: false,
                isEditable: true,
                isCustom: true
            };
            AGENTS.push(oNewAgent);
            AgentManager.saveCustomAgents();
            return oNewAgent;
        },

        updateAgent: function (sAgentId, oAgentData) {
            var oAgent = AgentManager.getAgentById(sAgentId);
            if (oAgent && oAgent.isEditable !== false) {
                oAgent.name = oAgentData.name;
                oAgent.description = oAgentData.description;
                oAgent.mcpUrl = oAgentData.mcpUrl;
                oAgent.maxSteps = oAgentData.maxSteps;
                oAgent.systemPrompt = oAgentData.systemPrompt;
                oAgent.authType = oAgentData.authType || "none";
                oAgent.authConfig = oAgentData.authConfig || {};
                AgentManager.saveCustomAgents();
                return true;
            }
            return false;
        },

        deleteAgent: function (sAgentId) {
            var oAgent = AgentManager.getAgentById(sAgentId);
            if (!oAgent || !oAgent.isCustom) {
                return false;
            }
            AGENTS = AGENTS.filter(function (a) {
                return a.id !== sAgentId;
            });
            AgentManager.saveCustomAgents();
            return true;
        },

        copyAgent: function (sAgentId) {
            var oAgent = AgentManager.getAgentById(sAgentId);
            if (!oAgent) return null;

            var sNewId = "copy_" + Date.now();
            var oCopiedAgent = {
                id: sNewId,
                name: oAgent.name + " (Copy)",
                description: oAgent.description || "",
                mcpUrl: oAgent.mcpUrl || "",
                maxSteps: oAgent.maxSteps || 30,
                maxResultChars: oAgent.maxResultChars || 40000,
                maxRecords: oAgent.maxRecords || 50,
                systemPrompt: oAgent.systemPrompt,
                authType: oAgent.authType || "none",
                authConfig: JSON.parse(JSON.stringify(oAgent.authConfig || {})),
                isDefault: false,
                isEditable: true,
                isCustom: true
            };
            AGENTS.push(oCopiedAgent);
            AgentManager.saveCustomAgents();
            return oCopiedAgent;
        },

        exportAgents: function () {
            var oExportData = {
                exportDate: new Date().toISOString(),
                version: "1.0",
                agents: AGENTS.map(function (agent) {
                    return {
                        id: agent.id,
                        name: agent.name,
                        description: agent.description,
                        mcpUrl: agent.mcpUrl,
                        maxSteps: agent.maxSteps,
                        maxResultChars: agent.maxResultChars || 40000,
                        maxRecords: agent.maxRecords || 50,
                        systemPrompt: agent.systemPrompt,
                        authType: agent.authType || "none",
                        authConfig: agent.authConfig || {},
                        isDefault: agent.isDefault || false,
                        isEditable: agent.isEditable !== false,
                        isCustom: agent.isCustom || false
                    };
                })
            };

            var sJson = JSON.stringify(oExportData, null, 2);
            var oBlob = new Blob([sJson], { type: "application/json" });
            var sFilename = "agents_export_" + new Date().toISOString().split('T')[0] + ".json";

            var oLink = document.createElement("a");
            oLink.href = URL.createObjectURL(oBlob);
            oLink.download = sFilename;
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
            URL.revokeObjectURL(oLink.href);

            return AGENTS.length;
        },

        processImportFile: function (oFile, fnCallback) {
            var oReader = new FileReader();

            oReader.onload = function (oEvent) {
                try {
                    var sContent = oEvent.target.result;
                    var oImportData = JSON.parse(sContent);

                    if (!oImportData.agents || !Array.isArray(oImportData.agents)) {
                        fnCallback({ error: "Invalid file format: missing agents array" });
                        return;
                    }

                    var iImported = 0, iUpdated = 0, iSkipped = 0;

                    for (var i = 0; i < oImportData.agents.length; i++) {
                        var oImportAgent = oImportData.agents[i];

                        if (!oImportAgent.name || !oImportAgent.systemPrompt) {
                            iSkipped++;
                            continue;
                        }

                        var oExisting = AgentManager.getAgentById(oImportAgent.id);

                        if (oExisting) {
                            if (oExisting.isCustom) {
                                oExisting.name = oImportAgent.name;
                                oExisting.description = oImportAgent.description || "";
                                oExisting.mcpUrl = oImportAgent.mcpUrl || "";
                                oExisting.maxSteps = oImportAgent.maxSteps || 30;
                                oExisting.maxResultChars = oImportAgent.maxResultChars || 40000;
                                oExisting.maxRecords = oImportAgent.maxRecords || 50;
                                oExisting.systemPrompt = oImportAgent.systemPrompt;
                                oExisting.authType = oImportAgent.authType || "none";
                                oExisting.authConfig = oImportAgent.authConfig || {};
                                iUpdated++;
                            } else {
                                iSkipped++;
                            }
                        } else {
                            AGENTS.push({
                                id: oImportAgent.id || "imported_" + Date.now() + "_" + i,
                                name: oImportAgent.name,
                                description: oImportAgent.description || "Imported agent",
                                mcpUrl: oImportAgent.mcpUrl || "",
                                maxSteps: oImportAgent.maxSteps || 30,
                                maxResultChars: oImportAgent.maxResultChars || 40000,
                                maxRecords: oImportAgent.maxRecords || 50,
                                systemPrompt: oImportAgent.systemPrompt,
                                authType: oImportAgent.authType || "none",
                                authConfig: oImportAgent.authConfig || {},
                                isDefault: false,
                                isEditable: true,
                                isCustom: true
                            });
                            iImported++;
                        }
                    }

                    AgentManager.saveCustomAgents();
                    fnCallback({ imported: iImported, updated: iUpdated, skipped: iSkipped });

                } catch (e) {
                    console.error("[Chatbot] Import error:", e);
                    fnCallback({ error: "Import failed: " + e.message });
                }
            };

            oReader.onerror = function () {
                fnCallback({ error: "Failed to read file" });
            };

            oReader.readAsText(oFile);
        }
    };

    return AgentManager;
});