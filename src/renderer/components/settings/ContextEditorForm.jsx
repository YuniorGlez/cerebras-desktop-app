import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useContextManager } from '@/context/ContextManagerContext';

export function ContextEditorForm({ contextToEdit, onSave, isOpen, onOpenChange }) {
    const { createContext, updateContext, validateContext } = useContextManager();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState(''); // Comma-separated string
    const [errors, setErrors] = useState({});

    const isEditing = Boolean(contextToEdit);

    useEffect(() => {
        if (isEditing && contextToEdit) {
            setName(contextToEdit.name || '');
            setDescription(contextToEdit.description || '');
            setContent(contextToEdit.content || '');
            setTags(contextToEdit.tags?.join(', ') || '');
            setErrors({});
        } else {
            // Reset form for creation
            setName('');
            setDescription('');
            setContent('');
            setTags('');
            setErrors({});
        }
    }, [contextToEdit, isEditing, isOpen]); // Reset when modal opens or context changes

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setErrors({}); // Clear previous errors

        const contextData = {
            name,
            description,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            // isTemplate is implicitly false for user-created contexts here
        };

        const validation = validateContext(contextData);

        if (!validation.valid) {
            // Map errors to state
            const newErrors = {};
            validation.errors.forEach(err => {
                if (err.toLowerCase().includes('name')) newErrors.name = err;
                else if (err.toLowerCase().includes('content')) newErrors.content = err;
                // Add more specific error mapping if needed
                else newErrors.general = err; // Catch-all
            });
            setErrors(newErrors);
            return;
        }

        let result;
        if (isEditing) {
            result = await updateContext(contextToEdit.id, contextData);
        } else {
            result = await createContext({ ...contextData, isTemplate: false });
        }

        if (result.success) {
            onSave(result.context); // Pass back the saved context
            onOpenChange(false); // Close the dialog on success
        } else {
            // Handle API/creation errors (e.g., display a general error message)
            setErrors({ general: result.errors?.join(', ') || 'Failed to save context.' });
            console.error('Failed to save context:', result.errors);
        }
    }, [name, description, content, tags, isEditing, contextToEdit, createContext, updateContext, validateContext, onSave, onOpenChange]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Context' : 'Create New Context'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="(Optional)"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="content" className="text-right pt-2">
                            Content
                        </Label>
                        <div className="col-span-3">
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter the context content here..."
                                rows={10}
                                className={errors.content ? 'border-red-500' : ''}
                            />
                            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tags" className="text-right">
                            Tags
                        </Label>
                        <Input
                            id="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="col-span-3"
                            placeholder="Comma-separated, e.g., code, python, planning"
                        />
                    </div>
                    {errors.general && (
                        <div className="col-span-4 text-center text-sm text-red-500">
                            {errors.general}
                        </div>
                    )}
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleSubmit}>Save Context</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 