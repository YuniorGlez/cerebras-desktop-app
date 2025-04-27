import React, { createContext, useState, useContext, useEffect } from 'react';

// Modelo de chat: { id, title, messages, updatedAt }
const LOCAL_STORAGE_KEY = 'cerebras-chats';

// Create the context
const ChatContext = createContext();

function loadChats() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveChats(chats) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
}

// Create a provider component
export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(null);

  // Sincronizar con localStorage en cada cambio
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Crear nuevo chat
  const createChat = (title = 'New Chat') => {
    const newChat = {
      id: Date.now().toString(),
      title,
      messages: [],
      updatedAt: Date.now(),
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    return newChat;
  };

  // Agregar mensaje a chat
  const addMessageToChat = (chatId, message) => {
    if (!message) return;
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, messages: [...chat.messages, message], updatedAt: Date.now() }
        : chat
    ));
  };

  // Actualizar el último mensaje de un chat (útil para streaming)
  const updateLastMessageInChat = (chatId, partialMessage) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      if (!chat.messages.length) return chat;
      const updatedMessages = [...chat.messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...updatedMessages[updatedMessages.length - 1],
        ...partialMessage,
      };
      return { ...chat, messages: updatedMessages, updatedAt: Date.now() };
    }));
  };

  // Renombrar chat
  const renameChat = (chatId, newTitle) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle, updatedAt: Date.now() } : chat
    ));
  };

  // Obtener chat activo
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Listar chats recientes (ordenados por updatedAt desc)
  const recentChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  // Eliminar chat
  const deleteChat = (chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  // Limpiar todos los chats
  const clearAllChats = () => {
    setChats([]);
    setActiveChatId(null);
  };

  // Search chat history for a query string
  const searchChatHistory = (query) => {
    const lowerQuery = query.toLowerCase();
    const results = [];
    chats.forEach((chat) => {
      chat.messages.forEach((msg, index) => {
        let content = typeof msg.content === 'string'
          ? msg.content
          : Array.isArray(msg.content)
            ? msg.content.map(part => part.text || '').join(' ')
            : '';
        if (content.toLowerCase().includes(lowerQuery)) {
          const idx = content.toLowerCase().indexOf(lowerQuery);
          const snippet = content
            .substr(Math.max(0, idx - 20), query.length + 40)
            .replace(/\n/g, ' ');
          results.push({ sessionId: chat.id, sessionTitle: chat.title, messageId: index, snippet });
        }
      });
    });
    return results;
  };

  // Provide the state and setter to children
  const value = {
    chats,
    setChats,
    createChat,
    addMessageToChat,
    updateLastMessageInChat,
    renameChat,
    deleteChat,
    clearAllChats,
    searchChatHistory,
    activeChatId,
    setActiveChatId,
    activeChat,
    recentChats,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 