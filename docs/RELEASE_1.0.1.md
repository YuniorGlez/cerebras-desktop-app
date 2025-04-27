# Release 1.0.1 – Cerebras Desktop

This patch release improves chat usability with a range of input enhancements and adds a new Context & Prompt Management page.

---

## 🆕 What's New

- **Auto-Expanding Input**: The chat input now dynamically grows as you type, up to a set maximum height, and supports internal scrolling for long messages.
- **Maximize Draft Mode**: A "maximize" icon lets you open the input in a modal dialog. Draft longer messages in a larger view and send directly from the pop-up.
- **Seamless Follow-Ups**: Fixed an issue where the input controls disappeared after your first message, so you can continue typing and sending follow-ups without interruption.
- **Scrollable Text Areas**: Both the inline and modal textareas now allow vertical scrolling when your content exceeds the visible area.
- **Context & Prompt Management**: Introduced a new management page (`src/renderer/pages/ManagementPage.jsx`) under Settings to create, edit, and organize your custom contexts and prompt templates.

## 🐞 Bug Fixes & Improvements

- Addressed minor styling issues around the new input controls.
- Optimized auto-resize performance for text areas.
- Updated underlying dependencies and fixed console warnings.

## 📦 Upgrade Instructions

1. Pull the latest changes and rebuild the app:

   ```bash
   git pull
   pnpm install
   pnpm run build
   ```

2. Restart the application to load the new features.

---

Thank you for using Cerebras Desktop! Your feedback is always welcome—let us know how these improvements work for you. 