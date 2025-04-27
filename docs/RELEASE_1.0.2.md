# Release 1.0.2 – Cerebras Desktop

This patch release enhances Multidialog configuration, persistence, and UI, and adds support for Radix UI components in the frontend.

---

## 🆕 What's New

- **Multidialog Configuration Persistence**: Added temperature controls for each model call and implemented localStorage saving/loading of user configurations.
- **Accordion-Based Response Display**: Integrated `@radix-ui/react-accordion` to display individual model responses in an interactive accordion format.
- **Iteration & Delay Settings**: Introduced configurable iteration count and response delay settings for parallel model queries.
- **Enhanced Model Selection UI**: Refactored model selection dropdown and improved display of available models.
- **New Slider Control**: Added `@radix-ui/react-slider` for adjusting numeric parameters like temperature and delay.

## 🐞 Bug Fixes & Improvements

- Fixed an issue where model-specific temperature settings were not applied during queries.
- Improved error handling in Multidialog IPC handlers.
- Refactored `chatHandler` to support multiple target models with distinct parameters.
- Updated `package.json` dependencies to include new Radix UI packages.
- Minor styling and layout tweaks across the Multidialog page and related UI components.

## 📦 Upgrade Instructions

1. Pull the latest changes and install dependencies:

   ```bash
   git pull
   pnpm install
   ```

2. Rebuild the app:

   ```bash
   pnpm run build
   ```

3. Restart the application to apply the new features.

---

Thank you for using Cerebras Desktop! We appreciate your feedback—let us know how these updates work for you. 