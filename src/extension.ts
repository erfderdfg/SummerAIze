import * as vscode from 'vscode';

interface Summary {
    id: string;
    text: string;
    summary: string;
    timestamp: Date;
}

class SummaryProvider implements vscode.TreeDataProvider<Summary> {
    private _onDidChangeTreeData: vscode.EventEmitter<Summary | undefined | null | void> = new vscode.EventEmitter<Summary | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Summary | undefined | null | void> = this._onDidChangeTreeData.event;

    public summaries: Summary[] = []; // Make it public so we can access it

    constructor() {
        console.log('🔧 SummaryProvider created');
        // Add startup summaries to make sidebar visible immediately
        this.addStartupSummaries();
    }

    private addStartupSummaries(): void {
        this.summaries = [
            {
                id: 'welcome',
                text: 'Welcome to AI Conversation Summarizer! This extension helps you summarize selected text.',
                summary: 'Welcome! Extension is ready to summarize your text selections.',
                timestamp: new Date()
            },
            {
                id: 'instructions',
                text: 'To use: 1. Select some text in any file 2. Right-click 3. Choose "Summarize Selected Text" 4. View results here',
                summary: 'Instructions: Select text → Right-click → Summarize Selected Text',
                timestamp: new Date()
            }
        ];
        console.log(`✅ Added ${this.summaries.length} startup summaries`);
    }

    refresh(): void {
        console.log('🔄 Refreshing tree view');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Summary): vscode.TreeItem {
        const index = this.summaries.indexOf(element) + 1;
        const item = new vscode.TreeItem(
            `Summary ${index}`,
            vscode.TreeItemCollapsibleState.None
        );
        
        item.description = element.summary.substring(0, 50) + (element.summary.length > 50 ? '...' : '');
        item.tooltip = `Summary: ${element.summary}\n\nOriginal Text: ${element.text}\n\nCreated: ${element.timestamp.toLocaleString()}`;
        item.iconPath = new vscode.ThemeIcon('file-text');
        
        // Make the item clickable
        item.command = {
            command: 'aiSummarizer.openSummary',
            title: 'Open Summary',
            arguments: [element]
        };
        
        return item;
    }

    getChildren(element?: Summary): Thenable<Summary[]> {
        console.log(`📋 getChildren called - returning ${this.summaries.length} summaries`);
        return Promise.resolve(this.summaries);
    }

    addSummary(text: string): void {
        console.log(`➕ Adding summary for: ${text.substring(0, 50)}...`);
        
        // Create a simple extractive summary
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
        let summary = '';
        
        if (sentences.length > 0) {
            summary = sentences[0].trim() + '.';
            if (sentences.length > 1 && summary.length < 80) {
                summary += ' ' + sentences[1].trim() + '.';
            }
        } else {
            const words = text.split(' ').filter(w => w.length > 2);
            summary = `Summary of ${words.length} words: ${words.slice(0, 10).join(' ')}...`;
        }
        
        const newSummary: Summary = {
            id: `summary_${Date.now()}`,
            text: text.trim(),
            summary: summary,
            timestamp: new Date()
        };

        this.summaries.unshift(newSummary);
        console.log(`✅ Summary added. Total: ${this.summaries.length}`);
        this.refresh();
    }

    clearAll(): void {
        console.log('🗑️ Clearing all summaries');
        this.summaries = [];
        this.addStartupSummaries(); // Add back welcome messages
        this.refresh();
    }

    getSummaryCount(): number {
        return this.summaries.length;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 AI Conversation Summarizer activating...');

    const summaryProvider = new SummaryProvider();
    
    // Register tree view
    console.log('📋 Registering tree data provider...');
    const treeView = vscode.window.createTreeView('aiSummarizerView', {
        treeDataProvider: summaryProvider,
        showCollapseAll: false
    });
    
    console.log('✅ Tree view created successfully');

    // Register commands
    const summarizeCommand = vscode.commands.registerCommand('aiSummarizer.summarizeText', () => {
        console.log('📝 Summarize command triggered');
        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No text editor is active');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Please select some text first');
            return;
        }

        console.log(`📄 Processing text: ${selectedText.substring(0, 100)}...`);
        summaryProvider.addSummary(selectedText);
        vscode.window.showInformationMessage('✅ Text summarized! Check the AI Summaries panel.');
    });

    const refreshCommand = vscode.commands.registerCommand('aiSummarizer.refresh', () => {
        console.log('🔄 Refresh command triggered');
        summaryProvider.refresh();
        vscode.window.showInformationMessage('🔄 Summaries refreshed');
    });

    const clearCommand = vscode.commands.registerCommand('aiSummarizer.clearSummaries', () => {
        console.log('🗑️ Clear command triggered');
        summaryProvider.clearAll();
        vscode.window.showInformationMessage('🗑️ Summaries cleared');
    });

    // Add command to open summary details
    const openSummaryCommand = vscode.commands.registerCommand('aiSummarizer.openSummary', (summary: Summary) => {
        console.log(`📖 Opening summary: ${summary.id}`);
        
        // Find the index of the summary
        const summaryIndex = summaryProvider.summaries.indexOf(summary) + 1;
        
        // Create a new document with the summary details
        const content = `# Summary ${summaryIndex}

## 📝 Summary
${summary.summary}

## 📄 Original Text
${summary.text}

## 🕐 Created
${summary.timestamp.toLocaleString()}

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

    // Alternative: Show in a popup instead
    const showSummaryCommand = vscode.commands.registerCommand('aiSummarizer.showSummary', (summary: Summary) => {
        console.log(`👁️ Showing summary: ${summary.id}`);
        
        const message = `📝 ${summary.summary}\n\n📄 Original: ${summary.text.substring(0, 100)}${summary.text.length > 100 ? '...' : ''}\n\n🕐 ${summary.timestamp.toLocaleString()}`;
        
        vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Copy Summary',
            'Copy Original'
        ).then(selection => {
            if (selection === 'Copy Summary') {
                vscode.env.clipboard.writeText(summary.summary);
                vscode.window.showInformationMessage('Summary copied to clipboard!');
            } else if (selection === 'Copy Original') {
                vscode.env.clipboard.writeText(summary.text);
                vscode.window.showInformationMessage('Original text copied to clipboard!');
            }
        });
    });

    // Add all to subscriptions
    context.subscriptions.push(
        treeView,
        summarizeCommand,
        refreshCommand,
        clearCommand,
        openSummaryCommand,
        showSummaryCommand
    );

    console.log('✅ AI Conversation Summarizer activated successfully!');
    
    // Show success message
    vscode.window.showInformationMessage(
        '🤖 AI Summarizer is ready! Look for "🤖 AI Summaries" in the Explorer panel.',
        'Show Panel'
    ).then(selection => {
        if (selection === 'Show Panel') {
            vscode.commands.executeCommand('workbench.view.explorer');
        }
    });
}