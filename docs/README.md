# Cerebras Desktop

This document provides an overview of the Cerebras Desktop application in English, based on source code analysis.

## Main Purpose

Cerebras Desktop is a cross-platform desktop application (built with Electron) that provides a chat interface for interacting with large language models (LLMs) available through the Cerebras API. Its goal is to offer a fast and fluid chat experience, leveraging Cerebras's inference speed.

In addition, the application integrates the **Model Context Protocol** (MCP), allowing LLMs to use external tools (MCP servers) to perform actions or retrieve real-world information during a conversation.

## Key Features

* **Chat Interface**: Clean and simple user interface for sending messages and receiving responses from Cerebras LLMs.
* **Cerebras Model Support**: Allows selection between the different models offered by the Cerebras API.

* **Response Streaming:** Model responses are displayed in real time as they are generated.
* **Model Context Protocol (MCP) Integration:**
* Allows you to configure and connect to local or remote MCP servers (via stdio, SSE, or StreamableHTTP).
* Discovers and displays tools available on connected MCP servers.
* Allows LLMs to request the execution of these tools (Function Calling/Tool Use).
* Manages tool execution and returns results to the LLM.
* Includes a tool approval flow for user control.
* Supports OAuth2 authentication for secure MCP servers (SSE/StreamableHTTP).
* **Image Support (Vision):** Allows images to be attached to messages for models with vision capabilities.
* **Persistent Configuration:** Saves the Cerebras API key, the selected model, and MCP server configurations.
* **MCP Log Viewer:** Allows you to view logs (standard output/error) from connected MCP servers via stdio.

## How Does It Work (Simplified)?

1. **Frontend (React):** The user interface, built with React and Tailwind CSS, runs in the Electron Renderer process. It handles user input (text, images), displays the conversation, and allows interaction with the configuration and MCP servers.
2. **Bridge (Preload Script):** A `preload.js` script safely exposes specific functions from the backend (Main process) to the user interface.
3. **Backend (Electron Main):** The main Electron process (Node.js) handles the core logic:
* Interacts with the Cerebras API (`cerebras-sdk`) to obtain chat completions (`chatHandler.js`).
* Manages connections and communication with MCP servers (`mcpManager.js`, `toolHandler.js`) using `@modelcontextprotocol/sdk`.
* Handles OAuth2 authentication for MCP servers (`authManager.js`).
* Loads and saves configuration (`settingsManager.js`).
* Coordinates the creation and management of the application window (`windowManager.js`).
* Resolves command paths for MCP stdio servers (`commandResolver.js`).
4. **Communication:** The frontend and backend communicate via Electron IPC (Inter-Process Communication) messages, provided by the preload script.
5. **Persistence:** Configuration is saved in a `settings.json` file, and MCP authentication data in `storage.json` within the application's user data directory. Tool approvals are stored in `localStorage`.

## Target Audience

* **Users:** People who want a fast desktop interface for chatting with Cerebras models and potentially using MCP tools.
* **Developers:** Those who want to understand the architecture, extend the functionality, or integrate their own MCP servers.