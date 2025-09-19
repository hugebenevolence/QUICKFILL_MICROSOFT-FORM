// QuickFill Microsoft Forms - Background Script v2.0
// Service worker for Chrome Extension coordination

class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        // Handle installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle extension startup
        chrome.runtime.onStartup.addListener(() => {
            console.log('QuickFill extension started');
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep channel open for async responses
        });
    }

    handleInstallation(details) {
        console.log('QuickFill Microsoft Forms installed/updated');
        
        if (details.reason === 'install') {
            // First installation - set default settings
            this.setDefaultSettings();
        } else if (details.reason === 'update') {
            // Extension updated - migrate settings if needed
            this.migrateSettings(details.previousVersion);
        }
    }

    async setDefaultSettings() {
        const defaultSettings = {
            // Basic settings
            ratingMin: 4,
            ratingMax: 5,
            preferPositiveAnswers: true,
            avoidOther: true,
            autoSubmitAnother: false,
            textLanguage: 'vi',
            maxFormSubmissions: 0,
            submitDelay: 3,

            // Advanced settings
            geminiApiKey: '',
            useRandomDelay: true,
            delayMin: 500,
            delayMax: 2000,
            maxRetries: 3,
            questionTimeout: 5000,

            // Special questions and preferences
            specialQuestions: [],
            radioStrategy: 'random'
        };

        try {
            await chrome.storage.sync.set(defaultSettings);
            console.log('Default settings saved');
        } catch (error) {
            console.error('Error saving default settings:', error);
        }
    }

    async migrateSettings(previousVersion) {
        try {
            const existingSettings = await chrome.storage.sync.get();
            
            // Add any new settings that might be missing
            const updates = {};
            
            // Add new settings introduced in v2.0
            if (!existingSettings.hasOwnProperty('autoSubmitAnother')) {
                updates.autoSubmitAnother = false;
            }
            if (!existingSettings.hasOwnProperty('maxFormSubmissions')) {
                updates.maxFormSubmissions = 0;
            }
            if (!existingSettings.hasOwnProperty('submitDelay')) {
                updates.submitDelay = 3;
            }
            if (!existingSettings.hasOwnProperty('specialQuestions')) {
                updates.specialQuestions = [];
            }
            if (!existingSettings.hasOwnProperty('radioStrategy')) {
                updates.radioStrategy = 'random';
            }

            if (Object.keys(updates).length > 0) {
                await chrome.storage.sync.set(updates);
                console.log('Settings migrated to v2.0');
            }

        } catch (error) {
            console.error('Error migrating settings:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getSettings':
                    const settings = await chrome.storage.sync.get();
                    sendResponse({ success: true, settings });
                    break;

                case 'saveSettings':
                    await chrome.storage.sync.set(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'clearSettings':
                    await chrome.storage.sync.clear();
                    await this.setDefaultSettings();
                    sendResponse({ success: true });
                    break;

                case 'updateStatus':
                    // Forward status updates to popup if it's open
                    this.forwardToPopup(message);
                    break;

                case 'fillingStopped':
                    // Forward filling stopped notification to popup
                    this.forwardToPopup(message);
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error in background message handler:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    forwardToPopup(message) {
        // Try to send message to popup (it might not be open)
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup is not open, ignore the error
        });
    }

    // Utility function to inject content script manually if needed
    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content-v2.js']
            });
            console.log('Content script injected manually');
        } catch (error) {
            console.error('Error injecting content script:', error);
        }
    }

    // Check if current tab is a Microsoft Forms page
    async isFormsPage(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            return tab.url && (
                tab.url.includes('forms.microsoft.com') ||
                tab.url.includes('forms.office.com') ||
                tab.url.includes('.forms.office.com')
            );
        } catch (error) {
            return false;
        }
    }
}

// Initialize background service
new BackgroundService();