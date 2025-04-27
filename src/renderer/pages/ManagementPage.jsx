import React from 'react';
import { ManagementDashboard } from '../components/settings/ManagementDashboard';

function ManagementPage() {
    return (
        <div className="flex flex-col h-full w-full">
            <main className="flex-1 overflow-y-auto p-8 bg-custom-dark-bg">
                <div className="max-w-4xl mx-auto bg-user-message-bg rounded-lg p-6 shadow-lg">
                    <h1 className="text-2xl font-bold mb-6 text-foreground">Context & Prompt Management</h1>
                    <p className="mb-6 text-muted-foreground">Create, edit, and manage your custom contexts and prompt templates.</p>
                    <ManagementDashboard />
                </div>
            </main>
        </div>
    );
}

export default ManagementPage; 