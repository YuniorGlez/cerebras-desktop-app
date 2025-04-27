import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display the list of configured MCP Servers.
 */
function McpServerList({ servers, onEdit, onRemove }) {
    const serverEntries = Object.entries(servers || {});

    if (serverEntries.length === 0) {
        return (
            <div className="mb-6 p-4 bg-custom-dark-bg rounded-md text-center text-gray-500">
                No MCP servers configured. Add one below.
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h4 className="font-medium text-sm text-gray-300 mb-2">Configured Servers:</h4>
            <div className="border border-gray-700 rounded-md overflow-hidden">
                {serverEntries.map(([id, config]) => (
                    <div
                        key={id}
                        className="p-3 border-b border-gray-700 last:border-b-0 bg-custom-dark-bg"
                        data-testid={`mcp-server-item-${id}`}
                    >
                        {/* Top row for ID and buttons */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-300 break-all mr-4 flex-1 min-w-0">
                                {id}
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 ml-2">
                                <button
                                    onClick={() => onEdit(id, config)}
                                    className="text-blue-400 hover:text-blue-300 text-sm py-1 px-2 bg-blue-900 hover:bg-blue-800 rounded transition-colors duration-150"
                                    aria-label={`Edit server ${id}`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onRemove(id)}
                                    className="text-red-400 hover:text-red-300 text-sm py-1 px-2 bg-red-900 hover:bg-red-800 rounded transition-colors duration-150"
                                    aria-label={`Remove server ${id}`}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Bottom section for config details */}
                        <div className="text-sm text-gray-500">
                            {config.transport === 'sse' ? (
                                <div><span className="font-mono break-all">Type: SSE | URL: {config.url}</span></div>
                            ) : config.transport === 'streamableHttp' ? (
                                <div><span className="font-mono break-all">Type: Streamable HTTP | URL: {config.url}</span></div>
                            ) : (
                                <>
                                    <div><span className="font-mono break-all">Type: Stdio | $ {config.command} {(config.args || []).join(' ')}</span></div>
                                    {config.env && Object.keys(config.env).length > 0 && (
                                        <div className="mt-1">
                                            <span className="text-xs text-gray-400">Environment variables:</span>
                                            <div className="pl-2 mt-1">
                                                {Object.entries(config.env).map(([key, value]) => (
                                                    <div key={key} className="text-xs font-mono break-all">
                                                        <span className="text-gray-300">{key}=</span><span className="text-gray-400">
                                                            {/* Mask sensitive values (basic example) */}
                                                            {key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')
                                                                ? '********'
                                                                : (typeof value === 'string' && value.length > 30 ? `${value.substring(0, 27)}...` : value)
                                                            }
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

McpServerList.propTypes = {
    servers: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired, // Expects (id, config)
    onRemove: PropTypes.func.isRequired, // Expects (id)
    // disabledServers: PropTypes.arrayOf(PropTypes.string), // Future: for enable/disable
    // onToggleServer: PropTypes.func, // Future: for enable/disable
};

export default McpServerList; 