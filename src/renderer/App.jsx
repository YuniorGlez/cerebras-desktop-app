import React, { useState, useEffect, useRef, useCallback } from 'react';
import ToolsPanel from './components/ToolsPanel';
import ToolApprovalModal from './components/ToolApprovalModal';
import { useChat } from './context/ChatContext';
import { estimateTokenCount } from './utils/tokenUtils';
import { useTheme } from "./components/theme/ThemeProvider";
import { useToolApproval } from './hooks/useToolApproval';
import { useMcpManagement } from './hooks/useMcpManagement';
import { useModelManagement } from './hooks/useModelManagement';

// Import Layout Components
import TopBar from './components/layout/TopBar';
import ChatArea from './components/layout/ChatArea';
import InputArea from './components/layout/InputArea';

function App() {
	// --- Hooks Initialization ---
	const {
		activeChat,
		activeChatId,
		setActiveChatId,
		createChat,
		addMessageToChat,
		updateLastMessageInChat,
		renameChat,
	} = useChat();

	// Theme hook might be needed for main div class later?
	const { theme } = useTheme();

	const {
		mcpTools,
		isToolsPanelOpen,
		mcpServersStatus,
		toggleToolsPanel,
		closeToolsPanel,
		disconnectMcpServer,
		reconnectMcpServer,
		refreshMcpTools,
	} = useMcpManagement();

	const {
		selectedModel,
		visionSupported,
	} = useModelManagement();

	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef(null);

	// --- Tool Approval Hook Dependencies (Need to define functions before passing) ---
	// Define processToolCalls placeholder first, it will be reassigned by the hook
	let processToolCalls = useRef(async () => {
		console.warn("processToolCalls called before initialization");
		return { status: 'error', toolResponseMessages: [] };
	}).current;

	// --- Core Chat Logic (Define executeChatTurn before handleChatFlowComplete) ---
	const executeChatTurn = useCallback(async (turnMessages, sentAt) => {
		let currentTurnStatus = 'processing';
		let turnAssistantMessage = null;
		let turnToolResponses = [];
		const responseStart = sentAt || Date.now();

		if (!selectedModel || selectedModel === 'default') {
			console.error("No valid model selected for chat turn.");
			if (activeChatId) {
				addMessageToChat(activeChatId, { role: 'assistant', content: "Error: No model selected or available.", isStreaming: false });
			}
			return { status: 'error', assistantMessage: null, toolResponseMessages: [] };
		}

		try {
			const assistantPlaceholder = { role: 'assistant', content: '', isStreaming: true };
			if (activeChatId) addMessageToChat(activeChatId, assistantPlaceholder);

			// eslint-disable-next-line no-undef
			const streamHandler = window.electron.startChatStream(turnMessages, selectedModel);
			let finalAssistantData = { role: 'assistant', content: '', tool_calls: undefined, reasoning: undefined };

			await new Promise((resolve, reject) => {
				streamHandler.onComplete((data) => {
					const responseEnd = Date.now();
					const ms = responseEnd - responseStart;
					const responseSecondsRaw = ms / 1000;
					const responseSecondsDisplay = responseSecondsRaw < 1 ? responseSecondsRaw.toFixed(2) + 's' : Math.round(responseSecondsRaw) + 's';

					finalAssistantData = {
						role: 'assistant', content: data.content || '', tool_calls: data.tool_calls,
						reasoning: data.reasoning, respondedAt: responseEnd, responseSeconds: responseSecondsRaw,
						responseSecondsDisplay, inputTokens: undefined, outputTokens: undefined, totalTokens: undefined,
						inferenceTime: responseSecondsRaw, speedInput: undefined, speedOutput: undefined, speedTotal: undefined,
						roundTripTime: responseSecondsRaw, isStreaming: false,
					};
					turnAssistantMessage = finalAssistantData;
					if (activeChatId) updateLastMessageInChat(activeChatId, finalAssistantData);

					const updateTokens = () => {
						const inputTokens = turnMessages.reduce((sum, msg) => sum + estimateTokenCount(msg), 0);
						const outputTokens = estimateTokenCount({ role: 'assistant', content: data.content || '', tool_calls: data.tool_calls });
						const totalTokens = inputTokens + outputTokens;
						const inferenceTime = responseSecondsRaw;
						const speedInput = inputTokens > 0 && inferenceTime > 0 ? Math.round(inputTokens / inferenceTime) : 0;
						const speedOutput = outputTokens > 0 && inferenceTime > 0 ? Math.round(outputTokens / inferenceTime) : 0;
						const speedTotal = totalTokens > 0 && inferenceTime > 0 ? Math.round(totalTokens / inferenceTime) : 0;
						if (activeChatId) updateLastMessageInChat(activeChatId, { ...finalAssistantData, inputTokens, outputTokens, totalTokens, inferenceTime, speedInput, speedOutput, speedTotal });
					};
					if (typeof window !== 'undefined' && window.requestIdleCallback) window.requestIdleCallback(updateTokens);
					else setTimeout(updateTokens, 0);
					resolve();
				});
				streamHandler.onError(({ error }) => {
					console.error('Stream error:', error);
					if (activeChatId) updateLastMessageInChat(activeChatId, { role: 'assistant', content: `Stream Error: ${error}`, isStreaming: false });
					reject(new Error(error));
				});
			});
			streamHandler.cleanup();

			if (turnAssistantMessage?.tool_calls?.length > 0) {
				console.log("Assistant has tool calls, processing...");
				const { status: toolProcessingStatus, toolResponseMessages } = await processToolCalls(
					turnAssistantMessage,
					turnMessages,
					responseStart
				);
				currentTurnStatus = toolProcessingStatus;
				turnToolResponses = toolResponseMessages;
				if (currentTurnStatus === 'completed') {
					console.log("Tool processing completed within turn.");
				} else if (currentTurnStatus === 'paused') {
					console.log("Tool processing paused.");
				}
			} else {
				currentTurnStatus = 'completed_no_tools';
			}
		} catch (error) {
			console.error('Error in executeChatTurn:', error);
			if (activeChatId) updateLastMessageInChat(activeChatId, { role: 'assistant', content: `Error: ${error.message}`, isStreaming: false });
			currentTurnStatus = 'error';
		}
		return { status: currentTurnStatus, assistantMessage: turnAssistantMessage, toolResponseMessages: turnToolResponses };
	}, [activeChatId, addMessageToChat, updateLastMessageInChat, selectedModel, estimateTokenCount, processToolCalls]);

	// --- Tool Approval Hook Setup ---
	const handleChatFlowComplete = useCallback(({ currentMessages, assistantMessage, toolResponseMessages, lastSentAt }) => {
		console.log("Chat flow completed, preparing next turn.");
		const nextApiMessages = [
			...currentMessages,
			{ role: assistantMessage.role, content: assistantMessage.content, tool_calls: assistantMessage.tool_calls },
			...toolResponseMessages.map(msg => ({ role: 'tool', content: msg.content, tool_call_id: msg.tool_call_id }))
		];
		executeChatTurn(nextApiMessages, lastSentAt).then(({ status }) => {
			if (status !== 'paused') setLoading(false);
		}).catch(err => {
			console.error("Error continuing chat flow:", err);
			setLoading(false);
		});
	}, [executeChatTurn, setLoading]);

	const toolApprovalHookResult = useToolApproval(setLoading, handleChatFlowComplete);
	// Reassign processToolCalls from the hook's return value
	processToolCalls = toolApprovalHookResult.processToolCalls;
	const { pendingApprovalCall, handleToolApproval, isPaused } = toolApprovalHookResult;

	// --- Effects ---
	// Initial chat creation
	useEffect(() => {
		if (!activeChatId && createChat) {
			const newChat = createChat();
			if (newChat) setActiveChatId(newChat.id);
		}
	}, [activeChatId, createChat, setActiveChatId]);

	// Scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [activeChat?.messages]);

	const handleSendMessage = useCallback(async (content) => {
		if (!activeChatId || isPaused) return;

		const isStructuredContent = Array.isArray(content);
		const hasContent = isStructuredContent ? content.some(part => (part.type === 'text' && part.text.trim()) || part.type === 'image_url') : content.trim();
		if (!hasContent) return;

		const sentAt = Date.now();
		const userMessage = { role: 'user', content: content, sentAt };
		addMessageToChat(activeChatId, userMessage);
		setLoading(true);

		const initialApiMessages = [...(activeChat?.messages || []), userMessage];
		let currentApiMessages = initialApiMessages;
		let continueLoop = true;

		while (continueLoop && !isPaused) {
			try {
				const { status, assistantMessage, toolResponseMessages } = await executeChatTurn(currentApiMessages, sentAt);

				if (status === 'paused') {
					console.log("handleSendMessage: Loop paused.");
					continueLoop = false;
				} else if (status === 'error') {
					console.error("handleSendMessage: Error in turn.");
					continueLoop = false;
					setLoading(false);
				} else if (status === 'completed') {
					console.log("handleSendMessage: Turn completed with tools (no pause).");
					currentApiMessages = [
						...currentApiMessages,
						{ ...assistantMessage },
						...toolResponseMessages.map(msg => ({ role: 'tool', content: msg.content, tool_call_id: msg.tool_call_id }))
					];
				} else if (status === 'completed_no_tools') {
					console.log("handleSendMessage: Turn completed without tools.");
					continueLoop = false;
				}
			} catch (error) {
				console.error('Error in handleSendMessage loop:', error);
				if (activeChatId) addMessageToChat(activeChatId, { role: 'assistant', content: `Loop Error: ${error.message}` });
				continueLoop = false;
				setLoading(false);
			}
		}
		if (isPaused) {
			console.log("handleSendMessage: Exiting loop because isPaused.");
		} else {
			setLoading(false);
		}
	}, [activeChatId, addMessageToChat, activeChat?.messages, setLoading, executeChatTurn, isPaused, updateLastMessageInChat]);

	// --- Render ---
	// Get messages AFTER hooks are initialized
	const messages = activeChat?.messages || [];
	// Determine if the chat is empty (or only has system messages)
	const userOrAssistantMessages = messages?.filter(m => m.role === 'user' || m.role === 'assistant') || [];
	const isEmptyChat = userOrAssistantMessages.length === 0;

	return (
		<div className="flex flex-col h-full w-full">
			<TopBar
				activeChat={activeChat}
				renameChat={renameChat}
				createChat={createChat}
				setActiveChatId={setActiveChatId}
			/>

			<div className="flex-1 overflow-hidden flex flex-col bg-background">
				<ChatArea
					messages={messages}
					messagesEndRef={messagesEndRef}
					handleSendMessage={handleSendMessage}
					mcpServersStatus={mcpServersStatus}
					toggleToolsPanel={toggleToolsPanel}
					refreshMcpTools={refreshMcpTools}
					loading={loading}
					isPaused={isPaused}
					visionSupported={visionSupported}
				/>
				{!isEmptyChat && (
					<InputArea
						mcpServersStatus={mcpServersStatus}
						toggleToolsPanel={toggleToolsPanel}
						refreshMcpTools={refreshMcpTools}
						handleSendMessage={handleSendMessage}
						loading={loading}
						isPaused={isPaused}
						visionSupported={visionSupported}
					/>
				)}
			</div>

			{isToolsPanelOpen && (
				<ToolsPanel
					tools={mcpTools}
					onClose={closeToolsPanel}
					onDisconnectServer={disconnectMcpServer}
					onReconnectServer={reconnectMcpServer}
				/>
			)}

			{pendingApprovalCall && (
				<ToolApprovalModal
					toolCall={pendingApprovalCall}
					onApprove={handleToolApproval}
				/>
			)}
		</div>
	);
}

export default App;