# Technology Stack

This document outlines the core technologies used in the Cerebras Desktop App.

## Frontend

*   **Framework:** [React](https://reactjs.org/) (v18+)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Language:** JavaScript (ES6+)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Component Libraries:**
    *   [shadcn/ui](https://ui.shadcn.com/): Accessible and customizable components built on Radix UI and Tailwind CSS.
    *   [Magic UI](https://magicui.design/): Animated components library.
*   **Routing:** [React Router DOM](https://reactrouter.com/web/guides/quick-start) (v6+)
*   **State Management:** React Context API ([ChatContext.jsx](mdc:src/renderer/context/ChatContext.jsx))
*   **Local Storage:** Browser `localStorage` API (for chat history persistence)

## Desktop Application Framework

*   **Framework:** [Electron](https://www.electronjs.org/)
*   **Packaging:** [electron-builder](https://www.electron.build/)

## Backend / Services (Integration)

*   **AI Completions:** [Cerebras Cloud SDK](mdc:docs/cerebras-cloud-sdk-node-streaming.md)
*   **Model Context Protocol (MCP):** Custom implementation for tool integration ([mcp-integration.md](mdc:docs/mcp-integration.md))

## Development & Tooling

*   **Package Manager:** [pnpm](https://pnpm.io/)
*   **Linting:** [ESLint](https://eslint.org/)
*   **Formatting:** [Prettier](https://prettier.io/)
*   **Task Management:** [Task Master AI](mdc:README-task-master.md) (integrated via MCP)

## Documentation

*   **Format:** Markdown
*   **Rules Engine:** Cursor Rules (`.mdc` files in [.cursor/rules/](mdc:.cursor/rules))

---
*Keep this document updated as new technologies are adopted or removed.*