import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Info, FolderSearch, FileText, Bot, CheckSquare, Square, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContextManager } from '../context/ContextManagerContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
{MODEL_RESPONSES}

Your unique response without mentioning the others responses:
`;

// NO LONGER STATIC: Calculate expected models count (excluding default and synthesis model)
// const EXPECTED_MODELS_COUNT = Object.keys(MODEL_CONTEXT_SIZES).filter(
//     model => model !== 'default' && model !== 'deepseek-r1-distill-llama-70b'
// ).length;

const DEFAULT_CALLS_PER_MINUTE = 60; // Default rate limit (essentially unlimited)
const MAX_CALLS_PER_MINUTE = 60;

const DEFAULT_TEMPERATURE = 0.7;

const LOCAL_STORAGE_KEY = 'multidialogConfig';

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

    // Per-model config: { [modelName]: { iterations, delaySec, temperature } }
    const [modelCallConfig, setModelCallConfig] = useState(() => Object.fromEntries(
        AVAILABLE_MODELS.map(m => [m, { iterations: 1, delaySec: 0, temperature: DEFAULT_TEMPERATURE }])
    ));

    // Update config when models are toggled
    useEffect(() => {
        setModelCallConfig(prev => {
            const updated = { ...prev };
            selectedTargetModels.forEach(m => {
                if (!updated[m]) updated[m] = { iterations: 1, delaySec: 0, temperature: DEFAULT_TEMPERATURE };
            });
            Object.keys(updated).forEach(m => {
                if (!selectedTargetModels.includes(m)) delete updated[m];
            });
            return updated;
        });
    }, [selectedTargetModels]);

    const handleModelConfigChange = (model, field, value) => {
        let numValue = Number(value);
        // Clamp temperature between 0.0 and 2.0
        if (field === 'temperature') {
            numValue = Math.max(0.0, Math.min(2.0, numValue));
        } else {
            numValue = Math.max(0, numValue);
        }

        setModelCallConfig(prev => ({
            ...prev,
            [model]: {
                ...prev[model],
                [field]: numValue
            }
        }));
    };

    const handleModelTempSliderChange = (model, value) => {
        const tempValue = value[0]; // Slider returns array
        handleModelConfigChange(model, 'temperature', tempValue);
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

    // Dynamically calculate total expected response count based on iterations
    const totalExpectedResponses = selectedTargetModels.reduce((sum, modelName) => {
        const config = modelCallConfig[modelName] || { iterations: 1 };
        return sum + Math.max(1, config.iterations);
    }, 0);

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

        // --- Reset state --- 
        setIsLoading(true);
        setResponses([]);
        setSynthesis({ response: null, error: null });
        setIsSynthesizing(false);
        currentResponsesRef.current = []; // Reset the ref holding received responses

        // --- Cleanup previous listener --- 
        if (responseListenerCleanup.current) {
            responseListenerCleanup.current();
            responseListenerCleanup.current = null;
        }

        // --- Capture current state for this submission --- 
        const submittedUserQuery = userQuery;
        const submittedSynthesisInstructions = synthesisPrompt;
        const submittedTargetModels = [...selectedTargetModels]; // Clone array
        const submittedSynthesisModel = selectedSynthesisModel;
        const submittedModelCallConfig = { ...modelCallConfig }; // Clone object
        // Calculate expected count for THIS submission based on captured config
        const expectedResponseCountForSubmission = submittedTargetModels.reduce((sum, modelName) => {
            const config = submittedModelCallConfig[modelName] || { iterations: 1 };
            return sum + Math.max(1, config.iterations);
        }, 0);

        try {
            // Pass modelCallConfig to backend
            const query = window.electron.startMultidialogQuery(submittedUserQuery, submittedTargetModels, submittedModelCallConfig);

            responseListenerCleanup.current = query.onResponse(data => {
                console.log("Received response:", data); // data should include iteration
                // Add to responses state for UI display (grouped later)
                setResponses(prev => [...prev, data]);
                // Add to ref used for checking completion
                currentResponsesRef.current.push(data);

                // Check if all expected responses (including iterations) have arrived for THIS submission
                if (currentResponsesRef.current.length >= expectedResponseCountForSubmission) {
                    console.log(`All ${expectedResponseCountForSubmission} expected responses received.`);
                    if (responseListenerCleanup.current) {
                        responseListenerCleanup.current();
                        responseListenerCleanup.current = null;
                    }
                    // Filter only the successful responses from the ref for synthesis
                    const successfulResponsesForSynthesis = currentResponsesRef.current.filter(r => r.response && !r.error);
                    triggerSynthesis(submittedUserQuery, submittedSynthesisInstructions, successfulResponsesForSynthesis, submittedSynthesisModel);
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

    // Group responses by model for Accordion display
    const groupedResponses = responses.reduce((acc, res) => {
        if (!acc[res.model]) {
            acc[res.model] = [];
        }
        acc[res.model].push(res); // Store the whole response object
        return acc;
    }, {});

    // Load config from localStorage on mount
    useEffect(() => {
        const savedConfigRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedConfigRaw) {
            try {
                const savedConfig = JSON.parse(savedConfigRaw);
                if (savedConfig.selectedTargetModels) {
                    setSelectedTargetModels(savedConfig.selectedTargetModels);
                }
                if (savedConfig.selectedSynthesisModel) {
                    setSelectedSynthesisModel(savedConfig.selectedSynthesisModel);
                }
                if (savedConfig.modelCallConfig) {
                    // Merge saved config with defaults to ensure all models have entries
                    setModelCallConfig(prev => {
                        const loadedConf = savedConfig.modelCallConfig;
                        const mergedConf = { ...prev }; // Start with current state (which includes defaults)
                        Object.keys(loadedConf).forEach(modelName => {
                            if (mergedConf[modelName]) { // Only update if model still exists
                                mergedConf[modelName] = { ...mergedConf[modelName], ...loadedConf[modelName] };
                            }
                        });
                        return mergedConf;
                    });
                }
                toast.info("Loaded saved Multidialog configuration.");
            } catch (error) {
                console.error("Failed to parse saved multidialog config:", error);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
                toast.error("Failed to load saved configuration.");
            }
        }
    }, []); // Empty array ensures this runs only once on mount

    const handleSaveConfig = () => {
        try {
            const configToSave = {
                selectedTargetModels,
                selectedSynthesisModel,
                modelCallConfig,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configToSave));
            toast.success("Multidialog configuration saved successfully!");
        } catch (error) {
            console.error("Failed to save multidialog config:", error);
            toast.error("Failed to save configuration.");
        }
    };

    return (
        <TooltipProvider>
            <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">

                {/* Left Column: Configuration */}
                <ScrollArea className="h-full p-4 border-r">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-semibold">Multidialog Configuration</h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleSaveConfig}>
                                        <Save className="h-5 w-5" />
                                        <span className="sr-only">Save Configuration</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Save current settings (models, iterations, delays, temperature) to local storage.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-muted-foreground">
                            Configure target models, iterations, delays, temperature, and synthesis model.
                        </p>

                        {/* Model Selection Section */}
                        <div className="grid grid-cols-1 gap-4 border p-4 rounded-md">
                            {/* Target Model Selection */}
                            <div className="space-y-2">
                                <Label className="font-medium">Target Models (for parallel query)</Label>
                                <div className="grid grid-cols-[auto,1fr,60px,32px,60px,60px,100px,40px] items-center gap-2 text-xs text-muted-foreground px-2 pb-1 border-b">
                                    <div></div>
                                    <div>Model</div>
                                    <div className="text-center">Iter</div>
                                    <div></div>
                                    <div className="text-center">Delay</div>
                                    <div></div>
                                    <div className="text-center">Temp</div>
                                    <div></div>
                                </div>
                                <ScrollArea className="h-48 border rounded-md p-2">
                                    <div className="space-y-2">
                                        {AVAILABLE_MODELS.map(modelName => (
                                            <div
                                                key={modelName}
                                                className="grid grid-cols-[auto,1fr,60px,32px,60px,60px,100px,40px] items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={`target-${modelName}`}
                                                    checked={selectedTargetModels.includes(modelName)}
                                                    onCheckedChange={() => handleTargetModelToggle(modelName)}
                                                    disabled={isLoading || isSynthesizing}
                                                />
                                                <label
                                                    htmlFor={`target-${modelName}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate pr-1"
                                                    title={modelName}
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
                                                            className="w-14 h-7 text-xs px-1 text-center"
                                                            disabled={isLoading || isSynthesizing}
                                                        />
                                                        <span className="text-xs">iter</span>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={modelCallConfig[modelName]?.delaySec || 0}
                                                            onChange={e => handleModelConfigChange(modelName, 'delaySec', e.target.value)}
                                                            className="w-14 h-7 text-xs px-1 text-center"
                                                            disabled={isLoading || isSynthesizing}
                                                        />
                                                        <span className="text-xs">sec delay</span>
                                                        <Slider
                                                            value={[modelCallConfig[modelName]?.temperature ?? DEFAULT_TEMPERATURE]}
                                                            min={0}
                                                            max={2}
                                                            step={0.1}
                                                            onValueChange={(val) => handleModelTempSliderChange(modelName, val)}
                                                            className="w-full h-7 py-2.5"
                                                            disabled={isLoading || isSynthesizing}
                                                        />
                                                        <span className="text-xs text-right tabular-nums">
                                                            {(modelCallConfig[modelName]?.temperature ?? DEFAULT_TEMPERATURE).toFixed(1)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <><div></div><div></div><div></div><div></div><div></div><div></div></>
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

                        {/* Synthesis Instructions Input (Modal Trigger) */}
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
                    </div>
                </ScrollArea>

                {/* Right Column: Results */}
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {/* Synthesized Response (always visible when available) */}
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

                        {/* Individual Responses (in Accordion) */}
                        {isLoading && Object.keys(groupedResponses).length === 0 && (
                            <p className="text-center text-muted-foreground py-4">Sending query to {selectedTargetModels.length} model(s)...</p>
                        )}
                        {(!isLoading || Object.keys(groupedResponses).length > 0) && Object.keys(groupedResponses).length > 0 && (
                            <h2 className="text-lg font-semibold pt-4">Individual Model Responses</h2>
                        )}
                        <Accordion type="multiple" className="w-full">
                            {Object.entries(groupedResponses).map(([modelName, modelResponses]) => (
                                <AccordionItem value={modelName} key={modelName}>
                                    <AccordionTrigger>{modelName} ({modelResponses.length} response{modelResponses.length > 1 ? 's' : ''})</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            {modelResponses.map((res, index) => (
                                                <Card key={`${res.model}-${index}`}>
                                                    <CardHeader className="p-3">
                                                        <CardTitle className="text-sm flex justify-between items-center">
                                                            Response {index + 1}
                                                            {res.response && !res.error && (
                                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(res.response)} className="h-6 w-6">
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-3 pt-0">
                                                        {res.error && (
                                                            <Alert variant="destructive" className="p-2 text-xs">
                                                                <AlertTitle className="text-xs">Error</AlertTitle>
                                                                <AlertDescription>{res.error}</AlertDescription>
                                                            </Alert>
                                                        )}
                                                        {res.response && <p className="text-sm">{res.response}</p>}
                                                        {!res.response && !res.error && (
                                                            <p className="text-muted-foreground italic text-sm">Waiting for response...</p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
}

export default MultidialogPage; 