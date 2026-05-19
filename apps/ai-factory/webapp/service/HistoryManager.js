sap.ui.define([
    "ai/factory/util/Constants"
], function (Constants) {
    "use strict";

    var HistoryManager = {

        _aHistoryList: [],

        getHistoryList: function () {
            return this._aHistoryList;
        },

        loadHistoryList: function () {
            try {
                var sHistory = localStorage.getItem(Constants.HISTORY_KEY);
                if (sHistory) {
                    this._aHistoryList = JSON.parse(sHistory);
                } else {
                    this._aHistoryList = [];
                }
            } catch (e) {
                console.warn("[Chatbot] Error loading history:", e);
                this._aHistoryList = [];
            }
            return this._aHistoryList;
        },

        saveHistoryList: function () {
            try {
                if (this._aHistoryList.length > 20) {
                    this._aHistoryList = this._aHistoryList.slice(-20);
                }
                localStorage.setItem(Constants.HISTORY_KEY, JSON.stringify(this._aHistoryList));
            } catch (e) {
                console.warn("[Chatbot] Error saving history:", e);
            }
        },

        saveCurrentToHistory: function (sConversationId, sAgentId) {
            try {
                var aMessages = JSON.parse(sessionStorage.getItem(Constants.STORAGE_KEY) || "[]");

                if (aMessages.length === 0) {
                    return;
                }

                // Get title from first user message
                var sTitle = "New Conversation";
                for (var i = 0; i < aMessages.length; i++) {
                    if (aMessages[i].type === "user") {
                        sTitle = aMessages[i].text.substring(0, 50);
                        if (aMessages[i].text.length > 50) {
                            sTitle += "...";
                        }
                        break;
                    }
                }

                var oHistoryEntry = {
                    id: sConversationId || "conv_" + Date.now(),
                    title: sTitle,
                    timestamp: new Date().toISOString(),
                    agent: sAgentId,
                    messages: aMessages
                };

                this.loadHistoryList();

                // Update existing or add new
                var bFound = false;
                for (var j = 0; j < this._aHistoryList.length; j++) {
                    if (this._aHistoryList[j].id === oHistoryEntry.id) {
                        this._aHistoryList[j] = oHistoryEntry;
                        bFound = true;
                        break;
                    }
                }

                if (!bFound) {
                    this._aHistoryList.push(oHistoryEntry);
                }

                this.saveHistoryList();
                console.log("[Chatbot] Saved conversation to history:", sTitle);

            } catch (e) {
                console.warn("[Chatbot] Error saving to history:", e);
            }
        },

        getHistoryEntry: function (sId) {
            for (var i = 0; i < this._aHistoryList.length; i++) {
                if (this._aHistoryList[i].id === sId) {
                    return this._aHistoryList[i];
                }
            }
            return null;
        },

        deleteHistoryItem: function (sId) {
            for (var i = 0; i < this._aHistoryList.length; i++) {
                if (this._aHistoryList[i].id === sId) {
                    this._aHistoryList.splice(i, 1);
                    break;
                }
            }
            this.saveHistoryList();
        },

        clearCurrentMessages: function () {
            try {
                sessionStorage.removeItem(Constants.STORAGE_KEY);
            } catch (e) {
                console.warn("[Chatbot] Error clearing storage:", e);
            }
        },

        saveMessage: function (sText, sType) {
            try {
                var aMessages = JSON.parse(sessionStorage.getItem(Constants.STORAGE_KEY) || "[]");
                if (aMessages.length > 20) {
                    aMessages = aMessages.slice(-20);
                }
                aMessages.push({ text: sText, type: sType });
                sessionStorage.setItem(Constants.STORAGE_KEY, JSON.stringify(aMessages));
            } catch (e) {
                try {
                    sessionStorage.removeItem(Constants.STORAGE_KEY);
                } catch (e2) {
                    // ignore
                }
            }
        },

        restoreMessages: function () {
            try {
                return JSON.parse(sessionStorage.getItem(Constants.STORAGE_KEY) || "[]");
            } catch (e) {
                console.warn("[Chatbot] Storage not available or error:", e);
                return [];
            }
        },

        loadFollowupSetting: function () {
            try {
                var sSavedFollowup = sessionStorage.getItem(Constants.FOLLOWUP_SETTING_KEY);
                if (sSavedFollowup !== null) {
                    return sSavedFollowup === "true";
                }
            } catch (e) {
                console.warn("[Chatbot] Error loading follow-up setting:", e);
            }
            return true; // default enabled
        },

        saveFollowupSetting: function (bEnabled) {
            try {
                sessionStorage.setItem(Constants.FOLLOWUP_SETTING_KEY, String(bEnabled));
                console.log("[Chatbot] Follow-up setting saved:", bEnabled);
            } catch (e) {
                console.warn("[Chatbot] Error saving follow-up setting:", e);
            }
        },

        loadStreamingSetting: function () {
            try {
                var sSavedStreaming = sessionStorage.getItem(Constants.STREAMING_SETTING_KEY);
                if (sSavedStreaming !== null) {
                    return sSavedStreaming === "true";
                }
            } catch (e) {
                console.warn("[Chatbot] Error loading streaming setting:", e);
            }
            return false; // default disabled
        },

        saveStreamingSetting: function (bEnabled) {
            try {
                sessionStorage.setItem(Constants.STREAMING_SETTING_KEY, String(bEnabled));
                console.log("[Chatbot] Streaming setting saved:", bEnabled);
            } catch (e) {
                console.warn("[Chatbot] Error saving streaming setting:", e);
            }
        }
    };

    return HistoryManager;
});
