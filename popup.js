// QuickFill Microsoft Forms - Popup Script v2.0
// Handles user interface interactions and settings management

class PopupController {
    constructor() {
        this.currentTab = 'basic';
        this.isRunning = false;
        this.sessionStartTime = null;
        this.statsUpdateInterval = null;
        this.currentStats = {
            submitCount: 0,
            sessionDuration: 0,
            isRunning: false
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupStatusListener();
        await this.loadSettings();
        this.updateUI();
        this.initializeStatistics();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick').match(/'(.*)'/)[1];
                this.switchTab(tabName);
            });
        });

        // Main action buttons
        document.getElementById('fillForm').addEventListener('click', () => this.startFilling());
        document.getElementById('stopFilling').addEventListener('click', () => this.stopFilling());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        document.getElementById('debugConnection').addEventListener('click', () => this.debugConnection());

        // Settings change listeners
        this.setupSettingsListeners();

        // Special questions management
        document.getElementById('addQuestion').addEventListener('click', () => this.addQuestion());
    }

    setupSettingsListeners() {
        // Auto-save on input change
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.type !== 'password') { // Don't auto-save API key
                    this.saveSettings();
                }
            });
        });

        // Delay config visibility
        const delayCheckbox = document.getElementById('useRandomDelay');
        if (delayCheckbox) {
            delayCheckbox.addEventListener('change', (e) => {
                document.getElementById('delayConfig').style.display = e.target.checked ? 'block' : 'none';
            });
        }

        // Rating range preview and validation
        const ratingMin = document.getElementById('ratingMin');
        const ratingMax = document.getElementById('ratingMax');
        const previewRange = document.getElementById('previewRange');

        const updateRatingPreview = () => {
            const min = parseInt(ratingMin.value) || 1;
            const max = parseInt(ratingMax.value) || 5;
            
            // Validation
            if (min > max) {
                ratingMax.value = min;
            }
            if (min < 1) {
                ratingMin.value = 1;
            }
            if (max > 5) {
                ratingMax.value = 5;
            }

            const finalMin = parseInt(ratingMin.value);
            const finalMax = parseInt(ratingMax.value);
            
            if (previewRange) {
                previewRange.textContent = finalMin === finalMax ? finalMin : `${finalMin}-${finalMax}`;
            }
        };

        if (ratingMin && ratingMax) {
            ratingMin.addEventListener('input', updateRatingPreview);
            ratingMax.addEventListener('input', updateRatingPreview);
            // Initial update
            updateRatingPreview();
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`.tab[onclick*="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'ratingMin', 'ratingMax', 'preferPositiveAnswers', 'avoidOther', 
                'autoSubmitAnother', 'textLanguage', 'maxFormSubmissions', 'submitDelay',
                'geminiApiKey', 'useRandomDelay', 'delayMin', 'delayMax', 
                'maxRetries', 'questionTimeout', 'specialQuestions', 'radioStrategy'
            ]);

            // Basic settings
            this.setInputValue('ratingMin', result.ratingMin || 4);
            this.setInputValue('ratingMax', result.ratingMax || 5);
            this.setInputValue('preferPositiveAnswers', result.preferPositiveAnswers !== false);
            this.setInputValue('avoidOther', result.avoidOther !== false);
            this.setInputValue('autoSubmitAnother', result.autoSubmitAnother !== false);
            this.setInputValue('textLanguage', result.textLanguage || 'vi');
            this.setInputValue('maxFormSubmissions', result.maxFormSubmissions || 0);
            this.setInputValue('submitDelay', result.submitDelay || 3);

            // Advanced settings
            this.setInputValue('geminiApiKey', result.geminiApiKey || '');
            this.setInputValue('useRandomDelay', result.useRandomDelay !== false);
            this.setInputValue('delayMin', result.delayMin || 500);
            this.setInputValue('delayMax', result.delayMax || 2000);
            this.setInputValue('maxRetries', result.maxRetries || 3);
            this.setInputValue('questionTimeout', result.questionTimeout || 5000);

            // Special questions
            this.loadSpecialQuestions(result.specialQuestions || []);
            
            // Radio strategy
            const radioStrategy = result.radioStrategy || 'random';
            const radioElement = document.querySelector(`input[name="radioStrategy"][value="${radioStrategy}"]`);
            if (radioElement) radioElement.checked = true;

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Lỗi khi tải cài đặt', 'error');
        }
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        if (element.type === 'checkbox') {
            element.checked = value;
        } else {
            element.value = value;
        }
    }

    async saveSettings() {
        try {
            const settings = {
                // Basic settings
                ratingMin: parseInt(document.getElementById('ratingMin').value) || 4,
                ratingMax: parseInt(document.getElementById('ratingMax').value) || 5,
                preferPositiveAnswers: document.getElementById('preferPositiveAnswers').checked,
                avoidOther: document.getElementById('avoidOther').checked,
                autoSubmitAnother: document.getElementById('autoSubmitAnother').checked,
                textLanguage: document.getElementById('textLanguage').value,
                maxFormSubmissions: parseInt(document.getElementById('maxFormSubmissions').value) || 0,
                submitDelay: parseInt(document.getElementById('submitDelay').value) || 3,

                // Advanced settings
                geminiApiKey: document.getElementById('geminiApiKey').value,
                useRandomDelay: document.getElementById('useRandomDelay').checked,
                delayMin: parseInt(document.getElementById('delayMin').value) || 500,
                delayMax: parseInt(document.getElementById('delayMax').value) || 2000,
                maxRetries: parseInt(document.getElementById('maxRetries').value) || 3,
                questionTimeout: parseInt(document.getElementById('questionTimeout').value) || 5000,

                // Special questions
                specialQuestions: this.getSpecialQuestions(),
                radioStrategy: document.querySelector('input[name="radioStrategy"]:checked')?.value || 'random'
            };

            // Validate settings
            if (settings.ratingMin > settings.ratingMax) {
                const temp = settings.ratingMin;
                settings.ratingMin = settings.ratingMax;
                settings.ratingMax = temp;
                this.setInputValue('ratingMin', settings.ratingMin);
                this.setInputValue('ratingMax', settings.ratingMax);
            }

            if (settings.delayMin > settings.delayMax) {
                const temp = settings.delayMin;
                settings.delayMin = settings.delayMax;
                settings.delayMax = temp;
                this.setInputValue('delayMin', settings.delayMin);
                this.setInputValue('delayMax', settings.delayMax);
            }

            await chrome.storage.sync.set(settings);
            this.showStatus('Cài đặt đã được lưu', 'success');

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Lỗi khi lưu cài đặt', 'error');
        }
    }

    async resetSettings() {
        if (confirm('Bạn có chắc muốn reset tất cả cài đặt về mặc định?')) {
            try {
                await chrome.storage.sync.clear();
                await this.loadSettings();
                this.showStatus('Đã reset cài đặt về mặc định', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showStatus('Lỗi khi reset cài đặt', 'error');
            }
        }
    }

    async startFilling() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Enhanced URL checking for Microsoft Forms
            if (!this.isMicrosoftFormsURL(tab.url)) {
                this.showStatus('Vui lòng mở Microsoft Forms trước khi sử dụng', 'error');
                console.log('Current URL:', tab.url); // Debug log
                return;
            }

            // Get current settings
            const settings = await chrome.storage.sync.get();
            
            // Update UI state
            this.isRunning = true;
            this.updateUI();
            this.showStatus('Đang bắt đầu điền form...', 'info');

            // Try direct message first (content script might already be loaded)
            chrome.tabs.sendMessage(tab.id, {
                action: 'startFilling',
                settings: settings
            }, async (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Direct message failed, trying injection:', chrome.runtime.lastError.message);
                    
                    // Try to inject and send again
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content-v2.1.js']
                        });
                        
                        console.log('Content script injected, waiting and retrying...');
                        
                        // Wait for script to initialize and try again
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, {
                                action: 'startFilling',
                                settings: settings
                            }, (retryResponse) => {
                                if (chrome.runtime.lastError) {
                                    console.error('Retry also failed:', chrome.runtime.lastError.message);
                                    this.showStatus('Lỗi kết nối với trang. Vui lòng refresh trang và thử lại.', 'error');
                                    this.isRunning = false;
                                    this.updateUI();
                                } else if (retryResponse && retryResponse.success) {
                                    this.showStatus('Đã bắt đầu điền form', 'success');
                                } else {
                                    this.showStatus('Không thể bắt đầu điền form', 'error');
                                    this.isRunning = false;
                                    this.updateUI();
                                }
                            });
                        }, 2000);
                        
                    } catch (injectError) {
                        console.error('Injection failed:', injectError);
                        this.showStatus('Không thể inject script. Vui lòng refresh trang.', 'error');
                        this.isRunning = false;
                        this.updateUI();
                    }
                } else if (response && response.success) {
                    this.showStatus('Đã bắt đầu điền form', 'success');
                } else {
                    console.log('Message sent but response invalid:', response);
                    this.showStatus('Không thể bắt đầu điền form', 'error');
                    this.isRunning = false;
                    this.updateUI();
                }
            });

        } catch (error) {
            console.error('Error starting form filling:', error);
            this.showStatus('Lỗi khi bắt đầu điền form', 'error');
            this.isRunning = false;
            this.updateUI();
        }
    }

    async stopFilling() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'stopFilling' }, (response) => {
                this.isRunning = false;
                this.updateUI();
                this.showStatus('Đã dừng điền form', 'info');
            });

        } catch (error) {
            console.error('Error stopping form filling:', error);
            this.isRunning = false;
            this.updateUI();
        }
    }

    async debugConnection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            this.showStatus('🔧 Debug: Checking connection...', 'info');
            console.log('=== DEBUG CONNECTION START ===');
            console.log('Current tab URL:', tab.url);
            console.log('Tab ID:', tab.id);
            console.log('Tab status:', tab.status);
            
            // Check URL validity
            const isValidURL = this.isMicrosoftFormsURL(tab.url);
            console.log('Is valid Microsoft Forms URL:', isValidURL);
            
            if (!isValidURL) {
                this.showStatus('❌ Debug: Not a Microsoft Forms URL', 'error');
                console.log('=== DEBUG CONNECTION END ===');
                return;
            }
            
            // Try ping first
            console.log('Trying to ping content script...');
            chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('❌ Ping failed:', chrome.runtime.lastError.message);
                    this.showStatus('❌ Debug: Content script not responding', 'error');
                    
                    // Try injection
                    console.log('Attempting to inject content script...');
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('❌ Injection failed:', chrome.runtime.lastError.message);
                            this.showStatus('❌ Debug: Script injection failed', 'error');
                        } else {
                            console.log('✅ Script injected successfully');
                            this.showStatus('✅ Debug: Script injected, try again', 'success');
                        }
                        console.log('=== DEBUG CONNECTION END ===');
                    });
                } else {
                    console.log('✅ Ping successful:', response);
                    this.showStatus('✅ Debug: Connection OK!', 'success');
                    console.log('=== DEBUG CONNECTION END ===');
                }
            });
            
        } catch (error) {
            console.error('Debug error:', error);
            this.showStatus('❌ Debug: Error occurred', 'error');
            console.log('=== DEBUG CONNECTION END ===');
        }
    }

    updateUI() {
        const fillButton = document.getElementById('fillForm');
        const stopButton = document.getElementById('stopFilling');

        if (this.isRunning) {
            fillButton.style.display = 'none';
            stopButton.style.display = 'inline-block';
        } else {
            fillButton.style.display = 'inline-block';
            stopButton.style.display = 'none';
        }

        // Update delay config visibility
        const useRandomDelay = document.getElementById('useRandomDelay');
        if (useRandomDelay) {
            document.getElementById('delayConfig').style.display = useRandomDelay.checked ? 'block' : 'none';
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }

    isMicrosoftFormsURL(url) {
        if (!url) return false;
        
        // Comprehensive Microsoft Forms URL patterns
        const formsPatterns = [
            'forms.microsoft.com',
            'forms.office.com',
            'forms.office365.com',
            '.forms.office.com',
            '.forms.microsoft.com',
            'microsoft.com/forms',
            'office.com/forms',
            'forms.cloud.microsoft',
            'responsepage.aspx' // Microsoft Forms response pages
        ];
        
        console.log('Checking URL:', url); // Debug log
        
        // Check for each pattern
        for (const pattern of formsPatterns) {
            if (url.includes(pattern)) {
                console.log('Matched pattern:', pattern); // Debug log
                return true;
            }
        }
        
        // Additional check for regional or corporate domains and response pages
        if (url.match(/https:\/\/[^\/]*forms[^\/]*\.(microsoft|office)/i) || 
            url.includes('responsepage.aspx') ||
            url.includes('microsoft') && url.includes('form')) {
            console.log('Matched regional/response pattern'); // Debug log
            return true;
        }
        
        console.log('No Microsoft Forms pattern matched'); // Debug log
        return false;
    }

    async ensureContentScriptReady(tabId) {
        return new Promise((resolve) => {
            // First try to ping the content script
            chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
                if (chrome.runtime.lastError || !response) {
                    // Content script not ready, check if page is loaded first
                    chrome.tabs.get(tabId, (tab) => {
                        if (tab.status === 'complete') {
                            console.log('Content script not ready, injecting...');
                            chrome.scripting.executeScript({
                                target: { tabId: tabId },
                                files: ['content-v2.1.js']
                            }, () => {
                                if (chrome.runtime.lastError) {
                                    console.error('Failed to inject content script:', chrome.runtime.lastError);
                                    resolve(false);
                                } else {
                                    // Wait a bit for the script to initialize
                                    setTimeout(() => resolve(true), 1000);
                                }
                            });
                        } else {
                            console.log('Page not fully loaded yet');
                            resolve(false);
                        }
                    });
                } else {
                    console.log('Content script already ready');
                    resolve(true);
                }
            });
        });
    }

    async sendMessageWithRetry(tabId, message, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabId, message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
                
                return response;
            } catch (error) {
                console.error(`Message attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
        }
    }

    // Special Questions Management
    loadSpecialQuestions(questions) {
        const container = document.getElementById('specialQuestions');
        if (!container) return;
        
        container.innerHTML = '';

        if (questions.length === 0) {
            this.addQuestion();
            return;
        }

        questions.forEach(question => {
            this.addQuestionItem(question.keyword, question.answer);
        });
    }

    addQuestion() {
        this.addQuestionItem('', '');
    }

    addQuestionItem(keyword = '', answer = '') {
        const container = document.getElementById('specialQuestions');
        if (!container) return;
        
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        
        questionItem.innerHTML = `
            <input type="text" placeholder="Từ khóa câu hỏi (VD: 'tên', 'tuổi', 'email')" class="question-keyword" value="${keyword}">
            <input type="text" placeholder="Câu trả lời cố định" class="question-answer" value="${answer}">
            <button class="remove-question" onclick="removeQuestion(this)">❌</button>
        `;
        
        container.appendChild(questionItem);

        // Add auto-save listeners to new inputs
        questionItem.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.saveSettings());
        });
    }

    getSpecialQuestions() {
        const questions = [];
        document.querySelectorAll('.question-item').forEach(item => {
            const keyword = item.querySelector('.question-keyword').value.trim();
            const answer = item.querySelector('.question-answer').value.trim();
            
            if (keyword && answer) {
                questions.push({ keyword, answer });
            }
        });
        return questions;
    }

    setupStatusListener() {
        // Listen for status updates from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'statusUpdate') {
                this.updateStatistics(message.data);
            }
        });
    }

    initializeStatistics() {
        // Show statistics section if it exists
        const statsElement = document.getElementById('statistics');
        if (statsElement) {
            statsElement.style.display = 'block';
        }
        
        // Initialize with default values
        this.updateStatistics({
            submitCount: 0,
            sessionDuration: 0,
            isRunning: false
        });
        
        // Start real-time updates
        this.startRealTimeUpdates();
    }

    updateStatistics(data) {
        // Update submit count
        const submitCountElement = document.getElementById('submitCount');
        if (submitCountElement && data.submitCount !== undefined) {
            submitCountElement.textContent = data.submitCount;
            submitCountElement.style.color = data.submitCount > 0 ? '#38a169' : '#718096';
        }

        // Update session duration
        const durationElement = document.getElementById('sessionDuration');
        if (durationElement && data.sessionDuration !== undefined) {
            const minutes = Math.floor(data.sessionDuration / 60000);
            const seconds = Math.floor((data.sessionDuration % 60000) / 1000);
            durationElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Update running status
        const statusElement = document.getElementById('runningStatus');
        if (statusElement && data.isRunning !== undefined) {
            if (data.isRunning) {
                statusElement.textContent = 'Đang chạy';
                statusElement.className = 'stat-value status-running';
            } else {
                statusElement.textContent = data.submitCount > 0 ? 'Hoàn thành' : 'Đang chờ';
                statusElement.className = 'stat-value status-idle';
            }
        }

        // Show statistics section
        const statsElement = document.getElementById('statistics');
        if (statsElement && (data.submitCount > 0 || data.isRunning)) {
            statsElement.style.display = 'block';
        }
    }

    resetStatistics() {
        this.updateStatistics({
            submitCount: 0,
            sessionDuration: 0,
            isRunning: false
        });
        
        // Hide statistics if no activity
        const statsElement = document.getElementById('statistics');
        if (statsElement) {
            statsElement.style.display = 'none';
        }
    }
}

// Global functions for HTML onclick handlers
function switchTab(tabName) {
    if (window.popupController) {
        window.popupController.switchTab(tabName);
    }
}

function addQuestion() {
    if (window.popupController) {
        window.popupController.addQuestion();
    }
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    if (document.querySelectorAll('.question-item').length > 1) {
        questionItem.remove();
        if (window.popupController) {
            window.popupController.saveSettings();
        }
    }
}




// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popupController = new PopupController();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStatus' && window.popupController) {
        window.popupController.showStatus(message.status, message.type || 'info');
    }
    
    if (message.action === 'fillingStopped' && window.popupController) {
        window.popupController.isRunning = false;
        window.popupController.updateUI();
    }
});