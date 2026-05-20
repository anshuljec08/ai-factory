sap.ui.define([], function () {
    "use strict";

    var MarkdownFormatter = {

        toHtml: function (sMarkdown) {
            if (!sMarkdown) return "";

            var sHtml = sMarkdown;

            // Escape HTML special characters first
            sHtml = sHtml.replace(/&/g, "&amp;");
            sHtml = sHtml.replace(/</g, "&lt;");
            sHtml = sHtml.replace(/>/g, "&gt;");
            
            // CRITICAL: Escape curly braces to prevent UI5 binding interpretation
            sHtml = sHtml.replace(/\{/g, "&#123;");
            sHtml = sHtml.replace(/\}/g, "&#125;");

            // Convert markdown tables to HTML tables
            sHtml = MarkdownFormatter._convertTables(sHtml);

            // Convert headers
            sHtml = sHtml.replace(/^### (.+)$/gm, '<h3 class="aichatbot-md-h3">$1</h3>');
            sHtml = sHtml.replace(/^## (.+)$/gm, '<h2 class="aichatbot-md-h2">$1</h2>');
            sHtml = sHtml.replace(/^# (.+)$/gm, '<h1 class="aichatbot-md-h1">$1</h1>');

            // Convert bold
            sHtml = sHtml.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // Convert italic (not part of bold)
            sHtml = sHtml.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

            // Convert horizontal rules
            sHtml = sHtml.replace(/^---+$/gm, '<hr class="aichatbot-md-hr">');

            // Convert inline code
            sHtml = sHtml.replace(/`([^`]+)`/g, '<code class="aichatbot-md-code">$1</code>');

            // Convert line breaks
            sHtml = sHtml.replace(/\n/g, '<br>');

            // Clean up multiple <br> tags
            sHtml = sHtml.replace(/(<br>){2,}/g, '<br>');

            // Remove <br> before block elements
            sHtml = sHtml.replace(/<br>(<div class="aichatbot-md-table-wrapper">)/g, '$1');
            sHtml = sHtml.replace(/<br>(<h[123] class="aichatbot-md-h)/g, '$1');
            sHtml = sHtml.replace(/<br>(<hr class="aichatbot-md-hr">)/g, '$1');

            return sHtml;
        },

        escapeHtml: function (sText) {
            if (!sText) return "";
            return sText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
                .replace(/\{/g, "&#123;")
                .replace(/\}/g, "&#125;");
        },

        formatNumber: function (iNumber) {
            if (iNumber === undefined || iNumber === null) return "0";
            return iNumber.toLocaleString();
        },

        _convertTables: function (sText) {
            var aLines = sText.split('\n');
            var aResult = [];
            var bInTable = false;
            var aTableRows = [];

            for (var i = 0; i < aLines.length; i++) {
                var sLine = aLines[i].trim();

                if (sLine.match(/^\|.*\|$/)) {
                    // Skip separator rows
                    if (sLine.match(/^\|[\s\-:|]+\|$/)) {
                        continue;
                    }

                    if (!bInTable) {
                        bInTable = true;
                        aTableRows = [];
                    }

                    var aCells = sLine.split('|').filter(function (cell, idx, arr) {
                        return idx > 0 && idx < arr.length - 1;
                    }).map(function (cell) {
                        return cell.trim();
                    });

                    aTableRows.push(aCells);
                } else {
                    if (bInTable) {
                        aResult.push(MarkdownFormatter._buildTableHtml(aTableRows));
                        bInTable = false;
                        aTableRows = [];
                    }
                    aResult.push(sLine);
                }
            }

            if (bInTable && aTableRows.length > 0) {
                aResult.push(MarkdownFormatter._buildTableHtml(aTableRows));
            }

            return aResult.join('\n');
        },

        _buildTableHtml: function (aRows) {
            if (aRows.length === 0) return '';

            var sHtml = '<div class="aichatbot-md-table-wrapper"><table class="aichatbot-md-table">';

            // Header row
            sHtml += '<thead><tr>';
            for (var h = 0; h < aRows[0].length; h++) {
                sHtml += '<th>' + aRows[0][h] + '</th>';
            }
            sHtml += '</tr></thead>';

            // Body rows
            if (aRows.length > 1) {
                sHtml += '<tbody>';
                for (var r = 1; r < aRows.length; r++) {
                    sHtml += '<tr>';
                    for (var c = 0; c < aRows[r].length; c++) {
                        sHtml += '<td>' + aRows[r][c] + '</td>';
                    }
                    sHtml += '</tr>';
                }
                sHtml += '</tbody>';
            }

            sHtml += '</table></div>';
            return sHtml;
        }
    };

    return MarkdownFormatter;
});