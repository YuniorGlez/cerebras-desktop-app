import React, { useState } from 'react';

// Simple component to display status indicator
const StatusIndicator = ({ loading, message, onRefresh }) => {
    return (
        <>
            {loading && (
                <div className="status-indicator loading">
                    <div className="loading-spinner"></div>
                    <span>{message}</span>
                </div>
            )}
            {!loading && (
                <div className="status-indicator">
                    <span>{message || "No tools available"}</span>
                    <button className="refresh-button" onClick={onRefresh} title="Refresh MCP tools">
                        <span>↻</span>
                    </button>
                </div>
            )}
        </>
    );
};

const InputArea = ({
    mcpServersStatus,
    toggleToolsPanel,
    refreshMcpTools,
    handleSendMessage,
    loading,
    isPaused,
    hideMcpStatusBar,
    inputValue,
    setInputValue
}) => {
    // Removed local state management if controlled
    const isControlled = typeof inputValue === 'string' && typeof setInputValue === 'function';
    const [localValue, setLocalValue] = useState("");
    const value = isControlled ? inputValue : localValue;
    const onChange = isControlled ? (e) => setInputValue(e.target.value) : (e) => setLocalValue(e.target.value);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!value.trim() || loading || isPaused) return;
        handleSendMessage(value);
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* MCP tools status bar, only if not hidden */}
            {!hideMcpStatusBar && (
                <div className="w-full flex items-center gap-2 mb-2">
                    <div className="tools-container">
                        <div className="tools-button" onClick={toggleToolsPanel} title="Toggle Tools Panel">
                            {/* SVG Icon */}
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <StatusIndicator
                            loading={mcpServersStatus.loading}
                            message={mcpServersStatus.message}
                            onRefresh={refreshMcpTools}
                        />
                    </div>
                </div>
            )}
            <form className="w-full flex items-center gap-2" onSubmit={onSubmit}>
                <input
                    className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder:text-muted-foreground"
                    value={value}
                    onChange={onChange}
                    disabled={loading || isPaused}
                    placeholder="Type a message... (Shift+Enter for newline)"
                />
                <button
                    type="submit"
                    disabled={loading || isPaused || !value.trim()}
                    className={`ml-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${loading || isPaused ? '' : 'hover:bg-primary/90'}`}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default InputArea; 