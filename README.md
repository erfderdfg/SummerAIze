# SummerAIze

SummerAIze is a Visual Studio Code extension that generates concise summaries of selected text using AI. Summaries are stored and organized within a dedicated sidebar, making it easier to manage and review information. This tool is useful for developers, researchers, and students who frequently work with large volumes of text.

## Features

Automated Summarization: Select text and receive clear, AI-generated summaries.

Sidebar Integration: View, organize, and manage all summaries in a separate Explorer panel.

AI Provider Options: Compatible with Ollama (local), OpenAI, Hugging Face, and mock summarization for testing.

Detailed Viewing: Open any summary in a new document for full details.

Persistent Storage: Summaries remain available between VS Code sessions.

Real-time Updates: Sidebar automatically refreshes as new summaries are created.

Efficient Processing: Optimized for performance with progress indicators.

## Technology Stack
Core Technologies

TypeScript – Strongly typed development with modern JavaScript features.

VS Code Extension API – Provides integration with VS Code and access to UI components.

Node.js – Runtime environment for executing extension logic.

## AI Integration

Ollama – Local AI models, recommended for improved privacy.

OpenAI API – Cloud-based GPT models for text summarization.

## Development Tools

npm – Package management and automation of scripts.

TypeScript Compiler – Handles code compilation and type checking.

VS Code Extension Generator – Provides scaffolding for extension development.

## Architecture Overview
## Design Patterns

Dependency Injection – Services are supplied to components that require them.

Observer Pattern – Sidebar tree view updates are triggered by event emitters.

Command Pattern – Implements VS Code commands for user actions.

Factory Pattern – AI services are created dynamically based on configuration.
