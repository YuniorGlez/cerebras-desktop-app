import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Info, FolderSearch, FileText, Bot, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContextManager } from '../context/ContextManagerContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

const DEFAULT_SYNTHESIS_MODEL = 'llama-3.3-70b';

// Get list of available models for selection (excluding default)
const AVAILABLE_MODELS = Object.keys(MODEL_CONTEXT_SIZES).filter(m => m !== 'default');
const AVAILABLE_TARGET_MODELS = AVAILABLE_MODELS.filter(m => m !== DEFAULT_SYNTHESIS_MODEL);

const DEFAULT_SYNTHESIS_INSTRUCTIONS = `You are an expert synthesizer AI. Analyze the following user query and the responses provided by different AI models. Your task is to combine the best aspects of each response into a single, comprehensive, and accurate final answer based *only* on the information provided in the responses. Ensure accuracy, coherence, and do not add any external information. Respond directly to the user query based on the synthesis.

User Query:
{USER_QUERY}

Model Responses:
{MODEL_RESPONSES}`;

// NO LONGER STATIC: Calculate expected models count (excluding default and synthesis model)
// const EXPECTED_MODELS_COUNT = Object.keys(MODEL_CONTEXT_SIZES).filter(
//     model => model !== 'default' && model !== 'deepseek-r1-distill-llama-70b'
// ).length;

const DEFAULT_CALLS_PER_MINUTE = 60; // Default rate limit (essentially unlimited)
const MAX_CALLS_PER_MINUTE = 60;

