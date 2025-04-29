# Technology Context

**Core Framework:** Electron (v27+)

**Frontend:**
*   **Framework:** React (v19)
*   **Build Tool:** Vite (v6+)
*   **Language:** JavaScript (ES6+)
*   **Styling:** Tailwind CSS (v3+), PostCSS
*   **Component Libraries:** shadcn/ui, Magic UI (built on Radix UI, Tailwind)
*   **Routing:** React Router DOM (v7+)
*   **Key Libraries:** `lucide-react` (icons), `react-markdown`, `react-syntax-highlighter`, `sonner` (toasts), `date-fns`, `clsx`, `tailwind-merge`, `tailwindcss-animate`

**Backend/Main Process (Node.js within Electron):**
*   **AI SDK:** `@cerebras/cerebras_cloud_sdk`
*   **MCP SDK:** `@modelcontextprotocol/sdk` (v1.7+)
*   **Storage:** `electron-json-storage` (potential alternative/supplement to localStorage)
*   **Utilities:** `uuid`, `node-fetch` (v2)

**Development & Build:**
*   **Package Manager:** pnpm (v10+)
*   **Linting:** ESLint (v9+)
*   **Formatting:** Prettier
*   **Build/Packaging:** Vite (frontend), electron-builder (app packaging)
*   **Concurrency:** `concurrently`
*   **Environment:** `cross-env`
*   **Task Management:** Task Master AI (managed via MCP)

**Configuration:** Settings managed via React Context (`SettingsContext`) potentially persisted using `localStorage` or `electron-json-storage`. 