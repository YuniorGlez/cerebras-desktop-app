import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Constants
const CONTEXT_STORAGE_KEY = 'cerebras-custom-contexts';
const PROMPT_STORAGE_KEY = 'cerebras-prompt-templates';
const MAX_NAME_LENGTH = 128;
const MIN_NAME_LENGTH = 2;
const MAX_CONTENT_LENGTH = 200000;
const MAX_PROMPT_LENGTH = 32000;

// CustomContext type definition
/**
 * @typedef {Object} CustomContext
 * @property {string} id - Unique identifier
 * @property {string} name - User-friendly name (3-50 chars)
 * @property {string} description - Optional description
 * @property {string} content - The actual context content
 * @property {string[]} tags - Metadata for filtering/organization
 * @property {number} creationDate - Unix timestamp (ms)
 * @property {number} lastModified - Unix timestamp (ms)
 * @property {boolean} isTemplate - Flag for system-provided vs user contexts
 */

// PromptTemplate type definition
/**
 * @typedef {Object} PromptTemplate
 * @property {string} id - Unique identifier
 * @property {string} name - User-friendly name (3-50 chars)
 * @property {string} description - Optional description
 * @property {string} content - The prompt content (max 10k chars)
 * @property {string[]} tags - Metadata for filtering/organization
 * @property {number} creationDate - Unix timestamp (ms)
 * @property {number} lastModified - Unix timestamp (ms)
 */

// Validation error type
/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the context is valid
 * @property {string[]} errors - List of validation error messages
 */

// Create the context
const ContextManagerContext = createContext(null);

// Storage helper functions
function loadContexts() {
    try {
        const data = localStorage.getItem(CONTEXT_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load contexts from localStorage:', error);
        // Optionally: Clear corrupted data
        // localStorage.removeItem(CONTEXT_STORAGE_KEY);
        return [];
    }
}

function saveContexts(contexts) {
    try {
        localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(contexts));
    } catch (error) {
        console.error('Failed to save contexts to localStorage:', error);
    }
}

// Added Storage helper functions for Prompts
function loadPrompts() {
    try {
        const data = localStorage.getItem(PROMPT_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load prompt templates from localStorage:', error);
        return [];
    }
}

function savePrompts(prompts) {
    try {
        localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompts));
    } catch (error) {
        console.error('Failed to save prompt templates to localStorage:', error);
    }
}

