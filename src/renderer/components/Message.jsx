import React, { useState } from 'react';
import ToolCall from './ToolCall';

function Message({ message, children, onToolCallExecute, allMessages, isLastMessage, onRemoveMessage }) {
  const { role, tool_calls, reasoning, isStreaming } = message;
  const [showReasoning, setShowReasoning] = useState(false);
  const [showTimePopup, setShowTimePopup] = useState(false);
  const isUser = role === 'user';
  const hasReasoning = reasoning && !isUser;
  const isStreamingMessage = isStreaming === true;

  // Find tool results for this message's tool calls in the messages array
  const findToolResult = (toolCallId) => {
    if (!allMessages) return null;

    // Look for a tool message that matches this tool call ID
    const toolMessage = allMessages.find(
      msg => msg.role === 'tool' && msg.tool_call_id === toolCallId
    );

    return toolMessage ? toolMessage.content : null;
  };

  const messageClasses = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
  // Apply background only for user messages
  const bubbleStyle = isUser ? 'bg-user-message-bg' : ''; // No background for assistant/system
  const bubbleClasses = `relative px-4 py-3 rounded-lg max-w-xl ${bubbleStyle} group`; // Added group for remove button
  const wrapperClasses = `message-content-wrapper ${isUser ? 'text-white' : ''} break-words`; // Keep text white for both, use break-words

  const toggleReasoning = () => setShowReasoning(!showReasoning);

  return (
    <div className={messageClasses}>
      <div className={bubbleClasses}>
        {isStreamingMessage && (
          <div className="streaming-indicator mb-1">
            <span className="dot-1"></span>
            <span className="dot-2"></span>
            <span className="dot-3"></span>
          </div>
        )}
        <div className={wrapperClasses}>
          {children}
        </div>

        {tool_calls && tool_calls.map((toolCall, index) => (
          <ToolCall
            key={toolCall.id || index}
            toolCall={toolCall}
            toolResult={findToolResult(toolCall.id)}
          />
        ))}

        {hasReasoning && (
          <div className="mt-3 border-t border-gray-600 pt-2">
            <button
              onClick={toggleReasoning}
              className="flex items-center text-sm px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 mr-1 transition-transform duration-200 ${showReasoning ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            </button>

            {showReasoning && (
              <div className="mt-2 p-3 bg-gray-800 rounded-md text-sm border border-gray-600">
                <pre className="whitespace-pre-wrap break-words">{reasoning}</pre>
              </div>
            )}
          </div>
        )}

        {/* Response time badge for assistant messages */}
        {!isUser && message.responseSecondsDisplay && (
          <div className="flex justify-end mt-2 relative">
            <span
              className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full select-none cursor-pointer hover:bg-gray-600 transition"
              title="Response time"
              onMouseEnter={() => setShowTimePopup(true)}
              onMouseLeave={() => setShowTimePopup(false)}
            >
              {message.responseSecondsDisplay}
            </span>
            {showTimePopup && (
              <div className="absolute bottom-full right-0 mb-2 z-20 bg-white text-gray-900 text-xs rounded shadow-lg px-3 py-2 min-w-[220px] border border-gray-200" style={{ whiteSpace: 'nowrap' }}>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />
                  <span>{message.speedOutput || 0} T/s</span>
                </div>
                <table className="w-full text-xs mb-2 border-separate" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr className="text-gray-500">
                      <th className="font-normal text-left pl-1 pr-2"></th>
                      <th className="font-normal text-center px-2">Input</th>
                      <th className="font-normal text-center px-2">Output</th>
                      <th className="font-normal text-center px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-gray-700 pl-1 pr-2">Tokens</td>
                      <td className="text-center px-2">{message.inputTokens ?? 0}</td>
                      <td className="text-center px-2">{message.outputTokens ?? 0}</td>
                      <td className="text-center px-2">{message.totalTokens ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-700 pl-1 pr-2">Inference time<br />(s)</td>
                      <td className="text-center px-2">0.00</td>
                      <td className="text-center px-2">{message.inferenceTime?.toFixed(2) ?? '0.00'}</td>
                      <td className="text-center px-2">{message.inferenceTime?.toFixed(2) ?? '0.00'}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-700 pl-1 pr-2">Speed<br />(t/s)</td>
                      <td className="text-center px-2">{message.speedInput ?? 0}</td>
                      <td className="text-center px-2">{message.speedOutput ?? 0}</td>
                      <td className="text-center px-2">{message.speedTotal ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-gray-700 mt-1">Round trip time: <span className="font-mono">{message.roundTripTime?.toFixed(2) ?? '0.00'}s</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message; 