import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Info, FolderSearch, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContextManager } from '../context/ContextManagerContext';

const MODEL_CONTEXT_SIZES = {
    default: {
        context: 8192,
        vision_supported: false,
    },
    "llama-4-scout-17b-16e-instruct": {
        context: 131072,
        vision_supported: true,
    },
    "llama-3.3-70b": {
        context: 128000,
        vision_supported: false,
    },
    "deepseek-r1-distill-llama-70b": {
        context: 128000,
        vision_supported: false,
    },
    "llama3.1-8b": {
        context: 8192,
        vision_supported: false,
    },
};

const DEFAULT_SYNTHESIS_INSTRUCTIONS = `You are an expert synthesizer AI. Analyze the following user query and the responses provided by different AI models. Your task is to combine the best aspects of each response into a single, comprehensive, and accurate final answer based *only* on the information provided in the responses. Ensure accuracy, coherence, and do not add any external information. Respond directly to the user query based on the synthesis.

User Query:
{USER_QUERY}

Model Responses:
{MODEL_RESPONSES}`;

// Calculate expected models count (excluding default and synthesis model)
const EXPECTED_MODELS_COUNT = Object.keys(MODEL_CONTEXT_SIZES).filter(
    model => model !== 'default' && model !== 'deepseek-r1-distill-llama-70b'
).length;

