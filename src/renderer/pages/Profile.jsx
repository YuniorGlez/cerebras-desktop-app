import React from 'react';
import { useSettings } from '../hooks/useSettings'; // Import the real hook

// Placeholder hook removed

function Profile() {
    // Use the real settings hook
    const { settings, updateSetting, isLoading, isSaving } = useSettings();

    const handleNameChange = (e) => {
        updateSetting('userName', e.target.value);
    };

    const handleAvatarUrlChange = (e) => {
        updateSetting('userAvatarUrl', e.target.value);
    };

    // Display loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full w-full text-gray-400">
                Loading Profile...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <main className="flex-1 overflow-y-auto p-8 bg-custom-dark-bg">
                <div className="max-w-xl mx-auto bg-user-message-bg rounded-lg p-6 shadow-lg relative">
                    {/* Saving indicator */}
                    {isSaving && (
                        <div className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-900 text-blue-100 rounded">
                            Saving...
                        </div>
                    )}

                    <h2 className="text-xl font-semibold mb-6 text-white">User Profile</h2>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
                        <div>
                            <label htmlFor="profile-user-name" className="block text-sm font-medium text-gray-300 mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                id="profile-user-name"
                                name="userName"
                                value={settings.userName || ''} // Use settings from hook
                                onChange={handleNameChange}
                                className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-white placeholder-gray-400"
                                placeholder="Enter your display name"
                            />
                        </div>
                        <div>
                            <label htmlFor="profile-user-avatar-url" className="block text-sm font-medium text-gray-300 mb-1">
                                Avatar URL (Optional)
                            </label>
                            <input
                                type="url"
                                id="profile-user-avatar-url"
                                name="userAvatarUrl"
                                value={settings.userAvatarUrl || ''} // Use settings from hook
                                onChange={handleAvatarUrlChange}
                                className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-white placeholder-gray-400"
                                placeholder="Enter URL for your avatar image"
                            />
                            {settings.userAvatarUrl && (
                                <div className="mt-3">
                                    <p className="text-xs text-gray-400 mb-1">Preview:</p>
                                    <img
                                        src={settings.userAvatarUrl} // Use settings from hook
                                        alt="Avatar Preview"
                                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-600"
                                        // Add onError handler similar to UserProfileSettings if desired
                                        onError={(e) => {
                                            e.target.src = ''; // Clear src on error
                                            e.target.style.display = 'none';
                                            console.warn('Failed to load avatar image.');
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                    </form>

                </div>
            </main>
        </div>
    );
}

export default Profile; 