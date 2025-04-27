// Estima el número de tokens de un mensaje (versión para el renderer)
export function estimateTokenCount(message) {
    if (!message) return 0;
    let tokenCount = 0;
    let textContent = '';

    if (typeof message.content === 'string') {
        textContent = message.content;
    } else if (Array.isArray(message.content)) {
        textContent = message.content
            .filter(part => part.type === 'text')
            .map(part => part.text)
            .join('\n');
    }

    if (textContent) {
        tokenCount += Math.ceil(textContent.length / 4);
    }

    if (message.role === 'assistant' && message.tool_calls && Array.isArray(message.tool_calls)) {
        message.tool_calls.forEach(toolCall => {
            try {
                const serializedToolCall = JSON.stringify(toolCall);
                tokenCount += Math.ceil(serializedToolCall.length / 4);
            } catch (e) {
                tokenCount += 50;
            }
        });
    }

    if (message.role === 'tool') {
        const contentString = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
        tokenCount += Math.ceil(contentString.length / 4);
        tokenCount += 10;
    }

    tokenCount += 5;
    return tokenCount;
} 