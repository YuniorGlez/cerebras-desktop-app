import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for the Tool Approval reset section in settings.
 */
function ToolApprovalSettings({ onReset }) {

    // Function to reset tool call approvals in localStorage
    const handleResetToolApprovals = () => {
        let keysToRemove = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('tool_approval_') || key === 'tool_approval_yolo_mode')) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Removed tool approval key: ${key}`);
            });

            // Call the onReset prop to notify the parent (e.g., to show a status message)
            onReset({ success: true, message: 'Tool call approvals reset' });

        } catch (error) {
            console.error('Error resetting tool approvals:', error);
            onReset({ success: false, message: `Error resetting: ${error.message}` });
        }
    };

    return (
        <button
            onClick={handleResetToolApprovals}
            className="px-4 py-2 bg-yellow-700 text-gray-100 rounded hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-70 transition-colors duration-150"
        >
            Reset Tool Call Approvals
        </button>
    );
}

ToolApprovalSettings.propTypes = {
    onReset: PropTypes.func.isRequired, // Callback to handle reset status (e.g., show message)
};

export default ToolApprovalSettings; 