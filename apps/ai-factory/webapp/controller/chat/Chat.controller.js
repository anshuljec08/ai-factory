sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("ai.factory.controller.chat.Chat", {
        
        // Agent Registry API URL
        _sAgentRegistryUrl: "/api/v1",
        
        onInit: function () {
            // Initialize Chat model
            var oChatModel = new JSONModel({
                messages: [],
                inputValue: "",
                isTyping: false,
                showSidePanel: true,
                messageCount: 0
            });
            this.getView().setModel(oChatModel, "chat");
            
            // Initialize Agents model
            var oAgentsModel = new JSONModel({
                agents: [],
                selectedAgent: null
            });
            this.getView().setModel(oAgentsModel, "agents");
            
            // Load agents on init
            this._loadAgents();
            
            // Attach route matched handler
            this.getRouter().getRoute("chat").attachPatternMatched(this._onRouteMatched, this);
        },
        
        _onRouteMatched: function () {
            // Refresh agents when navigating to chat
            this._loadAgents();
        },
        
        /**
         * Load agents from Agent Registry
         */
        _loadAgents: function () {
            var that = this;
            var oAgentsModel = this.getView().getModel("agents");
            
            fetch(this._sAgentRegistryUrl + "/agents")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load agents");
                    }
                    return response.json();
                })
                .then(function (aAgents) {
                    oAgentsModel.setProperty("/agents", aAgents);
                    
                    // Select first agent if none selected
                    if (aAgents.length > 0 && !oAgentsModel.getProperty("/selectedAgent")) {
                        that._selectAgent(aAgents[0]);
                    }
                })
                .catch(function (error) {
                    console.error("Error loading agents:", error);
                    // Use sample agents for demo
                    var aSampleAgents = [
                        {
                            id: "production-agent",
                            name: "Production Assistant",
                            description: "AI assistant for production operations",
                            framework: "mcp",
                            model: "gpt-4",
                            tools: [
                                { name: "get_production_orders", type: "mcp" },
                                { name: "analyze_alerts", type: "mcp" }
                            ]
                        },
                        {
                            id: "sales-agent",
                            name: "Sales Assistant",
                            description: "AI assistant for sales operations",
                            framework: "mcp",
                            model: "gpt-4",
                            tools: [
                                { name: "get_sales_orders", type: "mcp" }
                            ]
                        }
                    ];
                    oAgentsModel.setProperty("/agents", aSampleAgents);
                    that._selectAgent(aSampleAgents[0]);
                });
        },
        
        /**
         * Select an agent
         */
        _selectAgent: function (oAgent) {
            var oAgentsModel = this.getView().getModel("agents");
            oAgentsModel.setProperty("/selectedAgent", oAgent);
            
            // Update agent select control
            var oSelect = this.byId("agentSelect");
            if (oSelect) {
                oSelect.setSelectedKey(oAgent.id);
            }
        },
        
        /**
         * Handle agent selection change
         */
        onAgentChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            var oAgentsModel = this.getView().getModel("agents");
            var aAgents = oAgentsModel.getProperty("/agents");
            
            var oSelectedAgent = aAgents.find(function (agent) {
                return agent.id === sSelectedKey;
            });
            
            if (oSelectedAgent) {
                this._selectAgent(oSelectedAgent);
                MessageToast.show("Switched to " + oSelectedAgent.name);
            }
        },
        
        /**
         * Send message
         */
        onSendMessage: function () {
            var oChatModel = this.getView().getModel("chat");
            var sInputValue = oChatModel.getProperty("/inputValue").trim();
            
            if (!sInputValue) {
                return;
            }
            
            // Add user message
            this._addMessage("user", sInputValue);
            
            // Clear input
            oChatModel.setProperty("/inputValue", "");
            
            // Show typing indicator
            oChatModel.setProperty("/isTyping", true);
            
            // Simulate assistant response (will be replaced with actual API call)
            this._sendToAgent(sInputValue);
        },
        
        /**
         * Add message to chat
         */
        _addMessage: function (sRole, sContent, aToolCalls) {
            var oChatModel = this.getView().getModel("chat");
            var aMessages = oChatModel.getProperty("/messages");
            
            var oMessage = {
                id: Date.now().toString(),
                role: sRole,
                content: sContent,
                timestamp: new Date().toLocaleTimeString(),
                toolCalls: aToolCalls || []
            };
            
            aMessages.push(oMessage);
            oChatModel.setProperty("/messages", aMessages);
            oChatModel.setProperty("/messageCount", aMessages.length);
            
            // Scroll to bottom
            this._scrollToBottom();
        },
        
        /**
         * Send message to agent (placeholder - will be implemented with services)
         */
        _sendToAgent: function (sMessage) {
            var that = this;
            var oChatModel = this.getView().getModel("chat");
            var oAgentsModel = this.getView().getModel("agents");
            var oSelectedAgent = oAgentsModel.getProperty("/selectedAgent");
            
            // Simulate API call delay
            setTimeout(function () {
                // Hide typing indicator
                oChatModel.setProperty("/isTyping", false);
                
                // Add assistant response (placeholder)
                var sResponse = "Hello! I'm " + (oSelectedAgent ? oSelectedAgent.name : "the assistant") + 
                    ". I received your message: \"" + sMessage + "\"\n\n" +
                    "This is a placeholder response. The actual chat functionality will be implemented " +
                    "when the services are ported from AI_Chatbot_Standalone.";
                
                that._addMessage("assistant", sResponse, [
                    { name: "placeholder_tool", status: "completed", duration: 100 }
                ]);
            }, 1500);
        },
        
        /**
         * Scroll chat to bottom
         */
        _scrollToBottom: function () {
            var oScrollContainer = this.byId("chatScrollContainer");
            if (oScrollContainer) {
                setTimeout(function () {
                    oScrollContainer.scrollTo(0, 999999);
                }, 100);
            }
        },
        
        /**
         * Clear chat history
         */
        onClearChat: function () {
            var that = this;
            
            MessageBox.confirm("Are you sure you want to clear the chat history?", {
                title: "Clear Chat",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        var oChatModel = that.getView().getModel("chat");
                        oChatModel.setProperty("/messages", []);
                        oChatModel.setProperty("/messageCount", 0);
                        MessageToast.show("Chat cleared");
                    }
                }
            });
        },
        
        /**
         * Open settings dialog
         */
        onOpenSettings: function () {
            MessageToast.show("Settings dialog coming soon!");
        },
        
        /**
         * Navigate back
         */
        onNavBack: function () {
            this.navTo("home");
        }
    });
});