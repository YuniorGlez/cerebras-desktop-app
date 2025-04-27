# Chat Data Management

This document explains how chat sessions and messages are managed and persisted in the Cerebras Desktop App.

## Core Concepts

*   **Chat Session:** Represents a single conversation thread. It contains metadata (ID, title, last updated timestamp) and a list of messages.
*   **Message:** Represents a single turn in a conversation. It includes an ID, the role (e.g., 'user', 'assistant'), the content, and a timestamp.

## State Management

Chat state (list of all chat sessions, active chat ID, etc.) is managed globally using the React Context API.

*   **Context Provider:** `ChatProvider` in [src/renderer/context/ChatContext.jsx](mdc:src/renderer/context/ChatContext.jsx)
*   **Context Hook:** `useChat()` provides access to the chat state and actions.

## Data Structure

The primary data structures are:

```javascript
// Chat Session Object
{
  id: String, // Unique identifier (e.g., timestamp string)
  title: String, // User-defined or default title (e.g., "New Chat")
  messages: Array<Message>, // Array of message objects
  updatedAt: Number // Timestamp of the last update (used for sorting)
}

// Message Object
{
  id: String, // Unique identifier (potentially combined chatId + index or timestamp)
  role: String, // 'user' or 'assistant' or 'system'
  content: String, // The text content of the message (can include Markdown)
  timestamp: Number // Timestamp when the message was created
}
```

## Persistence

Chat history is persisted locally using the browser's **`localStorage` API**.

*   **Storage Key:** `cerebras-chats`
*   **Mechanism:**
    *   The entire array of chat sessions (`chats`) is serialized to JSON and saved to `localStorage` whenever the `chats` state changes (using a `useEffect` hook in `ChatProvider`).
    *   On application load, `loadChats` function attempts to read and parse the data from `localStorage`. If parsing fails or no data exists, it returns an empty array.
*   **Relevant Functions in `ChatContext.jsx`:**
    *   `loadChats()`: Reads data from `localStorage` on initialization.
    *   `saveChats(chats)`: Writes the current `chats` array to `localStorage`.

## Key Actions (via `useChat()` hook)

*   `chats`: The array of all chat session objects.
*   `activeChatId`: The ID of the currently selected chat.
*   `activeChat`: The full object of the currently active chat.
*   `recentChats`: The `chats` array sorted by `updatedAt` descending.
*   `createChat(title)`: Creates a new chat session and sets it as active.
*   `addMessageToChat(chatId, message)`: Adds a complete message object to a specific chat.
*   `updateLastMessageInChat(chatId, partialMessage)`: Updates the content of the *last* message in a chat (used for streaming AI responses).
*   `renameChat(chatId, newTitle)`: Updates the title of a chat.
*   `deleteChat(chatId)`: Removes a chat session.
*   `clearAllChats()`: Removes all chat sessions.
*   `setActiveChatId(chatId)`: Sets the currently active chat.

## Considerations

*   **Storage Limits:** `localStorage` has size limits (typically 5-10MB per origin). Very long chat histories could potentially exceed this limit, although it's unlikely with just text. Error handling for storage writes might be needed in the future.
*   **Performance:** For a very large number of chats or messages, reading/writing the entire history on every change might become slow. Future optimizations could involve more granular updates or using a different storage mechanism (like IndexedDB or a local database via the Main process).
*   **Data Format:** Currently stored as plain JSON. Migration strategies would be needed if the data format changes significantly.

---
*This mechanism provides simple persistence suitable for typical desktop application usage.* 