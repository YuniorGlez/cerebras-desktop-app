import React, { useState, useCallback } from 'react';

// Hooks
import { useSettings } from '../hooks/useSettings';

// Settings Components
import SettingsSection from '../components/settings/SettingsSection';
import ApiKeySettings from '../components/settings/ApiKeySettings';
import GenerationParamsSettings from '../components/settings/GenerationParamsSettings';
import CustomPromptSettings from '../components/settings/CustomPromptSettings';
import McpServerList from '../components/settings/McpServerList';
import McpServerForm from '../components/settings/McpServerForm';
import ToolApprovalSettings from '../components/settings/ToolApprovalSettings';
import SettingsStatusIndicator from '../components/layout/SettingsStatusIndicator'; // Assuming moved to layout

function Settings() {
  const {
    settings,
    // setSettings, // Use updateSetting or specific handlers instead of direct set
    updateSetting,
    isSaving,
    saveStatus,
    isLoading,
    settingsPath,
    reloadSettingsFromDisk,
  } = useSettings();

  // Local state for managing the MCP server editing process
  const [editingServerId, setEditingServerId] = useState(null);
  const [currentServerConfigForEdit, setCurrentServerConfigForEdit] = useState(null);

  // --- Event Handlers for Settings Page ---

  const handleUpdateSetting = useCallback((key, value) => {
    updateSetting(key, value);
  }, [updateSetting]);

  // Handler specifically for number inputs (like sliders)
  const handleUpdateNumberSetting = useCallback((key, value) => {
    // Optional: Add validation if needed
    updateSetting(key, value);
  }, [updateSetting]);

  // Start editing an MCP server
  const handleStartEditingMcpServer = useCallback((id, config) => {
    setEditingServerId(id);
    setCurrentServerConfigForEdit(config);
    // Optional: Scroll to the form
    const formElement = document.getElementById('mcp-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Cancel editing an MCP server
  const handleCancelEditingMcpServer = useCallback(() => {
    setEditingServerId(null);
    setCurrentServerConfigForEdit(null);
  }, []);

  // Save/Update an MCP server
  const handleSaveMcpServer = useCallback((id, config) => {
    const updatedMcpServers = {
      ...(settings.mcpServers || {}),
      [id]: config,
    };
    updateSetting('mcpServers', updatedMcpServers);
    setEditingServerId(null); // Exit editing mode after save
    setCurrentServerConfigForEdit(null);
  }, [settings.mcpServers, updateSetting]);

  // Remove an MCP server
  const handleRemoveMcpServer = useCallback((id) => {
    const updatedMcpServers = { ...(settings.mcpServers || {}) };
    delete updatedMcpServers[id];
    updateSetting('mcpServers', updatedMcpServers);

    // If the removed server was being edited, cancel the edit
    if (editingServerId === id) {
      handleCancelEditingMcpServer();
    }
  }, [settings.mcpServers, updateSetting, editingServerId, handleCancelEditingMcpServer]);

  // Handle the reset action from ToolApprovalSettings
  const handleToolApprovalReset = useCallback((status) => {
    // The actual reset logic is inside ToolApprovalSettings component
    // This handler is mainly for displaying status messages via the useSettings hook
    // We can reuse the saveStatus state for this temporary message
    // Note: useSettings hook needs modification to accept direct status setting OR we use a local state here.
    // For now, let's just log it.
    console.log('Tool Approval Reset Status:', status);
    // TODO: Potentially update useSettings to allow setting status message directly
    // setSaveStatus({ type: status.success ? 'success' : 'error', message: status.message });
    // setTimeout(() => setSaveStatus(null), 2000);
  }, []);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full text-gray-400">
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Status Message Container - Placed outside main scroll area */}
      <SettingsStatusIndicator isSaving={isSaving} saveStatus={saveStatus} />

      <main className="flex-1 overflow-y-auto p-8 bg-custom-dark-bg">
        <div className="max-w-2xl mx-auto bg-user-message-bg rounded-lg p-6 shadow-lg">

          {settingsPath && (
            <div className="mb-4 p-3 rounded text-sm bg-custom-dark-bg border border-gray-700">
              <p className="text-gray-400">
                Settings file location: <span className="font-mono text-gray-300 break-all">{settingsPath}</span>
              </p>
              <button
                onClick={reloadSettingsFromDisk}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                Reload from Disk
              </button>
            </div>
          )}

          <SettingsSection title="Cerebras API Settings">
            <ApiKeySettings
              apiKey={settings.CEREBRAS_API_KEY}
              onChange={handleUpdateSetting}
            />
          </SettingsSection>

          <SettingsSection title="Generation Parameters">
            <GenerationParamsSettings
              temperature={settings.temperature}
              topP={settings.top_p}
              onNumberChange={handleUpdateNumberSetting}
            />
          </SettingsSection>

          <SettingsSection title="Custom System Prompt" description="Appended to the default system prompt.">
            <CustomPromptSettings
              prompt={settings.customSystemPrompt}
              onChange={handleUpdateSetting}
            />
          </SettingsSection>

          {/* MCP Server Management Section */}
          <SettingsSection title="MCP Servers" description="Configure servers providing tools for the AI.">
            <McpServerList
              servers={settings.mcpServers}
              onEdit={handleStartEditingMcpServer}
              onRemove={handleRemoveMcpServer}
            // Pass disabledServers and onToggleServer if implementing enable/disable
            />
            <McpServerForm
              onSave={handleSaveMcpServer}
              editingServerId={editingServerId}
              initialServerConfig={currentServerConfigForEdit}
              onCancelEdit={handleCancelEditingMcpServer}
            />
          </SettingsSection>

          {/* Tool Approval Reset Section */}
          <SettingsSection title="Tool Call Permissions" description="Reset all saved permissions for tool calls.">
            <ToolApprovalSettings onReset={handleToolApprovalReset} />
          </SettingsSection>

        </div>
      </main>
    </div>
  );
}

export default Settings; 