export function ContextManagerProvider({ children }) {
    const [contexts, setContexts] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [isContextsLoaded, setIsContextsLoaded] = useState(false);
    const [isPromptsLoaded, setIsPromptsLoaded] = useState(false);

    // Combined loaded state
    const isLoaded = isContextsLoaded && isPromptsLoaded;

    // Load contexts from localStorage on mount
    useEffect(() => {
        const loaded = loadContexts();
        setContexts(loaded);
        setIsContextsLoaded(true);
        console.log(`Loaded ${loaded.length} contexts.`);
    }, []);

    // Load prompts from localStorage on mount
    useEffect(() => {
        const loaded = loadPrompts();
        setPrompts(loaded);
        setIsPromptsLoaded(true);
        console.log(`Loaded ${loaded.length} prompt templates.`);
    }, []);

    // Save contexts to localStorage whenever they change
    useEffect(() => {
        if (isContextsLoaded) {
            saveContexts(contexts);
        }
    }, [contexts, isContextsLoaded]);

    // Save prompts to localStorage whenever they change
    useEffect(() => {
        if (isPromptsLoaded) {
            savePrompts(prompts);
        }
    }, [prompts, isPromptsLoaded]);

    /**
     * Validates a context object
     * @param {Partial<CustomContext>} context - The context to validate
     * @returns {ValidationResult} Validation result
     */
    const validateContext = useCallback((context) => {
        const errors = [];

        if (!context.name?.trim()) {
            errors.push('Name is required');
        } else if (context.name.length < MIN_NAME_LENGTH || context.name.length > MAX_NAME_LENGTH) {
            errors.push(`Name must be between ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters`);
        }

        if (!context.content?.trim()) {
            errors.push('Content is required');
        } else if (context.content.length > MAX_CONTENT_LENGTH) {
            errors.push(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
        }

        // Add more validation as needed (e.g., tag format)

        return { valid: errors.length === 0, errors };
    }, []);

    /**
     * Creates a new context
     * @param {Omit<CustomContext, 'id' | 'creationDate' | 'lastModified'>} contextData 
     * @returns {{ success: boolean, context?: CustomContext, errors?: string[] }}
     */
    const createContext = useCallback((contextData) => {
        const now = Date.now();
        const newContext = {
            id: uuidv4(),
            name: '', // Ensure defaults if not provided
            description: '',
            content: '',
            tags: [],
            isTemplate: false,
            ...contextData, // Spread provided data over defaults
            creationDate: now,
            lastModified: now,
        };

        const validation = validateContext(newContext);
        if (!validation.valid) {
            console.warn('Context validation failed:', validation.errors);
            return { success: false, errors: validation.errors };
        }

        setContexts(prev => [...prev, newContext]);
        console.log('Context created:', newContext.id);
        return { success: true, context: newContext };
    }, [validateContext]);

    /**
     * Updates an existing context
     * @param {string} id - Context ID to update
     * @param {Partial<Omit<CustomContext, 'id' | 'creationDate'>>} updates - Fields to update
     * @returns {{ success: boolean, context?: CustomContext, errors?: string[] }}
     */
    const updateContext = useCallback((id, updates) => {
        const contextIndex = contexts.findIndex(c => c.id === id);
        if (contextIndex === -1) {
            console.warn('Update failed: Context not found', id);
            return { success: false, errors: ['Context not found'] };
        }

        // Prevent updating immutable fields
        const safeUpdates = { ...updates };
        delete safeUpdates.id;
        delete safeUpdates.creationDate;

        const updatedContext = {
            ...contexts[contextIndex],
            ...safeUpdates,
            lastModified: Date.now()
        };

        const validation = validateContext(updatedContext);
        if (!validation.valid) {
            console.warn('Context update validation failed:', validation.errors);
            return { success: false, errors: validation.errors };
        }

        const newContexts = [...contexts];
        newContexts[contextIndex] = updatedContext;
        setContexts(newContexts);
        console.log('Context updated:', id);
        return { success: true, context: updatedContext };
    }, [contexts, validateContext]);

    /**
     * Deletes a context by ID
     * @param {string} id - Context ID to delete
     * @returns {{ success: boolean }}
     */
    const deleteContext = useCallback((id) => {
        const contextIndex = contexts.findIndex(c => c.id === id);
        if (contextIndex === -1) {
            console.warn('Delete failed: Context not found', id);
            return { success: false };
        }

        setContexts(prev => prev.filter(c => c.id !== id));
        console.log('Context deleted:', id);
        return { success: true };
    }, [contexts]);

    /**
     * Gets a context by ID
     * @param {string} id - Context ID to retrieve
     * @returns {CustomContext|null} The context or null if not found
     */
    const getContext = useCallback((id) => {
        return contexts.find(c => c.id === id) || null;
    }, [contexts]);

    /**
     * Lists all contexts, optionally filtered
     * @param {{ isTemplate?: boolean, tags?: string[], searchTerm?: string }} [filters={}] - Optional filters
     * @returns {CustomContext[]} Filtered contexts sorted by lastModified descending
     */
    const listContexts = useCallback((filters = {}) => {
        let result = [...contexts];

        if (filters.isTemplate !== undefined) {
            result = result.filter(c => c.isTemplate === filters.isTemplate);
        }

        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(c =>
                filters.tags.every(tag => c.tags.includes(tag)) // Changed from some to every
            );
        }

        if (filters.searchTerm) {
            const lowerSearchTerm = filters.searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerSearchTerm) ||
                c.description.toLowerCase().includes(lowerSearchTerm) ||
                c.content.toLowerCase().includes(lowerSearchTerm) ||
                c.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
            );
        }

        // Sort by last modified date, newest first
        result.sort((a, b) => b.lastModified - a.lastModified);

        return result;
    }, [contexts]);

    /**
     * Validates a prompt template object
     * @param {Partial<PromptTemplate>} prompt - The prompt to validate
     * @returns {ValidationResult} Validation result
     */
    const validatePrompt = useCallback((prompt) => {
        const errors = [];

        if (!prompt.name?.trim()) {
            errors.push('Name is required');
        } else if (prompt.name.length < MIN_NAME_LENGTH || prompt.name.length > MAX_NAME_LENGTH) {
            errors.push(`Name must be between ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters`);
        }

        if (!prompt.content?.trim()) {
            errors.push('Content is required');
        } else if (prompt.content.length > MAX_PROMPT_LENGTH) {
            errors.push(`Content exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
        }

        // Add more validation as needed (e.g., tag format)

        return { valid: errors.length === 0, errors };
    }, []);

    /**
     * Creates a new prompt template
     * @param {Omit<PromptTemplate, 'id' | 'creationDate' | 'lastModified'>} promptData 
     * @returns {{ success: boolean, prompt?: PromptTemplate, errors?: string[] }}
     */
    const createPrompt = useCallback((promptData) => {
        const now = Date.now();
        const newPrompt = {
            id: uuidv4(),
            name: '',
            description: '',
            content: '',
            tags: [],
            ...promptData,
            creationDate: now,
            lastModified: now,
        };

        const validation = validatePrompt(newPrompt);
        if (!validation.valid) {
            console.warn('Prompt validation failed:', validation.errors);
            return { success: false, errors: validation.errors };
        }

        setPrompts(prev => [...prev, newPrompt]);
        console.log('Prompt created:', newPrompt.id);
        return { success: true, prompt: newPrompt };
    }, [validatePrompt]);

    /**
     * Updates an existing prompt template
     * @param {string} id - Prompt ID to update
     * @param {Partial<Omit<PromptTemplate, 'id' | 'creationDate'>>} updates - Fields to update
     * @returns {{ success: boolean, prompt?: PromptTemplate, errors?: string[] }}
     */
    const updatePrompt = useCallback((id, updates) => {
        const promptIndex = prompts.findIndex(p => p.id === id);
        if (promptIndex === -1) {
            console.warn('Update failed: Prompt not found', id);
            return { success: false, errors: ['Prompt not found'] };
        }

        const safeUpdates = { ...updates };
        delete safeUpdates.id;
        delete safeUpdates.creationDate;

        const updatedPrompt = {
            ...prompts[promptIndex],
            ...safeUpdates,
            lastModified: Date.now()
        };

        const validation = validatePrompt(updatedPrompt);
        if (!validation.valid) {
            console.warn('Prompt update validation failed:', validation.errors);
            return { success: false, errors: validation.errors };
        }

        const newPrompts = [...prompts];
        newPrompts[promptIndex] = updatedPrompt;
        setPrompts(newPrompts);
        console.log('Prompt updated:', id);
        return { success: true, prompt: updatedPrompt };
    }, [prompts, validatePrompt]);

    /**
     * Deletes a prompt template by ID
     * @param {string} id - Prompt ID to delete
     * @returns {{ success: boolean }}
     */
    const deletePrompt = useCallback((id) => {
        const promptIndex = prompts.findIndex(p => p.id === id);
        if (promptIndex === -1) {
            console.warn('Delete failed: Prompt not found', id);
            return { success: false };
        }

        setPrompts(prev => prev.filter(p => p.id !== id));
        console.log('Prompt deleted:', id);
        return { success: true };
    }, [prompts]);

    /**
     * Gets a prompt template by ID
     * @param {string} id - Prompt ID to retrieve
     * @returns {PromptTemplate|null} The prompt or null if not found
     */
    const getPrompt = useCallback((id) => {
        return prompts.find(p => p.id === id) || null;
    }, [prompts]);

    /**
     * Lists all prompt templates, optionally filtered
     * @param {{ tags?: string[], searchTerm?: string }} [filters={}] - Optional filters
     * @returns {PromptTemplate[]} Filtered prompts sorted by lastModified descending
     */
    const listPrompts = useCallback((filters = {}) => {
        let result = [...prompts];

        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(p =>
                filters.tags.every(tag => p.tags.includes(tag))
            );
        }

        if (filters.searchTerm) {
            const lowerSearchTerm = filters.searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerSearchTerm) ||
                p.description.toLowerCase().includes(lowerSearchTerm) ||
                p.content.toLowerCase().includes(lowerSearchTerm) ||
                p.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
            );
        }

        result.sort((a, b) => b.lastModified - a.lastModified);

        return result;
    }, [prompts]);

    const value = {
        contexts,
        createContext,
        updateContext,
        deleteContext,
        getContext,
        listContexts,
        validateContext,
        prompts,
        createPrompt,
        updatePrompt,
        deletePrompt,
        getPrompt,
        listPrompts,
        validatePrompt,
        isLoaded
    };

    return (
        <ContextManagerContext.Provider value={value}>
            {children}
        </ContextManagerContext.Provider>
    );
}

// Helper hook for using the context
export function useContextManager() {
    const context = useContext(ContextManagerContext);
    if (!context) {
        throw new Error('useContextManager must be used within a ContextManagerProvider');
    }
    return context;
}

// Example Usage (in another component):
// import { useContextManager } from './ContextManagerContext';
//
// function MyComponent() {
//   const { createContext, listContexts, isLoaded } = useContextManager();
//
//   if (!isLoaded) return <div>Loading contexts...</div>;
//
//   const handleAddContext = () => {
//     const result = createContext({ name: 'New Context', content: 'Initial content', isTemplate: false });
//     if (result.success) {
//       console.log('Added context:', result.context);
//     } else {
//       console.error('Failed to add context:', result.errors);
//     }
//   };
//
//   const userContexts = listContexts({ isTemplate: false });
//
//   return (
//     <div>
//       <button onClick={handleAddContext}>Add Context</button>
//       <ul>
//         {userContexts.map(ctx => <li key={ctx.id}>{ctx.name}</li>)}
//       </ul>
//     </div>
//   );
// } 