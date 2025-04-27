# Cerebras Desktop Setup, Development, and Building Guide

This guide covers how to set up the development environment, run the application locally, and build it for production.

## Prerequisites

*   **Node.js:** Version 18 or higher. Download it from [nodejs.org](https://nodejs.org/).
*   **pnpm:** Package manager. Install it globally after installing Node.js:

        npm install -g pnpm

## Development Environment Setup

1.  **Clone the Repository:**

        git clone <REPOSITORY_URL>
        cd cerebras-desktop-app # Or the name of the cloned directory

2.  **Install Dependencies:**
    Use `pnpm` to install all dependencies listed in `package.json`:

        pnpm install

    This will install dependencies for Electron, React, SDKs, and development tools.

## Running in Development Mode

To start the application in development mode with hot-reloading for the React UI:

    pnpm dev

This command runs two processes concurrently:

*   `pnpm dev:vite`: Starts the Vite development server for the React UI (Renderer process).
*   `pnpm dev:electron`: Starts Electron, which will load the UI from the Vite server. It automatically opens the Electron DevTools.

The application should launch, and you should see changes to the React code reflected almost instantly. Changes to the Main process code (`electron/` directory) will require restarting the `pnpm dev` process.

## Initial Application Configuration

When running the application for the first time (or after clearing settings):

1.  **Cerebras API Key:**
    *   Go to the "Settings" tab (gear icon).
    *   Enter your Cerebras API key in the "Cerebras API Key" field.
    *   You can obtain an API key by signing up at [console.cerebras.com](https://console.cerebras.com/).
    *   Settings are saved automatically when you leave the field.
2.  **MCP Servers (Optional):**
    *   If you want to use external tools, configure one or more MCP servers in the "MCP Servers" section of the "Settings" tab.
    *   You can add them using the form or by pasting a JSON configuration.
    *   Refer to `MCP_INTEGRATION.md` for details on transport types (stdio, sse, streamableHttp) and their configurations.

Settings are stored in a `settings.json` file within the application's user data directory. You can find the exact path in the "Settings" tab.

## Building for Production

To create a distributable package of the application (e.g., a `.dmg` on macOS, an `.exe` on Windows):

    pnpm dist

This command performs the following steps:

1.  `pnpm build`: Runs `vite build`, which compiles and optimizes the React application for production (generates static files in the `dist/` directory).
2.  `pnpm build:electron`: Runs `electron-builder`, which takes the Main process code, the compiled React files (`dist/`), and necessary dependencies to package the application into an installable format based on the configuration in `package.json` (`build` section).

The distributable files will be located in the `release/` directory.

**Note for macOS:** After installing a downloaded or locally built application, macOS might quarantine it. If the app doesn't open, you might need to run the following command in the terminal (adjust the path if necessary):

    xattr -c /Applications/Cerebras\ Desktop.app

## Project Structure (Summary)

*   `electron/`: Main process code (Node.js/Electron).
    *   `main.js`: Main entry point.
    *   `preload.js`: Bridge script between Main and Renderer.
    *   `*.js`: Modules for different functionalities (MCP, Auth, Chat, Settings...).
    *   `scripts/`: Wrapper scripts for running external commands (used by MCP stdio).
*   `src/renderer/`: Renderer process code (React).
    *   `main.jsx`: React entry point.
    *   `App.jsx`: Main UI application component.
    *   `components/`: Reusable React components.
    *   `pages/`: Page components (Chat, Settings).
    *   `context/`: React Contexts (e.g., `ChatContext`).
    *   `index.css`: Global styles and Tailwind configuration.
*   `shared/`: Potentially shared code (currently `models.js` is empty, but the intent might be for shared types or data).
*   `dist/`: Output directory for the Vite build (production React files).
*   `release/`: Output directory for Electron Builder (distributable packages).
*   `*.cjs`, `*.js`: Configuration files (Vite, Tailwind, PostCSS, ESLint).
*   `package.json`: Project definition, dependencies, and scripts.
*   `index.html`: Main HTML template.