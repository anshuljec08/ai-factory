 sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/ui/core/HTML",
    "sap/ui/core/Icon",
    "sap/ui/core/Item",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "ai/factory/util/Constants",
    "ai/factory/util/MarkdownFormatter",
    "ai/factory/service/ChatService",
    "ai/factory/service/HistoryManager"
], function (BaseController, JSONModel, HBox, VBox, Text, Button, HTML, Icon, Item, MessageToast, MessageBox, Constants, Markdown, ChatSvc, HistoryMgr) {
    "use strict";

    return BaseController.extend("ai.factory.controller.chat.Chat", {
        
        _sApiUrl: "/api/v1",
        _sSelectedAgent: null,
        _sSelectedModel: Constants.DEFAULT_MODEL,
        _oCurrentAgent: null,
        _aMessages: [],
        _bProcessing: false,
        _bFollowupEnabled: true,
        _bStreamingEnabled: false,
        _oCurrentTypingRow: null,
        
        onInit: function () {
            // Initialize chat model
            var oChatModel = new JSONModel({
                messages: [],
                selectedAgent: null,
                isProcessing: false
            });
            this.getView().setModel(oChatModel, "chat");
            
            // Load settings
            this._bFollowupEnabled = HistoryMgr.loadFollowupSetting();
            this._bStreamingEnabled = HistoryMgr.loadStreamingSetting();
            
            // Load models
            ChatSvc.loadModels();
            
            // Load agents when view is displayed
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("chat").attachPatternMatched(this._onRouteMatched, this);
        },
        
        _onRouteMatched: function () {
            this._loadAgents();
            this._restoreMessages();
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
                        
                        // Restore selected agent or select first
                        var sSavedAgent = HistoryMgr.restoreSelectedAgent ? HistoryMgr.restoreSelectedAgent() : null;
                        if (sSavedAgent && aAgents.find(function(a) { return a.id === sSavedAgent; })) {
                            oAgentSelect.setSelectedKey(sSavedAgent);
                            that._sSelectedAgent = sSavedAgent;
                            that._loadAgentConfig(sSavedAgent);
                        } else if (aAgents.length > 0) {
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
         * Load agent configuration and initialize tools
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
                    that._sSelectedModel = oAgent.model || Constants.DEFAULT_MODEL;
                    
                    console.log("[Chat] Loaded agent config:", oAgent.name);
                    console.log("[Chat] Model:", that._sSelectedModel);
                    console.log("[Chat] System Prompt:", oAgent.systemPrompt ? oAgent.systemPrompt.substring(0, 100) + "..." : "None");
                    
                    // Initialize ChatService with agent config
                    ChatSvc.setAgentConfig(oAgent);
                    
                    // Load tools if MCP URL is configured
                    if (oAgent.mcpUrl) {
                        console.log("[Chat] Loading tools from MCP:", oAgent.mcpUrl);
                        ChatSvc.loadToolsFromMcp(oAgent.mcpUrl, oAgent.authType, oAgent.authConfig);
                    } else if (oAgent.tools && oAgent.tools.length > 0) {
                        console.log("[Chat] Using configured tools:", oAgent.tools.length);
                    }
                    
                    // Save selected agent
                    if (HistoryMgr.saveSelectedAgent) {
                        HistoryMgr.saveSelectedAgent(sAgentId);
                    }
                })
                .catch(function (error) {
                    console.error("Error loading agent config:", error);
                    MessageToast.show("Failed to load agent configuration");
                });
        },
        
        /**
         * Handle agent selection change
         */
        onAgentChange: function (oEvent) {
            var sAgentId = oEvent.getParameter("selectedItem").getKey();
            if (sAgentId) {
                // Save current conversation before switching
                if (this._aMessages.length > 0) {
                    HistoryMgr.saveCurrentToHistory(this._sCurrentConversationId, this._sSelectedAgent);
                }
                
                this._sSelectedAgent = sAgentId;
                this._loadAgentConfig(sAgentId);
                
                // Clear conversation for new agent
                this._clearConversation();
                
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
            
            if (!this._oCurrentAgent) {
                MessageToast.show("Agent configuration not loaded yet");
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
            var oTypingRow = this._addTypingIndicator("Thinking...");
            this._oCurrentTypingRow = oTypingRow;
            
            // Set processing state
            this._bProcessing = true;
            this._updateSendButton();
            
            // Call AI API
            this._callAI(sMessage, oTypingRow);
        },
        
        /**
         * Call AI API using ChatService
         */
        _callAI: function (sMessage, oTypingRow) {
            var that = this;
            
            // Check if ChatService is properly initialized
            if (!ChatSvc.callAPI) {
                console.warn("[Chat] ChatService.callAPI not available, using simulated response");
                this._callAISimulated(sMessage, oTypingRow);
                return;
            }
            
            ChatSvc.callAPI(sMessage, this._sSelectedAgent, this._sSelectedModel, this._bFollowupEnabled, {
                onTypingUpdate: function (sText) {
                    that._updateTypingText(oTypingRow, sText);
                },
                onStreamChunk: function (sTextDelta, sAccumulatedText) {
                    if (sAccumulatedText.length < 500) {
                        that._updateTypingText(oTypingRow, sAccumulatedText + "▌");
                    } else {
                        that._updateTypingText(oTypingRow, sAccumulatedText.substring(sAccumulatedText.length - 300) + "▌");
                    }
                },
                onIntermediateText: function (sText) {
                    that._removeTypingIndicator(oTypingRow);
                    that._addMessage(sText, "bot");
                    oTypingRow = that._addTypingIndicator("Fetching data...");
                    that._oCurrentTypingRow = oTypingRow;
                },
                onResponse: function (sText, oReasoningData, aFollowups) {
                    that._removeTypingIndicator(oTypingRow);
                    that._oCurrentTypingRow = null;
                    that._bProcessing = false;
                    that._updateSendButton();
                    that._addMessage(sText, "bot", oReasoningData, aFollowups);
                },
                onError: function (sError) {
                    that._removeTypingIndicator(oTypingRow);
                    that._oCurrentTypingRow = null;
                    that._bProcessing = false;
                    that._updateSendButton();
                    that._addMessage("Error: " + sError, "bot");
                },
                onStop: function () {
                    that._removeTypingIndicator(oTypingRow);
                    that._oCurrentTypingRow = null;
                    that._bProcessing = false;
                    that._updateSendButton();
                    that._addMessage("Query stopped by user.", "bot");
                }
            }, this._bStreamingEnabled);
        },
        
        /**
         * Simulated AI response (fallback when ChatService not available)
         */
        _callAISimulated: function (sMessage, oTypingRow) {
            var that = this;
            
            setTimeout(function () {
                that._removeTypingIndicator(oTypingRow);
                that._oCurrentTypingRow = null;
                that._bProcessing = false;
                that._updateSendButton();
                
                var sResponse = that._generateSimulatedResponse(sMessage);
                that._addMessage(sResponse, "bot");
            }, 1500);
        },
        
        /**
         * Generate simulated response
         */
        _generateSimulatedResponse: function (sMessage) {
            var sLower = sMessage.toLowerCase();
            var sAgentName = this._oCurrentAgent ? this._oCurrentAgent.name : "Unknown";
            
            if (sLower.includes("hello") || sLower.includes("hi")) {
                return "Hello! I'm **" + sAgentName + "**. How can I help you today?";
            }
            
            if (sLower.includes("production") || sLower.includes("status")) {
                return "**Production Status Summary**\n\n" +
                    "| Line | Status | Output |\n" +
                    "|------|--------|--------|\n" +
                    "| Line 1 | Running | 1,250 units |\n" +
                    "| Line 2 | Running | 980 units |\n" +
                    "| Line 3 | Maintenance | 0 units |\n\n" +
                    "Overall efficiency: **87%**\n\n" +
                    "*Note: Connect to MCP server for real data.*";
            }
            
            if (sLower.includes("tool") || sLower.includes("available")) {
                var sTools = "**Available Tools**\n\n";
                if (this._oCurrentAgent && this._oCurrentAgent.tools && this._oCurrentAgent.tools.length > 0) {
                    this._oCurrentAgent.tools.forEach(function(tool, i) {
                        sTools += (i + 1) + ". **" + tool.name + "** - " + (tool.description || "No description") + "\n";
                    });
                } else {
                    sTools += "No tools configured for this agent.\n";
                }
                return sTools;
            }
            
            if (sLower.includes("get started") || sLower.includes("help")) {
                return "**Getting Started with " + sAgentName + "**\n\n" +
                    "I can help you with:\n\n" +
                    "1. **Ask Questions** - Type your question below\n" +
                    "2. **Use Tools** - I can call tools to fetch real data\n" +
                    "3. **Get Insights** - Ask for analysis and recommendations\n\n" +
                    "Try asking:\n" +
                    "- \"Check production status\"\n" +
                    "- \"Show available tools\"\n" +
                    "- \"What can you help me with?\"";
            }
            
            return "I received your message: \"" + sMessage + "\"\n\n" +
                "**Agent:** " + sAgentName + "\n" +
                "**Model:** " + this._sSelectedModel + "\n" +
                "**Status:** Demo Mode (ChatService integration pending)";
        },
        
        /**
         * Add message to chat
         */
        _addMessage: function (sText, sType, oReasoningData, aFollowups) {
            var that = this;
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) {
                HistoryMgr.saveMessage(sText, sType);
                return;
            }
            
            var oMessageContent;
            if (sType === "bot") {
                var sHtml = Markdown.toHtml ? Markdown.toHtml(sText) : this._formatMarkdown(sText);
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
            
            var aMessageRowItems = [oMessageBubble];
            
            // Add copy button for bot messages
            if (sType === "bot") {
                var oCopyIcon = new Icon({
                    src: "sap-icon://copy",
                    decorative: false,
                    press: function () { that._copyMessageToClipboard(sText, oCopyIcon); }
                }).addStyleClass("chatCopyIcon");
                aMessageRowItems.push(oCopyIcon);
            }
            
            // Add reasoning icon if available
            if (sType === "bot" && oReasoningData && oReasoningData.steps && oReasoningData.steps.length >= 1) {
                var oInfoIcon = new Icon({
                    src: "sap-icon://hint",
                    decorative: false,
                    press: function () { that._showReasoningSteps(oReasoningData); }
                }).addStyleClass("chatReasoningIcon");
                aMessageRowItems.push(oInfoIcon);
            }
            
            var oMessageRow = new HBox({
                justifyContent: sType === "user" ? "End" : "Start",
                width: "100%",
                alignItems: "Start",
                items: aMessageRowItems
            }).addStyleClass("chatMessageRow");
            
            oChatMessages.addItem(oMessageRow);
            
            // Add follow-up suggestions
            if (sType === "bot" && aFollowups && aFollowups.length > 0) {
                var aChips = [];
                for (var i = 0; i < aFollowups.length; i++) {
                    (function (sQ) {
                        aChips.push(new Button({
                            text: sQ,
                            type: "Transparent",
                            press: function () { that._handleFollowupClick(sQ); }
                        }).addStyleClass("chatFollowupChip"));
                    })(aFollowups[i]);
                }
                oChatMessages.addItem(new HBox({ items: aChips, wrap: "Wrap" }).addStyleClass("chatFollowupContainer"));
            }
            
            // Store message
            this._aMessages.push({ text: sText, type: sType, timestamp: new Date() });
            HistoryMgr.saveMessage(sText, sType);
            
            // Scroll to bottom
            this._scrollToBottom();
        },
        
        /**
         * Handle follow-up click
         */
        _handleFollowupClick: function (sQuestion) {
            this._sendMessage(sQuestion);
        },
        
        /**
         * Copy message to clipboard
         */
        _copyMessageToClipboard: function (sText, oIcon) {
            var that = this;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(sText).then(function () {
                    that._showCopySuccess(oIcon);
                }).catch(function () {
                    that._fallbackCopy(sText, oIcon);
                });
            } else {
                this._fallbackCopy(sText, oIcon);
            }
        },
        
        _fallbackCopy: function (sText, oIcon) {
            var oTextArea = document.createElement("textarea");
            oTextArea.value = sText;
            oTextArea.style.position = "fixed";
            oTextArea.style.left = "-9999px";
            document.body.appendChild(oTextArea);
            oTextArea.select();
            try {
                document.execCommand("copy");
                this._showCopySuccess(oIcon);
            } catch (e) {
                MessageToast.show("Failed to copy");
            }
            document.body.removeChild(oTextArea);
        },
        
        _showCopySuccess: function (oIcon) {
            if (oIcon && !oIcon.bIsDestroyed) {
                oIcon.setSrc("sap-icon://accept");
                oIcon.addStyleClass("chatCopied");
                setTimeout(function () {
                    if (!oIcon.bIsDestroyed) {
                        oIcon.setSrc("sap-icon://copy");
                        oIcon.removeStyleClass("chatCopied");
                    }
                }, 1500);
            }
            MessageToast.show("Copied to clipboard");
        },
        
        /**
         * Show reasoning steps (placeholder)
         */
        _showReasoningSteps: function (oReasoningData) {
            var sSteps = "**Reasoning Steps**\n\n";
            sSteps += "Total Steps: " + oReasoningData.totalSteps + "\n";
            sSteps += "Total Time: " + oReasoningData.totalTime + "\n\n";
            
            oReasoningData.steps.forEach(function(step, i) {
                sSteps += "**Step " + (i + 1) + ":** " + step.type + "\n";
            });
            
            MessageBox.information(sSteps, { title: "Reasoning Steps" });
        },
        
        /**
         * Simple markdown formatter (fallback)
         */
        _formatMarkdown: function (sText) {
            if (!sText) return "";
            
            var sHtml = sText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            sHtml = sHtml.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            sHtml = sHtml.replace(/\*(.+?)\*/g, "<em>$1</em>");
            sHtml = sHtml.replace(/`(.+?)`/g, "<code>$1</code>");
            sHtml = sHtml.replace(/\n/g, "<br>");
            
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
        _addTypingIndicator: function (sText) {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) return null;
            
            var oSpinner = new HTML({
                content: '<div class="chatSpinner"><div class="chatDot"></div><div class="chatDot"></div><div class="chatDot"></div></div>'
            });
            
            var oTypingText = new Text({
                text: sText || "Thinking..."
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
         * Update typing indicator text
         */
        _updateTypingText: function (oTypingRow, sText) {
            try {
                if (oTypingRow && !oTypingRow.bIsDestroyed) {
                    var oTypingBubble = oTypingRow.getItems()[0];
                    var oTypingContainer = oTypingBubble.getItems()[0];
                    var oTypingText = oTypingContainer.getItems()[1];
                    if (oTypingText && oTypingText.setText) {
                        oTypingText.setText(sText);
                    }
                }
            } catch (e) {
                // Ignore
            }
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
         * Restore messages from history
         */
        _restoreMessages: function () {
            var aMessages = HistoryMgr.restoreMessages();
            if (aMessages && aMessages.length > 0) {
                var that = this;
                setTimeout(function () {
                    var oWelcome = that.byId("welcomeSection");
                    if (oWelcome) {
                        oWelcome.setVisible(false);
                    }
                    
                    for (var i = 0; i < aMessages.length; i++) {
                        that._addMessageNoSave(aMessages[i].text, aMessages[i].type);
                    }
                    
                    ChatSvc.setConversationHistory(aMessages.map(function (msg) {
                        return { role: msg.type === "user" ? "user" : "assistant", content: msg.text };
                    }));
                }, 500);
            }
        },
        
        /**
         * Add message without saving to history
         */
        _addMessageNoSave: function (sText, sType) {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) return;
            
            var oMessageContent;
            if (sType === "bot") {
                var sHtml = Markdown.toHtml ? Markdown.toHtml(sText) : this._formatMarkdown(sText);
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
            
            oChatMessages.addItem(new HBox({
                justifyContent: sType === "user" ? "End" : "Start",
                width: "100%",
                items: [oMessageBubble]
            }).addStyleClass("chatMessageRow"));
            
            this._scrollToBottom();
        },
        
        /**
         * Clear conversation
         */
        _clearConversation: function () {
            var oChatMessages = this.byId("chatMessages");
            if (oChatMessages) {
                oChatMessages.removeAllItems();
            }
            
            var oWelcome = this.byId("welcomeSection");
            if (oWelcome) {
                oWelcome.setVisible(true);
            }
            
            this._aMessages = [];
            HistoryMgr.clearCurrentMessages();
            ChatSvc.clearConversationHistory();
        },
        
        /**
         * Start new conversation
         */
        onNewConversation: function () {
            // Save current conversation to history
            if (this._aMessages.length > 0) {
                HistoryMgr.saveCurrentToHistory(this._sCurrentConversationId, this._sSelectedAgent);
            }
            
            this._clearConversation();
            this._sCurrentConversationId = "conv_" + Date.now();
            MessageToast.show("New conversation started");
        },
        
        /**
         * Stop processing
         */
        onStopProcessing: function () {
            ChatSvc.stopProcessing();
            if (this._oCurrentTypingRow) {
                this._removeTypingIndicator(this._oCurrentTypingRow);
                this._oCurrentTypingRow = null;
            }
            this._bProcessing = false;
            this._updateSendButton();
            this._addMessage("Query stopped by user.", "bot");
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