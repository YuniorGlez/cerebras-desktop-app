import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Menu, Trash2, BookOpen, BrainCircuit } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const navItems = [
    { to: '/', label: 'Home', icon: <Home size={20} /> },
    { to: '/chat', label: 'Chat', icon: <MessageCircle size={20} /> },
    { to: '/multidialog', label: 'Multidialog', icon: <BrainCircuit size={20} /> },
    { to: '/management', label: 'Management', icon: <BookOpen size={20} /> }
];

const Sidebar = ({ collapsed, onToggle }) => {
    const location = useLocation();
    const { recentChats, setActiveChatId, activeChatId, deleteChat } = useChat();
    const [showAll, setShowAll] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const chatsToShow = showAll ? recentChats : recentChats.slice(0, 5);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
    }, [collapsed]);
    return (
        <nav
            className={`bg-card border-r border-border h-full flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'} min-w-[4rem]`}
            aria-label="Main navigation"
            role="navigation"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className={`font-bold text-lg text-primary transition-all duration-200 ${collapsed ? 'hidden' : 'block'}`}>Cerebras</span>
                <button
                    className="p-2 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={onToggle}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Menu size={20} />
                </button>
            </div>
            <ul className="flex-1 py-4 space-y-2" role="list">
                {navItems.map((item, idx) => (
                    <li key={item.to} role="listitem">
                        <Link
                            to={item.to}
                            className={`flex items-center gap-3 px-4 py-2 rounded transition-colors font-medium text-foreground hover:bg-accent focus:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-primary ${location.pathname === item.to ? 'bg-accent text-primary' : ''}`}
                            aria-current={location.pathname === item.to ? 'page' : undefined}
                            tabIndex={0}
                            role="menuitem"
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.currentTarget.click();
                                }
                                // Navegación con flechas
                                if (e.key === 'ArrowDown') {
                                    const next = e.currentTarget.parentElement.nextElementSibling?.querySelector('a');
                                    if (next) next.focus();
                                }
                                if (e.key === 'ArrowUp') {
                                    const prev = e.currentTarget.parentElement.previousElementSibling?.querySelector('a');
                                    if (prev) prev.focus();
                                }
                            }}
                        >
                            {item.icon}
                            <span className={`${collapsed ? 'hidden' : 'inline'}`}>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
            {/* Chats recientes */}
            <div className={`px-2 pb-4 ${collapsed ? 'hidden' : ''}`}>
                <div className="text-xs text-muted-foreground mb-2 mt-2">Recent Chats</div>
                <ul className="space-y-1">
                    {chatsToShow.map(chat => (
                        <li key={chat.id} className="group relative">
                            <div
                                role="button"
                                tabIndex={0}
                                className={`w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors flex items-center justify-between cursor-pointer ${activeChatId === chat.id ? 'bg-accent text-primary' : 'text-foreground'}`}
                                onClick={() => setActiveChatId(chat.id)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault(); // Prevent spacebar scrolling
                                        setActiveChatId(chat.id);
                                    }
                                }}
                                title={chat.title}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <span className="truncate block max-w-[120px] font-medium">{chat.title || 'Untitled Chat'}</span>
                                    <span className="block text-xs text-muted-foreground truncate max-w-[120px]">
                                        {chat.messages?.[chat.messages.length - 1]?.content?.slice(0, 30) || 'No messages'}
                                    </span>
                                </div>
                                <button
                                    className="ml-2 p-1 rounded hover:bg-destructive/20 text-muted-foreground hidden group-hover:inline-block flex-shrink-0"
                                    tabIndex={0}
                                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(chat.id); }}
                                    title="Delete chat"
                                    aria-label={`Delete chat: ${chat.title || 'Untitled Chat'}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {confirmDeleteId === chat.id && (
                                <div className="absolute left-0 top-0 z-50 bg-background border border-border rounded shadow-lg p-3 flex flex-col gap-2 w-56">
                                    <span className="text-sm">Are you sure you want to delete this chat?</span>
                                    <div className="flex gap-2 justify-end">
                                        <button className="px-2 py-1 rounded bg-muted hover:bg-accent" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                                        <button className="px-2 py-1 rounded bg-destructive text-white hover:bg-destructive/80" onClick={() => { deleteChat(chat.id); setConfirmDeleteId(null); }}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                {recentChats.length > 5 && (
                    <button
                        className="w-full mt-2 text-xs text-primary hover:underline"
                        onClick={() => setShowAll(v => !v)}
                    >
                        {showAll ? 'Show less' : 'Load more'}
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Sidebar; 