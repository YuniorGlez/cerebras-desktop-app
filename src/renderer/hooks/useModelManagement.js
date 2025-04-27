import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage model selection, configuration loading, and related state.
 */
export const useModelManagement = () => {
    const [selectedModel, setSelectedModel] = useState('default');
    const [modelConfigs, setModelConfigs] = useState({});
    const [models, setModels] = useState([]);
    const [visionSupported, setVisionSupported] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Effect for initial settings/model loading
    useEffect(() => {
        let isMounted = true;
        const loadInitialSettingsAndModels = async () => {
            try {
                // eslint-disable-next-line no-undef
                const configs = await window.electron.getModelConfigs();
                if (!isMounted) return;
                setModelConfigs(configs);
                const availableModels = Object.keys(configs).filter(key => key !== 'default');
                setModels(availableModels);

                // eslint-disable-next-line no-undef
                const settings = await window.electron.getSettings();
                let effectiveModel = availableModels.length > 0 ? availableModels[0] : 'default';
                if (settings?.model && configs[settings.model]) {
                    effectiveModel = settings.model;
                } else if (settings?.model) {
                    console.warn(`Saved model "${settings.model}" not found. Falling back.`);
                }
                if (isMounted) setSelectedModel(effectiveModel);

            } catch (error) {
                console.error('Error loading initial settings/models:', error);
                // Handle error state if needed, maybe set a status message?
            } finally {
                if (isMounted) setInitialLoadComplete(true);
            }
        };
        loadInitialSettingsAndModels();
        return () => { isMounted = false; }; // Cleanup
    }, []); // Runs once on mount

    // Effect to save selected model (only after initial load)
    useEffect(() => {
        if (!initialLoadComplete || models.length === 0 || !selectedModel || selectedModel === 'default') return;

        let isMounted = true;
        const saveModelSelection = async () => {
            try {
                // eslint-disable-next-line no-undef
                const settings = await window.electron.getSettings();
                if (settings.model !== selectedModel) {
                    console.log(`Saving new model selection: ${selectedModel}`);
                    // eslint-disable-next-line no-undef
                    await window.electron.saveSettings({ ...settings, model: selectedModel });
                }
            } catch (error) {
                // Only log error if component is still mounted
                if (isMounted) console.error('Error saving model selection:', error);
            }
        };

        saveModelSelection();
        return () => { isMounted = false; }; // Cleanup

    }, [selectedModel, initialLoadComplete, models]);

    // Update vision support based on selected model
    useEffect(() => {
        if (modelConfigs && selectedModel && modelConfigs[selectedModel]) {
            const capabilities = modelConfigs[selectedModel] || modelConfigs['default'] || {};
            setVisionSupported(!!capabilities.vision_supported);
        } else {
            setVisionSupported(false);
        }
    }, [selectedModel, modelConfigs]);

    // Expose state and setter for selectedModel
    return {
        selectedModel,
        setSelectedModel, // Allow App to change the model
        models,           // List of available models for UI
        modelConfigs,     // Raw configs if needed elsewhere (though maybe not)
        visionSupported,
        initialLoadComplete,
    };
}; 