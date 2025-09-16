# SummerAIze: AI Conversation Summarizer - VS Code Extension

SummerAIze is a powerful VS Code extension that summarizes AI conversations and displays them in an organized sidebar with a clean table/list view. It helps you keep track of important insights from your conversations, supporting multiple AI providers and flexible export options.  

---

## 🚀 Features
- **Sidebar Integration**: Summaries displayed in VS Code’s Explorer sidebar  
- **Multiple AI Providers**: Supports **Ollama (local)**, **OpenAI**, and **Hugging Face**  
- **Smart Summarization**: Configurable summary length (1–5 sentences)  
- **Auto-Summarize**: Automatically summarize selected text (optional)  
- **Export Options**: Export summaries as **Markdown**, **JSON**, or **plain text**  
- **Persistent Storage**: Summaries are retained between sessions  
- **Word Count Tracking**: View original text word count  
- **Time Stamps**: Track when each summary was created  
- **Context Menu Support**: Right-click → summarize selected text  

---

## 🛠️ Tech Stack
- **Languages**: TypeScript
- **APIs & Frameworks**:  
  - [VS Code Extension API](https://code.visualstudio.com/api)  
  - [Ollama API](https://ollama.ai) (local inference)  
  - [OpenAI API](https://platform.openai.com/docs)  
  - [Hugging Face Inference API](https://huggingface.co/inference-api)  
- **Server**: Node.js 
- **Storage**: VS Code Global State + JSON serialization
