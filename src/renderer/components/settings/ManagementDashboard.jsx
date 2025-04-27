import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useContextManager } from '@/context/ContextManagerContext';
import { ContextEditorForm } from './ContextEditorForm';
import { PromptEditorForm } from './PromptEditorForm';
import { formatDistanceToNow } from 'date-fns';

function ItemTable({ items, itemType, onEdit, onDelete, searchTerm }) {
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(lowerSearchTerm) ||
            item.description.toLowerCase().includes(lowerSearchTerm) ||
            item.content.toLowerCase().includes(lowerSearchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
        );
    }, [items, searchTerm]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Tags</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell truncate max-w-xs">{item.description || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">
                                {item.tags?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                ) : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden lg:table-cell">
                                {formatDistanceToNow(new Date(item.lastModified), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="mr-2">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(item)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No {itemType} found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export function ManagementDashboard() {
    const {
        contexts, listContexts, deleteContext,
        prompts, listPrompts, deletePrompt,
        isLoaded
    } = useContextManager();

    const [contextSearchTerm, setContextSearchTerm] = useState('');
    const [promptSearchTerm, setPromptSearchTerm] = useState('');

    const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
    const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);

    const [selectedContext, setSelectedContext] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(null);

    const [itemToDelete, setItemToDelete] = useState(null); // Can be context or prompt
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Filtered lists based on search terms
    const filteredContexts = useMemo(() => listContexts({ searchTerm: contextSearchTerm }), [listContexts, contextSearchTerm]);
    const filteredPrompts = useMemo(() => listPrompts({ searchTerm: promptSearchTerm }), [listPrompts, promptSearchTerm]);

    const handleNewContext = () => {
        setSelectedContext(null);
        setIsContextEditorOpen(true);
    };

    const handleEditContext = (context) => {
        setSelectedContext(context);
        setIsContextEditorOpen(true);
    };

    const handleNewPrompt = () => {
        setSelectedPrompt(null);
        setIsPromptEditorOpen(true);
    };

    const handleEditPrompt = (prompt) => {
        setSelectedPrompt(prompt);
        setIsPromptEditorOpen(true);
    };

    const handleDeleteRequest = (item) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        let result;
        if ('isTemplate' in itemToDelete) { // It's a context
            result = await deleteContext(itemToDelete.id);
        } else { // It's a prompt
            result = await deletePrompt(itemToDelete.id);
        }

        if (result.success) {
            console.log(`Deleted item: ${itemToDelete.id}`);
            // List will update automatically due to context state change
        } else {
            console.error('Failed to delete item');
            // TODO: Show error toast
        }

        setItemToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    const handleSave = (savedItem) => {
        console.log('Saved item:', savedItem);
        // No need to manually update list, context handles it
        // Close respective modals handled internally by forms
    }

    if (!isLoaded) {
        return <div>Loading management dashboard...</div>; // Or a spinner component
    }

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-2xl font-semibold mb-4">Manage Contexts & Prompts</h2>
            <Tabs defaultValue="contexts">
                <TabsList className="mb-4">
                    <TabsTrigger value="contexts">Custom Contexts</TabsTrigger>
                    <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
                </TabsList>

                {/* Contexts Tab */}
                <TabsContent value="contexts">
                    <div className="flex justify-between items-center mb-4">
                        <Input
                            placeholder="Search contexts..."
                            value={contextSearchTerm}
                            onChange={(e) => setContextSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button onClick={handleNewContext}>
                            <PlusCircle className="mr-2 h-4 w-4" /> New Context
                        </Button>
                    </div>
                    <ItemTable
                        items={filteredContexts}
                        itemType="contexts"
                        onEdit={handleEditContext}
                        onDelete={handleDeleteRequest}
                        searchTerm={contextSearchTerm} // Pass searchTerm directly
                    />
                </TabsContent>

                {/* Prompts Tab */}
                <TabsContent value="prompts">
                    <div className="flex justify-between items-center mb-4">
                        <Input
                            placeholder="Search prompts..."
                            value={promptSearchTerm}
                            onChange={(e) => setPromptSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button onClick={handleNewPrompt}>
                            <PlusCircle className="mr-2 h-4 w-4" /> New Prompt
                        </Button>
                    </div>
                    <ItemTable
                        items={filteredPrompts}
                        itemType="prompts"
                        onEdit={handleEditPrompt}
                        onDelete={handleDeleteRequest}
                        searchTerm={promptSearchTerm} // Pass searchTerm directly
                    />
                </TabsContent>
            </Tabs>

            {/* Context Editor Modal */}
            <ContextEditorForm
                isOpen={isContextEditorOpen}
                onOpenChange={setIsContextEditorOpen}
                contextToEdit={selectedContext}
                onSave={handleSave}
            />

            {/* Prompt Editor Modal */}
            <PromptEditorForm
                isOpen={isPromptEditorOpen}
                onOpenChange={setIsPromptEditorOpen}
                promptToEdit={selectedPrompt}
                onSave={handleSave}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            "{itemToDelete?.name}" {itemToDelete && 'isTemplate' in itemToDelete ? 'context' : 'prompt'}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 