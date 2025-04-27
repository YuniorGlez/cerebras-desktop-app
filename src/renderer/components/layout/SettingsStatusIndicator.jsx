import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display saving/status messages in a fixed position.
 */
function SettingsStatusIndicator({ isSaving, saveStatus }) {
    const getStatusMessage = () => {
        if (isSaving) return 'Saving...';
        return saveStatus?.message || '';
    };

    const getStatusClasses = () => {
        if (saveStatus?.type === 'error') {
            return 'bg-red-900 text-red-100';
        } else if (saveStatus?.type === 'info') {
            return 'bg-blue-900 text-blue-100';
        } else {
            // Default to success or neutral
            return 'bg-green-900 text-green-100';
        }
    };

    // Only render if there is a status to show or if it's saving
    if (!isSaving && !saveStatus) {
        return null;
    }

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 min-h-6 pointer-events-none">
            <div
                className={`px-3 py-1 rounded text-sm shadow-lg transition-opacity duration-300 pointer-events-auto ${getStatusClasses()}`}
                role="status"
                aria-live="polite"
            >
                {getStatusMessage()}
            </div>
        </div>
    );
}

SettingsStatusIndicator.propTypes = {
    isSaving: PropTypes.bool.isRequired,
    saveStatus: PropTypes.shape({
        type: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
        message: PropTypes.string.isRequired,
    }),
};

export default SettingsStatusIndicator; 