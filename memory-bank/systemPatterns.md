# System Patterns & Architecture

**Overall Architecture:** Standard Electron model with separate Main and Renderer processes.
*   **Main Process ([electron/main.js](mdc:electron/main.js)):** Node.js environment handling window management, OS integration, background tasks, SDK/MCP management.
*   **Renderer Process ([src/renderer/main.jsx](mdc:src/renderer/main.jsx)):** Chromium environment rendering the React UI, handling user interaction.
*   **IPC:** Communication between processes uses Electron's `ipcMain`/`ipcRenderer`, likely bridged securely via a preload script.

**Frontend (Renderer) Patterns:**
*   **Component Structure:** Functional components with Hooks. Organized by feature/layout ([src/renderer/components/](mdc:src/renderer/components/)). Adheres to [component-structure.mdc](mdc:.cursor/rules/component-structure.mdc).
*   **State Management:** Primarily React Context API for shared state ([context-api.mdc](mdc:.cursor/rules/context-api.mdc)).
    *   `ChatContext` ([src/renderer/context/ChatContext.jsx](mdc:src/renderer/context/ChatContext.jsx)): Manages chat sessions, messages.
    *   `SettingsContext` ([src/renderer/context/SettingsContext.jsx](mdc:src/renderer/context/SettingsContext.jsx)): Manages API keys, model settings.
    *   `ThemeProvider`: Manages themes (light/dark).
    *   Local component state via `useState`/`useReducer`.
*   **Logic Encapsulation:** Custom Hooks ([src/renderer/hooks/](mdc:src/renderer/hooks/)) for complex logic and state interactions ([react-hooks.mdc](mdc:.cursor/rules/react-hooks.mdc)).
*   **Data Persistence:** Uses `localStorage` (via Context) for chat history and settings ([localstorage.mdc](mdc:.cursor/rules/localstorage.mdc), [chat-data-management.md](mdc:docs/chat-data-management.md)).
*   **Utilities:** Shared, pure functions in [src/renderer/utils/](mdc:src/renderer/utils/).

**Backend Integration (Main Process):**
*   **Cerebras Cloud SDK:** Handled in [electron/chatHandler.js](mdc:electron/chatHandler.js), responsible for streaming API communication.
*   **Model Context Protocol (MCP):** Managed by [electron/mcpManager.js](mdc:electron/mcpManager.js) for tool discovery and execution with external MCP servers ([mcp-integration.md](mdc:docs/mcp-integration.md)).

**Code Style & Conventions:**
*   `camelCase` for variables/functions, `PascalCase` for components/classes.
*   File naming: `PascalCase.jsx` (Components), `camelCase.js` (Utilities).
*   Named exports preferred.
*   ESLint + Prettier enforcement ([eslint.config.js](mdc:eslint.config.js)).
*   See [cursor_rules.mdc](mdc:.cursor/rules/cursor_rules.mdc).

**Build & Development:**
*   `pnpm dev` for concurrent Vite (Renderer) and Electron (Main) development.
*   `pnpm build` for production frontend build.
*   `pnpm dist` for full application packaging via `electron-builder`. 