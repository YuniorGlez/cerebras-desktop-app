import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage application settings.
 * Handles loading settings from the main process, saving them back with debouncing,
 * and managing the loading/saving status.
 */
export function useSettings() {
    const [settings, setSettings] = useState({
        CEREBRAS_API_KEY: '',
        temperature: 0.7,
        top_p: 0.95,
        mcpServers: {},
        disabledMcpServers: [],
        customSystemPrompt: '',
        userName: 'User',
        userAvatarUrl: 'https://i.pravatar.cc/150?img=1',
        // Removed User Profile Fields from here
    });
    const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error' | 'info', message: string } | null
    const [isSaving, setIsSaving] = useState(false);
    const [settingsPath, setSettingsPath] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Track initial loading

    const statusTimeoutRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    // --- Effects ---

    // Load initial settings on mount
    useEffect(() => {
        const loadInitialSettings = async () => {
            setIsLoading(true);
            try {
                const settingsData = await window.electron.getSettings();
                // Ensure essential fields exist with defaults if necessary
                const validatedSettings = {
                    CEREBRAS_API_KEY: settingsData.CEREBRAS_API_KEY || '',
                    temperature: typeof settingsData.temperature === 'number' ? settingsData.temperature : 0.7,
                    top_p: typeof settingsData.top_p === 'number' ? settingsData.top_p : 0.95,
                    mcpServers: typeof settingsData.mcpServers === 'object' && settingsData.mcpServers !== null ? settingsData.mcpServers : {},
                    disabledMcpServers: Array.isArray(settingsData.disabledMcpServers) ? settingsData.disabledMcpServers : [],
                    customSystemPrompt: settingsData.customSystemPrompt || '',
                    userName: settingsData.userName || 'User',
                    userAvatarUrl: settingsData.userAvatarUrl || 'https://i.pravatar.cc/150?img=1',
                };
                setSettings(validatedSettings);
            } catch (error) {
                console.error('Error loading settings:', error);
                setSaveStatus({ type: 'error', message: `Failed to load settings: ${error.message}` });
                // Keep default initial state on error
            } finally {
                setIsLoading(false);
            }
        };

        const getSettingsPath = async () => {
            try {
                const path = await window.electron.getSettingsPath();
                setSettingsPath(path);
            } catch (error) {
                console.error('Error getting settings path:', error);
            }
        };

        loadInitialSettings();
        getSettingsPath();

        // Cleanup timeouts on unmount
        return () => {
            if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // --- Saving Logic ---

    const saveSettings = useCallback((updatedSettings) => {
        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set saving indicator immediately without status message
        setIsSaving(true);
        setSaveStatus(null); // Clear previous status immediately

        // Debounce the actual save operation
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const settingsToSave = {
                    ...updatedSettings,
                    // Ensure disabledMcpServers is always an array
                    disabledMcpServers: updatedSettings.disabledMcpServers || []
                };

                const result = await window.electron.saveSettings(settingsToSave);
                if (result.success) {
                    setSaveStatus({ type: 'success', message: 'Settings saved' });
                    // Clear success message after delay
                    if (statusTimeoutRef.current) {
                        clearTimeout(statusTimeoutRef.current);
                    }
                    statusTimeoutRef.current = setTimeout(() => {
                        setSaveStatus(null);
                    }, 2000);
                } else {
                    console.error('Failed to save settings:', result.error);
                    setSaveStatus({ type: 'error', message: `Failed to save: ${result.error || 'Unknown error'}` });
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                setSaveStatus({ type: 'error', message: `Error saving: ${error.message}` });
            } finally {
                setIsSaving(false);
            }
        }, 800); // Debounce time
    }, []); // No dependencies needed as it uses the updatedSettings argument

    // --- Helper Functions ---

    // Helper to update a specific setting field and trigger save
    const updateSetting = useCallback((key, value) => {
        setSettings(prevSettings => {
            const updated = { ...prevSettings, [key]: value };
            saveSettings(updated); // Save the newly updated state
            return updated;
        });
    }, [saveSettings]); // Depends on saveSettings

    // Reload settings from disk
    const reloadSettingsFromDisk = useCallback(async () => {
        setIsSaving(true); // Use saving indicator for loading feedback
        setSaveStatus({ type: 'info', message: 'Reloading settings...' });
        try {
            const result = await window.electron.reloadSettings();
            if (result.success) {
                // Re-validate settings on reload
                const validatedSettings = {
                    CEREBRAS_API_KEY: result.settings.CEREBRAS_API_KEY || '',
                    temperature: typeof result.settings.temperature === 'number' ? result.settings.temperature : 0.7,
                    top_p: typeof result.settings.top_p === 'number' ? result.settings.top_p : 0.95,
                    mcpServers: typeof result.settings.mcpServers === 'object' && result.settings.mcpServers !== null ? result.settings.mcpServers : {},
                    disabledMcpServers: Array.isArray(result.settings.disabledMcpServers) ? result.settings.disabledMcpServers : [],
                    customSystemPrompt: result.settings.customSystemPrompt || '',
                    userName: result.settings.userName || 'User',
                    userAvatarUrl: result.settings.userAvatarUrl || 'https://i.pravatar.cc/150?img=1',
                };
                setSettings(validatedSettings);
                setSaveStatus({ type: 'success', message: 'Settings reloaded' });
            } else {
                setSaveStatus({ type: 'error', message: `Failed to reload: ${result.error}` });
            }
            // Clear status message after delay
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
            statusTimeoutRef.current = setTimeout(() => {
                setSaveStatus(null);
            }, 2000);
        } catch (error) {
            console.error('Error reloading settings:', error);
            setSaveStatus({ type: 'error', message: `Error reloading: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    }, []); // No dependencies needed

    // --- Return Value ---

    return {
        settings,
        setSettings: (newSettings) => { // Allow direct setting if needed, triggers save
            setSettings(newSettings);
            saveSettings(newSettings);
        },
        updateSetting, // Preferred method for single field updates
        isSaving,
        saveStatus,
        isLoading, // Expose loading state
        settingsPath,
        reloadSettingsFromDisk,
    };
} 