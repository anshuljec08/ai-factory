sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/ui/core/HTML",
    "sap/ui/core/Item",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, HBox, VBox, Text, HTML, Item, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("ai.factory.controller.chat.Chat", {
        
        _sApiUrl: "/api/v1",
        _sSelectedAgent: null,
        _aMessages: [],
        _bProcessing: false,
        
        onInit: function () {
            // Initialize chat model
            var oChatModel = new JSONModel({
                messages: [],
                selectedAgent: null,
                isProcessing: false
            });
            this.getView().setModel(oChatModel, "chat");
            
            // Load agents when view is displayed
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("chat").attachPatternMatched(this._onRouteMatched, this);
        },
        
        _onRouteMatched: function () {
            this._loadAgents();
        },
        
        /**
         * Load agents from Agent Registry API
         */
        _loadAgents: function () {
            var that = this;
            var oAgentSelect = this.byId("agentSelect");
            
            fetch(this._sApiUrl + "/agents")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load agents");
                    }
                    return response.json();
                })
                .then(function (oData) {
                    var aAgents = oData.data || oData || [];
                    
                    if (oAgentSelect) {
                        oAgentSelect.removeAllItems();
                        oAgentSelect.addItem(new Item({ key: "", text: "Select an agent..." }));
                        
                        aAgents.forEach(function (oAgent) {
                            oAgentSelect.addItem(new Item({
                                key: oAgent.id,
                                text: oAgent.name
                            }));
                        });
                        
                        // Select first agent if available
                        if (aAgents.length > 0) {
                            oAgentSelect.setSelectedKey(aAgents[0].id);
                            that._sSelectedAgent = aAgents[0].id;
                            that._loadAgentConfig(aAgents[0].id);
                        }
                    }
                })
                .catch(function (error) {
                    console.error("Error loading agents:", error);
                    MessageToast.show("Failed to load agents");
                });
        },
        
        /**
         * Load agent configuration
         */
        _loadAgentConfig: function (sAgentId) {
            var that = this;
            
            fetch(this._sApiUrl + "/agents/" + sAgentId)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load agent config");
                    }
                    return response.json();
                })
                .then(function (oAgent) {
                    that._oCurrentAgent = oAgent;
                    console.log("Loaded agent config:", oAgent.name);
                })
                .catch(function (error) {
                    console.error("Error loading agent config:", error);
                });
        },
        
        /**
         * Handle agent selection change
         */
        onAgentChange: function (oEvent) {
            var sAgentId = oEvent.getParameter("selectedItem").getKey();
            if (sAgentId) {
                this._sSelectedAgent = sAgentId;
                this._loadAgentConfig(sAgentId);
                MessageToast.show("Agent selected: " + oEvent.getParameter("selectedItem").getText());
            }
        },
        
        /**
         * Handle chip click (quick actions)
         */
        onChipClick: function (oEvent) {
            var sText = oEvent.getSource().getText();
            this._sendMessage(sText);
        },
        
        /**
         * Handle send message
         */
        onSendMessage: function () {
            var oInput = this.byId("chatInput");
            if (!oInput) return;
            
            var sMessage = oInput.getValue().trim();
            if (!sMessage) return;
            
            oInput.setValue("");
            this._sendMessage(sMessage);
        },
        
        /**
         * Send message to AI
         */
        _sendMessage: function (sMessage) {
            if (!this._sSelectedAgent) {
                MessageToast.show("Please select an agent first");
                return;
            }
            
            // Hide welcome section
            var oWelcome = this.byId("welcomeSection");
            if (oWelcome) {
                oWelcome.setVisible(false);
            }
            
            // Add user message
            this._addMessage(sMessage, "user");
            
            // Show typing indicator
            var oTypingRow = this._addTypingIndicator();
            
            // Set processing state
            this._bProcessing = true;
            this._updateSendButton();
            
            // Call AI API (simulated for now)
            this._callAI(sMessage, oTypingRow);
        },
        
        /**
         * Call AI API
         */
        _callAI: function (sMessage, oTypingRow) {
            var that = this;
            
            // For now, simulate AI response
            // In Day 9, we'll port the actual ChatService
            setTimeout(function () {
                that._removeTypingIndicator(oTypingRow);
                that._bProcessing = false;
                that._updateSendButton();
                
                // Simulated response
                var sResponse = that._generateSimulatedResponse(sMessage);
                that._addMessage(sResponse, "bot");
                
            }, 1500);
        },
        
        /**
         * Generate simulated response (placeholder until ChatService is ported)
         */
        _generateSimulatedResponse: function (sMessage) {
            var sLower = sMessage.toLowerCase();
            
            if (sLower.includes("hello") || sLower.includes("hi")) {
                return "Hello! I'm your AI assistant. How can I help you today?";
            }
            
            if (sLower.includes("production") || sLower.includes("status")) {
                return "**Production Status Summary**\n\n" +
                    "| Line | Status | Output |\n" +
                    "|------|--------|--------|\n" +
                    "| Line 1 | Running | 1,250 units |\n" +
                    "| Line 2 | Running | 980 units |\n" +
                    "| Line 3 | Maintenance | 0 units |\n\n" +
                    "Overall efficiency: **87%**\n\n" +
                    "*Note: This is simulated data. Connect to MCP server for real data.*";
            }
            
            if (sLower.includes("tool") || sLower.includes("available")) {
                return "**Available Tools**\n\n" +
                    "The following tools are configured for this agent:\n\n" +
                    "1. **get_production_orders** - Retrieve production orders\n" +
                    "2. **get_work_centers** - Get work center information\n" +
                    "3. **get_materials** - Query material master data\n\n" +
                    "*Note: Tools will be functional after MCP integration in Day 9.*";
            }
            
            if (sLower.includes("get started") || sLower.includes("help")) {
                return "**Getting Started with AI Factory**\n\n" +
                    "Welcome! Here's what you can do:\n\n" +
                    "1. **Select an Agent** - Choose from the dropdown above\n" +
                    "2. **Ask Questions** - Type your question in the input below\n" +
                    "3. **Use Tools** - Agents can call tools to fetch real data\n\n" +
                    "Try asking:\n" +
                    "- \"Check production status\"\n" +
                    "- \"Show available tools\"\n" +
                    "- \"What can you help me with?\"";
            }
            
            return "I received your message: \"" + sMessage + "\"\n\n" +
                "I'm currently running in demo mode. Full AI capabilities will be available after the ChatService integration.\n\n" +
                "**Selected Agent:** " + (this._sSelectedAgent || "None") + "\n" +
                "**Status:** Demo Mode";
        },
        
        /**
         * Add message to chat
         */
        _addMessage: function (sText, sType) {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) return;
            
            var oMessageContent;
            if (sType === "bot") {
                // Convert markdown-like text to HTML
                var sHtml = this._formatMarkdown(sText);
                oMessageContent = new HTML({
                    content: '<div class="chatMessageText chatBotText">' + sHtml + '</div>'
                });
            } else {
                oMessageContent = new Text({
                    text: sText
                }).addStyleClass("chatMessageText chatUserText");
            }
            
            var oMessageBubble = new HBox({
                items: [oMessageContent]
            }).addStyleClass("chatMessageBubble").addStyleClass(sType === "user" ? "chatUserBubble" : "chatBotBubble");
            
            var oMessageRow = new HBox({
                justifyContent: sType === "user" ? "End" : "Start",
                width: "100%",
                items: [oMessageBubble]
            }).addStyleClass("chatMessageRow");
            
            oChatMessages.addItem(oMessageRow);
            
            // Store message
            this._aMessages.push({ text: sText, type: sType, timestamp: new Date() });
            
            // Scroll to bottom
            this._scrollToBottom();
        },
        
        /**
         * Simple markdown formatter
         */
        _formatMarkdown: function (sText) {
            if (!sText) return "";
            
            // Escape HTML
            var sHtml = sText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            // Bold
            sHtml = sHtml.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            
            // Italic
            sHtml = sHtml.replace(/\*(.+?)\*/g, "<em>$1</em>");
            
            // Code
            sHtml = sHtml.replace(/`(.+?)`/g, "<code>$1</code>");
            
            // Line breaks
            sHtml = sHtml.replace(/\n/g, "<br>");
            
            // Simple table support
            if (sHtml.includes("|")) {
                sHtml = this._formatTable(sHtml);
            }
            
            return sHtml;
        },
        
        /**
         * Format markdown table
         */
        _formatTable: function (sHtml) {
            var aLines = sHtml.split("<br>");
            var bInTable = false;
            var aResult = [];
            
            for (var i = 0; i < aLines.length; i++) {
                var sLine = aLines[i].trim();
                if (sLine.startsWith("|") && sLine.endsWith("|")) {
                    if (!bInTable) {
                        aResult.push('<table class="chatTable">');
                        bInTable = true;
                    }
                    
                    // Skip separator line
                    if (sLine.includes("---")) {
                        continue;
                    }
                    
                    var aCells = sLine.split("|").filter(function (s) { return s.trim(); });
                    var sTag = i === 0 ? "th" : "td";
                    aResult.push("<tr>");
                    aCells.forEach(function (sCell) {
                        aResult.push("<" + sTag + ">" + sCell.trim() + "</" + sTag + ">");
                    });
                    aResult.push("</tr>");
                } else {
                    if (bInTable) {
                        aResult.push("</table>");
                        bInTable = false;
                    }
                    aResult.push(sLine + "<br>");
                }
            }
            
            if (bInTable) {
                aResult.push("</table>");
            }
            
            return aResult.join("");
        },
        
        /**
         * Add typing indicator
         */
        _addTypingIndicator: function () {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) return null;
            
            var oSpinner = new HTML({
                content: '<div class="chatSpinner"><div class="chatDot"></div><div class="chatDot"></div><div class="chatDot"></div></div>'
            });
            
            var oTypingText = new Text({
                text: "Thinking..."
            }).addStyleClass("chatTypingText");
            
            var oTypingContainer = new HBox({
                items: [oSpinner, oTypingText],
                alignItems: "Center"
            }).addStyleClass("chatTypingContainer");
            
            var oTypingBubble = new HBox({
                items: [oTypingContainer]
            }).addStyleClass("chatMessageBubble chatBotBubble chatTypingBubble");
            
            var oTypingRow = new HBox({
                justifyContent: "Start",
                width: "100%",
                items: [oTypingBubble]
            }).addStyleClass("chatMessageRow chatTypingRow");
            
            oChatMessages.addItem(oTypingRow);
            this._scrollToBottom();
            
            return oTypingRow;
        },
        
        /**
         * Remove typing indicator
         */
        _removeTypingIndicator: function (oTypingRow) {
            if (!oTypingRow) return;
            
            var oChatMessages = this.byId("chatMessages");
            if (oChatMessages) {
                try {
                    oChatMessages.removeItem(oTypingRow);
                } catch (e) {
                    // Ignore
                }
            }
            
            if (!oTypingRow.bIsDestroyed) {
                try {
                    oTypingRow.destroy();
                } catch (e) {
                    // Ignore
                }
            }
        },
        
        /**
         * Update send button state
         */
        _updateSendButton: function () {
            var oBtn = this.byId("sendBtn");
            if (oBtn) {
                if (this._bProcessing) {
                    oBtn.setIcon("sap-icon://stop");
                    oBtn.setType("Reject");
                } else {
                    oBtn.setIcon("sap-icon://paper-plane");
                    oBtn.setType("Emphasized");
                }
            }
        },
        
        /**
         * Scroll chat to bottom
         */
        _scrollToBottom: function () {
            var oScrollContainer = this.byId("chatScrollContainer");
            if (oScrollContainer) {
                setTimeout(function () {
                    oScrollContainer.scrollTo(0, 99999);
                }, 100);
            }
        },
        
        /**
         * Start new conversation
         */
        onNewConversation: function () {
            var oChatMessages = this.byId("chatMessages");
            if (oChatMessages) {
                oChatMessages.removeAllItems();
            }
            
            var oWelcome = this.byId("welcomeSection");
            if (oWelcome) {
                oWelcome.setVisible(true);
            }
            
            this._aMessages = [];
            MessageToast.show("New conversation started");
        },
        
        /**
         * Open settings (placeholder)
         */
        onOpenSettings: function () {
            MessageToast.show("Settings will be available in a future update");
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