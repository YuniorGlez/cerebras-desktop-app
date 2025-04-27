# Model Context Protocol (MCP) Integration in Cerebras Desktop

This document details how Cerebras Desktop integrates and utilizes the Model Context Protocol (MCP) to enable the use of external tools by language models.

## Purpose of MCP

MCP allows a language model (like those from Cerebras) to discover and call functions (referred to as "tools") exposed by external services (MCP servers). This extends the model's capabilities beyond text generation, enabling it to interact with APIs, databases, local systems, etc.

## Configuring MCP Integration Points

Cerebras Desktop supports **two primary ways** to integrate MCP tools:

### 1. MCP Servers (Stdio, SSE, StreamableHTTP)

These are external processes or remote services that expose tools via the standard MCP protocols. Configuration happens in the "Settings" tab.

*   **Stdio (Standard Input/Output):**
    *   **Use Case:** Running a local process (Node, Python, compiled binary) as an MCP server.
    *   **Configuration:** `id`, `transport: "stdio"`, `command`, `args` (optional), `env` (optional).
    *   **Management:** Handled by `mcpManager.js` for process lifecycle and communication.
*   **SSE (Server-Sent Events) / Streamable HTTP:**
    *   **Use Case:** Connecting to remote HTTP-based MCP servers.
    *   **Configuration:** `id`, `transport: "sse" | "streamableHttp"`, `url`.
    *   **Authentication:** Supports OAuth2 Authorization Code Grant flow via `authManager.js` if the server requires it.
    *   **Management:** Handled by `mcpManager.js` for connection, health checks, and tool discovery.

*   **Example (JSON - Stdio):**
        {
          "id": "local-node-server",
          "transport": "stdio",
          "command": "node",
          "args": ["/path/to/your/mcp_server.js"],
          "env": { "API_KEY": "some_secret" }
        }

*   **Example (JSON - SSE):**
        {
          "id": "remote-sse-secure",
          "transport": "sse",
          "url": "https://mcp.example.com/v1/stream"
        }

### 2. NPX-Style Command Tools (Planned - Task 12/13)

This mechanism allows integrating tools as standalone command-line scripts or packages, executed on demand, similar to how `npx` runs packages.

*   **Use Case:** Integrating tools that are distributed as CLI applications or scripts without requiring a constantly running server process. Ideal for development tools, utility scripts, or tools that are invoked infrequently.
*   **Concept:**
    1.  **Discovery/Registry:** A mechanism to discover available npx-style tools (e.g., scanning a specific directory, reading a configuration file, or a future online registry).
    2.  **Installation/Setup:** Tools might require an initial setup step (e.g., `npm install`, downloading a binary) which would be managed by the system.
    3.  **Execution:** When the model calls an npx-style tool, the application:
        *   Locates the tool's executable/script.
        *   Constructs the necessary command-line arguments based on the tool call input.
        *   Executes the command in a sandboxed environment (e.g., a separate process).
        *   Captures the output (stdout/stderr) from the command.
        *   Formats the output as the tool result.
    4.  **Management UI (Task 13):** A dedicated UI section for users to browse, install, update, and remove these npx-style tools.
*   **Configuration:** Details TBD, but likely involve defining the tool name, the command to execute, how to map input arguments, and potentially setup/installation instructions.
*   **Implementation:** This feature is part of the current development roadmap (Task 12/13) and relevant components/managers will be added to handle the registry, execution, and UI.

## Connection Management (`mcpManager.js` - Primarily for Servers)

*   **Connection/Disconnection:** `mcpManager.js` handles the lifecycle of connections to the configured servers. It attempts automatic connection on startup and allows manual connection/disconnection from `ToolsPanel.jsx`.
*   **Tool Discovery:** Upon successful connection, it calls the MCP server's `listTools` RPC method to get the list of available tools, including their name, description, and input schema (JSON Schema).
*   **State and Notification:** It maintains the state of connected servers (`mcpClients`) and discovered tools (`discoveredTools`). It notifies the UI (`App.jsx`) of any changes (`notifyMcpServerStatus`) to update the UI (e.g., `ToolsPanel`, status indicator).
*   **Health Checks:** For each active connection, `mcpManager` sets up a periodic interval that runs `listTools` as a way to verify the server is still responding. If it fails repeatedly, the connection is considered lost and cleaned up.
*   **Logs (Stdio):** For `stdio` connections, it captures the `stderr` output from the MCP server process, stores it temporarily, and makes it available for viewing in `LogViewerModal.jsx`.

## Tool Execution (`toolHandler.js` - Primarily for Servers)

*(Note: The execution flow for npx-style tools will likely involve a different handler or path within the main process, focusing on process execution rather than MCP client communication)*

When the Cerebras model generates a `tool_call` for a **server-based tool**:

1.  The request reaches `toolHandler.handleExecuteToolCall` (see `CORE_PROCESSES.md`).
2.  `toolHandler` identifies the `serverId` associated with the requested tool.
3.  It gets the active MCP client instance (`mcpClients`) for that `serverId` from `mcpManager`.
4.  It calls the `callTool({ name: toolName, input: parsedArgs })` RPC method on the client instance.
5.  The MCP SDK handles communication with the MCP server (via stdio, SSE, or HTTP).
6.  The MCP server executes the tool with the provided arguments.
7.  The MCP server returns the result (or an error).
8.  `toolHandler` receives the response, processes it (limits size, stringifies), and returns it to `App.jsx`.

## Authentication (OAuth2 for SSE/HTTP Servers) (`authManager.js`)

*   **Need:** Remote MCP servers (SSE/StreamableHTTP) may require authentication to protect access to tools. Cerebras Desktop implements the OAuth 2.0 Authorization Code Grant flow with PKCE.
*   **Flow:**
    1.  The initial connection attempt (without authentication) fails with a specific error (`AuthorizationRequiredError`).
    2.  The UI (`ToolsPanel`) offers the user an "Authorize" button to start the flow.
    3.  `authManager` coordinates the flow: starts a local callback server, registers the client (if needed), opens the MCP server's authorization URL in the system browser.
    4.  The user authorizes in the browser.
    5.  The MCP server redirects to the local callback with an authorization code.
    6.  `authManager` exchanges the code for tokens (access/refresh).
    7.  Tokens and client information are saved securely using `electron-json-storage`.
    8.  `authManager` notifies `mcpManager` to retry the connection.
*   **Reconnection:** `mcpManager` retries the connection, passing the obtained tokens to the SSE/HTTP transport using a `StaticAuthProvider`.
*   **Persistence:** Tokens and client info are stored persistently, so the authorization flow should only be necessary once per server (or until tokens expire and cannot be refreshed).

## Tool Approval (UI)

*(Note: The approval mechanism will apply to both server-based and npx-style tools)*

To give the user control over executing potentially sensitive or costly tools:

*   The application checks the approval status in `localStorage` before executing any tool.
*   **Statuses:**
    *   `prompt` (default): Shows `ToolApprovalModal` for user decision.
    *   `always`: Always execute this specific tool without asking.
    *   `yolo` (global): Execute *any* tool without asking.
    *   `deny` (one-time decision): Do not execute the tool this time.
*   The user's choice ('always', 'yolo') is saved in `localStorage` for future calls.