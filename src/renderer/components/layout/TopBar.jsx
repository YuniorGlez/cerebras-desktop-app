import React, { useState, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";

const TopBar = ({ activeChat, renameChat, createChat, setActiveChatId }) => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const activeChatId = activeChat?.id;
    const currentTitle = activeChat?.title || 'Untitled Chat';

    // Update local input when active chat changes
    React.useEffect(() => {
        setTitleInput(currentTitle);
        // If chat changes while editing, exit editing mode
        if (editingTitle) {
            setEditingTitle(false);
        }
    }, [activeChatId, currentTitle]); // Rerun when chat or its title changes

    const startEditingTitle = useCallback(() => {
        setTitleInput(currentTitle);
        setEditingTitle(true);
    }, [currentTitle]);

    const confirmEditTitle = useCallback(() => {
        if (activeChatId && titleInput.trim() && renameChat) {
            renameChat(activeChatId, titleInput.trim());
        }
        setEditingTitle(false);
    }, [activeChatId, titleInput, renameChat]);

    const handleTitleInputKey = useCallback((e) => {
        if (e.key === 'Enter') {
            confirmEditTitle();
        } else if (e.key === 'Escape') {
            setTitleInput(currentTitle); // Reset input on escape
            setEditingTitle(false);
        }
    }, [confirmEditTitle, currentTitle]);

    const handleNewChat = useCallback(() => {
        if (createChat && setActiveChatId) {
            const newChat = createChat('New Chat');
            if (newChat) {
                setActiveChatId(newChat.id);
            }
        }
    }, [createChat, setActiveChatId]);

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80">
            {/* Title Editing */}
            <div className="flex items-center gap-2">
                {editingTitle ? (
                    <>
                        <input
                            className="font-bold text-lg text-primary bg-background border-b border-primary focus:outline-none px-1 w-48"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            onBlur={confirmEditTitle} // Save on blur
                            onKeyDown={handleTitleInputKey}
                            autoFocus
                        />
                        <button onClick={confirmEditTitle} className="ml-1 p-1 text-primary hover:bg-accent rounded" title="Save">
                            <Check size={18} />
                        </button>
                    </>
                ) : (
                    <>
                        <span className="font-bold text-lg text-primary">{currentTitle}</span>
                        <button onClick={startEditingTitle} className="ml-1 p-1 text-muted-foreground hover:bg-accent rounded" title="Rename">
                            <Pencil size={18} />
                        </button>
                    </>
                )}
            </div>
            {/* New Chat Button */}
            <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={handleNewChat}>New Chat</Button>
            </div>
        </div>
    );
};

export default TopBar; 