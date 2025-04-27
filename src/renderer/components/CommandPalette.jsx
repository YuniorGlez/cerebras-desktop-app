import React, { useState, useEffect, useRef } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'; // Assuming shadcn/ui command components are here
import { useChat } from '@/context/ChatContext'; // To access searchChatHistory later
import { useNavigate } from 'react-router-dom';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const { searchChatHistory, setActiveChatId, createChat } = useChat();
    const navigate = useNavigate();

    // Focus input and reset state when opening
    useEffect(() => {
        if (open) {
            setInputValue('');
            setSearchResults([]);
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [open]);

    // Keyboard navigation: arrow keys and Enter
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return;
            // Build items array: static commands + dynamic results
            const commands = [
                { action: () => { createChat(); setOpen(false); } },
                { action: () => { navigate('/settings'); setOpen(false); } },
            ];
            const items = [...commands, ...searchResults.map(r => ({ action: () => handleSelectSearchResult(r) }))];
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = items[selectedIndex];
                if (item) item.action();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, searchResults, selectedIndex, createChat, navigate]);

    // Keyboard shortcut (Cmd+K or Ctrl+K) to toggle 'open' state
    useEffect(() => {
        const down = (e) => {
            // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault(); // Prevent browser find
                setOpen((prevOpen) => !prevOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []); // Empty dependency array ensures this runs only once on mount

    // Handle input change to perform search
    useEffect(() => {
        if (inputValue.length > 1) { // Start searching after 1 character
            const results = searchChatHistory(inputValue);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [inputValue, searchChatHistory]);

    const handleSelectSearchResult = (result) => {
        // Close palette before navigating
        setOpen(false);
        setActiveChatId(result.sessionId);
        // Navigate to the chat overview page; App usará activeChatId
        navigate('/chat');
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                ref={inputRef}
                placeholder="Type a command or search..."
                value={inputValue}
                onValueChange={setInputValue}
            />
            <CommandList>
                {inputValue.length > 1 && searchResults.length === 0 && (
                    <CommandEmpty>No results found.</CommandEmpty>
                )}

                {/* Static Commands Group (Example) */}
                <CommandGroup heading="Commands">
                    <CommandItem
                        onSelect={() => {
                            // Close palette, create new chat and navigate
                            setOpen(false);
                            const newChat = createChat();
                            setActiveChatId(newChat.id);
                            navigate('/chat');
                        }}
                        className={selectedIndex === 0 ? 'bg-gray-200' : ''}
                    >
                        <span>New Chat</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => { navigate('/settings'); setOpen(false); }}
                        className={selectedIndex === 1 ? 'bg-gray-200' : ''}
                    >
                        <span>Settings</span>
                    </CommandItem>
                </CommandGroup>

                {/* Dynamic Search Results Group */}
                {searchResults.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Search Results">
                            {searchResults.map((result, idx) => (
                                <CommandItem
                                    key={`${result.sessionId}-${result.messageId}`}
                                    onSelect={() => handleSelectSearchResult(result)}
                                    className={selectedIndex === 2 + idx ? 'bg-gray-200' : ''}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{result.sessionTitle}</span>
                                        <span className="text-xs text-muted-foreground truncate">{result.snippet}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
} 