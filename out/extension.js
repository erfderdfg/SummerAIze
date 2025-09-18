"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const aiService_1 = require("./aiService");
class SummaryProvider {
    constructor(context, aiService) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.summaries = [];
        this.context = context;
        this.aiService = aiService;
        console.log('SummaryProvider initialized');
        this.loadSummaries();
        if (this.summaries.length === 0) {
            this.addWelcomeSummaries();
        }
    }
    addWelcomeSummaries() {
        this.summaries = [
            {
                id: 'welcome',
                text: 'Welcome to AI Conversation Summarizer! This extension helps you summarize selected text.',
                summary: 'Welcome! Extension is ready to summarize your text selections.',
                timestamp: new Date(),
                wordCount: 12,
                source: 'welcome'
            },
            {
                id: 'instructions',
                text: 'To use: 1. Select some text in any file 2. Right-click 3. Choose "Summarize Selected Text" 4. View results here',
                summary: 'Instructions: Select text, right-click, then choose Summarize Selected Text',
                timestamp: new Date(),
                wordCount: 20,
                source: 'welcome'
            }
        ];
        console.log(`Added ${this.summaries.length} welcome messages`);
        this.saveSummaries();
    }
    refresh() {
        console.log('Refreshing summary list');
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        const index = this.summaries.indexOf(element) + 1;
        const item = new vscode.TreeItem(`Summary ${index}`, vscode.TreeItemCollapsibleState.None);
        item.description = element.summary.substring(0, 50) + (element.summary.length > 50 ? '...' : '');
        item.tooltip = `Summary: ${element.summary}\n\nOriginal Text: ${element.text}\n\nCreated: ${element.timestamp.toLocaleString()}`;
        item.iconPath = new vscode.ThemeIcon('file-text');
        // Make items clickable to open details
        item.command = {
            command: 'aiSummarizer.openSummary',
            title: 'Open Summary',
            arguments: [element]
        };
        return item;
    }
    getChildren(element) {
        console.log(`Returning ${this.summaries.length} summaries`);
        return Promise.resolve(this.summaries);
    }
    async addSummary(text, source) {
        console.log(`Adding summary for: ${text.substring(0, 50)}...`);
        try {
            // Use AI service to create summary
            const summaryText = await this.aiService.summarize(text);
            const newSummary = {
                id: `summary_${Date.now()}`,
                text: text.trim(),
                summary: summaryText,
                timestamp: new Date(),
                wordCount: text.trim().split(/\s+/).length,
                source: source || 'manual'
            };
            this.summaries.unshift(newSummary);
            console.log(`Summary added. Total summaries: ${this.summaries.length}`);
            await this.saveSummaries();
            this.refresh();
        }
        catch (error) {
            console.error('Failed to add summary:', error);
            vscode.window.showErrorMessage(`Failed to create summary: ${error.message}`);
        }
    }
    clearAll() {
        console.log('Clearing all summaries');
        this.summaries = [];
        this.addWelcomeSummaries();
        this.refresh();
    }
    getSummaryCount() {
        return this.summaries.length;
    }
    async loadSummaries() {
        try {
            const saved = this.context.globalState.get('summaries', []);
            // Convert timestamp strings back to Date objects
            this.summaries = saved.map(s => ({
                ...s,
                timestamp: new Date(s.timestamp)
            }));
            console.log(`Loaded ${this.summaries.length} saved summaries`);
        }
        catch (error) {
            console.error('Failed to load summaries:', error);
            this.summaries = [];
        }
    }
    async saveSummaries() {
        try {
            await this.context.globalState.update('summaries', this.summaries);
            console.log(`Saved ${this.summaries.length} summaries`);
        }
        catch (error) {
            console.error('Failed to save summaries:', error);
        }
    }
}
function activate(context) {
    console.log('AI Conversation Summarizer is starting up...');
    // Initialize services
    const aiService = new aiService_1.AIService();
    const summaryProvider = new SummaryProvider(context, aiService);
    // Create the sidebar panel
    console.log('Setting up sidebar panel...');
    const treeView = vscode.window.createTreeView('aiSummarizerView', {
        treeDataProvider: summaryProvider,
        showCollapseAll: false
    });
    console.log('Sidebar panel ready');
    // Handle text summarization
    const summarizeCommand = vscode.commands.registerCommand('aiSummarizer.summarizeText', async () => {
        console.log('User requested text summarization');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No text editor is open');
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Please select some text first');
            return;
        }
        console.log(`Processing ${selectedText.length} characters of text`);
        // Show progress while summarizing
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating summary...",
            cancellable: false
        }, async (progress) => {
            await summaryProvider.addSummary(selectedText, 'editor');
        });
        vscode.window.showInformationMessage('Text summarized successfully! Check the AI Summaries panel.');
    });
    // Handle list refresh
    const refreshCommand = vscode.commands.registerCommand('aiSummarizer.refresh', () => {
        console.log('User requested refresh');
        summaryProvider.refresh();
        vscode.window.showInformationMessage('Summary list refreshed');
    });
    // Handle clear all summaries
    const clearCommand = vscode.commands.registerCommand('aiSummarizer.clearSummaries', async () => {
        console.log('User requested clear all');
        const result = await vscode.window.showWarningMessage('Are you sure you want to clear all summaries?', { modal: true }, 'Clear All');
        if (result === 'Clear All') {
            summaryProvider.clearAll();
            vscode.window.showInformationMessage('All summaries cleared');
        }
    });
    // Handle opening summary details
    const openSummaryCommand = vscode.commands.registerCommand('aiSummarizer.openSummary', (summary) => {
        console.log(`Opening detailed view for summary: ${summary.id}`);
        const summaryIndex = summaryProvider.summaries.indexOf(summary) + 1;
        // Create detailed view in new document
        const content = `# Summary ${summaryIndex}

## Summary
${summary.summary}

## Original Text
${summary.text}

## Details
- **Word Count**: ${summary.wordCount} words
- **Created**: ${summary.timestamp.toLocaleString()}
- **Source**: ${summary.source || 'Manual'}

---
*Generated by AI Conversation Summarizer*
`;
        vscode.workspace.openTextDocument({
            content: content,
            language: 'markdown'
        }).then(doc => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        });
    });
    // Handle showing summary in popup
    const showSummaryCommand = vscode.commands.registerCommand('aiSummarizer.showSummary', (summary) => {
        console.log(`Showing popup for summary: ${summary.id}`);
        const message = `Summary: ${summary.summary}\n\nOriginal: ${summary.text.substring(0, 100)}${summary.text.length > 100 ? '...' : ''}\n\nCreated: ${summary.timestamp.toLocaleString()}`;
        vscode.window.showInformationMessage(message, { modal: true }, 'Copy Summary', 'Copy Original').then(selection => {
            if (selection === 'Copy Summary') {
                vscode.env.clipboard.writeText(summary.summary);
                vscode.window.showInformationMessage('Summary copied to clipboard');
            }
            else if (selection === 'Copy Original') {
                vscode.env.clipboard.writeText(summary.text);
                vscode.window.showInformationMessage('Original text copied to clipboard');
            }
        });
    });
    // Register all commands
    context.subscriptions.push(treeView, summarizeCommand, refreshCommand, clearCommand, openSummaryCommand, showSummaryCommand);
    console.log('AI Conversation Summarizer is ready');
    // Show welcome message
    vscode.window.showInformationMessage('AI Summarizer is ready! Look for "AI Summaries" in the Explorer panel.', 'Show Panel').then(selection => {
        if (selection === 'Show Panel') {
            vscode.commands.executeCommand('workbench.view.explorer');
        }
    });
}
exports.activate = activate;
function deactivate() {
    console.log('AI Conversation Summarizer stopped');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map