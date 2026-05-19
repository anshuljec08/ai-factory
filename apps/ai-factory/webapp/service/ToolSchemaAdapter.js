sap.ui.define([], function () {
    "use strict";

    /**
     * ToolSchemaAdapter
     * 
     * Converts MCP tool schemas to OpenAI function calling format.
     * Handles schema sanitization for compatibility with different LLM providers.
     * 
     * Gemini-specific handling:
     * - Removes $ref, anyOf, oneOf, allOf
     * - Normalizes array-style type definitions to single type
     * - Converts complex nested schemas to string fallback
     */
    var ToolSchemaAdapter = {

        /**
         * Convert MCP tools array to OpenAI function calling format.
         * @param {Array} aTools - Array of MCP tools with name, description, input_schema
         * @param {Object} [oOptions] - Optional settings (e.g., { provider: "gemini" })
         * @returns {Array} Array of OpenAI-compatible tool definitions
         */
        convertToolsToOpenAI: function (aTools, oOptions) {
            var that = this;
            oOptions = oOptions || {};

            if (!aTools || !Array.isArray(aTools)) {
                return [];
            }
            return aTools.map(function (oTool) {
                var oParams = that.sanitizeSchema(oTool.input_schema || { type: "object", properties: {} }, oOptions);
                return {
                    type: "function",
                    "function": {
                        name: oTool.name,
                        description: oTool.description || "",
                        parameters: oParams
                    }
                };
            });
        },

        /**
         * Sanitize a JSON schema for LLM compatibility.
         * - Ensures 'required' field exists
         * - Converts empty object properties to string type
         * - Recursively processes nested schemas
         * - For Gemini: removes $ref, anyOf, oneOf, allOf
         * 
         * @param {Object} oSchema - JSON schema object
         * @param {Object} [oOptions] - Optional settings (e.g., { provider: "gemini" })
         * @returns {Object} Sanitized schema
         */
        sanitizeSchema: function (oSchema, oOptions) {
            if (!oSchema || typeof oSchema !== "object") {
                return { type: "object", properties: {}, required: [] };
            }

            var oClean = this._deepClone(oSchema);
            oOptions = oOptions || {};
            var bStrictProvider = oOptions.provider === "gemini" || oOptions.provider === "sonar";

            // Remove unsupported constructs for strict providers (Gemini, Sonar Pro)
            if (bStrictProvider) {
                this._stripUnsupportedConstructs(oClean);
            }

            // Ensure required field exists
            if (!oClean.required) {
                oClean.required = [];
            }

            // Normalize array-style type to single type
            if (Array.isArray(oClean.type)) {
                oClean.type = this._pickSafeType(oClean.type);
            }

            // Process properties
            if (oClean.properties) {
                var oProps = {};
                var aKeys = Object.keys(oClean.properties);
                for (var i = 0; i < aKeys.length; i++) {
                    var sKey = aKeys[i];
                    var oProp = oClean.properties[sKey];
                    oProps[sKey] = this._sanitizeProperty(oProp, oOptions);
                }
                oClean.properties = oProps;
            }

            // Handle items for array types (recursive)
            if (oClean.type === "array" && oClean.items) {
                oClean.items = this._sanitizeProperty(oClean.items, oOptions);
            }

            // Remove $schema if present (strict providers don't like it)
            if (bStrictProvider) {
                delete oClean["$schema"];
            }

            return oClean;
        },

        /**
         * Sanitize a single property definition.
         * @private
         */
        _sanitizeProperty: function (oProp, oOptions) {
            if (!oProp || typeof oProp !== "object") {
                return { type: "string" };
            }

            var oClean = this._deepClone(oProp);
            var bStrictProvider = oOptions && (oOptions.provider === "gemini" || oOptions.provider === "sonar");

            // Remove unsupported constructs for strict providers (Gemini, Sonar Pro)
            if (bStrictProvider) {
                this._stripUnsupportedConstructs(oClean);
            }

            // Handle $ref - convert to string fallback
            if (oClean["$ref"]) {
                return {
                    type: "string",
                    description: oClean.description || "Reference value (provide as string)"
                };
            }

            // Handle anyOf/oneOf - convert to string fallback for strict providers
            if (bStrictProvider && (oClean.anyOf || oClean.oneOf || oClean.allOf)) {
                return {
                    type: "string",
                    description: oClean.description || "Value (provide as string or JSON)"
                };
            }

            // Normalize array-style type to single type
            if (Array.isArray(oClean.type)) {
                oClean.type = this._pickSafeType(oClean.type);
            }

            // Handle empty object properties - convert to string
            if (oClean.type === "object" && (!oClean.properties || Object.keys(oClean.properties).length === 0)) {
                return {
                    type: "string",
                    description: oClean.description || "JSON object as string"
                };
            }

            // Recursively sanitize nested object schemas
            if (oClean.type === "object" && oClean.properties) {
                return this.sanitizeSchema(oClean, oOptions);
            }

            // Recursively sanitize array item schemas
            if (oClean.type === "array" && oClean.items) {
                oClean.items = this._sanitizeProperty(oClean.items, oOptions);
                return oClean;
            }

            return oClean;
        },

        /**
         * Strip unsupported JSON Schema constructs for strict providers.
         * Modifies the object in place.
         * @private
         */
        _stripUnsupportedConstructs: function (oObj) {
            if (!oObj || typeof oObj !== "object") {
                return;
            }

            // Remove unsupported keywords
            delete oObj["$ref"];
            delete oObj["$schema"];
            delete oObj["$id"];
            delete oObj.anyOf;
            delete oObj.oneOf;
            delete oObj.allOf;
            delete oObj.not;
            delete oObj["if"];
            delete oObj["then"];
            delete oObj["else"];
            delete oObj.definitions;
            delete oObj["$defs"];

            // Recursively process nested objects
            if (oObj.properties) {
                var aKeys = Object.keys(oObj.properties);
                for (var i = 0; i < aKeys.length; i++) {
                    this._stripUnsupportedConstructs(oObj.properties[aKeys[i]]);
                }
            }

            if (oObj.items) {
                this._stripUnsupportedConstructs(oObj.items);
            }

            if (oObj.additionalProperties && typeof oObj.additionalProperties === "object") {
                this._stripUnsupportedConstructs(oObj.additionalProperties);
            }
        },

        /**
         * Pick a safe single type from an array of types.
         * Prefers string > number > integer > boolean > object
         * @private
         */
        _pickSafeType: function (aTypes) {
            if (!Array.isArray(aTypes) || aTypes.length === 0) {
                return "string";
            }

            // Filter out null
            var aFiltered = aTypes.filter(function (t) { return t !== "null"; });
            if (aFiltered.length === 0) {
                return "string";
            }

            // Priority order
            var aPriority = ["string", "number", "integer", "boolean", "array", "object"];
            for (var i = 0; i < aPriority.length; i++) {
                if (aFiltered.indexOf(aPriority[i]) !== -1) {
                    return aPriority[i];
                }
            }

            return aFiltered[0] || "string";
        },

        /**
         * Deep clone an object (simple implementation for JSON-safe objects).
         * @private
         */
        _deepClone: function (oObj) {
            if (!oObj || typeof oObj !== "object") {
                return oObj;
            }
            return JSON.parse(JSON.stringify(oObj));
        },

        /**
         * Extract tool text content from MCP response.
         * @param {Object} oResponse - MCP tool call response
         * @returns {string} Extracted text content or JSON string
         */
        extractToolResultText: function (oResponse) {
            if (oResponse && oResponse.result && oResponse.result.content) {
                var aTexts = oResponse.result.content
                    .filter(function (c) { return c.type === "text" && c.text; })
                    .map(function (c) { return c.text; });
                return aTexts.length > 0 ? aTexts.join("\n") : JSON.stringify(oResponse);
            }
            return JSON.stringify(oResponse);
        }
    };

    return ToolSchemaAdapter;
});