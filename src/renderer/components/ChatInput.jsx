import React, { useState, useRef, useEffect } from 'react';

function ChatInput({ onSendMessage, loading = false }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const prevLoadingRef = useRef(loading);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const textContent = message.trim();
    if (textContent.length > 0 && !loading) {
      onSendMessage([{ type: 'text', text: textContent }]);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {/* Text Area */}
        <div className="flex-1 flex">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for newline)"
            className="w-full block py-2 px-3 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-white placeholder-gray-400 resize-none overflow-hidden max-h-[200px]"
            rows={1}
            disabled={loading}
          />
        </div>
        {/* Send Button */}
        <button
          type="submit"
          className="py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded transition-colors self-end"
          disabled={loading || !message.trim()}
        >
          {loading ? (
            <span>Sending...</span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default ChatInput; 