function MultidialogPage() {
    const { contexts, prompts } = useContextManager();
    const [synthesisPrompt, setSynthesisPrompt] = useState(DEFAULT_SYNTHESIS_INSTRUCTIONS);
    const [userQuery, setUserQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [responses, setResponses] = useState([]);
    const [synthesis, setSynthesis] = useState({ response: null, error: null });
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const responseListenerCleanup = useRef(null);
    const currentResponsesRef = useRef([]);

    // State for model selection
    const [selectedTargetModels, setSelectedTargetModels] = useState(AVAILABLE_TARGET_MODELS);
    const [selectedSynthesisModel, setSelectedSynthesisModel] = useState(DEFAULT_SYNTHESIS_MODEL);
    const [callsPerMinuteLimit, setCallsPerMinuteLimit] = useState(DEFAULT_CALLS_PER_MINUTE); // New state for rate limit

    // Per-model config: { [modelName]: { iterations, delaySec } }
    const [modelCallConfig, setModelCallConfig] = useState(() => Object.fromEntries(
        AVAILABLE_MODELS.map(m => [m, { iterations: 1, delaySec: 0 }])
    ));

    // Update config when models are toggled
    useEffect(() => {
        setModelCallConfig(prev => {
            const updated = { ...prev };
            // Ensure all selected models have config
            selectedTargetModels.forEach(m => {
                if (!updated[m]) updated[m] = { iterations: 1, delaySec: 0 };
            });
            // Remove config for unselected models
            Object.keys(updated).forEach(m => {
                if (!selectedTargetModels.includes(m)) delete updated[m];
            });
            return updated;
        });
    }, [selectedTargetModels]);

    const handleModelConfigChange = (model, field, value) => {
        setModelCallConfig(prev => ({
            ...prev,
            [model]: {
                ...prev[model],
                [field]: Math.max(0, Number(value))
            }
        }));
    };

    // Calculate total expected time (max sum of all model delays)
    const totalWaitSec = selectedTargetModels.reduce((max, m) => {
        const cfg = modelCallConfig[m] || { iterations: 1, delaySec: 0 };
        const t = (cfg.iterations) * cfg.delaySec + (1 * cfg.iterations);
        return Math.max(max, t);
    }, 0);

    // Dynamically calculate expected count based on selection
    const expectedModelsCount = selectedTargetModels.length;

    const [isSynthesisPromptModalOpen, setIsSynthesisPromptModalOpen] = useState(false);

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

    const handleTargetModelToggle = (modelName) => {
        setSelectedTargetModels(prev =>
            prev.includes(modelName)
                ? prev.filter(m => m !== modelName)
                : [...prev, modelName]
        );
    };

    const handleSynthesisModelSelect = (modelName) => {
        if (modelName) {
            setSelectedSynthesisModel(modelName);
            // Optional: Prevent the synthesis model from being a target model?
            // setSelectedTargetModels(prev => prev.filter(m => m !== modelName));
        }
    };

    const handleRateLimitChange = (value) => {
        // The slider returns an array, we take the first value
        const limit = value[0];
        setCallsPerMinuteLimit(limit);
    };

    const triggerSynthesis = async (originalUserQuery, synthesisInstructions, collectedResponses, synthesisModel) => {
        console.log(`Triggering synthesis with model ${synthesisModel} using instructions and responses:`, synthesisInstructions, collectedResponses);
        setIsSynthesizing(true);
        setSynthesis({ response: null, error: null });
        try {
            const result = await window.electron.synthesizeMultidialogResponses(originalUserQuery, synthesisInstructions, collectedResponses, synthesisModel);
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
            setIsLoading(false);
            setIsSynthesizing(false);
        }
    };

    const handleSubmit = async () => {
        if (!userQuery || !userQuery.trim()) {
            toast.warning("Please enter your query.");
            return;
        }
        if (selectedTargetModels.length === 0) {
            toast.warning("Please select at least one target model to query.");
            return;
        }
        if (callsPerMinuteLimit <= 0) {
            toast.warning("Calls per minute limit must be greater than 0.");
            return;
        }

        // Validate per-model config
        for (const m of selectedTargetModels) {
            const cfg = modelCallConfig[m];
            if (!cfg || cfg.iterations < 1) {
                toast.warning(`Model ${m}: iterations must be at least 1.`);
                return;
            }
            if (cfg.delaySec < 0) {
                toast.warning(`Model ${m}: delay cannot be negative.`);
                return;
            }
        }

        setIsLoading(true);
        setResponses([]);
        setSynthesis({ response: null, error: null });
        setIsSynthesizing(false);
        currentResponsesRef.current = [];

        if (responseListenerCleanup.current) {
            responseListenerCleanup.current();
            responseListenerCleanup.current = null;
        }

        const submittedUserQuery = userQuery;
        const submittedSynthesisInstructions = synthesisPrompt;
        const submittedTargetModels = selectedTargetModels; // Use state
        const submittedSynthesisModel = selectedSynthesisModel; // Use state
        const submittedModelCallConfig = { ...modelCallConfig };

        try {
            // Pass modelCallConfig to backend
            const query = window.electron.startMultidialogQuery(submittedUserQuery, submittedTargetModels, submittedModelCallConfig);

            responseListenerCleanup.current = query.onResponse(data => {
                console.log("Received response:", data);
                setResponses(prev => [...prev, { model: data.model, response: data.response, error: data.error }]);
                currentResponsesRef.current = [
                    ...currentResponsesRef.current,
                    { model: data.model, response: data.response, error: data.error }
                ];

                // Check if all SELECTED responses have arrived
                if (currentResponsesRef.current.length >= expectedModelsCount) { // Use dynamic count
                    console.log(`All ${expectedModelsCount} expected responses received.`);
                    if (responseListenerCleanup.current) {
                        responseListenerCleanup.current();
                        responseListenerCleanup.current = null;
                    }
                    // Trigger synthesis with selected model
                    triggerSynthesis(submittedUserQuery, submittedSynthesisInstructions, currentResponsesRef.current, submittedSynthesisModel);
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
                <h1 className="text-2xl font-semibold">Multidialog Configuration</h1>
                <p className="text-muted-foreground">
                    Configure target models for parallel querying and the final model for synthesizing the results.
                </p>

                {/* Model Selection Section */}
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                    {/* Target Model Selection */}
                    <div className="space-y-2">
                        <Label className="font-medium">Target Models (for parallel query)</Label>
                        <ScrollArea className="h-48 border rounded-md p-2">
                            <div className="space-y-2">
                                {AVAILABLE_MODELS.map(modelName => (
                                    <div
                                        key={modelName}
                                        className="grid grid-cols-[auto,1fr,60px,32px,60px,60px] items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`target-${modelName}`}
                                            checked={selectedTargetModels.includes(modelName)}
                                            onCheckedChange={() => handleTargetModelToggle(modelName)}
                                            disabled={isLoading || isSynthesizing}
                                        />
                                        <label
                                            htmlFor={`target-${modelName}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {modelName}
                                        </label>
                                        {selectedTargetModels.includes(modelName) ? (
                                            <>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={modelCallConfig[modelName]?.iterations || 1}
                                                    onChange={e => handleModelConfigChange(modelName, 'iterations', e.target.value)}
                                                    className="w-14 h-7 text-xs px-1"
                                                    disabled={isLoading || isSynthesizing}
                                                />
                                                <span className="text-xs">iter</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={modelCallConfig[modelName]?.delaySec || 0}
                                                    onChange={e => handleModelConfigChange(modelName, 'delaySec', e.target.value)}
                                                    className="w-14 h-7 text-xs px-1"
                                                    disabled={isLoading || isSynthesizing}
                                                />
                                                <span className="text-xs">sec delay</span>
                                            </>
                                        ) : (
                                            <><div></div><div></div><div></div><div></div></>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground">Set calls and delay for each model. Synthesis will wait for all iterations to finish.</p>
                        <div className="text-xs mt-2">Total wait before synthesis: <span className="font-bold">{totalWaitSec}s</span></div>
                    </div>

                    {/* Synthesis Model Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="synthesis-model-select" className="font-medium">Synthesis Model (for final answer)</Label>
                        <Select
                            id="synthesis-model-select"
                            value={selectedSynthesisModel}
                            onValueChange={handleSynthesisModelSelect}
                            disabled={isLoading || isSynthesizing}
                        >
                            <SelectTrigger className="w-full">
                                <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Select synthesis model..." />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_MODELS.map(modelName => (
                                    <SelectItem key={modelName} value={modelName}>
                                        {modelName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Model used to combine results.</p>
                    </div>
                </div>

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
                        <Label htmlFor="synthesis-prompt">Synthesis Prompt Template (for {selectedSynthesisModel})</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setIsSynthesisPromptModalOpen(true)}
                            className="ml-2"
                        >
                            Show / Change
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p>This prompt instructs the final model ({selectedSynthesisModel}) on how to combine the answers. Placeholders {`{USER_QUERY}`} and {`{MODEL_RESPONSES}`} will be filled.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    {/* Preview of current synthesis prompt (truncated) */}
                    <div className="hidden text-xs text-muted-foreground bg-muted rounded p-2 font-mono max-h-16 overflow-hidden whitespace-pre-line">
                        {synthesisPrompt.split('\n').slice(0, 2).join('\n')}{synthesisPrompt.split('\n').length > 2 ? '...' : ''}
                    </div>
                    {/* Modal for editing synthesis prompt */}
                    <Dialog open={isSynthesisPromptModalOpen} onOpenChange={setIsSynthesisPromptModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Synthesis Prompt Template</DialogTitle>
                            </DialogHeader>
                            <Textarea
                                id="synthesis-prompt-modal"
                                placeholder="Enter the instructions for the synthesis model..."
                                value={synthesisPrompt}
                                onChange={handleSynthesisPromptChange}
                                rows={8}
                                className="font-mono text-sm"
                                disabled={isLoading || isSynthesizing}
                            />
                            <DialogFooter>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setIsSynthesisPromptModalOpen(false)}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setIsSynthesisPromptModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Button onClick={handleSubmit} disabled={isLoading || isSynthesizing || !userQuery.trim() || selectedTargetModels.length === 0}>
                    {isLoading ? 'Generating Responses...' : isSynthesizing ? 'Synthesizing...' : 'Submit Query'}
                </Button>

                <ScrollArea className="flex-grow">
                    <div className="space-y-4">
                        {/* Synthesized Response */}
                        {(synthesis.response || synthesis.error || isSynthesizing) && (
                            <Card className="border-primary">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        Synthesized Response ({selectedSynthesisModel})
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
                            <p className="text-center text-muted-foreground py-4">Sending query to {selectedTargetModels.length} model(s)...</p>
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