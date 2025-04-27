import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react'; // Example Icon
// import InputArea from './InputArea'; // No longer needed
import ChatInputControls from './ChatInputControls'; // Import ChatInputControls

const InitialChatView = ({
    handleSendMessage,
    mcpServersStatus,
    toggleToolsPanel,
    refreshMcpTools,
    loading,
    isPaused,
    visionSupported,
    // Props for ChatInputControls
    selectedContextId,
    setSelectedContextId,
    availableContexts,
    selectedPromptId,
    handlePromptSelect,
    availablePrompts,
    inputValue,
    setInputValue
}) => {
    // Remove local inputValue state, use passed-in props
    // const [inputValue, setInputValue] = useState("");
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

            {/* Render ChatInputControls instead of InputArea */}
            <div className="w-full max-w-2xl mb-6"> {/* Adjust width as needed */}
                <ChatInputControls
                    // Pass all the necessary props down
                    selectedContextId={selectedContextId}
                    setSelectedContextId={setSelectedContextId}
                    availableContexts={availableContexts}
                    selectedPromptId={selectedPromptId}
                    handlePromptSelect={handlePromptSelect}
                    availablePrompts={availablePrompts}
                    loading={loading}
                    isPaused={isPaused}
                    mcpServersStatus={mcpServersStatus}
                    toggleToolsPanel={toggleToolsPanel}
                    refreshMcpTools={refreshMcpTools}
                    handleSendMessage={handleSendMessage}
                    visionSupported={visionSupported}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                // hideSelects={true} // Optionally hide selects if needed
                // hideMcpStatusBar // Might need adjustments based on ChatInputControls structure
                />
            </div>

            {/* Render suggested prompts below the input */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xl w-full">
                {suggestedPrompts.map((prompt, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        className="text-xs rounded-full h-auto py-1 px-3 bg-background hover:bg-accent"
                        onClick={() => setInputValue(prompt)} // Use the passed-in setInputValue
                    >
                        {prompt}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default InitialChatView; 