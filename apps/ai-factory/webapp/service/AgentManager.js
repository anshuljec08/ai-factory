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

        // DEVIATION: No context providers or hooks loaded yet (Weeks 6-7) — see docs/phase1-deviations.md
        loadAgentsConfig: function (fnCallback) {
            jQuery.ajax({
                url: Constants.AGENTS_API_URL,
                method: "GET",
                dataType: "json",
                success: function (oResponse) {
                    var aAgents = [];
                    if (oResponse && oResponse.data && Array.isArray(oResponse.data)) {
                        aAgents = oResponse.data;
                    } else if (Array.isArray(oResponse)) {
                        aAgents = oResponse;
                    }
                    AGENTS = aAgents;
                    console.log("[AgentManager] Loaded agents from API:", AGENTS.length);
                    AgentManager.mergeCustomAgents();
                    AGENTS_LOADED = true;
                    if (fnCallback) fnCallback();
                },
                error: function (oError) {
                    console.warn("[AgentManager] Failed to load agents from API, using defaults:", oError.statusText);
                    AGENTS = [
                        {
                            id: "production-agent",
                            name: "Production Agent",
                            description: "SAP Digital Manufacturing assistant",
                            systemPrompt: "You are an AI assistant for SAP Digital Manufacturing.",
                            model: "claude-opus-4-6",
                            modelConfig: { maxTokens: 4096 },
                            tools: [],
                            maxSteps: 30,
                            timeout: 30000
                        },
                        {
                            id: "general-assistant",
                            name: "General Assistant",
                            description: "General purpose AI assistant",
                            systemPrompt: "You are a helpful AI assistant.",
                            model: "claude-opus-4-6",
                            modelConfig: { maxTokens: 4096 },
                            tools: [],
                            maxSteps: 10,
                            timeout: 30000
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
                        console.log("[AgentManager] Merged custom agents:", aCustomAgents.length);
                    }
                }
            } catch (e) {
                console.warn("[AgentManager] Error loading custom agents:", e);
            }
        },

        saveCustomAgents: function () {
            try {
                var aCustomAgents = AGENTS.filter(function (agent) {
                    return agent.isCustom === true;
                });
                localStorage.setItem(Constants.CUSTOM_AGENTS_KEY, JSON.stringify(aCustomAgents));
            } catch (e) {
                console.warn("[AgentManager] Error saving custom agents:", e);
            }
        },

        restoreSelectedAgent: function () {
            try {
                var sSavedAgent = sessionStorage.getItem(Constants.AGENT_STORAGE_KEY);
                if (sSavedAgent) {
                    var oAgent = AgentManager.getAgentById(sSavedAgent);
                    if (oAgent) {
                        return sSavedAgent;
                    }
                }
            } catch (e) {
                // ignore
            }
            return Constants.DEFAULT_AGENT;
        },

        saveSelectedAgent: function (sAgentId) {
            try {
                sessionStorage.setItem(Constants.AGENT_STORAGE_KEY, sAgentId);
            } catch (e) {
                // ignore
            }
        },

        addAgent: function (oAgentData) {
            var sNewId = "custom_" + Date.now();
            var oNewAgent = {
                id: sNewId,
                name: oAgentData.name,
                description: oAgentData.description || "Custom agent",
                systemPrompt: oAgentData.systemPrompt,
                model: oAgentData.model || Constants.DEFAULT_MODEL,
                modelConfig: oAgentData.modelConfig || { maxTokens: 4096 },
                tools: oAgentData.tools || [],
                maxSteps: oAgentData.maxSteps || 30,
                timeout: oAgentData.timeout || 30000,
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
                Object.keys(oAgentData).forEach(function (sKey) {
                    oAgent[sKey] = oAgentData[sKey];
                });
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
                systemPrompt: oAgent.systemPrompt,
                model: oAgent.model || Constants.DEFAULT_MODEL,
                modelConfig: JSON.parse(JSON.stringify(oAgent.modelConfig || {})),
                tools: JSON.parse(JSON.stringify(oAgent.tools || [])),
                maxSteps: oAgent.maxSteps || 30,
                timeout: oAgent.timeout || 30000,
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
                version: "2.0",
                agents: AGENTS
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
                                Object.keys(oImportAgent).forEach(function (sKey) {
                                    oExisting[sKey] = oImportAgent[sKey];
                                });
                                iUpdated++;
                            } else {
                                iSkipped++;
                            }
                        } else {
                            oImportAgent.id = oImportAgent.id || "imported_" + Date.now() + "_" + i;
                            oImportAgent.isEditable = true;
                            oImportAgent.isCustom = true;
                            AGENTS.push(oImportAgent);
                            iImported++;
                        }
                    }

                    AgentManager.saveCustomAgents();
                    fnCallback({ imported: iImported, updated: iUpdated, skipped: iSkipped });

                } catch (e) {
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
