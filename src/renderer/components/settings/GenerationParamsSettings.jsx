import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for managing the Generation Parameters (Temperature, Top P) in settings.
 */
function GenerationParamsSettings({ temperature, topP, onNumberChange }) {

    const handleTempChange = (e) => {
        onNumberChange('temperature', parseFloat(e.target.value));
    };

    const handleTopPChange = (e) => {
        onNumberChange('top_p', parseFloat(e.target.value));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature: {temperature}
                </label>
                <div className="flex items-center">
                    <span className="mr-2 text-xs text-gray-400">0</span>
                    <input
                        type="range"
                        id="temperature"
                        name="temperature"
                        min="0"
                        max="1"
                        step="0.01"
                        value={temperature}
                        onChange={handleTempChange}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="ml-2 text-xs text-gray-400">1</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    Lower values make responses more deterministic, higher values more creative.
                </p>
            </div>

            <div>
                <label htmlFor="top_p" className="block text-sm font-medium text-gray-300 mb-2">
                    Top P: {topP}
                </label>
                <div className="flex items-center">
                    <span className="mr-2 text-xs text-gray-400">0</span>
                    <input
                        type="range"
                        id="top_p"
                        name="top_p"
                        min="0"
                        max="1"
                        step="0.01"
                        value={topP}
                        onChange={handleTopPChange}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="ml-2 text-xs text-gray-400">1</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    Controls diversity by limiting tokens to the most likely ones.
                </p>
            </div>
        </div>
    );
}

GenerationParamsSettings.propTypes = {
    temperature: PropTypes.number.isRequired,
    topP: PropTypes.number.isRequired,
    onNumberChange: PropTypes.func.isRequired, // Expects (key, value)
};

export default GenerationParamsSettings; 