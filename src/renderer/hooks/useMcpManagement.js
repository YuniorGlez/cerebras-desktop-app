import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage MCP (Model Context Protocol) tools and server connections.
 */
export const useMcpManagement = () => {
    const [mcpTools, setMcpTools] = useState([]);
    const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
    const [mcpServersStatus, setMcpServersStatus] = useState({ loading: false, message: "" });

    // Function to update the server status display
    const updateServerStatusDisplay = useCallback((tools, settings) => {
        try {
            const toolCount = Array.isArray(tools) ? tools.length : 0;
            let message = `${toolCount} tools available`;

            if (settings && settings.mcpServers) {
                const configuredCount = Object.keys(settings.mcpServers).length;
                if (configuredCount > 0) {
                    const connectedServerIds = new Set(tools?.map(tool => tool.serverId).filter(Boolean) || []);
                    const connectedCount = connectedServerIds.size;
                    if (connectedCount === configuredCount) {
                        message = `${toolCount} tools, ${connectedCount}/${configuredCount} MCP servers connected`;
                    } else {
                        message = `${toolCount} tools, ${connectedCount}/${configuredCount} MCP servers connected`; // Shows partial connection
                        if (connectedCount === 0) {
                            message = `${toolCount} tools, No MCP servers connected (${configuredCount} configured)`;
                        }
                    }
                } else {
                    message = `${toolCount} tools, No MCP servers configured`;
                }
            } else {
                // Keep default message if no server settings found
            }
            setMcpServersStatus({ loading: false, message });
        } catch (error) {
            console.error('Error updating server status display:', error);
            setMcpServersStatus({ loading: false, message: "Error updating status" });
        }
    }, []); // No dependencies needed for this pure calculation logic

    // Effect for initial tool loading and setting up listener
    useEffect(() => {
        let isMounted = true;
        let removeListener = null;

        const loadInitialTools = async () => {
            if (!isMounted) return;
            setMcpServersStatus({ loading: true, message: "Connecting to MCP servers..." });
            try {
                // eslint-disable-next-line no-undef
                const settings = await window.electron.getSettings();
                // eslint-disable-next-line no-undef
                const mcpToolsResult = await window.electron.getMcpTools();

                if (isMounted) {
                    const currentTools = mcpToolsResult?.tools || [];
                    setMcpTools(currentTools);
                    updateServerStatusDisplay(currentTools, settings);
                }
            } catch (error) {
                console.error('Error loading initial MCP tools:', error);
                if (isMounted) {
                    setMcpServersStatus({ loading: false, message: "Error loading tools" });
                }
            }
        };

        loadInitialTools();

        // Set up event listener for MCP server status changes
        // eslint-disable-next-line no-undef
        removeListener = window.electron.onMcpServerStatusChanged(async (data) => {
            if (isMounted && data && data.tools !== undefined) {
                try {
                    // eslint-disable-next-line no-undef
                    const currentSettings = await window.electron.getSettings();
                    setMcpTools(data.tools);
                    updateServerStatusDisplay(data.tools, currentSettings);
                } catch (err) {
                    console.error("Error fetching settings for MCP status update:", err);
                    // Fallback: update status with potentially stale settings info or none
                    setMcpTools(data.tools);
                    updateServerStatusDisplay(data.tools, null);
                }
            }
        });

        // Cleanup function
        return () => {
            isMounted = false;
            if (removeListener) {
                removeListener();
            }
        };
    }, [updateServerStatusDisplay]); // Include the memoized function

    // Disconnect from an MCP server
    const disconnectMcpServer = useCallback(async (serverId) => {
        try {
            // eslint-disable-next-line no-undef
            const result = await window.electron.disconnectMcpServer(serverId);
            if (result?.success) {
                // Refresh state explicitly after disconnect if needed (or rely on listener)
                // await refreshMcpTools(); // Option: force refresh
                return true;
            } // Listener should update the state
            return false;
        } catch (error) {
            console.error('Error disconnecting from MCP server:', error);
            return false;
        }
    }, []);

    // Reconnect to an MCP server
    const reconnectMcpServer = useCallback(async (serverId) => {
        setMcpServersStatus(prev => ({ ...prev, loading: true, message: `Reconnecting to ${serverId}...` }));
        try {
            // eslint-disable-next-line no-undef
            const settings = await window.electron.getSettings();
            if (!settings?.mcpServers?.[serverId]) {
                throw new Error(`Server configuration not found for ${serverId}`);
            }
            const serverConfig = settings.mcpServers[serverId];

            // eslint-disable-next-line no-undef
            const result = await window.electron.connectMcpServer({ ...serverConfig, id: serverId });

            // Listener should handle updating tools/status, but return result for immediate feedback
            if (!result?.success) {
                // If connection failed, update status immediately
                // eslint-disable-next-line no-undef
                const currentTools = await window.electron.getMcpTools();
                updateServerStatusDisplay(currentTools?.tools || [], settings);
            }
            // Returning the full result allows UI to handle requiresAuth etc.
            return result;
        } catch (error) {
            console.error('Error reconnecting to MCP server:', error);
            // Attempt to fetch current state to update status display after error
            try {
                // eslint-disable-next-line no-undef
                const settings = await window.electron.getSettings();
                // eslint-disable-next-line no-undef
                const currentTools = await window.electron.getMcpTools();
                updateServerStatusDisplay(currentTools?.tools || [], settings);
            } catch (statusError) {
                console.error('Error fetching status after reconnect error:', statusError);
                setMcpServersStatus({ loading: false, message: "Error reconnecting" });
            }
            return { success: false, error: error.message || 'Unknown error', requiresAuth: false };
        }
    }, [updateServerStatusDisplay]);

    // Explicitly refresh MCP tools and status
    const refreshMcpTools = useCallback(async () => {
        setMcpServersStatus({ loading: true, message: "Refreshing MCP connections..." });
        try {
            // eslint-disable-next-line no-undef
            const settings = await window.electron.getSettings();
            // eslint-disable-next-line no-undef
            const mcpToolsResult = await window.electron.getMcpTools();
            const currentTools = mcpToolsResult?.tools || [];
            setMcpTools(currentTools);
            updateServerStatusDisplay(currentTools, settings);
        } catch (error) {
            console.error('Error refreshing MCP tools:', error);
            setMcpServersStatus({ loading: false, message: "Error refreshing tools" });
        }
    }, [updateServerStatusDisplay]);

    // Toggle panel visibility
    const toggleToolsPanel = useCallback(() => {
        setIsToolsPanelOpen(prev => !prev);
        // Optionally refresh tools when opening the panel
        // if (!isToolsPanelOpen) { refreshMcpTools(); }
    }, [isToolsPanelOpen, refreshMcpTools]); // Need isToolsPanelOpen dependency if used conditionally

    const closeToolsPanel = useCallback(() => {
        setIsToolsPanelOpen(false);
    }, []);

    return {
        mcpTools,
        isToolsPanelOpen,
        mcpServersStatus,
        toggleToolsPanel,
        closeToolsPanel,
        disconnectMcpServer,
        reconnectMcpServer,
        refreshMcpTools,
    };
};
