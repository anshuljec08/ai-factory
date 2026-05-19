sap.ui.define([], function () {
    "use strict";

    var FOLLOWUP_INSTRUCTION = " FOLLOW-UP SUGGESTIONS: At the end of your response, when appropriate, suggest 2 relevant follow-up questions the user might want to ask. Format them as: [FOLLOWUP]Question 1|Question 2[/FOLLOWUP]";

    var FORMATTING_INSTRUCTION = " OUTPUT FORMATTING: " +
        "- Use markdown formatting for readability. " +
        "- Present data in tables when showing multiple records (use | for columns, with header row). " +
        "- Use bullet points for lists. " +
        "- Use headers (##) to organize sections when appropriate. " +
        "- Highlight important values with **bold**. " +
        "- Keep responses concise but complete.";

    return {
        STORAGE_KEY: "aifactory_messages",
        HISTORY_KEY: "aifactory_history",
        AGENT_STORAGE_KEY: "aifactory_selected_agent",
        CUSTOM_AGENTS_KEY: "aifactory_custom_agents",
        FOLLOWUP_SETTING_KEY: "aifactory_followup_enabled",
        STREAMING_SETTING_KEY: "aifactory_streaming_enabled",
        
        // API URLs - configurable via agent config
        MODELS_URL: "/api/v1/models",
        OPENAI_API_URL: "/api/v1/chat/completions",
        MCP_PROXY_URL: "/api/v1/mcp-proxy",
        MCP_BATCH_PROXY_URL: "/api/v1/mcp-proxy-batch",
        
        UNSUPPORTED_MODELS: ["amazon--nova-pro", "nvidia--llama-3.2-nv-embedqa-1b", "sap-rpt-1-large"],
        DEFAULT_MODEL: "claude-opus-4-6",
        REASONING_PREVIEW_CHARS: 500,

        DEFAULT_AGENT: "production-agent",
        FOLLOWUP_INSTRUCTION: FOLLOWUP_INSTRUCTION,
        FORMATTING_INSTRUCTION: FORMATTING_INSTRUCTION,

        buildSystemPrompt: function (sBasePrompt, bEnableFollowup) {
            var oNow = new Date();
            var sToday = oNow.toISOString().split('T')[0];
            var sLocalDate = oNow.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            var sLocalTime = oNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            var sPrompt = sBasePrompt + " " +
                "CURRENT DATE/TIME CONTEXT: " +
                "- Today's date is " + sLocalDate + " (" + sToday + "). " +
                "- Current time is " + sLocalTime + ". " +
                "- When users ask about 'today', 'yesterday', or specific dates, use the appropriate date filters. " +
                "- For date filtering, use ISO 8601 format (e.g., " + sToday + ").";

            // Add formatting instruction for all agents
            sPrompt += FORMATTING_INSTRUCTION;

            if (bEnableFollowup) {
                sPrompt += FOLLOWUP_INSTRUCTION;
            }

            return sPrompt;
        }
    };
});