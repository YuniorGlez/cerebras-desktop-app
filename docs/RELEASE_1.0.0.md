# Release 1.0.0 – Cerebras Desktop

Welcome to the official launch of Cerebras Desktop v1.0.0, your fast, fluid, and secure cross-platform desktop application for interacting with powerful Cerebras LLMs. Below is a quick tour, complete with screenshot placeholders and pointers to our full documentation.

---

## 🚀 Key Highlights

- **Blazing-fast Chat**: Real-time streaming of model responses for a seamless conversation flow.
- **Cerebras Model Selection**: Easily switch between supported Cerebras models directly in the UI.
- **Persistent Settings**: Securely save your API key, chosen model, theme, and server configurations.
- **Chat History & Management**: Easily browse, delete, and edit past conversations to stay organized.
- **Command Palette**: Quickly run actions—new chat, search, delete conversation, edit messages—from one unified interface.

---

## 🚧 Roadmap

- **Tool Integration (Coming Soon)**: Planned support for discovering and controlling external tools via MCP servers.
- **Built-in Log Viewer (Coming Soon)**: Inspect MCP server logs (stdio, SSE) for troubleshooting and transparency.

---

## 💬 Core UI Pages

### 1. Chat Interface & Messaging

![Chat Interface Placeholder](/docs/images/chat-interface.png)

- **Streaming Responses**: Watch tokens appear in real time as the model types.
- **Model Switcher**: Swap between Cerebras models.


### 2. Settings & Preferences 

![Settings Page Placeholder](/docs/images/settings-page.png)

- API key management
- Profile settings
- Custom system prompt
- Temperature and top-p settings
- MCP settings


### 3. Command Palette

![Command Palette Placeholder](/docs/images/command-palette.png)

- Global search across all chats


---

## 📦 Getting Started

```bash
git clone https://github.com/YuniorGlez/cerebras-desktop-app.git
cd cerebras-desktop-app
pnpm install
pnpm dev
```

Supported on **macOS**, **Windows**, and **Linux**. For packaging, run `pnpm build`.

---

## 📖 In-Depth Documentation

For a deep dive, explore our docs folder:

- **Project Overview**: [README.md](README.md)
- **Architecture**: [architecture.md](architecture.md)
- **MCP Integration**: [mcp-integration.md](mcp-integration.md)
- **Chat Data Management**: [chat-data-management.md](chat-data-management.md)
- **Tech Stack**: [technology-stack.md](technology-stack.md)
- **SDK Streaming**: [cerebras-cloud-sdk-node-streaming.md](cerebras-cloud-sdk-node-streaming.md)
- **Developer Setup**: [setup-development.md](setup-development.md)

---

Thank you for using Cerebras Desktop! We can't wait to see what you build. 