import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
    const navigate = useNavigate();
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
                switch (e.key) {
                    case '1':
                        navigate('/');
                        break;
                    case '2':
                        navigate('/chat');
                        break;
                    case '3':
                        navigate('/settings');
                        break;
                    default:
                        break;
                }
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [navigate]);
} 