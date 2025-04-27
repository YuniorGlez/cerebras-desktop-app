import React from 'react';
import { useTheme } from './theme/ThemeProvider';
import { Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

const Header = () => {
    const { theme, setTheme } = useTheme();
    const { settings, isLoading } = useSettings();

    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.trim().split(' ');
        if (names.length === 1) return names[0][0].toUpperCase();
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const [avatarError, setAvatarError] = React.useState(false);

    React.useEffect(() => {
        setAvatarError(false);
    }, [settings.userAvatarUrl]);

    return (
        <header className="bg-card shadow border-b border-border flex items-center justify-between px-6 py-3 relative">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only absolute left-2 top-2 z-50 bg-primary text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                tabIndex={0}
            >
                Skip to content
            </a>
            <div className="flex items-center gap-4">
                {/* Left side can be used for logo or nav if needed */}
            </div>
            <div className="flex items-center gap-4">
                <button
                    className="p-2 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <Link to="/settings" className="p-2 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary" title="Settings">
                    <SettingsIcon className="h-5 w-5" />
                </Link>
                <span className="text-xs text-muted-foreground">⌘K</span>
                <Link to="/profile" className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary" title="User Profile">
                    {isLoading ? (
                        <span className="text-xs font-bold text-muted-foreground">...</span>
                    ) : settings.userAvatarUrl && !avatarError ? (
                        <img
                            src={settings.userAvatarUrl}
                            alt={`${settings.userName || 'User'}'s avatar`}
                            className="w-full h-full rounded-full object-cover"
                            onError={() => setAvatarError(true)}
                        />
                    ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                            {getInitials(settings.userName)}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
};

export default Header; 