function MultidialogPage() {
    const { contexts, prompts } = useContextManager();
    const [synthesisPrompt, setSynthesisPrompt] = useState(DEFAULT_SYNTHESIS_INSTRUCTIONS);
    const [userQuery, setUserQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [responses, setResponses] = useState([]); // [{ model: 'model-name', response: 'text', error: null }]
    const [synthesis, setSynthesis] = useState({ response: null, error: null });
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const responseListenerCleanup = useRef(null); // Ref to store cleanup function
    const currentResponsesRef = useRef([]); // Ref to track responses for synthesis trigger

    // Cleanup listener on component unmount
    useEffect(() => {
        return () => {
            if (responseListenerCleanup.current) {
                responseListenerCleanup.current();
            }
        };
    }, []);

    const handleSynthesisPromptChange = (event) => {
        setSynthesisPrompt(event.target.value);
    };

    const handleUserQueryChange = (event) => {
        setUserQuery(event.target.value);
    };

    const handlePromptSelect = (promptId) => {
        const selectedPrompt = prompts.find(p => p.id === promptId);
        if (selectedPrompt) {
            setUserQuery(String(selectedPrompt.text || ''));
            toast.info(`Loaded prompt: ${selectedPrompt.name}`);
        }
    };

    const handleContextSelect = (contextId) => {
        const selectedContext = contexts.find(c => c.id === contextId);
        if (selectedContext) {
            const contextText = String(selectedContext.preamble || selectedContext.rules || '');
            setUserQuery(prev => `${contextText}\n\n${String(prev || '')}`.trim());
            toast.info(`Prepended context: ${selectedContext.name}`);
        }
    };

    // Function to trigger synthesis
    const triggerSynthesis = async (originalUserQuery, synthesisInstructions, collectedResponses) => {
        console.log("Triggering synthesis with instructions and responses:", synthesisInstructions, collectedResponses);
        setIsSynthesizing(true);
        setSynthesis({ response: null, error: null }); // Clear previous synthesis
        try {
            // Pass all necessary info to the backend
            const result = await window.electron.synthesizeMultidialogResponses(originalUserQuery, synthesisInstructions, collectedResponses);
            setSynthesis({ response: result.response, error: result.error });
            if (result.error) {
                toast.error(`Synthesis failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Error during synthesis call:", error);
            const errorMsg = `Synthesis failed: ${error.message}`;
            setSynthesis({ response: null, error: errorMsg });
            toast.error(errorMsg);
        } finally {
            setIsLoading(false); // Overall loading stops after synthesis attempt
            setIsSynthesizing(false);
        }
    };

    const handleSubmit = async () => {
        if (!userQuery || !userQuery.trim()) {
            toast.warning("Please enter your query.");
            return;
        }
        setIsLoading(true);
        setResponses([]); // Clear previous responses
        setSynthesis({ response: null, error: null });
        setIsSynthesizing(false);
        currentResponsesRef.current = []; // Reset ref for new submission

        // Cleanup previous listener if exists
        if (responseListenerCleanup.current) {
            responseListenerCleanup.current();
            responseListenerCleanup.current = null;
        }

        const submittedUserQuery = userQuery; // Capture user query at time of submission
        const submittedSynthesisInstructions = synthesisPrompt; // Capture synthesis instructions

        try {
            // Send the USER QUERY to the individual models
            const query = window.electron.startMultidialogQuery(submittedUserQuery);

            responseListenerCleanup.current = query.onResponse(data => {
                console.log("Received response:", data);
                // Update state incrementally for UI display
                setResponses(prev => [...prev, { model: data.model, response: data.response, error: data.error }]);

                // Update ref used for triggering synthesis
                currentResponsesRef.current = [
                    ...currentResponsesRef.current,
                    { model: data.model, response: data.response, error: data.error }
                ];

                // Check if all expected responses have arrived
                if (currentResponsesRef.current.length >= EXPECTED_MODELS_COUNT) {
                    console.log("All expected responses received.");
                    if (responseListenerCleanup.current) {
                        responseListenerCleanup.current(); // Stop listening for more individual responses
                        responseListenerCleanup.current = null;
                    }
                    // Trigger synthesis with the original query, the instructions, and the responses
                    triggerSynthesis(submittedUserQuery, submittedSynthesisInstructions, currentResponsesRef.current);
                }
            });

        } catch (error) {
            console.error("Error starting multidialog query:", error);
            toast.error(`Failed to start query: ${error.message}`);
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                toast.success('Copied to clipboard!');
            })
            .catch(err => {
                toast.error('Failed to copy text.');
                console.error('Clipboard copy failed:', err);
            });
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full p-4 space-y-4">
                <h1 className="text-2xl font-semibold">Multidialog</h1>
                <p className="text-muted-foreground">
                    Enter your query below. It will be sent to multiple AI models simultaneously.
                    The DeepSeek R1 model will then synthesize a final answer based on the instructions provided in the prompt template.
                </p>

                {/* User Query Input */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="user-query">Your Query</Label>
                        <div className="flex space-x-2">
                            {/* Prompt Template Select */}
                            <Select onValueChange={handlePromptSelect} disabled={isLoading || isSynthesizing || prompts.length === 0}>
                                <SelectTrigger className="w-[180px] h-8 text-xs" aria-label="Select Prompt Template">
                                    <FileText className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <SelectValue placeholder="Load Prompt..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {prompts.map((prompt) => (
                                        <SelectItem key={prompt.id} value={prompt.id} className="text-xs">
                                            {prompt.name}
                                        </SelectItem>
                                    ))}
                                    {prompts.length === 0 && <SelectItem value="no-prompts" disabled>No saved prompts</SelectItem>}
                                </SelectContent>
                            </Select>
                            {/* Context Select */}
                            <Select onValueChange={handleContextSelect} disabled={isLoading || isSynthesizing || contexts.length === 0}>
                                <SelectTrigger className="w-[180px] h-8 text-xs" aria-label="Select Context">
                                    <FolderSearch className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <SelectValue placeholder="Apply Context..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {contexts.map((context) => (
                                        <SelectItem key={context.id} value={context.id} className="text-xs">
                                            {context.name}
                                        </SelectItem>
                                    ))}
                                    {contexts.length === 0 && <SelectItem value="no-contexts" disabled>No saved contexts</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Textarea
                        id="user-query"
                        placeholder="Enter your query here, or select a prompt/context above..."
                        value={userQuery}
                        onChange={handleUserQueryChange}
                        rows={5}
                        className="flex-grow-0"
                        disabled={isLoading || isSynthesizing}
                    />
                </div>

                {/* Synthesis Instructions Input */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="synthesis-prompt">Synthesis Prompt Template (for DeepSeek R1)</Label>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p>This prompt instructs the final model (DeepSeek R1) on how to combine the answers from the other models. Placeholders like {`{USER_QUERY}`} and {`{MODEL_RESPONSES}`} will be automatically filled.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Textarea
                        id="synthesis-prompt"
                        placeholder="Enter the instructions for the synthesis model..."
                        value={synthesisPrompt}
                        onChange={handleSynthesisPromptChange}
                        rows={8}
                        className="flex-grow-0 font-mono text-sm"
                        disabled={isLoading || isSynthesizing}
                    />
                </div>

                <Button onClick={handleSubmit} disabled={isLoading || isSynthesizing || !userQuery.trim()}>
                    {isLoading ? 'Generating Responses...' : isSynthesizing ? 'Synthesizing...' : 'Submit Query'}
                </Button>

                <ScrollArea className="flex-grow">
                    <div className="space-y-4">
                        {/* Synthesized Response */}
                        {(synthesis.response || synthesis.error || isSynthesizing) && (
                            <Card className="border-primary">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        Synthesized Response (DeepSeek R1)
                                        {synthesis.response && !synthesis.error && (
                                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(synthesis.response)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isSynthesizing && !synthesis.response && !synthesis.error && <p>Synthesizing final answer...</p>}
                                    {synthesis.error && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Synthesis Error</AlertTitle>
                                            <AlertDescription>{synthesis.error}</AlertDescription>
                                        </Alert>
                                    )}
                                    {synthesis.response && <p>{synthesis.response}</p>}
                                </CardContent>
                            </Card>
                        )}

                        {/* Individual Responses */}
                        {isLoading && responses.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">Sending query to models...</p>
                        )}
                        {(!isLoading || responses.length > 0) && responses.length > 0 && (
                            <h2 className="text-lg font-semibold pt-4">Individual Model Responses</h2>
                        )}
                        {responses.map((res, index) => (
                            <Card key={`${res.model}-${index}`}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {res.model}
                                        {res.response && !res.error && (
                                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(res.response)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {res.error && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>{res.error}</AlertDescription>
                                        </Alert>
                                    )}
                                    {res.response && <p>{res.response}</p>}
                                    {!res.response && !res.error && (
                                        <p className="text-muted-foreground italic">Waiting for response...</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
}

export default MultidialogPage; 