import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import Settings from './pages/Settings';
import { ChatProvider } from './context/ChatContext';
import { ContextManagerProvider } from './context/ContextManagerContext';
import { ThemeProvider } from './components/theme/ThemeProvider';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ManagementPage from './pages/ManagementPage';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/chat', element: <App /> },
      { path: '/settings', element: <Settings /> },
      { path: '/profile', element: <Profile /> },
      { path: '/management', element: <ManagementPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ContextManagerProvider>
        <ChatProvider>
          <RouterProvider router={router} />
        </ChatProvider>
      </ContextManagerProvider>
    </ThemeProvider>
  </React.StrictMode>
); 