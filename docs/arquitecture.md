# Application Architecture

This document describes the high-level architecture of the Cerebras Desktop App.

## Overview

The application follows a standard Electron architecture, separating concerns between the **Main Process** and the **Renderer Process**.

*   **Main Process:** Runs in a Node.js environment. Responsible for:
    *   Creating and managing application windows (`BrowserWindow`).
    *   Handling application lifecycle events (startup, quit).
    *   Interacting with the operating system (native APIs, menus, dialogs).
    *   Running background tasks.
    *   Managing the MCP (Model Context Protocol) server/client integration ([electron/mcpManager.js](mdc:electron/mcpManager.js)).
    *   Handling communication with the Cerebras Cloud SDK ([electron/chatHandler.js](mdc:electron/chatHandler.js)).
    *   See [electron/main.js](mdc:electron/main.js).
*   **Renderer Process:** Runs the user interface within a Chromium browser environment. Responsible for:
    *   Rendering the React application.
    *   Handling user interactions.
    *   Displaying data.
    *   Communicating with the Main Process via Inter-Process Communication (IPC).
    *   See [src/renderer/main.jsx](mdc:src/renderer/main.jsx) for entry point and routing.
    *   Core application logic and UI composition happens within components like [src/renderer/components/layout/AppLayout.jsx](mdc:src/renderer/components/layout/AppLayout.jsx) and page-specific components in [src/renderer/pages/](mdc:src/renderer/pages/).
*   **Preload Script:** A script that runs before the web page is loaded in the Renderer Process. It has access to both the `window` object and Node.js APIs, acting as a secure bridge for IPC.

## Frontend Architecture (Renderer Process)

The frontend is built with React and follows modern patterns:

*   **Component-Based:** UI is broken down into reusable functional components located in [src/renderer/components/](mdc:src/renderer/components/).
    *   Uses **shadcn/ui** and **Magic UI** for the component library.
    *   Components are organized by feature or layout structure (e.g., `layout/`, `chat/`, `settings/`).
*   **Routing:** [React Router DOM](https://reactrouter.com/web/guides/quick-start) manages navigation between different sections (Pages) of the application, defined in [src/renderer/main.jsx](mdc:src/renderer/main.jsx).
    *   Page components reside in [src/renderer/pages/](mdc:src/renderer/pages/).
*   **State Management:**
    *   **Local Component State:** Managed using `useState` and `useReducer` hooks for component-specific UI state.
    *   **Global/Shared State:** Managed primarily via React Context API. See [context-api.mdc](mdc:.cursor/rules/context-api.mdc).
        *   `ChatProvider` / `useChat` ([src/renderer/context/ChatContext.jsx](mdc:src/renderer/context/ChatContext.jsx)) manages chat sessions, messages, and the active chat.
        *   `SettingsProvider` / `useSettings` ([src/renderer/context/SettingsContext.jsx](mdc:src/renderer/context/SettingsContext.jsx)) manages application settings.
        *   `ThemeProvider` (likely in `src/renderer/components/theme/`) manages dark/light mode.
*   **Data Persistence:**
    *   Chat history ([chat-data-management.md](mdc:docs/chat-data-management.md)) and settings are persisted using the browser's `localStorage` API via their respective contexts. See [localstorage.mdc](mdc:.cursor/rules/localstorage.mdc).
*   **Logic Encapsulation:** Business logic and complex state interactions are encapsulated within custom hooks ([src/renderer/hooks/](mdc:src/renderer/hooks/)). See [react-hooks.mdc](mdc:.cursor/rules/react-hooks.mdc). Examples include `useChatOrchestration`, `useToolApproval`, `useMcpTools`.
*   **Utilities:** Reusable, pure functions are placed in [src/renderer/utils/](mdc:src/renderer/utils/).

## Backend Integration (Main Process)

*   **Cerebras Cloud SDK:** Integrated in [electron/chatHandler.js](mdc:electron/chatHandler.js) to stream responses from the Cerebras API.
*   **MCP (Model Context Protocol):** Managed by [electron/mcpManager.js](mdc:electron/mcpManager.js), facilitating communication and tool discovery/execution between the frontend and potential backend tool servers.

## Inter-Process Communication (IPC)

Communication between the Renderer and Main processes happens via Electron's IPC mechanisms (`ipcMain`, `ipcRenderer`). A preload script is typically used to expose specific IPC channels securely to the Renderer process.

## Build Process

*   **Vite:** Used for development server and bundling the React frontend code.
*   **Electron Builder:** Used to package the final application for distribution.

---
*This architecture aims for separation of concerns, maintainability, and leverages standard Electron and React patterns.*