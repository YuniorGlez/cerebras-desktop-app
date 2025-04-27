import React, { useRef, useCallback } from 'react';
import MessageList from '../MessageList';
import InitialChatView from './InitialChatView';
import ChatInputControls from './ChatInputControls';
import { useChat } from '../../context/ChatContext';

const ChatArea = ({
    messages,
    messagesEndRef,
    handleSendMessage,
    mcpServersStatus,
    toggleToolsPanel,
    refreshMcpTools,
    loading,
    isPaused,
    visionSupported,
    selectedContextId,
    setSelectedContextId,
    availableContexts,
    selectedPromptId,
    handlePromptSelect,
    availablePrompts,
    inputValue,
    setInputValue,
    isEmptyChat
}) => {
    const { activeChatId, addMessageToChat } = useChat();

    const handleRemoveLastMessage = useCallback(() => {
        const currentMessages = messages || [];
        if (!activeChatId || !currentMessages.length) return;
        const newMsgs = currentMessages.slice(0, -1);
        // Pass null for message to indicate replacement
        addMessageToChat(activeChatId, null, newMsgs);
    }, [activeChatId, messages, addMessageToChat]);

    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="flex-1 overflow-y-auto p-2">
                {isEmptyChat ? (
                    <InitialChatView
                        handleSendMessage={handleSendMessage}
                        mcpServersStatus={mcpServersStatus}
                        toggleToolsPanel={toggleToolsPanel}
                        refreshMcpTools={refreshMcpTools}
                        loading={loading}
                        isPaused={isPaused}
                        visionSupported={visionSupported}
                        selectedContextId={selectedContextId}
                        setSelectedContextId={setSelectedContextId}
                        availableContexts={availableContexts}
                        selectedPromptId={selectedPromptId}
                        handlePromptSelect={handlePromptSelect}
                        availablePrompts={availablePrompts}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                    />
                ) : (
                    <>
                        <MessageList messages={messages} onRemoveLastMessage={handleRemoveLastMessage} />
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            {!isEmptyChat && (
                <ChatInputControls
                    mcpServersStatus={mcpServersStatus}
                    toggleToolsPanel={toggleToolsPanel}
                    refreshMcpTools={refreshMcpTools}
                    handleSendMessage={handleSendMessage}
                    loading={loading}
                    isPaused={isPaused}
                    visionSupported={visionSupported}
                    selectedContextId={selectedContextId}
                    setSelectedContextId={setSelectedContextId}
                    availableContexts={availableContexts}
                    selectedPromptId={selectedPromptId}
                    handlePromptSelect={handlePromptSelect}
                    availablePrompts={availablePrompts}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                />
            )}
        </div>
    );
};

export default ChatArea; 