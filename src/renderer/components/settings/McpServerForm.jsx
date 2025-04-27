import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMcpServerForm } from '../../hooks/useMcpServerForm';

/**
 * Form component for adding or editing MCP Server configurations.
 * Uses the useMcpServerForm hook to manage its internal state and logic.
 */
function McpServerForm({ onSave, onCancelEdit, editingServerId, initialServerConfig }) {
    const {
        serverFormData,
        jsonInput,
        useJsonInput,
        jsonError,
        newEnvVar,
        handleNewMcpServerChange,
        handleTransportChange,
        handleEnvVarChange,
        addEnvVar,
        removeEnvVar,
        handleJsonInputChange,
        parseJsonInput,
        parseArgsString,
        switchToFormView,
        switchToJsonView,
        resetForm,
        populateFormForEdit,
    } = useMcpServerForm();

    // Populate form when editingServerId or initialServerConfig changes
    useEffect(() => {
        if (editingServerId && initialServerConfig) {
            populateFormForEdit(editingServerId, initialServerConfig);
        } else {
            // If not editing, ensure the form is reset
            // This handles cases like finishing an edit or removing the server being edited
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingServerId, initialServerConfig]); // Only re-run if the server being edited changes

    const handleSubmit = (e) => {
        e.preventDefault();

        let finalServerConfig;
        const serverId = serverFormData.id; // ID comes from the form state

        if (!serverId || !serverId.trim()) {
            alert("Server ID is required."); // Basic validation feedback
            return;
        }

        if (useJsonInput) {
            const parsedConfig = parseJsonInput();
            if (!parsedConfig) {
                // Error is already set by parseJsonInput
                return;
            }
            finalServerConfig = parsedConfig;
        } else {
            // Use form state
            if (serverFormData.transport === 'stdio') {
                if (!serverFormData.command || !serverFormData.command.trim()) {
                    alert('Command is required for stdio transport'); // Basic validation
                    return;
                }
                const args = parseArgsString(serverFormData.args);
                finalServerConfig = {
                    transport: 'stdio',
                    command: serverFormData.command.trim(),
                    args,
                    env: serverFormData.env,
                };
            } else { // sse or streamableHttp
                if (!serverFormData.url || !serverFormData.url.trim()) {
                    alert(`URL is required for ${serverFormData.transport.toUpperCase()} transport`);
                    return;
                }
                try {
                    new URL(serverFormData.url); // Basic URL validation
                } catch (urlError) {
                    alert(`Invalid URL: ${urlError.message}`);
                    return;
                }
                finalServerConfig = {
                    transport: serverFormData.transport,
                    url: serverFormData.url.trim(),
                };
            }
        }

        // Call the onSave prop provided by the parent Settings component
        onSave(serverId, finalServerConfig);

        // Reset form state internally after successful save submission
        resetForm();
    };

    return (
        <div id="mcp-form" className="border border-gray-700 rounded-md p-4">
            <h4 className="font-medium text-sm text-gray-300 mb-3">
                {editingServerId ? `Editing Server: ${editingServerId}` : 'Add New MCP Server:'}
            </h4>

            <div className="mb-4 flex">
                <button
                    type="button"
                    className={`px-4 py-2 text-sm rounded-l transition-colors duration-150 ${!useJsonInput ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    onClick={switchToFormView}
                    disabled={!useJsonInput} // Disable if already in Form view
                    aria-pressed={!useJsonInput}
                >
                    Form
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 text-sm rounded-r transition-colors duration-150 ${useJsonInput ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    onClick={switchToJsonView}
                    disabled={useJsonInput} // Disable if already in JSON view
                    aria-pressed={useJsonInput}
                >
                    JSON
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="server-id" className="block text-sm font-medium text-gray-300 mb-1">
                        Server ID:
                        <span className="text-xs text-gray-500 ml-1">
                            {editingServerId && "(Cannot change ID during edit)"}
                        </span>
                    </label>
                    <input
                        type="text"
                        id="server-id"
                        name="id" // Corresponds to serverFormData key
                        value={serverFormData.id}
                        onChange={handleNewMcpServerChange}
                        className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
                        placeholder="e.g., filesystem, task-master"
                        required
                        disabled={!!editingServerId} // Disable ID field when editing
                    />
                </div>

                {/* Transport Selection */}
                <div className="mb-3">
                    <label htmlFor="server-transport" className="block text-sm font-medium text-gray-300 mb-1">
                        Transport Type:
                    </label>
                    <select
                        id="server-transport"
                        name="transport" // Corresponds to serverFormData key
                        value={serverFormData.transport}
                        onChange={handleTransportChange}
                        disabled={useJsonInput} // Disable if using JSON input
                        className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
                    >
                        <option value="stdio">Standard I/O (stdio)</option>
                        <option value="sse">Server-Sent Events (SSE)</option>
                        <option value="streamableHttp">Streamable HTTP</option>
                    </select>
                </div>

                {!useJsonInput ? (
                    <div className="transition-opacity duration-300 ease-in-out opacity-100">
                        {/* Stdio Specific Fields */}
                        {serverFormData.transport === 'stdio' && (
                            <>
                                <div className="mb-3">
                                    <label htmlFor="server-command" className="block text-sm font-medium text-gray-300 mb-1">
                                        Command:
                                    </label>
                                    <input
                                        type="text"
                                        id="server-command"
                                        name="command" // Corresponds to serverFormData key
                                        value={serverFormData.command}
                                        onChange={handleNewMcpServerChange}
                                        className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm"
                                        placeholder="e.g., npx, python, /path/to/executable"
                                        required={serverFormData.transport === 'stdio'}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="server-args" className="block text-sm font-medium text-gray-300 mb-1">
                                        Arguments <span className="text-xs text-gray-500">(space separated, use quotes for args with spaces)</span>:
                                    </label>
                                    <input
                                        type="text"
                                        id="server-args"
                                        name="args" // Corresponds to serverFormData key
                                        value={serverFormData.args}
                                        onChange={handleNewMcpServerChange}
                                        className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm"
                                        placeholder="e.g., -y @mcp/server /path/to/dir --port 8080"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Environment Variables:
                                    </label>

                                    {Object.keys(serverFormData.env).length > 0 && (
                                        <div className="mb-3 border border-gray-700 rounded-md overflow-hidden">
                                            {Object.entries(serverFormData.env).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center p-2 border-b border-gray-700 last:border-b-0 bg-custom-dark-bg">
                                                    <div className="flex-1 font-mono text-sm break-all mr-2">
                                                        <span className="text-gray-300">{key}=</span>
                                                        <span className="text-gray-400">{value}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEnvVar(key)}
                                                        className="text-red-400 hover:text-red-300 text-xs py-1 px-1 flex-shrink-0"
                                                        aria-label={`Remove environment variable ${key}`}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                        <input
                                            type="text"
                                            value={newEnvVar.key}
                                            onChange={handleEnvVarChange}
                                            name="key"
                                            placeholder="KEY"
                                            className="flex-1 px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={newEnvVar.value}
                                            onChange={handleEnvVarChange}
                                            name="value"
                                            placeholder="VALUE"
                                            className="flex-1 px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={addEnvVar}
                                            disabled={!newEnvVar.key.trim()} // Disable if key is empty
                                            className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                                        >
                                            Add Env Var
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* SSE Specific Fields */}
                        {serverFormData.transport === 'sse' && (
                            <div className="mb-3">
                                <label htmlFor="server-url-sse" className="block text-sm font-medium text-gray-300 mb-1">
                                    SSE URL:
                                </label>
                                <input
                                    type="url"
                                    id="server-url-sse" // Unique ID
                                    name="url" // Corresponds to serverFormData key
                                    value={serverFormData.url}
                                    onChange={handleNewMcpServerChange}
                                    className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm"
                                    placeholder="e.g., http://localhost:8000/sse"
                                    required={serverFormData.transport === 'sse'}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Enter the full URL for the Server-Sent Events endpoint.
                                </p>
                            </div>
                        )}

                        {/* StreamableHTTP Specific Fields */}
                        {serverFormData.transport === 'streamableHttp' && (
                            <div className="mb-3">
                                <label htmlFor="server-url-http" className="block text-sm font-medium text-gray-300 mb-1">
                                    Streamable HTTP URL:
                                </label>
                                <input
                                    type="url"
                                    id="server-url-http" // Unique ID
                                    name="url" // Corresponds to serverFormData key
                                    value={serverFormData.url}
                                    onChange={handleNewMcpServerChange}
                                    className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm"
                                    placeholder="e.g., http://localhost:8080/mcp"
                                    required={serverFormData.transport === 'streamableHttp'}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Enter the full URL for the Streamable HTTP endpoint.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mb-4 transition-opacity duration-300 ease-in-out opacity-100">
                        <label htmlFor="json-input" className="block text-sm font-medium text-gray-300 mb-1">
                            Server Configuration JSON:
                        </label>
                        <textarea
                            id="json-input"
                            value={jsonInput}
                            onChange={handleJsonInputChange}
                            className="w-full px-3 py-2 border border-gray-500 rounded-md bg-transparent text-white placeholder-gray-400 text-sm font-mono"
                            placeholder={`{\n  "transport": "stdio",\n  "command": "npx",\n  "args": ["-y", "..."],\n  "env": { ... }\n}\n\n// OR\n\n{\n  "transport": "sse",\n  "url": "http://localhost:8000/sse"\n}\n\n// OR\n\n{\n  "transport": "streamableHttp",\n  "url": "http://localhost:8080/mcp"\n}`}
                            rows={10}
                            aria-label="Server Configuration JSON input"
                        />
                        {jsonError && (
                            <p className="mt-1 text-sm text-red-400" role="alert">{jsonError}</p>
                        )}
                    </div>
                )}

                <div className="flex space-x-2 mt-4">
                    <button
                        type="submit"
                        className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors duration-150 text-sm"
                    >
                        {editingServerId ? 'Update Server' : 'Add Server'}
                    </button>
                    {editingServerId && (
                        <button
                            type="button"
                            onClick={onCancelEdit} // Use the prop from parent
                            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors duration-150 text-sm"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

McpServerForm.propTypes = {
    onSave: PropTypes.func.isRequired, // Expects (id, config)
    onCancelEdit: PropTypes.func.isRequired,
    editingServerId: PropTypes.string, // ID of the server being edited, or null/undefined if adding
    initialServerConfig: PropTypes.object, // Config of the server being edited
};

export default McpServerForm; 