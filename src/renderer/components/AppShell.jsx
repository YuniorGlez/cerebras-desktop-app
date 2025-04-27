import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const AppShell = () => {
    useKeyboardShortcuts();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });
    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <CommandPalette />
                <main id="main-content" className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppShell; 