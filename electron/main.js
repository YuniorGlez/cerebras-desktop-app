const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Determine if running in development
const isDev = process.env.NODE_ENV !== 'production';

// Create ~/Library/Logs/Cerebras Desktop if it does not exist
app.setAppLogsPath();
const logFile = path.join(app.getPath('logs'), 'main.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Mirror every console.* call to the file
['log', 'info', 'warn', 'error'].forEach(fn => {
  const orig = console[fn].bind(console);
  console[fn] = (...args) => {
    orig(...args);
    logStream.write(args.map(String).join(' ') + '\n');
  };
});

console.log('Cerebras Desktop started, logging to', logFile);

// Import necessary Electron modules
const { BrowserWindow, ipcMain, screen, shell } = require('electron');

// Import shared models
const { MODEL_CONTEXT_SIZES } = require('../shared/models.js');

// Import handlers
const chatHandler = require('./chatHandler');
const toolHandler = require('./toolHandler');

// Import new manager modules
const { initializeSettingsHandlers, loadSettings } = require('./settingsManager');
const { initializeCommandResolver, resolveCommandPath } = require('./commandResolver');
const mcpManager = require('./mcpManager');
const { initializeWindowManager } = require('./windowManager');
const authManager = require('./authManager');

// Global variable to hold the main window instance
let mainWindow;

// Variable to hold loaded model context sizes
let modelContextSizes = {};

// App initialization sequence
app.whenReady().then(async () => {
  console.log("App Ready. Initializing...");

  // Initialize command resolver first (might be needed by others)
  initializeCommandResolver(app);

  // Load model context sizes from the JS module
  try {
    modelContextSizes = MODEL_CONTEXT_SIZES;
    console.log('Successfully loaded shared model definitions.');
  } catch (error) {
    console.error('Failed to load shared model definitions:', error);
    modelContextSizes = { 'default': { context: 8192, vision_supported: false } }; // Fallback
  }

  // Initialize window manager and get the main window instance
  mainWindow = initializeWindowManager(app, screen, shell, BrowserWindow);
  if (!mainWindow) {
    console.error("Fatal: Main window could not be created. Exiting.");
    app.quit();
    return;
  }

  // Initialize settings handlers (needs app)
  initializeSettingsHandlers(ipcMain, app);

  // Initialize MCP handlers (use module object)
  mcpManager.initializeMcpHandlers(ipcMain, app, mainWindow, loadSettings, resolveCommandPath);

  // Initialize Auth Manager (check will now work)
  console.log("[Main Init] Initializing Auth Manager...");
  if (mcpManager && typeof mcpManager.retryConnectionAfterAuth === 'function') {
    authManager.initialize(mcpManager.retryConnectionAfterAuth);
  } else {
    console.error("[Main] CRITICAL: mcpManager or retryConnectionAfterAuth not available for AuthManager initialization!");
  }

  // --- Register Core App IPC Handlers --- //
  // Chat completion (use module object)
  ipcMain.on('chat-stream', async (event, messages, model) => {
    const currentSettings = loadSettings();
    const { discoveredTools } = mcpManager.getMcpState(); // Use module object
    chatHandler.handleChatStream(event, messages, model, currentSettings, modelContextSizes, discoveredTools);
  });

  // Multidialog query handler
  ipcMain.on('multidialog-query', async (event, userPrompt, targetModels, modelCallConfig) => {
    const currentSettings = loadSettings();
    chatHandler.handleMultidialogQuery(event, userPrompt, targetModels, modelCallConfig, currentSettings);
  });

  // Multidialog synthesis handler (using handle for async return)
  ipcMain.handle('multidialog-synthesize', async (event, originalUserQuery, synthesisInstructions, responses, synthesisModel) => {
    const currentSettings = loadSettings();
    return chatHandler.handleMultidialogSynthesize(event, originalUserQuery, synthesisInstructions, responses, synthesisModel, currentSettings);
  });

  // Tool execution (use module object)
  console.log("[Main Init] Registering execute-tool-call...");
  ipcMain.handle('execute-tool-call', async (event, toolCall) => {
    const { discoveredTools, mcpClients } = mcpManager.getMcpState(); // Use module object
    return toolHandler.handleExecuteToolCall(event, toolCall, discoveredTools, mcpClients);
  });

  // Handler for getting model configurations
  ipcMain.handle('get-model-configs', async () => {
    // Return a copy to prevent accidental modification
    return JSON.parse(JSON.stringify(modelContextSizes));
  });

  // --- Auth IPC Handler ---
  ipcMain.handle('start-mcp-auth-flow', async (event, { serverId, serverUrl }) => {
    if (!serverId || !serverUrl) {
      throw new Error("Missing serverId or serverUrl for start-mcp-auth-flow");
    }
    try {
      console.log(`[Main] Handling start-mcp-auth-flow for ${serverId}`);
      const result = await authManager.initiateAuthFlow(serverId, serverUrl);
      return result;
    } catch (error) {
      console.error(`[Main] Error handling start-mcp-auth-flow for ${serverId}:`, error);
      throw error;
    }
  });

  // --- Post-initialization Tasks --- //
  setTimeout(() => {
    mcpManager.connectConfiguredMcpServers(); // Use module object
  }, 1000);

  console.log("Initialization complete.");
});

// Note: App lifecycle events (window-all-closed, activate) are now handled by windowManager.js

// Keep any essential top-level error handling or logging if needed
process.on('uncaughtException', (error) => {
  console.error('Unhandled Exception:', error);
  // Optionally: Log to file, show dialog, etc.
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Correct path relative to main.js
    }
  });

  // Use correct Vite port 5173 for development
  const startURL = isDev
    ? 'http://localhost:5173' // Changed port from 3000 to 5173
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}