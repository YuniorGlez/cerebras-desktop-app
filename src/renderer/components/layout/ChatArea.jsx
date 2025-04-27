import React, { useRef, useCallback } from 'react';
import MessageList from '../MessageList';
import InitialChatView from './InitialChatView';
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
    visionSupported
}) => {
    const { activeChatId, addMessageToChat } = useChat();

    const userOrAssistantMessages = messages?.filter(m => m.role === 'user' || m.role === 'assistant') || [];

    const handleRemoveLastMessage = useCallback(() => {
        const currentMessages = messages || [];
        if (!activeChatId || !currentMessages.length) return;
        const newMsgs = currentMessages.slice(0, -1);
        // Pass null for message to indicate replacement
        addMessageToChat(activeChatId, null, newMsgs);
    }, [activeChatId, messages, addMessageToChat]);

    const isEmptyChat = userOrAssistantMessages.length === 0;

    return (
        <div className="flex-1 overflow-y-auto p-2 bg-background flex flex-col">
            {isEmptyChat ? (
                <InitialChatView
                    handleSendMessage={handleSendMessage}
                    mcpServersStatus={mcpServersStatus}
                    toggleToolsPanel={toggleToolsPanel}
                    refreshMcpTools={refreshMcpTools}
                    loading={loading}
                    isPaused={isPaused}
                    visionSupported={visionSupported}
                />
            ) : (
                <>
                    <MessageList messages={messages} onRemoveLastMessage={handleRemoveLastMessage} />
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    );
};

export default ChatArea; 