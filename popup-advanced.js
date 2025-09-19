// QuickFill Microsoft Forms - Advanced Popup Script
class AdvancedPopupController {
    constructor() {
        this.settings = {
            ratingMin: 3,
            ratingMax: 5,
            avoidOther: true,
            autoRescan: true,
            naturalDelay: true,
            multiPage: false,
            useGemini: false,
            geminiApiKey: '',
            conditionalHandling: true,
            enhancedScanning: true,
            smartRetry: true,
            fixedFields: {}
        };
        
        this.scanResults = null;
        this.isScanning = false;
        this.isFilling = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Advanced Popup Controller');
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.checkActiveTab();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'ratingMin', 'ratingMax', 'avoidOther', 'autoRescan', 
                'naturalDelay', 'multiPage', 'useGemini', 'geminiApiKey',
                'conditionalHandling', 'enhancedScanning', 'smartRetry', 'fixedFields'
            ]);
            
            this.settings = { ...this.settings, ...result };
            console.log('✅ Advanced settings loaded:', this.settings);
        } catch (error) {
            console.error('❌ Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set(this.settings);
            console.log('💾 Settings saved');
        } catch (error) {
            console.error('❌ Error saving settings:', error);
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners');
        
        // Main action buttons
        const advancedScan = document.getElementById('advancedScan');
        const advancedFill = document.getElementById('advancedFill');
        const quickAdvancedFill = document.getElementById('quickAdvancedFill');

        if (advancedScan) {
            advancedScan.addEventListener('click', () => this.advancedScanForm());
        }

        if (advancedFill) {
            advancedFill.addEventListener('click', () => this.advancedFillForm());
        }

        if (quickAdvancedFill) {
            quickAdvancedFill.addEventListener('click', () => this.quickAdvancedFill());
        }

        // Rating settings
        const ratingMin = document.getElementById('ratingMin');
        const ratingMax = document.getElementById('ratingMax');
        
        if (ratingMin) {
            ratingMin.addEventListener('change', (e) => {
                this.settings.ratingMin = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        if (ratingMax) {
            ratingMax.addEventListener('change', (e) => {
                this.settings.ratingMax = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Checkbox settings
        const checkboxSettings = [
            'avoidOther', 'autoRescan', 'naturalDelay', 'multiPage', 
            'conditionalHandling', 'enhancedScanning', 'smartRetry'
        ];

        checkboxSettings.forEach(setting => {
            const element = document.getElementById(setting);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[setting] = e.target.checked;
                    this.saveSettings();
                    this.updateUI();
                });
            }
        });

        // Gemini API settings
        const useGemini = document.getElementById('useGemini');
        const geminiApiKey = document.getElementById('geminiApiKey');
        
        if (useGemini) {
            useGemini.addEventListener('change', (e) => {
                this.settings.useGemini = e.target.checked;
                this.toggleGeminiSettings();
                this.saveSettings();
            });
        }

        if (geminiApiKey) {
            geminiApiKey.addEventListener('input', (e) => {
                this.settings.geminiApiKey = e.target.value;
                this.saveSettings();
            });
        }

        // Fixed fields management
        const addFixedField = document.getElementById('addFixedField');
        if (addFixedField) {
            addFixedField.addEventListener('click', () => this.addFixedField());
        }
    }

    updateUI() {
        console.log('🎨 Updating UI');
        
        // Update rating inputs
        const ratingMin = document.getElementById('ratingMin');
        const ratingMax = document.getElementById('ratingMax');
        
        if (ratingMin) ratingMin.value = this.settings.ratingMin;
        if (ratingMax) ratingMax.value = this.settings.ratingMax;
        
        // Update checkboxes
        const checkboxSettings = [
            'avoidOther', 'autoRescan', 'naturalDelay', 'multiPage', 
            'conditionalHandling', 'enhancedScanning', 'smartRetry'
        ];

        checkboxSettings.forEach(setting => {
            const element = document.getElementById(setting);
            if (element) {
                element.checked = this.settings[setting];
            }
        });

        // Update Gemini settings
        const useGemini = document.getElementById('useGemini');
        const geminiApiKey = document.getElementById('geminiApiKey');
        
        if (useGemini) useGemini.checked = this.settings.useGemini;
        if (geminiApiKey) geminiApiKey.value = this.settings.geminiApiKey;
        
        this.toggleGeminiSettings();
        this.updateFixedFields();
    }

    toggleGeminiSettings() {
        const geminiSettings = document.getElementById('geminiSettings');
        if (geminiSettings) {
            geminiSettings.style.display = this.settings.useGemini ? 'block' : 'none';
        }
    }

    updateFixedFields() {
        const container = document.getElementById('fixedFieldsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.settings.fixedFields).forEach(([key, value]) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'fixed-field-item';
            fieldDiv.innerHTML = `
                <span class="field-text">${key}: ${value}</span>
                <button class="remove-btn" data-key="${key}">❌</button>
            `;
            
            const removeBtn = fieldDiv.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                delete this.settings.fixedFields[key];
                this.saveSettings();
                this.updateFixedFields();
                this.showMessage(`🗑️ Removed fixed field: ${key}`, 'info');
            });
            
            container.appendChild(fieldDiv);
        });
    }

    addFixedField() {
        const keyInput = document.getElementById('fixedFieldKey');
        const valueInput = document.getElementById('fixedFieldValue');
        
        if (!keyInput || !valueInput) return;
        
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key && value) {
            this.settings.fixedFields[key.toLowerCase()] = value;
            this.saveSettings();
            this.updateFixedFields();
            
            // Clear inputs
            keyInput.value = '';
            valueInput.value = '';
            
            this.showMessage(`✅ Added fixed field: ${key}`, 'success');
        } else {
            this.showMessage('⚠️ Please enter both field name and value', 'warning');
        }
    }

    async checkActiveTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const isMicrosoftForms = tab.url.includes('forms.office.com') || 
                                   tab.url.includes('forms.microsoft.com') ||
                                   tab.url.includes('forms.cloud.microsoft');
            
            if (isMicrosoftForms) {
                this.showMessage('✅ Microsoft Forms detected! Ready to use.', 'success');
            } else {
                this.showMessage('⚠️ Please navigate to a Microsoft Forms page first', 'warning');
                this.disableButtons();
            }
        } catch (error) {
            console.error('❌ Error checking active tab:', error);
            this.showMessage('❌ Error checking current page', 'error');
        }
    }

    disableButtons() {
        const buttons = ['advancedScan', 'advancedFill', 'quickAdvancedFill'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });
    }

    enableButtons() {
        const buttons = ['advancedScan', 'advancedFill', 'quickAdvancedFill'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    }

    async advancedScanForm() {
        if (this.isScanning) return;
        
        console.log('🔍 Starting advanced scan');
        this.isScanning = true;
        this.showMessage('🔍 Running advanced form scan...', 'info');
        this.updateButtonStates();
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            console.log('📍 Current tab URL:', tab.url);
            
            // Check if it's a Microsoft Forms page
            if (!this.isValidFormsUrl(tab.url)) {
                throw new Error('Please navigate to a Microsoft Forms page first');
            }

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'advancedScan'
            });
            
            if (response && response.success) {
                this.scanResults = response.results;
                const totalFields = response.results.totalFields;
                const conditionalCount = response.results.conditionalFields.length;
                
                this.showMessage(
                    `✅ Advanced scan complete: ${totalFields} fields found` + 
                    (conditionalCount > 0 ? `, ${conditionalCount} conditional fields detected` : ''), 
                    'success'
                );
                
                this.displayAdvancedScanResults();
            } else {
                this.showMessage('❌ Advanced scan failed: ' + (response?.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error in advanced scan:', error);
            
            if (error.message.includes('Could not establish connection')) {
                this.showMessage('❌ Connection error: Please refresh the page and try again', 'error');
            } else if (error.message.includes('navigate to a Microsoft Forms')) {
                this.showMessage('❌ Please open a Microsoft Forms page first', 'error');
            } else {
                this.showMessage('❌ Advanced scan error: ' + error.message, 'error');
            }
        } finally {
            this.isScanning = false;
            this.updateButtonStates();
        }
    }

    async advancedFillForm() {
        if (this.isFilling) return;
        
        console.log('🎯 Starting advanced fill');
        this.isFilling = true;
        this.showMessage('🎯 Starting advanced form filling...', 'info');
        this.updateButtonStates();
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            if (!this.isValidFormsUrl(tab.url)) {
                throw new Error('Please navigate to a Microsoft Forms page first');
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'advancedFill',
                config: this.settings
            });
            
            if (response && response.success) {
                this.showMessage(
                    `✅ Advanced fill complete: ${response.filledCount} fields filled!`, 
                    'success'
                );
            } else {
                this.showMessage('❌ Advanced fill failed: ' + (response?.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error in advanced fill:', error);
            
            if (error.message.includes('Could not establish connection')) {
                this.showMessage('❌ Connection error: Please refresh the page and try again', 'error');
            } else if (error.message.includes('navigate to a Microsoft Forms')) {
                this.showMessage('❌ Please open a Microsoft Forms page first', 'error');
            } else {
                this.showMessage('❌ Advanced fill error: ' + error.message, 'error');
            }
        } finally {
            this.isFilling = false;
            this.updateButtonStates();
        }
    }

    async quickAdvancedFill() {
        if (this.isFilling || this.isScanning) return;
        
        console.log('⚡ Starting quick advanced fill');
        this.isFilling = true;
        this.isScanning = true;
        this.showMessage('⚡ Quick advanced fill in progress...', 'info');
        this.updateButtonStates();
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            if (!this.isValidFormsUrl(tab.url)) {
                throw new Error('Please navigate to a Microsoft Forms page first');
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'quickAdvancedFill',
                config: this.settings
            });
            
            if (response && response.success) {
                this.showMessage(
                    `⚡ Quick fill complete: ${response.filledCount} fields filled!`, 
                    'success'
                );
            } else {
                this.showMessage('❌ Quick fill failed: ' + (response?.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error in quick fill:', error);
            
            if (error.message.includes('Could not establish connection')) {
                this.showMessage('❌ Connection error: Please refresh the page and try again', 'error');
            } else if (error.message.includes('navigate to a Microsoft Forms')) {
                this.showMessage('❌ Please open a Microsoft Forms page first', 'error');
            } else {
                this.showMessage('❌ Quick fill error: ' + error.message, 'error');
            }
        } finally {
            this.isFilling = false;
            this.isScanning = false;
            this.updateButtonStates();
        }
    }

    displayAdvancedScanResults() {
        const container = document.getElementById('scanResults');
        if (!container || !this.scanResults) return;
        
        container.innerHTML = '';
        
        // Summary
        const summary = document.createElement('div');
        summary.className = 'scan-summary';
        summary.innerHTML = `
            <h4>📊 Scan Results Summary</h4>
            <div class="result-stats">
                <div class="stat-item">
                    <span class="stat-label">Radio Groups:</span>
                    <span class="stat-value">${this.scanResults.radioGroups.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Text Fields:</span>
                    <span class="stat-value">${this.scanResults.textFields.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Checkboxes:</span>
                    <span class="stat-value">${this.scanResults.checkboxes.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Dropdowns:</span>
                    <span class="stat-value">${this.scanResults.dropdowns.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Conditional Fields:</span>
                    <span class="stat-value">${this.scanResults.conditionalFields.length}</span>
                </div>
            </div>
        `;
        container.appendChild(summary);
        
        // Detailed results
        if (this.scanResults.radioGroups.length > 0) {
            const radioSection = document.createElement('div');
            radioSection.className = 'result-section';
            radioSection.innerHTML = `
                <h5>🔘 Radio Groups</h5>
                ${this.scanResults.radioGroups.map(group => `
                    <div class="field-detail">
                        <strong>${group.question}</strong>
                        <small>(${group.options.length} options${group.isRating ? ', Rating scale' : ''}${group.hasConditional ? ', Has conditional logic' : ''})</small>
                    </div>
                `).join('')}
            `;
            container.appendChild(radioSection);
        }
        
        if (this.scanResults.textFields.length > 0) {
            const textSection = document.createElement('div');
            textSection.className = 'result-section';
            textSection.innerHTML = `
                <h5>📝 Text Fields</h5>
                ${this.scanResults.textFields.map(field => `
                    <div class="field-detail">
                        <strong>${field.question || field.label}</strong>
                        <small>(${field.type}${field.required ? ', Required' : ''}${field.isConditional ? ', Conditional' : ''})</small>
                    </div>
                `).join('')}
            `;
            container.appendChild(textSection);
        }
        
        // Page info
        if (this.scanResults.pageInfo && this.scanResults.pageInfo.isMultiPage) {
            const pageSection = document.createElement('div');
            pageSection.className = 'result-section';
            pageSection.innerHTML = `
                <h5>📄 Multi-page Form Detected</h5>
                <div class="field-detail">
                    <strong>Current Page: ${this.scanResults.pageInfo.currentPage} / ${this.scanResults.pageInfo.totalPages}</strong>
                </div>
            `;
            container.appendChild(pageSection);
        }
        
        container.style.display = 'block';
    }

    updateButtonStates() {
        const scanButton = document.getElementById('advancedScan');
        const fillButton = document.getElementById('advancedFill');
        const quickButton = document.getElementById('quickAdvancedFill');
        
        if (scanButton) {
            scanButton.disabled = this.isScanning;
            scanButton.innerHTML = this.isScanning ? 
                '🔍 <span class="loading">Scanning...</span>' : 
                '🔍 Advanced Scan';
        }
        
        if (fillButton) {
            fillButton.disabled = this.isFilling;
            fillButton.innerHTML = this.isFilling ? 
                '🎯 <span class="loading">Filling...</span>' : 
                '🎯 Advanced Fill';
        }
        
        if (quickButton) {
            quickButton.disabled = this.isFilling || this.isScanning;
            quickButton.innerHTML = (this.isFilling || this.isScanning) ? 
                '⚡ <span class="loading">Processing...</span>' : 
                '⚡ Quick Fill';
        }
    }

    isValidFormsUrl(url) {
        if (!url) return false;
        return url.includes('forms.office.com') || 
               url.includes('forms.microsoft.com') ||
               url.includes('forms.cloud.microsoft') ||
               url.includes('.forms.office.com');
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('message');
        if (!messageEl) return;
        
        messageEl.innerHTML = message;
        messageEl.className = `message ${type}`;
        
        // Auto hide after 7 seconds
        setTimeout(() => {
            if (messageEl.innerHTML === message) {
                messageEl.innerHTML = '';
                messageEl.className = 'message';
            }
        }, 7000);
    }
}

// Initialize advanced popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing Advanced Popup Controller');
    window.popupController = new AdvancedPopupController();
});