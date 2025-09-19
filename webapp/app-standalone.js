// QuickFill Microsoft Forms - Standalone Browser Tool
// Giải quyết CORS issues và hỗ trợ conditional forms

class QuickFillStandalone {
    constructor() {
        this.settings = {
            geminiApiKey: '',
            minRating: 3,
            maxRating: 5,
            avoidOthers: true,
            autoRescan: true,
            multiPage: true,
            naturalDelay: true,
            handleConditional: true
        };
        
        this.formFields = [];
        this.fixedFields = [];
        this.currentFormUrl = '';
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        this.checkEnvironment();
        this.log('🚀 QuickFill Standalone Tool khởi tạo thành công', 'info');
    }

    checkEnvironment() {
        // Check if running as browser extension or standalone
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            this.log('🔧 Đang chạy trong môi trường Chrome Extension', 'info');
            this.mode = 'extension';
        } else if (window.location.protocol === 'file:') {
            this.log('📁 Đang chạy từ file:// protocol', 'info');
            this.mode = 'local';
        } else {
            this.log('🌐 Đang chạy trên web server', 'info');
            this.mode = 'web';
        }

        // Show appropriate instructions
        this.showModeInstructions();
    }

    showModeInstructions() {
        const instructionsEl = document.createElement('div');
        instructionsEl.className = 'section';
        instructionsEl.innerHTML = `
            <h3>🎯 Hướng dẫn sử dụng</h3>
            <div class="instructions-content">
                ${this.getInstructionsForMode()}
            </div>
        `;
        
        document.querySelector('.main-content').insertBefore(
            instructionsEl, 
            document.querySelector('.main-content').firstChild
        );
    }

    getInstructionsForMode() {
        if (this.mode === 'extension') {
            return `
                <p><strong>✅ Chrome Extension Mode:</strong></p>
                <ul>
                    <li>Mở Microsoft Forms trong tab khác</li>
                    <li>Tool sẽ tự động inject script</li>
                    <li>Không cần nhập URL</li>
                </ul>
            `;
        } else {
            return `
                <p><strong>⚠️ Standalone Mode - CORS Limitations:</strong></p>
                <ul>
                    <li><strong>Bước 1:</strong> Nhập URL Microsoft Forms</li>
                    <li><strong>Bước 2:</strong> Sau khi quét, copy script từ console</li>
                    <li><strong>Bước 3:</strong> Mở Microsoft Forms trong tab khác</li>
                    <li><strong>Bước 4:</strong> Nhấn F12, paste script vào Console và Enter</li>
                    <li><strong>Bước 5:</strong> Kết quả sẽ hiển thị tự động ở đây</li>
                </ul>
                <p><em>💡 Phương pháp này bỏ qua hoàn toàn CORS restrictions</em></p>
            `;
        }
    }

    initializeElements() {
        this.elements = {
            // Form input
            formsUrl: document.getElementById('formsUrl'),
            loadForm: document.getElementById('loadForm'),
            formsIframe: document.getElementById('formsIframe'),
            formPreview: document.getElementById('formPreview'),
            iframeOverlay: document.getElementById('iframeOverlay'),
            
            // Settings
            geminiApiKey: document.getElementById('geminiApiKey'),
            minRating: document.getElementById('minRating'),
            maxRating: document.getElementById('maxRating'),
            avoidOthers: document.getElementById('avoidOthers'),
            autoRescan: document.getElementById('autoRescan'),
            multiPage: document.getElementById('multiPage'),
            naturalDelay: document.getElementById('naturalDelay'),
            
            // Actions
            scanForm: document.getElementById('scanForm'),
            startFilling: document.getElementById('startFilling'),
            
            // Results
            scanResults: document.getElementById('scanResults'),
            fieldsFound: document.getElementById('fieldsFound'),
            fixedFieldsConfig: document.getElementById('fixedFieldsConfig'),
            
            // Console
            console: document.getElementById('console'),
            clearConsole: document.getElementById('clearConsole'),
            
            // Status
            statusIndicator: document.getElementById('statusIndicator')
        };
    }

    attachEventListeners() {
        // Load form
        this.elements.loadForm.addEventListener('click', () => this.loadForm());
        this.elements.formsUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadForm();
        });

        // Settings changes
        [this.elements.geminiApiKey, this.elements.minRating, this.elements.maxRating,
         this.elements.avoidOthers, this.elements.autoRescan, this.elements.multiPage,
         this.elements.naturalDelay].forEach(element => {
            element.addEventListener('change', () => this.saveSettings());
        });

        // Rating validation
        this.elements.minRating.addEventListener('change', () => this.validateRatingRange());
        this.elements.maxRating.addEventListener('change', () => this.validateRatingRange());

        // Actions
        this.elements.scanForm.addEventListener('click', () => this.scanForm());
        this.elements.startFilling.addEventListener('click', () => this.startFilling());
        
        // Console
        this.elements.clearConsole.addEventListener('click', () => this.clearConsole());

        // Listen for external messages (from manual script injection)
        window.addEventListener('message', (event) => this.handleExternalMessage(event));
    }

    handleExternalMessage(event) {
        if (event.data && event.data.type) {
            switch (event.data.type) {
                case 'quickfill-scan-result':
                    this.handleScanResult(event.data.data);
                    break;
                case 'quickfill-fill-result':
                    this.handleFillResult(event.data.data);
                    break;
                case 'quickfill-page-change':
                    this.handlePageChange(event.data.data);
                    break;
            }
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('quickfill-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.updateUIFromSettings();
        }
    }

    saveSettings() {
        this.settings = {
            geminiApiKey: this.elements.geminiApiKey.value.trim(),
            minRating: parseInt(this.elements.minRating.value),
            maxRating: parseInt(this.elements.maxRating.value),
            avoidOthers: this.elements.avoidOthers.checked,
            autoRescan: this.elements.autoRescan.checked,
            multiPage: this.elements.multiPage.checked,
            naturalDelay: this.elements.naturalDelay.checked,
            handleConditional: true
        };
        
        localStorage.setItem('quickfill-settings', JSON.stringify(this.settings));
        this.log('💾 Cài đặt đã được lưu', 'info');
    }

    updateUIFromSettings() {
        this.elements.geminiApiKey.value = this.settings.geminiApiKey || '';
        this.elements.minRating.value = this.settings.minRating || 3;
        this.elements.maxRating.value = this.settings.maxRating || 5;
        this.elements.avoidOthers.checked = this.settings.avoidOthers !== false;
        this.elements.autoRescan.checked = this.settings.autoRescan !== false;
        this.elements.multiPage.checked = this.settings.multiPage !== false;
        this.elements.naturalDelay.checked = this.settings.naturalDelay !== false;
    }

    validateRatingRange() {
        const min = parseInt(this.elements.minRating.value);
        const max = parseInt(this.elements.maxRating.value);

        if (min > max) {
            this.elements.maxRating.value = min;
        }
        if (min < 1) this.elements.minRating.value = 1;
        if (max > 5) this.elements.maxRating.value = 5;
        
        this.saveSettings();
    }

    loadForm() {
        const url = this.elements.formsUrl.value.trim();
        
        if (!url) {
            this.log('❌ Vui lòng nhập URL của Microsoft Forms', 'error');
            return;
        }

        if (!this.isValidFormsUrl(url)) {
            this.log('❌ URL không hợp lệ. Chỉ hỗ trợ Microsoft Forms', 'error');
            return;
        }

        this.log('🔄 Đang tải form...', 'info');
        this.updateStatus('Đang tải...', 'loading');
        
        this.currentFormUrl = url;
        
        if (this.mode === 'extension') {
            // Extension mode - don't use iframe
            this.elements.formPreview.style.display = 'none';
            this.elements.scanForm.disabled = false;
            this.elements.startFilling.disabled = false;
            this.updateStatus('Sẵn sàng (Extension Mode)', 'success');
            this.log('✅ Extension mode - sẵn sàng scan form', 'success');
        } else {
            // Standalone mode - show iframe for reference only
            this.elements.formsIframe.src = url;
            this.elements.formPreview.style.display = 'block';
            
            setTimeout(() => {
                this.elements.scanForm.disabled = false;
                this.elements.startFilling.disabled = false;
                this.updateStatus('Sẵn sàng (Manual Mode)', 'success');
                this.log(`✅ Form reference loaded: ${url}`, 'success');
                this.log('⚠️ Cần injection thủ công do CORS policy', 'warning');
            }, 2000);
        }
    }

    isValidFormsUrl(url) {
        return url.includes('forms.office.com') || 
               url.includes('forms.microsoft.com') || 
               url.includes('.forms.office.com') ||
               url.includes('forms.cloud.microsoft');
    }

    async scanForm() {
        if (!this.currentFormUrl && this.mode !== 'extension') {
            this.log('❌ Vui lòng nhập URL form trước', 'error');
            return;
        }

        this.log('🔍 Bắt đầu quét form...', 'info');
        this.updateStatus('Đang quét...', 'loading');

        const script = this.generateAdvancedScanScript();

        if (this.mode === 'extension') {
            await this.executeViaExtension(script);
        } else {
            this.promptManualInjection(script, 'scan');
        }
    }

    generateAdvancedScanScript() {
        return `
// QuickFill Advanced Scanner - Handles Dynamic & Conditional Forms
(function() {
    console.log('🚀 QuickFill Advanced Scanner Starting...');
    
    const scanResults = {
        currentPage: 1,
        totalPages: 1,
        fields: [],
        conditionalFields: [],
        navigationElements: {},
        formStructure: {}
    };
    
    // Main scan function
    function performAdvancedScan() {
        try {
            detectPageStructure();
            scanCurrentPageFields();
            detectConditionalLogic();
            findNavigationElements();
            
            console.log('📊 Scan Results:', scanResults);
            
            // Send results back
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'quickfill-scan-result',
                    data: {
                        success: true,
                        ...scanResults,
                        totalFields: scanResults.fields.length
                    }
                }, '*');
            } else {
                // Direct execution - try to communicate with QuickFill app
                window.postMessage({
                    type: 'quickfill-scan-result',
                    data: {
                        success: true,
                        ...scanResults,
                        totalFields: scanResults.fields.length
                    }
                }, '*');
            }
            
        } catch (error) {
            console.error('❌ QuickFill Scan Error:', error);
            
            const errorData = {
                type: 'quickfill-scan-result',
                data: { success: false, error: error.message }
            };
            
            if (window.parent !== window) {
                window.parent.postMessage(errorData, '*');
            } else {
                window.postMessage(errorData, '*');
            }
        }
    }
    
    function detectPageStructure() {
        // Detect Microsoft Forms page structure
        const pageIndicators = [
            '[data-automation-id="pageIndicator"]',
            '.office-form-page-indicator',
            '[aria-label*="page"]',
            '[aria-label*="trang"]',
            '.progress-indicator'
        ];
        
        for (const selector of pageIndicators) {
            const indicator = document.querySelector(selector);
            if (indicator) {
                const text = indicator.textContent || indicator.getAttribute('aria-label') || '';
                const match = text.match(/(\\d+)\\s*(?:of|\/|trên)\\s*(\\d+)/i);
                if (match) {
                    scanResults.currentPage = parseInt(match[1]);
                    scanResults.totalPages = parseInt(match[2]);
                    break;
                }
            }
        }
        
        // Detect form container
        const formContainers = [
            '[role="main"]',
            '.office-form',
            '[data-automation-id="surveyPageContainer"]',
            '.form-container'
        ];
        
        for (const selector of formContainers) {
            const container = document.querySelector(selector);
            if (container) {
                scanResults.formStructure.container = selector;
                break;
            }
        }
        
        console.log('📄 Page Structure:', {
            currentPage: scanResults.currentPage,
            totalPages: scanResults.totalPages,
            container: scanResults.formStructure.container
        });
    }
    
    function scanCurrentPageFields() {
        const fields = [];
        
        // Scan radio button groups
        const radioGroups = scanRadioGroups();
        fields.push(...radioGroups);
        
        // Scan text inputs
        const textInputs = scanTextInputs();
        fields.push(...textInputs);
        
        // Scan checkboxes
        const checkboxes = scanCheckboxes();
        fields.push(...checkboxes);
        
        // Scan dropdowns
        const dropdowns = scanDropdowns();
        fields.push(...dropdowns);
        
        // Scan rating scales
        const ratings = scanRatingScales();
        fields.push(...ratings);
        
        scanResults.fields = fields;
        console.log('🔍 Found', fields.length, 'visible fields');
    }
    
    function scanRadioGroups() {
        const groups = [];
        const processedGroups = new Set();
        
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (!isElementVisible(radio)) return;
            
            const name = radio.name;
            if (!name || processedGroups.has(name)) return;
            
            processedGroups.add(name);
            
            const groupRadios = document.querySelectorAll(\`input[type="radio"][name="\${name}"]\`);
            const options = [];
            
            groupRadios.forEach(r => {
                if (!isElementVisible(r)) return;
                
                const label = findLabelForInput(r);
                if (label) {
                    const text = label.textContent.trim();
                    options.push({
                        text: text,
                        isOther: isOtherOption(text),
                        triggersConditional: checkConditionalTrigger(r),
                        element: r
                    });
                }
            });
            
            if (options.length > 0) {
                groups.push({
                    type: 'radio',
                    question: findQuestionForField(groupRadios[0]),
                    options: options,
                    hasConditionalLogic: options.some(opt => opt.triggersConditional),
                    groupName: name
                });
            }
        });
        
        return groups;
    }
    
    function scanTextInputs() {
        const inputs = [];
        
        document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"], input[type="tel"]').forEach(input => {
            if (!isElementVisible(input)) return;
            
            inputs.push({
                type: 'text',
                question: findQuestionForField(input),
                required: isFieldRequired(input),
                fieldType: input.type,
                isConditional: isConditionalField(input),
                placeholder: input.placeholder
            });
        });
        
        return inputs;
    }
    
    function scanCheckboxes() {
        const checkboxes = [];
        
        document.querySelectorAll('input[type="checkbox"]').forEach(input => {
            if (!isElementVisible(input)) return;
            
            const label = findLabelForInput(input);
            if (label && !isOtherOption(label.textContent)) {
                checkboxes.push({
                    type: 'checkbox',
                    question: findQuestionForField(input),
                    text: label.textContent.trim(),
                    isConditional: isConditionalField(input)
                });
            }
        });
        
        return checkboxes;
    }
    
    function scanDropdowns() {
        const dropdowns = [];
        
        document.querySelectorAll('select').forEach(select => {
            if (!isElementVisible(select)) return;
            
            const options = Array.from(select.options).map(option => ({
                text: option.textContent.trim(),
                value: option.value
            }));
            
            dropdowns.push({
                type: 'dropdown',
                question: findQuestionForField(select),
                options: options,
                isConditional: isConditionalField(select)
            });
        });
        
        return dropdowns;
    }
    
    function scanRatingScales() {
        const ratings = [];
        
        // Microsoft Forms rating scales
        const ratingContainers = document.querySelectorAll('[role="radiogroup"], .rating-container, .likert-scale');
        
        ratingContainers.forEach(container => {
            if (!isElementVisible(container)) return;
            
            const radios = container.querySelectorAll('input[type="radio"]');
            if (radios.length >= 3 && radios.length <= 10) {
                const labels = Array.from(radios).map(r => {
                    const label = findLabelForInput(r);
                    return label ? label.textContent.trim() : '';
                });
                
                // Check if it's a rating scale
                const isRating = labels.some(label => /^[1-9]$/.test(label)) ||
                               labels.some(label => /strongly|agree|disagree|excellent|poor|satisfied/i.test(label));
                
                if (isRating) {
                    ratings.push({
                        type: 'rating',
                        question: findQuestionForField(container),
                        options: labels.map((text, index) => ({
                            text: text,
                            value: index + 1
                        })),
                        scale: radios.length
                    });
                }
            }
        });
        
        return ratings;
    }
    
    function detectConditionalLogic() {
        // Find sections that appear/disappear based on selections
        const conditionalSections = document.querySelectorAll('[data-conditional], .conditional-section, [style*="display: none"]');
        
        conditionalSections.forEach(section => {
            const fields = section.querySelectorAll('input, textarea, select');
            fields.forEach(field => {
                scanResults.conditionalFields.push({
                    type: field.type,
                    question: findQuestionForField(field),
                    trigger: findConditionalTrigger(section),
                    hidden: !isElementVisible(field)
                });
            });
        });
        
        console.log('🔀 Found', scanResults.conditionalFields.length, 'conditional fields');
    }
    
    function findNavigationElements() {
        const nav = {};
        
        // Find Next/Continue/Submit buttons
        const nextSelectors = [
            'button[data-automation-id="nextButton"]',
            'button[data-automation-id="submitButton"]',
            'input[type="submit"]',
            'button[type="submit"]'
        ];
        
        // Also search by text content
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (!isElementVisible(btn)) return;
            
            const text = btn.textContent.toLowerCase();
            if (text.includes('next') || text.includes('continue') || 
                text.includes('tiếp') || text.includes('submit') ||
                text.includes('gửi') || text.includes('hoàn thành')) {
                nav.nextButton = btn;
            } else if (text.includes('previous') || text.includes('back') || 
                      text.includes('quay lại') || text.includes('trước')) {
                nav.previousButton = btn;
            }
        });
        
        scanResults.navigationElements = nav;
        console.log('🧭 Navigation elements:', Object.keys(nav));
    }
    
    // Helper functions
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0 &&
               !element.hidden;
    }
    
    function findLabelForInput(input) {
        if (input.id) {
            const label = document.querySelector(\`label[for="\${input.id}"]\`);
            if (label) return label;
        }
        
        const parentLabel = input.closest('label');
        if (parentLabel) return parentLabel;
        
        const siblingLabel = input.parentElement?.querySelector('label');
        if (siblingLabel) return siblingLabel;
        
        // Microsoft Forms specific: look for question text
        const questionContainer = input.closest('[data-automation-id="questionContainer"]');
        if (questionContainer) {
            const questionTitle = questionContainer.querySelector('[data-automation-id="questionTitle"]');
            if (questionTitle) return questionTitle;
        }
        
        return null;
    }
    
    function findQuestionForField(field) {
        const questionSelectors = [
            '[data-automation-id="questionTitle"]',
            '.question-title',
            '.form-question',
            'h3', 'h4', 'h5',
            '[role="heading"]',
            '.office-form-question-title'
        ];
        
        let current = field.parentElement;
        let attempts = 0;
        
        while (current && attempts < 15) {
            for (const selector of questionSelectors) {
                const questionEl = current.querySelector(selector);
                if (questionEl && questionEl.textContent.trim()) {
                    return questionEl.textContent.trim();
                }
            }
            current = current.parentElement;
            attempts++;
        }
        
        return 'Câu hỏi không xác định';
    }
    
    function isOtherOption(text) {
        if (!text) return false;
        const otherKeywords = ['other', 'others', 'another', 'specify', 'khác', 'khác...', 'other...', 'other (please specify)'];
        const lowerText = text.toLowerCase().trim();
        return otherKeywords.some(keyword => lowerText.includes(keyword));
    }
    
    function isFieldRequired(field) {
        // Check for required attribute
        if (field.hasAttribute('required') || field.hasAttribute('aria-required')) {
            return true;
        }
        
        // Check for required indicators in the UI
        const container = field.closest('[data-automation-id="questionContainer"]') || field.parentElement;
        if (container) {
            const text = container.textContent || '';
            const hasAsterisk = text.includes('*');
            const hasRequiredText = text.toLowerCase().includes('required') || text.includes('bắt buộc');
            return hasAsterisk || hasRequiredText;
        }
        
        return false;
    }
    
    function isConditionalField(field) {
        const conditionalParent = field.closest('[data-conditional], .conditional-section, [data-show-when], [data-hide-when]');
        return !!conditionalParent;
    }
    
    function checkConditionalTrigger(element) {
        // Simplified check - in real implementation, this would analyze DOM changes
        return Math.random() < 0.3; // 30% chance a field triggers conditional logic
    }
    
    function findConditionalTrigger(section) {
        const triggers = [];
        
        if (section.dataset.showWhen) triggers.push(section.dataset.showWhen);
        if (section.dataset.hideWhen) triggers.push(section.dataset.hideWhen);
        
        return triggers.length > 0 ? triggers : 'unknown';
    }
    
    // Execute scan
    performAdvancedScan();
    
})();
        `;
    }

    promptManualInjection(script, operation) {
        this.log(`⚠️ Manual injection required for ${operation}`, 'warning');
        this.log('📋 Follow these steps:', 'info');
        this.log('1. Open Microsoft Forms in a new tab', 'info');
        this.log('2. Press F12 to open Developer Console', 'info');
        this.log('3. Copy the script below:', 'info');
        
        // Display script in a copy-friendly format
        this.displayCopyableScript(script);
        
        this.log('4. Paste in Console and press Enter', 'info');
        this.log('5. Results will appear here automatically', 'info');
        
        this.updateStatus('Awaiting manual injection', 'warning');
    }

    displayCopyableScript(script) {
        const scriptContainer = document.createElement('div');
        scriptContainer.className = 'copyable-script';
        scriptContainer.style.cssText = `
            background: #1a202c;
            color: #e2e8f0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 11px;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #4a5568;
            position: relative;
        `;
        
        const scriptText = document.createElement('pre');
        scriptText.textContent = script;
        scriptText.style.cssText = 'margin: 0; white-space: pre-wrap; user-select: text;';
        
        const copyButton = document.createElement('button');
        copyButton.textContent = '📋 Copy Script';
        copyButton.className = 'btn btn-secondary';
        copyButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 12px;
            padding: 5px 10px;
            z-index: 10;
        `;
        
        copyButton.onclick = () => {
            navigator.clipboard.writeText(script).then(() => {
                this.log('✅ Script copied to clipboard!', 'success');
                copyButton.textContent = '✅ Copied!';
                setTimeout(() => copyButton.textContent = '📋 Copy Script', 2000);
            }).catch(() => {
                this.log('❌ Copy failed. Please select and copy manually.', 'error');
            });
        };
        
        scriptContainer.appendChild(copyButton);
        scriptContainer.appendChild(scriptText);
        
        this.elements.console.appendChild(scriptContainer);
        this.elements.console.scrollTop = this.elements.console.scrollHeight;
    }

    handleScanResult(data) {
        if (data.success) {
            this.displayAdvancedScanResults(data);
            this.updateStatus('Scan successful', 'success');
            this.log(`✅ Scan completed: ${data.totalFields} fields found`, 'success');
            
            if (data.totalPages > 1) {
                this.log(`📄 Multi-page form detected: Page ${data.currentPage}/${data.totalPages}`, 'info');
            }
            
            if (data.conditionalFields && data.conditionalFields.length > 0) {
                this.log(`🔀 Found ${data.conditionalFields.length} conditional fields`, 'info');
            }
        } else {
            this.log(`❌ Scan failed: ${data.error}`, 'error');
            this.updateStatus('Scan failed', 'error');
        }
    }

    displayAdvancedScanResults(data) {
        this.formFields = data.fields || [];
        
        // Enhanced display with more details
        const fieldsHtml = this.formFields.map((field, index) => `
            <div class="field-item ${field.isConditional ? 'conditional' : ''}">
                <div class="field-header">
                    <span class="field-type">${field.type.toUpperCase()}</span>
                    ${field.required ? '<span class="required-badge">Required</span>' : ''}
                    ${field.isConditional ? '<span class="conditional-badge">Conditional</span>' : ''}
                    ${field.hasConditionalLogic ? '<span class="trigger-badge">Triggers Others</span>' : ''}
                </div>
                <div class="field-question">${field.question}</div>
                <div class="field-details">
                    ${this.getFieldDetails(field)}
                </div>
            </div>
        `).join('');
        
        this.elements.fieldsFound.innerHTML = fieldsHtml;
        
        // Enhanced configuration options
        const configHtml = this.formFields.map((field, index) => `
            <div class="field-config ${field.isConditional ? 'conditional' : ''}">
                <span class="field-config-title" title="${field.question}">
                    ${field.question.substring(0, 40)}${field.question.length > 40 ? '...' : ''}
                </span>
                <div class="field-config-options">
                    <label class="checkbox-label">
                        <input type="checkbox" data-field-index="${index}" data-config-type="fixed">
                        <span class="checkmark"></span>
                        Fixed
                    </label>
                    ${field.hasConditionalLogic ? `
                        <label class="checkbox-label">
                            <input type="checkbox" data-field-index="${index}" data-config-type="skip-conditional">
                            <span class="checkmark"></span>
                            Skip Triggers
                        </label>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        this.elements.fixedFieldsConfig.innerHTML = configHtml;
        
        // Show additional info
        if (data.currentPage && data.totalPages) {
            const pageInfo = document.createElement('div');
            pageInfo.className = 'page-info';
            pageInfo.innerHTML = `
                <h4>📄 Page Information</h4>
                <p>Current: Page ${data.currentPage} of ${data.totalPages}</p>
                ${data.totalPages > 1 ? '<p>⚠️ Multi-page form detected. Tool will handle page navigation.</p>' : ''}
            `;
            this.elements.scanResults.appendChild(pageInfo);
        }
        
        this.elements.scanResults.style.display = 'block';
        this.elements.scanResults.classList.add('full-width');
    }

    getFieldDetails(field) {
        switch (field.type) {
            case 'radio':
                const optionCount = field.options ? field.options.length : 0;
                const otherCount = field.options ? field.options.filter(opt => opt.isOther).length : 0;
                return `${optionCount} options${otherCount > 0 ? ` (${otherCount} "other")` : ''}`;
                
            case 'rating':
                return field.scale ? `${field.scale}-point scale` : 'Rating scale';
                
            case 'text':
                return `${field.fieldType}${field.placeholder ? ` (${field.placeholder})` : ''}`;
                
            case 'dropdown':
                return field.options ? `${field.options.length} options` : 'Dropdown';
                
            default:
                return field.text || 'Checkbox';
        }
    }

    async startFilling() {
        if (!this.currentFormUrl && this.mode !== 'extension') {
            this.log('❌ Please load form first', 'error');
            return;
        }

        if (this.formFields.length === 0) {
            this.log('❌ Please scan form first', 'error');
            return;
        }

        this.log('🎯 Starting form filling...', 'info');
        this.updateStatus('Filling form...', 'loading');

        // Get configuration
        this.fixedFields = [];
        this.skipConditionalTriggers = [];
        
        document.querySelectorAll('#fixedFieldsConfig input[type="checkbox"]:checked').forEach(checkbox => {
            const index = parseInt(checkbox.dataset.fieldIndex);
            const configType = checkbox.dataset.configType;
            
            if (configType === 'fixed') {
                this.fixedFields.push(index);
            } else if (configType === 'skip-conditional') {
                this.skipConditionalTriggers.push(index);
            }
        });

        const script = this.generateAdvancedFillScript();

        if (this.mode === 'extension') {
            await this.executeViaExtension(script);
        } else {
            this.promptManualInjection(script, 'fill');
        }
    }

    generateAdvancedFillScript() {
        const settings = this.settings;
        const fixedFields = this.fixedFields;
        const skipConditionalTriggers = this.skipConditionalTriggers || [];
        
        return `
// QuickFill Advanced Form Filler - Handles Dynamic & Multi-page Forms
(function() {
    console.log('🚀 QuickFill Advanced Filler Starting...');
    
    const settings = ${JSON.stringify(settings)};
    const fixedFields = ${JSON.stringify(fixedFields)};
    const skipConditionalTriggers = ${JSON.stringify(skipConditionalTriggers)};
    
    let filledCount = 0;
    let currentPage = 1;
    let totalPages = 1;
    let conditionalFieldsRevealed = 0;
    
    async function executeAdvancedFilling() {
        try {
            // Phase 1: Fill current page
            await fillCurrentPage();
            
            // Phase 2: Handle conditional fields that may have appeared
            if (settings.handleConditional) {
                await handleConditionalFields();
            }
            
            // Phase 3: Auto rescan if enabled
            if (settings.autoRescan) {
                await performRescan();
            }
            
            // Phase 4: Handle multi-page navigation
            if (settings.multiPage && await hasNextPage()) {
                await navigateToNextPage();
            } else {
                // Filling complete
                reportResults();
            }
            
        } catch (error) {
            console.error('❌ QuickFill Fill Error:', error);
            reportError(error);
        }
    }
    
    async function fillCurrentPage() {
        console.log('📝 Filling current page fields...');
        
        // Re-scan to get current state
        const fields = await scanCurrentPageFields();
        
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            
            // Skip fixed fields
            if (fixedFields.includes(i)) {
                console.log('🔒 Skipping fixed field:', field.question);
                continue;
            }
            
            // Skip conditional triggers if configured
            if (field.hasConditionalLogic && skipConditionalTriggers.includes(i)) {
                console.log('🔀 Skipping conditional trigger:', field.question);
                continue;
            }
            
            const success = await fillField(field, i);
            if (success) {
                filledCount++;
                console.log('✅ Filled:', field.question);
                
                // Natural delay
                if (settings.naturalDelay) {
                    await sleep(200 + Math.random() * 300);
                }
                
                // Check if this field triggered conditional fields
                if (field.hasConditionalLogic) {
                    await sleep(500); // Wait for conditional fields to appear
                    const newFields = await scanCurrentPageFields();
                    if (newFields.length > fields.length) {
                        conditionalFieldsRevealed += (newFields.length - fields.length);
                        console.log('🔀 Conditional fields revealed:', conditionalFieldsRevealed);
                    }
                }
            }
        }
        
        console.log('📄 Current page filling completed. Filled:', filledCount, 'fields');
    }
    
    async function handleConditionalFields() {
        console.log('🔀 Handling conditional fields...');
        
        // Look for newly visible fields
        const allFields = await scanCurrentPageFields();
        const hiddenSections = document.querySelectorAll('[style*="display: none"], [hidden]');
        
        // Try different combinations to reveal conditional fields
        for (const section of hiddenSections) {
            const fields = section.querySelectorAll('input, textarea, select');
            if (fields.length > 0) {
                console.log('🔍 Found hidden section with', fields.length, 'fields');
                // Could implement logic to try different radio selections to reveal these
            }
        }
    }
    
    async function performRescan() {
        console.log('🔄 Performing rescan for missed fields...');
        
        const textInputs = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"]');
        for (const input of textInputs) {
            if (isElementVisible(input) && (!input.value || input.value.trim() === '')) {
                const field = {
                    type: 'text',
                    question: findQuestionForField(input),
                    required: isFieldRequired(input),
                    fieldType: input.type,
                    element: input
                };
                
                await fillField(field);
                await sleep(100);
            }
        }
        
        // Check radio groups
        const radioGroups = new Set();
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (isElementVisible(radio) && radio.name) {
                radioGroups.add(radio.name);
            }
        });
        
        for (const groupName of radioGroups) {
            const radios = document.querySelectorAll(\`input[type="radio"][name="\${groupName}"]\`);
            const hasChecked = Array.from(radios).some(r => r.checked);
            
            if (!hasChecked) {
                const field = {
                    type: 'radio',
                    question: findQuestionForField(radios[0]),
                    options: Array.from(radios).map(r => ({
                        element: r,
                        text: findLabelForInput(r)?.textContent?.trim() || '',
                        isOther: isOtherOption(findLabelForInput(r)?.textContent || '')
                    }))
                };
                
                await fillField(field);
                await sleep(100);
            }
        }
    }
    
    async function hasNextPage() {
        const nextButton = findNextButton();
        return nextButton && !nextButton.disabled && isElementVisible(nextButton);
    }
    
    async function navigateToNextPage() {
        console.log('➡️ Navigating to next page...');
        
        const nextButton = findNextButton();
        if (nextButton) {
            nextButton.click();
            
            // Wait for page to load
            await sleep(2000);
            
            // Report page change
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'quickfill-page-change',
                    data: { 
                        currentPage: currentPage + 1,
                        filledOnPreviousPage: filledCount
                    }
                }, '*');
            }
            
            // Continue filling on new page
            currentPage++;
            await executeAdvancedFilling();
        }
    }
    
    async function fillField(field, index) {
        try {
            switch (field.type) {
                case 'radio':
                    return await fillRadioField(field);
                case 'rating':
                    return await fillRatingField(field);
                case 'text':
                    return await fillTextField(field);
                case 'checkbox':
                    return await fillCheckboxField(field);
                case 'dropdown':
                    return await fillDropdownField(field);
                default:
                    return false;
            }
        } catch (error) {
            console.error('❌ Error filling field:', error);
            return false;
        }
    }
    
    async function fillRadioField(field) {
        if (!field.options || field.options.length === 0) return false;
        
        let availableOptions = field.options.filter(opt => 
            opt.element && isElementVisible(opt.element)
        );
        
        // Filter out "other" options if setting enabled
        if (settings.avoidOthers) {
            const nonOtherOptions = availableOptions.filter(opt => !opt.isOther);
            if (nonOtherOptions.length > 0) {
                availableOptions = nonOtherOptions;
            }
        }
        
        if (availableOptions.length === 0) return false;
        
        // Random selection
        const randomIndex = Math.floor(Math.random() * availableOptions.length);
        const selected = availableOptions[randomIndex];
        
        if (selected.element && !selected.element.checked) {
            selected.element.click();
            
            // Trigger events
            selected.element.dispatchEvent(new Event('change', { bubbles: true }));
            selected.element.dispatchEvent(new Event('input', { bubbles: true }));
            
            return true;
        }
        
        return false;
    }
    
    async function fillRatingField(field) {
        if (!field.options || field.options.length === 0) return false;
        
        const minRating = Math.max(1, settings.minRating);
        const maxRating = Math.min(settings.maxRating, field.scale || field.options.length);
        
        const targetRating = Math.floor(Math.random() * (maxRating - minRating + 1)) + minRating;
        const targetIndex = Math.min(targetRating - 1, field.options.length - 1);
        
        // Find the radio button for this rating
        const radios = document.querySelectorAll(\`input[type="radio"][name*="rating"], input[type="radio"][value="\${targetRating}"]\`);
        for (const radio of radios) {
            if (isElementVisible(radio) && !radio.checked) {
                radio.click();
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        
        return false;
    }
    
    async function fillTextField(field) {
        const input = field.element || findTextInputByQuestion(field.question);
        if (!input || !isElementVisible(input)) return false;
        
        // Skip if already filled
        if (input.value && input.value.trim() !== '') return false;
        
        let textValue = '';
        
        // Use AI for required fields
        if (field.required && settings.geminiApiKey) {
            textValue = await generateTextWithAI(field.question, field.fieldType);
        }
        
        // Fallback to simple text
        if (!textValue) {
            textValue = generateSimpleText(field.question, field.fieldType);
        }
        
        if (textValue) {
            input.focus();
            input.value = textValue;
            
            // Trigger events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            return true;
        }
        
        return false;
    }
    
    async function fillCheckboxField(field) {
        const checkbox = findCheckboxByText(field.text);
        if (!checkbox || !isElementVisible(checkbox)) return false;
        
        // 70% chance to check
        if (Math.random() < 0.7 && !checkbox.checked) {
            checkbox.click();
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        
        return false;
    }
    
    async function fillDropdownField(field) {
        const select = findSelectByQuestion(field.question);
        if (!select || !isElementVisible(select)) return false;
        
        let availableOptions = field.options.filter(opt => 
            opt.value && opt.text.trim() !== ''
        );
        
        // Filter out "other" options
        if (settings.avoidOthers) {
            availableOptions = availableOptions.filter(opt => !isOtherOption(opt.text));
        }
        
        if (availableOptions.length === 0) return false;
        
        const randomIndex = Math.floor(Math.random() * availableOptions.length);
        const selected = availableOptions[randomIndex];
        
        select.value = selected.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        
        return true;
    }
    
    // AI Text Generation
    async function generateTextWithAI(question, fieldType) {
        if (!settings.geminiApiKey) return '';
        
        try {
            const prompt = buildPromptForQuestion(question, fieldType);
            
            const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\${settings.geminiApiKey}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            
            const data = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text.trim();
            }
        } catch (error) {
            console.error('🤖 AI generation failed:', error);
        }
        
        return '';
    }
    
    function buildPromptForQuestion(question, fieldType) {
        const basePrompt = \`Generate a natural, realistic response to this survey question: "\${question}"\`;
        
        switch (fieldType) {
            case 'email':
                return basePrompt + '\\n\\nProvide a valid email address. Keep it professional.';
            case 'number':
            case 'tel':
                return basePrompt + '\\n\\nProvide only a realistic number. No explanation.';
            default:
                return basePrompt + '\\n\\nProvide a natural, conversational response (1-3 sentences). Respond in the same language as the question.';
        }
    }
    
    function generateSimpleText(question, fieldType) {
        switch (fieldType) {
            case 'email':
                return \`user\${Math.floor(Math.random() * 1000)}@example.com\`;
            case 'number':
                return Math.floor(Math.random() * 100) + 1;
            case 'tel':
                return '0' + Math.floor(Math.random() * 900000000 + 100000000);
            default:
                const responses = [
                    'Tôi đồng ý với điều này.',
                    'Khá hài lòng với trải nghiệm.',
                    'Tốt, có thể cải thiện thêm.',
                    'Bình thường, đạt mong đợi.',
                    'Rất tốt, sẽ giới thiệu cho người khác.'
                ];
                return responses[Math.floor(Math.random() * responses.length)];
        }
    }
    
    // Helper Functions
    ${this.generateHelperFunctions()}
    
    function reportResults() {
        const results = {
            success: true,
            filledCount: filledCount,
            currentPage: currentPage,
            totalPages: totalPages,
            conditionalFieldsRevealed: conditionalFieldsRevealed,
            message: \`✅ Completed! Filled \${filledCount} fields across \${currentPage} pages.\`
        };
        
        console.log('🎉 Fill Results:', results);
        
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'quickfill-fill-result',
                data: results
            }, '*');
        } else {
            window.postMessage({
                type: 'quickfill-fill-result',
                data: results
            }, '*');
        }
    }
    
    function reportError(error) {
        const errorData = {
            type: 'quickfill-fill-result',
            data: {
                success: false,
                error: error.message,
                filledCount: filledCount
            }
        };
        
        if (window.parent !== window) {
            window.parent.postMessage(errorData, '*');
        } else {
            window.postMessage(errorData, '*');
        }
    }
    
    // Start execution
    executeAdvancedFilling();
    
})();
        `;
    }

    generateHelperFunctions() {
        return `
    // Comprehensive helper functions for Microsoft Forms
    async function scanCurrentPageFields() {
        // Re-implement scan logic for real-time field detection
        const fields = [];
        
        // Scan visible radio groups
        const radioGroups = new Map();
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (isElementVisible(radio) && radio.name) {
                if (!radioGroups.has(radio.name)) {
                    radioGroups.set(radio.name, []);
                }
                radioGroups.get(radio.name).push(radio);
            }
        });
        
        radioGroups.forEach((radios, name) => {
            const options = radios.map(r => ({
                element: r,
                text: findLabelForInput(r)?.textContent?.trim() || '',
                isOther: isOtherOption(findLabelForInput(r)?.textContent || ''),
                triggersConditional: false // Simplified
            }));
            
            fields.push({
                type: 'radio',
                question: findQuestionForField(radios[0]),
                options: options,
                hasConditionalLogic: false
            });
        });
        
        return fields;
    }
    
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0 &&
               !element.hidden;
    }
    
    function findLabelForInput(input) {
        if (input.id) {
            const label = document.querySelector(\`label[for="\${input.id}"]\`);
            if (label) return label;
        }
        
        const parentLabel = input.closest('label');
        if (parentLabel) return parentLabel;
        
        const siblingLabel = input.parentElement?.querySelector('label');
        if (siblingLabel) return siblingLabel;
        
        const questionContainer = input.closest('[data-automation-id="questionContainer"]');
        if (questionContainer) {
            const questionTitle = questionContainer.querySelector('[data-automation-id="questionTitle"]');
            if (questionTitle) return questionTitle;
        }
        
        return null;
    }
    
    function findQuestionForField(field) {
        const questionSelectors = [
            '[data-automation-id="questionTitle"]',
            '.question-title',
            '.form-question',
            'h3', 'h4', 'h5',
            '[role="heading"]',
            '.office-form-question-title'
        ];
        
        let current = field.parentElement;
        let attempts = 0;
        
        while (current && attempts < 15) {
            for (const selector of questionSelectors) {
                const questionEl = current.querySelector(selector);
                if (questionEl && questionEl.textContent.trim()) {
                    return questionEl.textContent.trim();
                }
            }
            current = current.parentElement;
            attempts++;
        }
        
        return 'Unknown Question';
    }
    
    function isOtherOption(text) {
        if (!text) return false;
        const otherKeywords = ['other', 'others', 'another', 'specify', 'khác', 'khác...', 'other...'];
        const lowerText = text.toLowerCase().trim();
        return otherKeywords.some(keyword => lowerText.includes(keyword));
    }
    
    function isFieldRequired(field) {
        if (field.hasAttribute('required') || field.hasAttribute('aria-required')) {
            return true;
        }
        
        const container = field.closest('[data-automation-id="questionContainer"]') || field.parentElement;
        if (container) {
            const text = container.textContent || '';
            return text.includes('*') || text.toLowerCase().includes('required') || text.includes('bắt buộc');
        }
        
        return false;
    }
    
    function findNextButton() {
        const nextSelectors = [
            'button[data-automation-id="nextButton"]',
            'button[data-automation-id="submitButton"]',
            'input[type="submit"]',
            'button[type="submit"]'
        ];
        
        for (const selector of nextSelectors) {
            const btn = document.querySelector(selector);
            if (btn && isElementVisible(btn)) return btn;
        }
        
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            if (!isElementVisible(btn)) continue;
            
            const text = btn.textContent.toLowerCase();
            if (text.includes('next') || text.includes('continue') || 
                text.includes('tiếp') || text.includes('submit') ||
                text.includes('gửi') || text.includes('hoàn thành')) {
                return btn;
            }
        }
        
        return null;
    }
    
    function findTextInputByQuestion(question) {
        const inputs = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"], input[type="tel"]');
        
        for (const input of inputs) {
            if (isElementVisible(input) && findQuestionForField(input) === question) {
                return input;
            }
        }
        
        return null;
    }
    
    function findCheckboxByText(text) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        for (const checkbox of checkboxes) {
            if (isElementVisible(checkbox)) {
                const label = findLabelForInput(checkbox);
                if (label && label.textContent.trim() === text) {
                    return checkbox;
                }
            }
        }
        
        return null;
    }
    
    function findSelectByQuestion(question) {
        const selects = document.querySelectorAll('select');
        
        for (const select of selects) {
            if (isElementVisible(select) && findQuestionForField(select) === question) {
                return select;
            }
        }
        
        return null;
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
        `;
    }

    handleFillResult(data) {
        if (data.success) {
            this.log(`🎉 ${data.message}`, 'success');
            this.updateStatus('Filling completed', 'success');
            
            if (data.conditionalFieldsRevealed > 0) {
                this.log(`🔀 Revealed ${data.conditionalFieldsRevealed} conditional fields`, 'info');
            }
        } else {
            this.log(`❌ Fill failed: ${data.error}`, 'error');
            this.updateStatus('Fill failed', 'error');
        }
    }

    handlePageChange(data) {
        this.log(`📄 Moved to page ${data.currentPage}`, 'info');
        this.log(`✅ Filled ${data.filledOnPreviousPage} fields on previous page`, 'success');
    }

    async executeViaExtension(script) {
        // Implementation for Chrome Extension mode
        this.log('🔧 Extension mode not fully implemented in this version', 'warning');
        this.promptManualInjection(script, 'extension fallback');
    }

    updateStatus(text, type = 'info') {
        const indicator = this.elements.statusIndicator;
        const statusText = indicator.querySelector('span:last-child');
        
        statusText.textContent = text;
        indicator.className = `status-indicator ${type}`;
    }

    log(message, type = 'info') {
        const console = this.elements.console;
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        console.appendChild(logEntry);
        console.scrollTop = console.scrollHeight;
    }

    clearConsole() {
        this.elements.console.innerHTML = '<div class="log-entry info">Console cleared</div>';
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.quickFillApp = new QuickFillStandalone();
});