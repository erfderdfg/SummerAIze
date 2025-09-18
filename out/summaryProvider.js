"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryProvider = exports.SummaryDetailItem = exports.SummaryItem = void 0;
const vscode = require("vscode");
const path = require("path");
class SummaryItem extends vscode.TreeItem {
    constructor(summary, collapsibleState) {
        super(`Summary ${summary.id}`, collapsibleState);
        this.summary = summary;
        this.collapsibleState = collapsibleState;
        this.tooltip = this.createTooltip();
        this.description = this.createDescription();
        this.contextValue = 'summaryItem';
        // Choose icon based on text length
        if (summary.wordCount > 500) {
            this.iconPath = new vscode.ThemeIcon('file-text');
        }
        else if (summary.wordCount > 100) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('note');
        }
    }
    createTooltip() {
        return `Summary: ${this.summary.summary.substring(0, 200)}...\n\n` +
            `Original Length: ${this.summary.wordCount} words\n` +
            `Created: ${this.summary.timestamp.toLocaleString()}\n` +
            `Source: ${this.summary.source || 'Manual Selection'}`;
    }
    createDescription() {
        const timeAgo = this.getTimeAgo(this.summary.timestamp);
        return `${this.summary.wordCount}w • ${timeAgo}`;
    }
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1)
            return 'now';
        if (diffMins < 60)
            return `${diffMins}m`;
        if (diffMins < 1440)
            return `${Math.floor(diffMins / 60)}h`;
        return `${Math.floor(diffMins / 1440)}d`;
    }
}
exports.SummaryItem = SummaryItem;
class SummaryDetailItem extends vscode.TreeItem {
    constructor(label, value, collapsibleState = vscode.TreeItemCollapsibleState.None) {
        super(label, collapsibleState);
        this.label = label;
        this.value = value;
        this.collapsibleState = collapsibleState;
        this.description = value;
        this.contextValue = 'summaryDetail';
        this.iconPath = new vscode.ThemeIcon('symbol-text');
    }
}
exports.SummaryDetailItem = SummaryDetailItem;
class SummaryProvider {
    constructor(context, aiService) {
        this.context = context;
        this.aiService = aiService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.summaries = [];
        this.storageUri = vscode.Uri.joinPath(context.globalStorageUri, 'summaries.json');
        this.loadSummaries();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Show all summaries at root level
            return Promise.resolve(this.summaries.map(summary => new SummaryItem(summary, vscode.TreeItemCollapsibleState.Collapsed)));
        }
        else if (element instanceof SummaryItem) {
            // Show details when summary is expanded
            const summary = element.summary;
            return Promise.resolve([
                new SummaryDetailItem('Summary', summary.summary.substring(0, 100) + '...'),
                new SummaryDetailItem('Word Count', summary.wordCount.toString()),
                new SummaryDetailItem('Created', summary.timestamp.toLocaleString()),
                new SummaryDetailItem('Source', summary.source || 'Manual Selection')
            ]);
        }
        return Promise.resolve([]);
    }
    async addSummary(text, source) {
        try {
            const summaryText = await this.aiService.summarize(text);
            const summary = {
                id: this.generateId(),
                text: text.trim(),
                summary: summaryText.trim(),
                timestamp: new Date(),
                wordCount: text.trim().split(/\s+/).length,
                source
            };
            this.summaries.unshift(summary);
            await this.saveSummaries();
            this.refresh();
        }
        catch (error) {
            throw new Error(`Failed to create summary: ${error}`);
        }
    }
    clearAll() {
        this.summaries = [];
        this.saveSummaries();
        this.refresh();
    }
    async exportSummaries() {
        if (this.summaries.length === 0) {
            vscode.window.showInformationMessage('No summaries to export');
            return;
        }
        const options = {
            defaultUri: vscode.Uri.file('ai-summaries.md'),
            filters: {
                'Markdown files': ['md'],
                'JSON files': ['json'],
                'Text files': ['txt']
            }
        };
        const uri = await vscode.window.showSaveDialog(options);
        if (!uri)
            return;
        try {
            let content = '';
            const fileType = path.extname(uri.fsPath).toLowerCase();
            if (fileType === '.json') {
                content = JSON.stringify(this.summaries, null, 2);
            }
            else if (fileType === '.md') {
                content = this.createMarkdownExport();
            }
            else {
                content = this.createTextExport();
            }
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Summaries exported to ${uri.fsPath}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Export failed: ${error}`);
        }
    }
    createMarkdownExport() {
        let markdown = '# AI Conversation Summaries\n\n';
        markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
        markdown += `Total summaries: ${this.summaries.length}\n\n---\n\n`;
        this.summaries.forEach((summary, index) => {
            markdown += `## Summary ${index + 1}\n\n`;
            markdown += `**Created:** ${summary.timestamp.toLocaleString()}\n`;
            markdown += `**Word Count:** ${summary.wordCount}\n`;
            markdown += `**Source:** ${summary.source || 'Manual Selection'}\n\n`;
            markdown += `### Summary\n${summary.summary}\n\n`;
            markdown += `### Original Text\n${summary.text}\n\n---\n\n`;
        });
        return markdown;
    }
    createTextExport() {
        let text = 'AI Conversation Summaries\n';
        text += '='.repeat(30) + '\n\n';
        text += `Generated on: ${new Date().toLocaleString()}\n`;
        text += `Total summaries: ${this.summaries.length}\n\n`;
        this.summaries.forEach((summary, index) => {
            text += `Summary ${index + 1}\n`;
            text += '-'.repeat(15) + '\n';
            text += `Created: ${summary.timestamp.toLocaleString()}\n`;
            text += `Word Count: ${summary.wordCount}\n`;
            text += `Source: ${summary.source || 'Manual Selection'}\n\n`;
            text += `Summary: ${summary.summary}\n\n`;
            text += `Original: ${summary.text}\n\n`;
            text += '='.repeat(50) + '\n\n';
        });
        return text;
    }
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
    async loadSummaries() {
        try {
            const data = await vscode.workspace.fs.readFile(this.storageUri);
            const jsonStr = Buffer.from(data).toString('utf8');
            const parsed = JSON.parse(jsonStr);
            // Convert saved timestamps back to Date objects
            this.summaries = parsed.map((s) => ({
                ...s,
                timestamp: new Date(s.timestamp)
            }));
        }
        catch (error) {
            // Start with empty list if no saved data
            this.summaries = [];
        }
    }
    async saveSummaries() {
        try {
            await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
            const jsonStr = JSON.stringify(this.summaries, null, 2);
            await vscode.workspace.fs.writeFile(this.storageUri, Buffer.from(jsonStr, 'utf8'));
        }
        catch (error) {
            console.error('Failed to save summaries:', error);
        }
    }
}
exports.SummaryProvider = SummaryProvider;
//# sourceMappingURL=summaryProvider.js.map