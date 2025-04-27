import { useState, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { getToolApprovalStatus, setToolApprovalStatus } from '../utils/localStorageUtils';

// Helper internal to the hook
const executeToolCall = async (toolCall) => {
    try {
        // Assume window.electron is available in this renderer context
        // eslint-disable-next-line no-undef
        const response = await window.electron.executeToolCall(toolCall);
        return {
            role: 'tool',
            content: response.error ? JSON.stringify({ error: response.error }) : (response.result || ''),
            tool_call_id: toolCall.id,
            success: !response.error,
        };
    } catch (error) {
        console.error('Error executing tool call:', error);
        return {
            role: 'tool',
            content: JSON.stringify({ error: error.message }),
            tool_call_id: toolCall.id,
            success: false,
        };
    }
};

/**
 * Manages the tool approval flow, including pausing and resuming chat interaction.
 * @param {Function} setLoading - Function to control the main loading state in the App.
 * @param {Function} onChatFlowComplete - Callback invoked when the tool flow completes for a turn, providing necessary data to continue.
 */
export const useToolApproval = (setLoading, onChatFlowComplete) => {
    const { activeChatId, addMessageToChat } = useChat();
    const [pendingApprovalCall, setPendingApprovalCall] = useState(null);
    // Stores state needed to resume after pause: { currentMessages, finalAssistantMessage, accumulatedResponses, lastSentAt }
    const [pausedChatState, setPausedChatState] = useState(null);

    // Processes tool calls for a given assistant message.
    // Returns status: 'completed', 'paused', or 'error'
    const processToolCalls = useCallback(async (assistantMessage, currentMessagesBeforeAssistant, lastSentAt) => {
        if (!assistantMessage?.tool_calls?.length) {
            return { status: 'completed', toolResponseMessages: [] };
        }

        const toolResponseMessages = [];
        let needsPause = false;

        for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const approvalStatus = getToolApprovalStatus(toolName);

            if (approvalStatus === 'always' || approvalStatus === 'yolo') {
                console.log(`Tool '${toolName}' automatically approved (${approvalStatus}). Executing...`);
                try {
                    const resultMsg = await executeToolCall(toolCall);
                    toolResponseMessages.push(resultMsg);
                    if (activeChatId) addMessageToChat(activeChatId, { ...resultMsg, role: 'tool' }); // Ensure role is correct
                } catch (error) {
                    // executeToolCall already catches internal errors, this is unlikely
                    console.error(`Unexpected error during auto-approved tool call '${toolName}':`, error);
                    const errorMsg = {
                        role: 'tool',
                        content: JSON.stringify({ error: `Error executing tool '${toolName}': ${error.message}` }),
                        tool_call_id: toolCall.id,
                        success: false,
                    };
                    toolResponseMessages.push(errorMsg);
                    if (activeChatId) addMessageToChat(activeChatId, errorMsg);
                }
            } else { // status === 'prompt'
                console.log(`Tool '${toolName}' requires user approval.`);
                setPendingApprovalCall(toolCall);
                setPausedChatState({
                    currentMessages: currentMessagesBeforeAssistant,
                    finalAssistantMessage: assistantMessage,
                    accumulatedResponses: toolResponseMessages, // Responses gathered *before* this pause
                    lastSentAt: lastSentAt // Store timestamp from the initial send
                });
                needsPause = true;
                break; // Stop processing further tools for this turn
            }
        }

        return {
            status: needsPause ? 'paused' : 'completed',
            toolResponseMessages
        };
    }, [activeChatId, addMessageToChat]);

    // Internal function to resume processing remaining tools after approval/denial.
    // It does NOT trigger the next API call, but calls `onChatFlowComplete` if all tools are done.
    const resumeChatFlowInternal = useCallback(async (handledToolResponse) => {
        if (!pausedChatState) {
            console.error("Attempted to resume chat flow without paused state.");
            setLoading(false); // Stop loading if state is inconsistent
            return; // Cannot proceed
        }

        const { currentMessages, finalAssistantMessage, accumulatedResponses, lastSentAt } = pausedChatState;
        // Don't clear pausedChatState immediately, clear only if flow completes or pauses again

        const allResponsesForTurn = [...accumulatedResponses, handledToolResponse];

        const pausedToolIndex = finalAssistantMessage.tool_calls.findIndex(
            tc => tc.id === handledToolResponse.tool_call_id
        );

        if (pausedToolIndex === -1) {
            console.error("Could not find the paused tool call in the original message.");
            setPausedChatState(null); // Clear invalid state
            setLoading(false);
            return;
        }

        const remainingTools = finalAssistantMessage.tool_calls.slice(pausedToolIndex + 1);
        let needsPauseAgain = false;

        // Process remaining tools
        for (const nextToolCall of remainingTools) {
            const toolName = nextToolCall.function.name;
            const approvalStatus = getToolApprovalStatus(toolName);

            if (approvalStatus === 'always' || approvalStatus === 'yolo') {
                console.log(`Resuming: Tool '${toolName}' automatically approved (${approvalStatus}). Executing...`);
                try {
                    const resultMsg = await executeToolCall(nextToolCall);
                    allResponsesForTurn.push(resultMsg);
                    if (activeChatId) addMessageToChat(activeChatId, { ...resultMsg, role: 'tool' });
                } catch (error) {
                    console.error(`Resuming: Error executing tool call '${toolName}':`, error);
                    const errorMsg = { role: 'tool', content: JSON.stringify({ error: `Error executing tool '${toolName}': ${error.message}` }), tool_call_id: nextToolCall.id, success: false };
                    allResponsesForTurn.push(errorMsg);
                    if (activeChatId) addMessageToChat(activeChatId, errorMsg);
                }
            } else {
                console.log(`Resuming: Tool '${toolName}' requires user approval (pause again).`);
                setPendingApprovalCall(nextToolCall);
                // Update paused state with the responses gathered *up to this new pause*
                setPausedChatState({
                    currentMessages: currentMessages,
                    finalAssistantMessage: finalAssistantMessage,
                    accumulatedResponses: allResponsesForTurn, // Include responses gathered during this resume attempt
                    lastSentAt: lastSentAt
                });
                needsPauseAgain = true;
                break; // Stop processing remaining tools
            }
        }

        if (needsPauseAgain) {
            console.log("Chat flow paused again for the next tool.");
            // setLoading(true) should already be active from the initial send or previous resume step
        } else {
            // All tools for this turn successfully processed (or denied).
            console.log("All tools for the turn processed. Signaling completion to App.");
            setPausedChatState(null); // Clear the paused state as the flow for *this turn* is done
            // setLoading(false); // Momentarily set loading false before App triggers next turn

            // Call the callback to signal App.jsx to prepare and execute the next turn
            if (onChatFlowComplete) {
                onChatFlowComplete({
                    currentMessages: currentMessages,
                    assistantMessage: finalAssistantMessage,
                    toolResponseMessages: allResponsesForTurn,
                    lastSentAt: lastSentAt
                });
            }
        }
        // Dependencies need careful checking
    }, [pausedChatState, setLoading, activeChatId, addMessageToChat, onChatFlowComplete]);

    // Handles the user's choice from the approval modal.
    const handleToolApproval = useCallback(async (choice, toolCall) => {
        if (!toolCall || !toolCall.id) {
            console.error("handleToolApproval called with invalid toolCall:", toolCall);
            return;
        }
        console.log(`User choice for tool '${toolCall.function.name}': ${choice}`);

        setToolApprovalStatus(toolCall.function.name, choice);
        setPendingApprovalCall(null); // Clear pending call *before* async operations

        let handledToolResponse;

        if (choice === 'deny') {
            handledToolResponse = {
                role: 'tool',
                content: JSON.stringify({ error: 'Tool execution denied by user.' }),
                tool_call_id: toolCall.id,
                success: false, // Mark as unsuccessful
            };
            if (activeChatId) addMessageToChat(activeChatId, handledToolResponse); // Show denial in UI
            // Resume processing potential subsequent tools internally
            await resumeChatFlowInternal(handledToolResponse);
        } else { // 'once', 'always', 'yolo' -> Execute
            setLoading(true); // Show loading specifically for this tool execution phase
            try {
                console.log(`Executing tool '${toolCall.function.name}' after user approval...`);
                handledToolResponse = await executeToolCall(toolCall);
                // Add message to chat *after* execution
                if (activeChatId) addMessageToChat(activeChatId, { ...handledToolResponse, role: 'tool' });
                // Resume flow internally after successful/failed execution
                await resumeChatFlowInternal(handledToolResponse);
            } catch (error) {
                // This catch is somewhat redundant as executeToolCall handles errors, but good safety.
                console.error(`Unexpected error during approved tool execution '${toolCall.function.name}':`, error);
                handledToolResponse = {
                    role: 'tool',
                    content: JSON.stringify({ error: `Error executing tool '${toolCall.function.name}' after approval: ${error.message}` }),
                    tool_call_id: toolCall.id,
                    success: false,
                };
                if (activeChatId) addMessageToChat(activeChatId, handledToolResponse); // Show error in UI
                // Still try to resume processing subsequent tools internally
                await resumeChatFlowInternal(handledToolResponse);
            }
            // setLoading will be managed by resumeChatFlowInternal or the final callback
        }
        // Dependencies need careful checking
    }, [activeChatId, addMessageToChat, resumeChatFlowInternal, setLoading]);

    return {
        pendingApprovalCall,
        processToolCalls, // Exported for App.jsx to initiate the flow
        handleToolApproval, // Exported for the Modal
        isPaused: !!pausedChatState, // Boolean flag for App.jsx UI state
    };
}; 