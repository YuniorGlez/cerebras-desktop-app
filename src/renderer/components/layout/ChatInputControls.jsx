import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import InputArea from './InputArea'; // Assuming InputArea is in the same directory

const ChatInputControls = ({
    // Props for Dropdowns
    selectedContextId,
    setSelectedContextId,
    availableContexts = [], // Default to empty array
    selectedPromptId,
    handlePromptSelect,
    availablePrompts = [], // Default to empty array
    loading,
    isPaused,
    // Props for InputArea
    mcpServersStatus,
    toggleToolsPanel,
    refreshMcpTools,
    handleSendMessage,
    visionSupported,
    inputValue,
    setInputValue,
    // Optional prop to hide selects (if needed later, not used initially)
    // hideSelects = false
}) => {
    return (
        <div className="border-t bg-background p-4">
            {/* Only show selects if not explicitly hidden */}
            {/* !hideSelects && ( */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Apply Context Dropdown */}
                <div className="flex items-center gap-2">
                    <Label htmlFor="context-select" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Apply Context:
                    </Label>
                    <Select value={selectedContextId} onValueChange={setSelectedContextId} disabled={loading || isPaused}>
                        <SelectTrigger id="context-select" className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {availableContexts.map(context => (
                                <SelectItem key={context.id} value={context.id} className="text-xs">
                                    {context.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Use Prompt Dropdown */}
                <div className="flex items-center gap-2">
                    <Label htmlFor="prompt-select" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Use Prompt:
                    </Label>
                    <Select value={selectedPromptId} onValueChange={handlePromptSelect} disabled={loading || isPaused}>
                        <SelectTrigger id="prompt-select" className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {availablePrompts.map(prompt => (
                                <SelectItem key={prompt.id} value={prompt.id} className="text-xs">
                                    {prompt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* )} */}
            <InputArea
                mcpServersStatus={mcpServersStatus}
                toggleToolsPanel={toggleToolsPanel}
                refreshMcpTools={refreshMcpTools}
                handleSendMessage={handleSendMessage}
                loading={loading}
                isPaused={isPaused}
                visionSupported={visionSupported}
                inputValue={inputValue}
                setInputValue={setInputValue}
                hideMcpStatusBar={true}
            // Pass hideMcpStatusBar if needed, or manage within InputArea/ChatInputControls
            />
        </div>
    );
};

export default ChatInputControls; 