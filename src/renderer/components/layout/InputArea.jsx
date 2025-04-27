import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";

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
    // Controlled vs local state
    const isControlled = typeof inputValue === 'string' && typeof setInputValue === 'function';
    const [localValue, setLocalValue] = useState("");
    const value = isControlled ? inputValue : localValue;
    const onChange = isControlled ? (e) => setInputValue(e.target.value) : (e) => setLocalValue(e.target.value);
    // Maximize dialog state
    const [isMaximized, setIsMaximized] = useState(false);
    // Ref to textarea for auto-resizing
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

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
            <div className="w-full flex items-center gap-2">
                <form className="flex-1 flex items-center gap-2" onSubmit={onSubmit}>
                    {/* Expanding textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={onChange}
                        disabled={loading || isPaused}
                        placeholder="Type a message... (Shift+Enter for newline)"
                        className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto placeholder:text-muted-foreground max-h-60"
                        rows={1}
                    />
                    {/* Send button */}
                    <button
                        type="submit"
                        className="ml-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-primary/90"
                        disabled={loading || isPaused || !value.trim()}
                    >
                        Send
                    </button>
                </form>
                {/* Maximize dialog trigger */}
                <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
                    <DialogTrigger asChild>
                        <button type="button" className="p-2 text-foreground hover:text-primary" disabled={loading || isPaused}>
                            <Maximize2 size={20} />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl w-full">
                        <DialogHeader>
                            <DialogTitle>Compose Message</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={onChange}
                                disabled={loading || isPaused}
                                placeholder="Type a message..."
                                className="w-full h-64 rounded-md border border-input bg-background p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto"
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <button
                                    className="ml-auto px-4 py-2 bg-primary text-white rounded"
                                    disabled={loading || isPaused || !value.trim()}
                                    onClick={() => { handleSendMessage(value); setIsMaximized(false); }}
                                >
                                    Send
                                </button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default InputArea; 