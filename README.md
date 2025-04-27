# Cerebras Desktop App

Cerebras Desktop App is a modern Electron-based application that provides seamless integration with the Cerebras Cloud SDK for advanced AI chat and tool-augmented workflows.

## Features
- Native integration with Cerebras Cloud SDK for chat completions
- Tool calling support via Model Context Protocol (MCP)
- Modern React-based UI with support for multiple models
- Secure API key management
- Extensible tool system for advanced automation
- Easy configuration and settings management

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- pnpm (recommended) or npm/yarn
- A valid Cerebras Cloud API key

### Installation
```bash
pnpm install
```

### Running the App
```bash
pnpm dev
```

### Building for Production
```bash
pnpm build
```

## Configuration
- Set your Cerebras API key in the app settings or via environment variables.
- Configure MCP tool servers as needed for your workflow.

## Documentation
- For detailed usage and configuration, see the [docs/](docs/) directory.
- All documentation and code examples reference Cerebras Cloud SDK exclusively.

## Contributing
Contributions are welcome! Please open issues or pull requests for improvements or new features.

## License
[MIT](LICENSE)

---
*This project is built from the ground up for Cerebras Cloud SDK and does not reference or depend on any other LLM provider.*
