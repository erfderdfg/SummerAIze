import * as vscode from 'vscode';
import * as path from 'path';
import { Summary } from './types';
import { AIService } from './aiService';

export class SummaryItem extends vscode.TreeItem {
    constructor(
        public readonly summary: Summary,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(`Summary ${summary.id}`, collapsibleState);
        
        this.tooltip = this.createTooltip();
        this.description = this.createDescription();
        this.contextValue = 'summaryItem';
        
        // Choose icon based on text length
        if (summary.wordCount > 500) {
            this.iconPath = new vscode.ThemeIcon('file-text');
        } else if (summary.wordCount > 100) {
            this.iconPath = new vscode.ThemeIcon('file');
        } else {
            this.iconPath = new vscode.ThemeIcon('note');
        }
    }

    private createTooltip(): string {
        return `Summary: ${this.summary.summary.substring(0, 200)}...\n\n` +
               `Original Length: ${this.summary.wordCount} words\n` +
               `Created: ${this.summary.timestamp.toLocaleString()}\n` +
               `Source: ${this.summary.source || 'Manual Selection'}`;
    }

    private createDescription(): string {
        const timeAgo = this.getTimeAgo(this.summary.timestamp);
        return `${this.summary.wordCount}w • ${timeAgo}`;
    }

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return `${Math.floor(diffMins / 1440)}d`;
    }
}

export class SummaryDetailItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly value: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState);
        this.description = value;
        this.contextValue = 'summaryDetail';
        this.iconPath = new vscode.ThemeIcon('symbol-text');
    }
}

export class SummaryProvider implements vscode.TreeDataProvider<SummaryItem | SummaryDetailItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SummaryItem | SummaryDetailItem | undefined | null | void> = new vscode.EventEmitter<SummaryItem | SummaryDetailItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SummaryItem | SummaryDetailItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private summaries: Summary[] = [];
    private storageUri: vscode.Uri;

    constructor(
        private context: vscode.ExtensionContext,
        private aiService: AIService
    ) {
        this.storageUri = vscode.Uri.joinPath(context.globalStorageUri, 'summaries.json');
        this.loadSummaries();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SummaryItem | SummaryDetailItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SummaryItem | SummaryDetailItem): Thenable<(SummaryItem | SummaryDetailItem)[]> {
        if (!element) {
            // Show all summaries at root level
            return Promise.resolve(
                this.summaries.map(summary => 
                    new SummaryItem(summary, vscode.TreeItemCollapsibleState.Collapsed)
                )
            );
        } else if (element instanceof SummaryItem) {
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

    async addSummary(text: string, source?: string): Promise<void> {
        try {
            const summaryText = await this.aiService.summarize(text);
            
            const summary: Summary = {
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
        } catch (error) {
            throw new Error(`Failed to create summary: ${error}`);
        }
    }

    clearAll(): void {
        this.summaries = [];
        this.saveSummaries();
        this.refresh();
    }

    async exportSummaries(): Promise<void> {
        if (this.summaries.length === 0) {
            vscode.window.showInformationMessage('No summaries to export');
            return;
        }

        const options: vscode.SaveDialogOptions = {
            defaultUri: vscode.Uri.file('ai-summaries.md'),
            filters: {
                'Markdown files': ['md'],
                'JSON files': ['json'],
                'Text files': ['txt']
            }
        };

        const uri = await vscode.window.showSaveDialog(options);
        if (!uri) return;

        try {
            let content = '';
            const fileType = path.extname(uri.fsPath).toLowerCase();

            if (fileType === '.json') {
                content = JSON.stringify(this.summaries, null, 2);
            } else if (fileType === '.md') {
                content = this.createMarkdownExport();
            } else {
                content = this.createTextExport();
            }

            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Summaries exported to ${uri.fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Export failed: ${error}`);
        }
    }

    private createMarkdownExport(): string {
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

    private createTextExport(): string {
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

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    private async loadSummaries(): Promise<void> {
        try {
            const data = await vscode.workspace.fs.readFile(this.storageUri);
            const jsonStr = Buffer.from(data).toString('utf8');
            const parsed = JSON.parse(jsonStr);
            
            // Convert saved timestamps back to Date objects
            this.summaries = parsed.map((s: any) => ({
                ...s,
                timestamp: new Date(s.timestamp)
            }));
        } catch (error) {
            // Start with empty list if no saved data
            this.summaries = [];
        }
    }

    private async saveSummaries(): Promise<void> {
        try {
            await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
            const jsonStr = JSON.stringify(this.summaries, null, 2);
            await vscode.workspace.fs.writeFile(this.storageUri, Buffer.from(jsonStr, 'utf8'));
        } catch (error) {
            console.error('Failed to save summaries:', error);
        }
    }
}