import * as vscode from 'vscode';
import { SummaryProvider, SummaryItem } from './summaryProvider';
import { AIService } from './aiService';

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('AI Conversation Summarizer is now active!');

        const aiService = new AIService();
        const summaryProvider = new SummaryProvider(context, aiService);
        
        // Register the tree data provider
        vscode.window.createTreeView('aiSummarizerView', {
            treeDataProvider: summaryProvider,
            showCollapseAll: true
        });

        // Register commands
        const refreshCommand = vscode.commands.registerCommand('aiSummarizer.refresh', () => {
            try {
                summaryProvider.refresh();
            } catch (err) {
                console.error('Error in refreshCommand:', err);
            }
        });

        const summarizeTextCommand = vscode.commands.registerCommand('aiSummarizer.summarizeText', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active text editor found');
                    return;
                }

                const selection = editor.selection;
                const selectedText = editor.document.getText(selection);
                
                if (!selectedText.trim()) {
                    vscode.window.showErrorMessage('Please select some text to summarize');
                    return;
                }

                vscode.window.showInformationMessage('Summarizing text...');
                await summaryProvider.addSummary(selectedText);
                vscode.window.showInformationMessage('Text summarized successfully!');
            } catch (error) {
                console.error('Error in summarizeTextCommand:', error);
                vscode.window.showErrorMessage(`Summarization failed: ${error}`);
            }
        });

        const clearSummariesCommand = vscode.commands.registerCommand('aiSummarizer.clearSummaries', () => {
            try {
                summaryProvider.clearAll();
                vscode.window.showInformationMessage('All summaries cleared');
            } catch (err) {
                console.error('Error in clearSummariesCommand:', err);
            }
        });

        const exportSummariesCommand = vscode.commands.registerCommand('aiSummarizer.exportSummaries', async () => {
            try {
                await summaryProvider.exportSummaries();
            } catch (err) {
                console.error('Error in exportSummariesCommand:', err);
            }
        });

        // Auto-summarize on text selection (if enabled)
        const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection(async (event) => {
            try {
                const config = vscode.workspace.getConfiguration('aiSummarizer');
                const autoSummarize = config.get<boolean>('autoSummarize', false);
                
                if (!autoSummarize) return;
                
                const selectedText = event.textEditor.document.getText(event.selections[0]);
                if (selectedText.trim().length > 100) { // Only auto-summarize longer texts
                    try {
                        await summaryProvider.addSummary(selectedText);
                    } catch (error) {
                        console.error('Auto-summarization failed:', error);
                    }
                }
            } catch (err) {
                console.error('Error in selectionChangeListener:', err);
            }
        });

        // Register disposables
        context.subscriptions.push(
            refreshCommand,
            summarizeTextCommand,
            clearSummariesCommand,
            exportSummariesCommand,
            selectionChangeListener
        );
    } catch (activationError) {
        console.error('Extension activation failed:', activationError);
    }
}

export function deactivate() {
    console.log('AI Conversation Summarizer deactivated');
}