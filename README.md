# 🤖 SummerAIze

A powerful VS Code extension that automatically summarizes selected text using AI and displays organized summaries in a convenient sidebar panel. Perfect for developers, researchers, and anyone who works with large amounts of text content.

## ✨ Features

- **Smart Text Summarization**: Select any text and get concise, AI-powered summaries
- **Sidebar Panel**: Dedicated Explorer panel to view and manage all your summaries
- **Multiple AI Providers**: Support for Ollama (local), OpenAI, Hugging Face, and mock summarization
- **Detailed View**: Click any summary to open full details in a new document
- **Persistent Storage**: Summaries are saved between VS Code sessions
- **Real-time Updates**: Instant sidebar updates when new summaries are created
- **Performance**: Efficient processing with progress indicators

## 🛠️ Technology Stack

### Core Technologies
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development with modern JavaScript features
- **[VS Code Extension API](https://code.visualstudio.com/api)** - Native VS Code integration and UI components
- **[Node.js](https://nodejs.org/)** - Runtime environment for extension logic

### AI Integration
- **[Ollama](https://ollama.ai/)** - Local AI models (recommended for privacy)
- **[OpenAI API](https://openai.com/api/)** - Cloud-based GPT models

### Development Tools
- **[npm](https://www.npmjs.com/)** - Package management and script automation
- **[TypeScript Compiler](https://www.typescriptlang.org/docs/handbook/compiler-options.html)** - Code compilation and type checking
- **[VS Code Extension Generator](https://github.com/Microsoft/vscode-generator-code)** - Project scaffolding

## 🎨 Architecture Overview
### Design Patterns
- **Dependency Injection**: Services passed to components that need them
- **Observer Pattern**: Tree view updates through event emitters  
- **Command Pattern**: VS Code commands for user interactions
- **Factory Pattern**: AI service creation based on configuration

[⬆ Back to Top](#-ai-conversation-summarizer---vs-code-extension)

</div>
