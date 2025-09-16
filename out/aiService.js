"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
// === src/aiService.ts ===
const vscode = require("vscode");
const http = require("http");
class AIService {
    constructor() {
        this.config = vscode.workspace.getConfiguration('aiSummarizer');
    }
    async summarize(text) {
        const provider = this.config.get('provider', 'ollama');
        const maxLength = this.config.get('maxSummaryLength', 3);
        switch (provider) {
            case 'ollama':
                return this.summarizeWithOllama(text, maxLength);
            default:
                return this.createMockSummary(text, maxLength);
        }
    }
    async summarizeWithOllama(text, maxLength) {
        const model = this.config.get('model', 'llama2');
        const prompt = `Summarize the following text in exactly ${maxLength} sentences. Be concise and capture the key points:\n\n${text}\n\nSummary:`;
        const postData = JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.3,
                top_p: 0.9
            }
        });
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData && jsonData.response) {
                            resolve(this.cleanSummary(jsonData.response));
                        }
                        else {
                            reject(new Error('Invalid response from Ollama'));
                        }
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse Ollama response: ${error}`));
                    }
                });
            });
            req.on('error', (error) => {
                if (error.message.includes('ECONNREFUSED')) {
                    reject(new Error('Ollama is not running. Please start Ollama service.'));
                }
                else {
                    reject(new Error(`Ollama request failed: ${error.message}`));
                }
            });
            req.write(postData);
            req.end();
        });
    }
    createMockSummary(text, maxLength) {
        // Mock summary for testing when no AI service is available
        const words = text.split(' ');
        const summary = `This is a ${maxLength}-sentence summary of ${words.length} words. The text discusses various topics and concepts. Key points have been identified and condensed for clarity.`;
        return Promise.resolve(summary);
    }
    cleanSummary(summary) {
        // Clean up the summary text
        let cleaned = summary.replace(/^(Summary:|Here's a summary:|The text discusses:|This text is about:)\s*/i, '');
        cleaned = cleaned.replace(/\n\s*\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned && !/[.!?]$/.test(cleaned)) {
            cleaned += '.';
        }
        return cleaned;
    }
    async testConnection() {
        try {
            const testSummary = await this.summarize('This is a test message to verify the AI service is working correctly.');
            return {
                success: true,
                message: `Connection successful. Test summary: ${testSummary.substring(0, 50)}...`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`
            };
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map