import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react'; // Example Icon
import InputArea from './InputArea'; // Import InputArea

const InitialChatView = ({
    handleSendMessage,
    // InputArea props:
    mcpServersStatus,
    toggleToolsPanel,
    refreshMcpTools,
    loading,
    isPaused,
    visionSupported
}) => {
    const [inputValue, setInputValue] = useState("");
    const suggestedPrompts = [
        "Explain quantum computing in simple terms.",
        "What are the latest advancements in AI?",
        "Summarize the main points of the article at [link].",
        "Help me brainstorm ideas for a new project."
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <BrainCircuit size={48} className="mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-6 text-foreground">What can I help with?</h2>

            {/* Render InputArea here, above the prompts */}
            <div className="w-full max-w-xl mb-6"> {/* Adjusted width and margin */}
                <InputArea
                    mcpServersStatus={mcpServersStatus}
                    toggleToolsPanel={toggleToolsPanel}
                    refreshMcpTools={refreshMcpTools}
                    handleSendMessage={handleSendMessage}
                    loading={loading}
                    isPaused={isPaused}
                    visionSupported={visionSupported}
                    hideMcpStatusBar
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                />
            </div>

            {/* Render suggested prompts below the input */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xl w-full">
                {suggestedPrompts.map((prompt, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        // Make buttons smaller and rounded
                        className="text-xs rounded-full h-auto py-1 px-3 bg-background hover:bg-accent"
                        onClick={() => setInputValue(prompt)}
                    >
                        {prompt}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default InitialChatView; 