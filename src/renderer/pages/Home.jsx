import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const Home = () => (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
        <h2 className="text-3xl font-bold mb-4 text-primary text-center">Welcome to Cerebras Desktop App</h2>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-xl">
            Start a new chat or explore your recent conversations. Use the quick actions below to get started.
        </p>
        <div className="flex gap-4 mb-10">
            <Link to="/chat">
                <Button variant="default">New Chat</Button>
            </Link>
            <Link to="/settings">
                <Button variant="secondary">Settings</Button>
            </Link>
        </div>
        {/* You can add onboarding or tips here if needed */}
    </div>
);

export default Home; 