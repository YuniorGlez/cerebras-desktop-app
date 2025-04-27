import React from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable wrapper component for styling sections within the settings page.
 */
function SettingsSection({ title, description, children }) {
    return (
        <div className="mt-8 border-t border-gray-700 pt-6 first:mt-0 first:border-t-0 first:pt-0">
            {title && <h3 className="text-lg font-medium mb-3 text-white">{title}</h3>}
            {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
            <div>
                {children}
            </div>
        </div>
    );
}

SettingsSection.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default SettingsSection; 