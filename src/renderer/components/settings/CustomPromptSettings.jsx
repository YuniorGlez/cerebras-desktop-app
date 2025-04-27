import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for managing the Custom System Prompt input in settings.
 */
function CustomPromptSettings({ prompt, onChange }) {

    const handleChange = (e) => {
        onChange('customSystemPrompt', e.target.value);
    };

    return (
        <textarea
            id="custom-system-prompt"
            name="customSystemPrompt" // Keep name for potential form context
            value={prompt || ''} // Ensure value is controlled
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-white placeholder-gray-400 text-sm"
            placeholder="Optional: Enter your custom system prompt..."
        />
    );
}

CustomPromptSettings.propTypes = {
    prompt: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired, // Expects (key, value)
};

export default CustomPromptSettings; 