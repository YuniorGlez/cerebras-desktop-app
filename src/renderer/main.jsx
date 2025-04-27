import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import Settings from './pages/Settings';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './components/theme/ThemeProvider';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Profile from './pages/Profile';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/chat', element: <App /> },
      { path: '/settings', element: <Settings /> },
      { path: '/profile', element: <Profile /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ChatProvider>
        <RouterProvider router={router} />
      </ChatProvider>
    </ThemeProvider>
  </React.StrictMode>
); 