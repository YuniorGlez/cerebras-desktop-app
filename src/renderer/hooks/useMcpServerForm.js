import { useState, useCallback } from 'react';

/**
 * Custom hook to manage the state and logic for the MCP Server configuration form.
 * Handles switching between form input and JSON input modes, validation, and parsing.
 */
export function useMcpServerForm() {
    const [serverFormData, setServerFormData] = useState({
        id: '',
        transport: 'stdio', // 'stdio' | 'sse' | 'streamableHttp'
        command: '',
        args: '', // Store args as a single string in the form
        env: {},
        url: ''
    });
    const [jsonInput, setJsonInput] = useState('');
    const [useJsonInput, setUseJsonInput] = useState(false);
    const [jsonError, setJsonError] = useState(null);
    const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '' });

    // --- Form Field Handlers ---

    const handleNewMcpServerChange = useCallback((e) => {
        const { name, value } = e.target;
        setServerFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleTransportChange = useCallback((e) => {
        const transportType = e.target.value;
        setServerFormData(prev => ({
            ...prev,
            transport: transportType,
            // Clear fields not relevant to the new transport type
            command: transportType !== 'stdio' ? '' : prev.command,
            args: transportType !== 'stdio' ? '' : prev.args,
            env: transportType !== 'stdio' ? {} : prev.env,
            url: transportType === 'stdio' ? '' : prev.url
        }));
        setJsonInput(''); // Clear JSON when transport changes
        setJsonError(null);
    }, []);

    const handleEnvVarChange = useCallback((e) => {
        const { name, value } = e.target;
        setNewEnvVar(prev => ({ ...prev, [name]: value }));
    }, []);

    // --- Environment Variable Management (Form only) ---

    const addEnvVar = useCallback(() => {
        if (!newEnvVar.key) return;
        setServerFormData(prev => ({
            ...prev,
            env: {
                ...prev.env,
                [newEnvVar.key]: newEnvVar.value
            }
        }));
        setNewEnvVar({ key: '', value: '' }); // Reset input fields
    }, [newEnvVar]);

    const removeEnvVar = useCallback((keyToRemove) => {
        setServerFormData(prev => {
            const updatedEnv = { ...prev.env };
            delete updatedEnv[keyToRemove];
            return { ...prev, env: updatedEnv };
        });
    }, []);

    // --- JSON Input Handling ---

    const handleJsonInputChange = useCallback((e) => {
        setJsonInput(e.target.value);
        setJsonError(null); // Clear error on input change
    }, []);

    /**
     * Parses the current jsonInput state into a validated server configuration object.
     * Returns the config object on success, or null on failure (sets jsonError).
     */
    const parseJsonInput = useCallback(() => {
        try {
            if (!jsonInput.trim()) {
                throw new Error("JSON input is empty");
            }
            const parsedJson = JSON.parse(jsonInput);

            if (typeof parsedJson !== 'object' || parsedJson === null) {
                throw new Error("JSON must be an object");
            }

            const serverEntry = {};
            const transport = parsedJson.transport === 'sse' || parsedJson.transport === 'streamableHttp' ? parsedJson.transport : 'stdio';
            serverEntry.transport = transport;

            if (transport === 'stdio') {
                if (typeof parsedJson.command !== 'string' || !parsedJson.command.trim()) {
                    throw new Error("Stdio server config must include a non-empty 'command' string");
                }
                serverEntry.command = parsedJson.command.trim();
                serverEntry.args = Array.isArray(parsedJson.args) ? parsedJson.args : [];
                serverEntry.env = (typeof parsedJson.env === 'object' && parsedJson.env !== null) ? parsedJson.env : {};
                serverEntry.url = '';
            } else { // sse or streamableHttp
                if (typeof parsedJson.url !== 'string' || !parsedJson.url.trim()) {
                    throw new Error(`${transport.toUpperCase()} server config must include a non-empty 'url' string`);
                }
                try {
                    new URL(parsedJson.url); // Validate URL format
                } catch (urlError) {
                    throw new Error(`Invalid URL format for ${transport.toUpperCase()} server: ${urlError.message}`);
                }
                serverEntry.url = parsedJson.url.trim();
                serverEntry.command = '';
                serverEntry.args = [];
                serverEntry.env = {};
            }

            setJsonError(null); // Clear error on successful parse
            return serverEntry;
        } catch (error) {
            setJsonError(error.message);
            return null;
        }
    }, [jsonInput]);

    // --- View Mode Switching ---

    // Helper to parse args string into array (used internally and potentially by caller)
    const parseArgsString = useCallback((argsStr) => {
        if (!argsStr) return [];
        let args = [];
        const trimmedArgsStr = argsStr.trim();
        let current = '';
        let inQuotes = false;
        let quoteChar = null;

        for (let i = 0; i < trimmedArgsStr.length; i++) {
            const char = trimmedArgsStr[i];

            if ((char === '"' || char === "'") && (quoteChar === null || quoteChar === char)) {
                if (inQuotes) {
                    inQuotes = false;
                    quoteChar = null;
                } else {
                    inQuotes = true;
                    quoteChar = char;
                }
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            args.push(current);
        }
        return args;
    }, []);

    // Switches view to Form, converting JSON state if valid
    const switchToFormView = useCallback(() => {
        if (!useJsonInput) return; // Already in form view

        try {
            const parsedConfig = parseJsonInput(); // Use existing parse logic
            if (!parsedConfig) {
                // Keep user in JSON view if current JSON is invalid
                setJsonError(prev => prev || "Invalid JSON. Cannot switch to form view.");
                return;
            }

            // Populate form fields from the successfully parsed JSON
            setServerFormData(prev => ({
                ...prev, // Keep the existing ID
                transport: parsedConfig.transport,
                command: parsedConfig.command || '',
                args: (parsedConfig.args || []).join(' '), // Convert array back to string for form
                env: parsedConfig.env || {},
                url: parsedConfig.url || ''
            }));

            setJsonError(null);
            setUseJsonInput(false);
        } catch (error) {
            // This catch block might be redundant if parseJsonInput handles errors
            console.error("Error parsing JSON to switch to form view:", error);
            setJsonError(`Invalid JSON: ${error.message}. Cannot switch to form view.`);
        }
    }, [useJsonInput, parseJsonInput]);

    // Switches view to JSON, converting form state
    const switchToJsonView = useCallback(() => {
        if (useJsonInput) return; // Already in JSON view

        try {
            let serverConfig = {};
            if (serverFormData.transport === 'stdio') {
                const argsArray = parseArgsString(serverFormData.args);
                serverConfig = {
                    transport: 'stdio',
                    command: serverFormData.command,
                    args: argsArray,
                    env: serverFormData.env
                };
            } else { // sse or streamableHttp
                serverConfig = {
                    transport: serverFormData.transport,
                    url: serverFormData.url
                };
            }

            const jsonString = JSON.stringify(serverConfig, null, 2);
            setJsonInput(jsonString);
            setJsonError(null);
            setUseJsonInput(true);
        } catch (error) {
            console.error("Error converting form state to JSON:", error);
            setJsonError(`Internal error: Failed to generate JSON. ${error.message}`);
        }
    }, [useJsonInput, serverFormData, parseArgsString]);

    // --- Utility Functions ---

    const resetForm = useCallback(() => {
        setServerFormData({
            id: '',
            transport: 'stdio',
            command: '',
            args: '',
            env: {},
            url: ''
        });
        setJsonInput('');
        setUseJsonInput(false);
        setJsonError(null);
        setNewEnvVar({ key: '', value: '' });
    }, []);

    // Populates the form state based on an existing server config object
    const populateFormForEdit = useCallback((serverId, serverConfig) => {
        if (!serverConfig) {
            resetForm();
            return;
        }

        const transport = serverConfig.transport === 'sse' || serverConfig.transport === 'streamableHttp'
            ? serverConfig.transport
            : 'stdio';

        let command = '', argsArray = [], envObject = {}, argsString = '', url = '';
        if (transport === 'stdio') {
            command = serverConfig.command || '';
            argsArray = Array.isArray(serverConfig.args) ? serverConfig.args : [];
            envObject = typeof serverConfig.env === 'object' && serverConfig.env !== null ? serverConfig.env : {};
            argsString = argsArray.join(' ');
        } else { // sse or streamableHttp
            url = serverConfig.url || '';
        }

        setServerFormData({
            id: serverId, // Set the ID of the server being edited
            transport: transport,
            command: command,
            args: argsString,
            env: envObject,
            url: url
        });

        // Also populate the JSON input field based on the structured data
        try {
            let jsonConfig;
            if (transport === 'stdio') {
                jsonConfig = { transport: 'stdio', command, args: argsArray, env: envObject };
            } else {
                jsonConfig = { transport: transport, url };
            }
            const jsonString = JSON.stringify(jsonConfig, null, 2);
            setJsonInput(jsonString);
        } catch (error) {
            console.error("Failed to stringify server config for JSON input during edit population:", error);
            setJsonInput(''); // Clear if error
        }

        setUseJsonInput(false); // Default to form view when editing starts
        setJsonError(null);
        setNewEnvVar({ key: '', value: '' }); // Reset new env var input

    }, [resetForm]);

    // --- Return Value ---

    return {
        // State
        serverFormData,
        jsonInput,
        useJsonInput,
        jsonError,
        newEnvVar,

        // Setters/Handlers
        setServerFormData, // Expose direct setter if needed
        setJsonInput, // Expose direct setter if needed
        setUseJsonInput, // Expose direct setter if needed
        handleNewMcpServerChange,
        handleTransportChange,
        handleEnvVarChange,
        addEnvVar,
        removeEnvVar,
        handleJsonInputChange,

        // Logic/Utilities
        parseJsonInput,
        parseArgsString,
        switchToFormView,
        switchToJsonView,
        resetForm,
        populateFormForEdit,
    };
} 