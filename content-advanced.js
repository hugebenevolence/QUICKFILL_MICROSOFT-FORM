// QuickFill Microsoft Forms - Advanced Content Script
// Enhanced form scanning and filling with conditional logic support

console.log('🚀 QuickFill Advanced Content Script loaded');

class AdvancedMicrosoftFormsHandler {
    constructor() {
        this.config = {
            ratingMin: 3,
            ratingMax: 5,
            avoidOther: true,
            autoRescan: true,
            naturalDelay: true,
            multiPage: false,
            useGemini: false,
            geminiApiKey: '',
            fixedFields: {},
            conditionalHandling: true,
            enhancedScanning: true,
            smartRetry: true
        };
        
        this.formFields = [];
        this.conditionalFields = [];
        this.dependencies = {};
        this.filledCount = 0;
        
        this.init();
    }

    async init() {
        console.log('✅ Advanced Microsoft Forms handler initialized');
        this.loadConfig();
        this.attachMessageListener();
        
        // Wait for form to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onPageReady());
        } else {
            this.onPageReady();
        }
    }

    async loadConfig() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get([
                    'ratingMin', 'ratingMax', 'avoidOther', 'autoRescan', 
                    'naturalDelay', 'multiPage', 'useGemini', 'geminiApiKey', 'fixedFields',
                    'conditionalHandling', 'enhancedScanning', 'smartRetry'
                ]);
                
                this.config = { ...this.config, ...result };
                console.log('📋 Advanced Config loaded:', this.config);
            } else {
                console.log('⚠️ Chrome storage not available, using default config');
            }
        } catch (error) {
            console.log('⚠️ Error loading config, using defaults:', error);
        }
    }

    onPageReady() {
        console.log('📄 Page ready, waiting for form elements...');
        setTimeout(() => {
            this.detectFormStructure();
        }, 1000);
    }

    attachMessageListener() {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('📨 Content script received message:', request);
                this.handleMessage(request, sender, sendResponse);
                return true; // Keep message channel open for async responses
            });
            console.log('✅ Message listener attached successfully');
        } else {
            console.error('❌ Chrome runtime not available');
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            console.log('📨 Message received:', request.action);
            
            switch (request.action) {
                case 'advancedScan':
                    const scanResult = await this.advancedScanForm();
                    sendResponse(scanResult);
                    break;
                    
                case 'advancedFill':
                    if (request.config) {
                        this.config = { ...this.config, ...request.config };
                    }
                    const fillResult = await this.advancedFillForm();
                    sendResponse(fillResult);
                    break;
                    
                case 'quickAdvancedFill':
                    if (request.config) {
                        this.config = { ...this.config, ...request.config };
                    }
                    const quickResult = await this.quickAdvancedFill();
                    sendResponse(quickResult);
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('❌ Message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    detectFormStructure() {
        const formSelectors = [
            '[role="main"]',
            '.office-form',
            '[data-automation-id="questionContainer"]',
            '.question-container',
            '[data-automation-id="surveyPageContainer"]',
            'form',
            '[role="form"]'
        ];

        for (const selector of formSelectors) {
            const formContainer = document.querySelector(selector);
            if (formContainer) {
                console.log(`✅ Found form using selector: ${selector}`);
                return formContainer;
            }
        }

        console.log('⚠️ Form container not found, using document body');
        return document.body;
    }

    // Advanced form scanning with conditional logic detection
    async advancedScanForm() {
        console.log('🔍 Starting advanced form scan...');
        
        const results = {
            radioGroups: [],
            textFields: [],
            checkboxes: [],
            dropdowns: [],
            questions: [],
            conditionalFields: [],
            dependencies: {},
            pageInfo: {},
            totalFields: 0,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Wait for form elements to load
            await this.waitForElements('input, select, textarea');
            
            // Enhanced radio group scanning with conditional detection
            const radioGroups = await this.scanRadioGroupsAdvanced();
            results.radioGroups = radioGroups.groups;
            results.conditionalFields = radioGroups.conditionalFields;
            results.dependencies = radioGroups.dependencies;
            
            // Enhanced text field scanning
            results.textFields = await this.scanTextFieldsAdvanced();
            
            // Enhanced checkbox scanning
            results.checkboxes = await this.scanCheckboxesAdvanced();
            
            // Enhanced dropdown scanning
            results.dropdowns = await this.scanDropdownsAdvanced();
            
            // Extract questions with context
            results.questions = await this.extractQuestionsAdvanced();
            
            // Detect multi-page structure
            results.pageInfo = await this.detectPageStructure();
            
            results.totalFields = results.radioGroups.length + results.textFields.length + 
                                results.checkboxes.length + results.dropdowns.length;
            
            console.log('✅ Advanced scan completed:', results);
            return { success: true, results };
            
        } catch (error) {
            console.error('❌ Advanced scan failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Advanced radio group scanning with conditional field detection
    async scanRadioGroupsAdvanced() {
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        const groups = {};
        const conditionalFields = [];
        const dependencies = {};
        
        // Group radios by name/group
        radioInputs.forEach(radio => {
            const groupName = radio.name || radio.getAttribute('aria-describedby') || 
                             radio.closest('[role="radiogroup"]')?.id || 'unnamed';
            
            if (!groups[groupName]) {
                groups[groupName] = {
                    name: groupName,
                    options: [],
                    question: this.getQuestionTextAdvanced(radio),
                    isRating: false,
                    hasConditional: false
                };
            }
            
            const option = {
                element: radio,
                label: this.getFieldLabelAdvanced(radio),
                value: radio.value,
                id: radio.id || `radio-${Math.random().toString(36).substr(2, 9)}`
            };
            
            groups[groupName].options.push(option);
            
            // Check if this is a rating question
            if (/^\d+$/.test(option.label) || /rating|điểm|đánh giá|point/i.test(groups[groupName].question)) {
                groups[groupName].isRating = true;
            }
        });
        
        // Store for later use
        this.formFields = Object.values(groups);
        
        return {
            groups: Object.values(groups),
            conditionalFields,
            dependencies
        };
    }

    // Enhanced text field scanning
    async scanTextFieldsAdvanced() {
        const textFields = [];
        const selectors = [
            'input[type="text"]',
            'input[type="email"]', 
            'input[type="number"]',
            'input[type="tel"]',
            'input[type="url"]',
            'textarea'
        ];
        
        for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(field => {
                if (this.isElementVisible(field)) {
                    const fieldInfo = {
                        element: field,
                        type: field.type || 'textarea',
                        label: this.getFieldLabelAdvanced(field),
                        question: this.getQuestionTextAdvanced(field),
                        required: field.required || field.getAttribute('aria-required') === 'true',
                        placeholder: field.placeholder,
                        maxLength: field.maxLength || null,
                        pattern: field.pattern || null,
                        isConditional: this.isConditionalField(field)
                    };
                    
                    textFields.push(fieldInfo);
                }
            });
        }
        
        return textFields;
    }

    // Enhanced checkbox scanning
    async scanCheckboxesAdvanced() {
        const checkboxes = [];
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (this.isElementVisible(checkbox)) {
                checkboxes.push({
                    element: checkbox,
                    label: this.getFieldLabelAdvanced(checkbox),
                    question: this.getQuestionTextAdvanced(checkbox),
                    checked: checkbox.checked,
                    required: checkbox.required,
                    isConditional: this.isConditionalField(checkbox)
                });
            }
        });
        
        return checkboxes;
    }

    // Enhanced dropdown scanning
    async scanDropdownsAdvanced() {
        const dropdowns = [];
        
        document.querySelectorAll('select').forEach(select => {
            if (this.isElementVisible(select)) {
                const options = Array.from(select.options).map(option => ({
                    value: option.value,
                    text: option.textContent.trim(),
                    selected: option.selected
                }));
                
                dropdowns.push({
                    element: select,
                    label: this.getFieldLabelAdvanced(select),
                    question: this.getQuestionTextAdvanced(select),
                    options: options,
                    required: select.required,
                    isConditional: this.isConditionalField(select)
                });
            }
        });
        
        return dropdowns;
    }

    // Extract questions with enhanced context
    async extractQuestionsAdvanced() {
        const questions = [];
        const questionSelectors = [
            '[data-automation-id="questionTitle"]',
            '.office-form-question-title',
            '.question-title',
            '.form-question h3',
            '.question-text',
            'h1, h2, h3, h4',
            '[role="heading"]'
        ];
        
        questionSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(question => {
                const text = question.textContent.trim();
                if (text && text.length > 3) {
                    questions.push({
                        text: text,
                        element: question,
                        level: question.tagName?.toLowerCase() || 'unknown',
                        isRequired: question.textContent.includes('*') || 
                                   question.closest('[aria-required="true"]') !== null
                    });
                }
            });
        });
        
        return questions;
    }

    // Detect page structure for multi-page forms
    async detectPageStructure() {
        const pageInfo = {
            isMultiPage: false,
            currentPage: 1,
            totalPages: 1,
            nextButton: null,
            prevButton: null,
            progressIndicator: null
        };
        
        // Look for next button
        const nextSelectors = [
            '[data-automation-id="nextButton"]',
            'button[title*="Next"]',
            'button[aria-label*="Next"]',
            '.next-button',
            'input[value*="Next"]'
        ];
        
        for (const selector of nextSelectors) {
            const button = document.querySelector(selector);
            if (button && this.isElementVisible(button)) {
                pageInfo.nextButton = button;
                pageInfo.isMultiPage = true;
                break;
            }
        }
        
        return pageInfo;
    }

    // Advanced form filling with conditional logic
    async advancedFillForm() {
        console.log('🎯 Starting advanced form fill...');
        
        try {
            this.filledCount = 0;
            const scanResult = await this.advancedScanForm();
            
            if (!scanResult.success) {
                throw new Error('Failed to scan form');
            }
            
            const { results } = scanResult;
            
            // Fill radio groups
            for (const group of results.radioGroups) {
                const selectedOption = await this.selectRadioAdvanced(group);
                if (selectedOption) {
                    await this.clickElement(selectedOption.element);
                    this.filledCount++;
                    
                    // Handle conditional fields
                    if (this.config.conditionalHandling) {
                        await this.naturalDelay(300, 600);
                        await this.handleConditionalFields();
                    }
                    
                    if (this.config.naturalDelay) await this.naturalDelay();
                }
            }
            
            // Fill text fields
            for (const fieldInfo of results.textFields) {
                if (this.isElementVisible(fieldInfo.element)) {
                    const text = await this.generateTextAdvanced(fieldInfo);
                    if (text) {
                        await this.fillTextField(fieldInfo.element, text);
                        this.filledCount++;
                        if (this.config.naturalDelay) await this.naturalDelay();
                    }
                }
            }
            
            // Fill checkboxes
            for (const checkboxInfo of results.checkboxes) {
                if (this.isElementVisible(checkboxInfo.element) && Math.random() > 0.3) {
                    await this.clickElement(checkboxInfo.element);
                    this.filledCount++;
                    if (this.config.naturalDelay) await this.naturalDelay();
                }
            }
            
            // Fill dropdowns
            for (const dropdownInfo of results.dropdowns) {
                if (this.isElementVisible(dropdownInfo.element)) {
                    await this.selectDropdownOption(dropdownInfo);
                    this.filledCount++;
                    if (this.config.naturalDelay) await this.naturalDelay();
                }
            }
            
            // Enhanced rescan
            if (this.config.autoRescan) {
                await this.naturalDelay(1000);
                const rescanResult = await this.rescanAndFillNew();
                this.filledCount += rescanResult.newFieldsFilled;
            }
            
            console.log(`✅ Advanced fill completed: ${this.filledCount} fields filled`);
            return { 
                success: true, 
                filledCount: this.filledCount, 
                message: `Đã điền ${this.filledCount} trường thành công!`
            };
            
        } catch (error) {
            console.error('❌ Advanced fill failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Quick advanced scan and fill
    async quickAdvancedFill() {
        console.log('⚡ Starting quick advanced fill...');
        const result = await this.advancedFillForm();
        return result;
    }

    // Handle conditional fields that appear after selections
    async handleConditionalFields() {
        console.log('🔀 Checking for conditional fields...');
        
        // Wait for any dynamic content to load
        await this.naturalDelay(500);
        
        // Find new fields that might have appeared
        const newTextFields = document.querySelectorAll('input[type="text"], textarea, input[type="email"]');
        const newRadios = document.querySelectorAll('input[type="radio"]');
        const newCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        
        // Fill new text fields
        for (const field of newTextFields) {
            if (this.isElementVisible(field) && !field.value) {
                const text = await this.generateTextAdvanced({ element: field, question: this.getQuestionTextAdvanced(field) });
                if (text) {
                    await this.fillTextField(field, text);
                    this.filledCount++;
                    console.log('✅ Filled conditional text field');
                }
            }
        }
        
        // Fill new checkboxes
        for (const checkbox of newCheckboxes) {
            if (this.isElementVisible(checkbox) && !checkbox.checked && Math.random() > 0.3) {
                await this.clickElement(checkbox);
                this.filledCount++;
                console.log('✅ Filled conditional checkbox');
            }
        }
        
        // Handle new radio groups
        const newRadioGroups = {};
        for (const radio of newRadios) {
            if (this.isElementVisible(radio) && !radio.checked) {
                const groupName = radio.name || 'unnamed';
                if (!newRadioGroups[groupName]) {
                    newRadioGroups[groupName] = [];
                }
                newRadioGroups[groupName].push(radio);
            }
        }
        
        for (const [groupName, radios] of Object.entries(newRadioGroups)) {
            const hasChecked = radios.some(r => r.checked);
            if (!hasChecked && radios.length > 0) {
                const randomRadio = radios[Math.floor(Math.random() * radios.length)];
                await this.clickElement(randomRadio);
                this.filledCount++;
                console.log('✅ Filled conditional radio group');
            }
        }
    }

    // Enhanced radio selection with smart rating logic
    async selectRadioAdvanced(group) {
        let validOptions = group.options.filter(option => {
            if (!this.isElementVisible(option.element)) return false;
            
            if (this.config.avoidOther) {
                const label = option.label.toLowerCase();
                if (label.includes('other') || label.includes('khác') || 
                    label.includes('others') || label.includes('altro')) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (validOptions.length === 0) return null;
        
        // Smart rating selection
        if (group.isRating) {
            const ratingOptions = validOptions.filter(option => {
                const value = parseInt(option.label) || parseInt(option.value);
                return value >= this.config.ratingMin && value <= this.config.ratingMax;
            });
            
            if (ratingOptions.length > 0) {
                // Weighted selection favoring higher ratings
                const weights = ratingOptions.map((_, index) => index + 1);
                const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let i = weights.length - 1; i >= 0; i--) {
                    random -= weights[i];
                    if (random <= 0) {
                        return ratingOptions[i];
                    }
                }
            }
        }
        
        // Random selection for non-rating questions
        return validOptions[Math.floor(Math.random() * validOptions.length)];
    }

    // Enhanced text generation with better AI prompts
    async generateTextAdvanced(fieldInfo) {
        const { element, question, label, type } = fieldInfo;
        
        // Check for fixed fields first
        const fieldKey = (label || '').toLowerCase();
        if (this.config.fixedFields[fieldKey]) {
            return this.config.fixedFields[fieldKey];
        }
        
        // Type-specific generation
        if (type === 'email') {
            return `test${Math.floor(Math.random() * 1000)}@example.com`;
        } else if (type === 'tel' || type === 'number') {
            return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        } else if (type === 'url') {
            return 'https://example.com';
        }
        
        // Use enhanced Gemini API
        if (this.config.useGemini && this.config.geminiApiKey && question) {
            const aiText = await this.callGeminiAPIAdvanced(question, fieldInfo);
            if (aiText) return aiText;
        }
        
        // Enhanced fallback responses
        return this.generateContextualFallbacks(question, label);
    }

    // Enhanced Gemini API with better prompts
    async callGeminiAPIAdvanced(question, fieldInfo) {
        if (!this.config.geminiApiKey) return null;
        
        try {
            const prompt = `Please provide a short, natural response to this form question: "${question}"
            
            Context:
            - Field type: ${fieldInfo.type || 'text'}
            - Field label: ${fieldInfo.label || 'No label'}
            
            Requirements:
            - Keep response concise (1-2 sentences max)
            - Make it sound natural and human-like
            - Appropriate for a form submission`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.config.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                console.log('🤖 AI Generated:', text.substring(0, 50) + '...');
                return text.trim();
            }
            
        } catch (error) {
            console.error('❌ Gemini API error:', error);
        }
        
        return null;
    }

    // Generate contextual fallback responses
    generateContextualFallbacks(question, label) {
        const q = (question || '').toLowerCase();
        const l = (label || '').toLowerCase();
        const combined = q + ' ' + l;
        
        if (combined.includes('name') || combined.includes('tên')) {
            const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Minh C', 'Phạm Thu D'];
            return names[Math.floor(Math.random() * names.length)];
        } else if (combined.includes('company') || combined.includes('công ty')) {
            const companies = ['Công ty ABC', 'Doanh nghiệp XYZ', 'Tập đoàn DEF'];
            return companies[Math.floor(Math.random() * companies.length)];
        } else if (combined.includes('feedback') || combined.includes('comment') || combined.includes('ý kiến')) {
            const feedback = [
                'Dịch vụ tốt, tôi rất hài lòng.',
                'Chất lượng ổn, có thể cải thiện thêm.',
                'Nhân viên nhiệt tình, chu đáo.',
                'Sản phẩm đúng như mong đợi.'
            ];
            return feedback[Math.floor(Math.random() * feedback.length)];
        }
        
        // Default fallbacks
        const defaults = [
            'Tôi đồng ý với điều này.',
            'Khá hài lòng với dịch vụ.',
            'Sản phẩm/dịch vụ tốt.',
            'Có thể cải thiện thêm.',
            'Đáp ứng được nhu cầu.'
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    // Rescan for new fields after initial fill
    async rescanAndFillNew() {
        console.log('🔄 Rescanning for new fields...');
        
        let newFieldsFilled = 0;
        
        // Find new text fields
        const textFields = document.querySelectorAll('input[type="text"], textarea, input[type="email"]');
        for (const field of textFields) {
            if (this.isElementVisible(field) && !field.value.trim()) {
                const text = await this.generateTextAdvanced({ 
                    element: field, 
                    question: this.getQuestionTextAdvanced(field),
                    type: field.type 
                });
                if (text) {
                    await this.fillTextField(field, text);
                    newFieldsFilled++;
                }
            }
        }
        
        // Find new checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        for (const checkbox of checkboxes) {
            if (this.isElementVisible(checkbox) && !checkbox.checked && Math.random() > 0.3) {
                await this.clickElement(checkbox);
                newFieldsFilled++;
            }
        }
        
        console.log(`✅ Rescan completed: ${newFieldsFilled} new fields filled`);
        return { newFieldsFilled };
    }

    // Helper methods
    isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return element.offsetParent !== null && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }

    isConditionalField(element) {
        return element.hasAttribute('data-conditional') ||
               element.closest('[data-conditional]') !== null ||
               element.style.display === 'none' ||
               element.hasAttribute('hidden');
    }

    getFieldLabelAdvanced(element) {
        const labelMethods = [
            () => document.querySelector(`label[for="${element.id}"]`)?.textContent?.trim(),
            () => element.closest('.form-group, .field-group, .question')?.querySelector('label')?.textContent?.trim(),
            () => element.getAttribute('aria-label'),
            () => element.getAttribute('placeholder'),
            () => element.previousElementSibling?.textContent?.trim(),
            () => element.parentNode?.querySelector('label')?.textContent?.trim()
        ];
        
        for (const method of labelMethods) {
            try {
                const label = method();
                if (label && label.length > 0) return label;
            } catch (e) {}
        }
        
        return '';
    }

    getQuestionTextAdvanced(element) {
        const questionMethods = [
            () => element.closest('[data-automation-id="questionTitle"]')?.textContent?.trim(),
            () => element.closest('.office-form-question')?.querySelector('.question-title')?.textContent?.trim(),
            () => element.closest('.form-question')?.querySelector('h3, h4, .question-text')?.textContent?.trim(),
            () => element.closest('.question')?.querySelector('.question-text, h3, h4')?.textContent?.trim()
        ];
        
        for (const method of questionMethods) {
            try {
                const question = method();
                if (question && question.length > 3) return question;
            } catch (e) {}
        }
        
        return '';
    }

    async clickElement(element) {
        element.focus();
        element.click();
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async fillTextField(element, text) {
        element.focus();
        element.value = '';
        
        // Simulate typing if natural delay is enabled
        if (this.config.naturalDelay) {
            for (let i = 0; i < text.length; i++) {
                element.value += text[i];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                await this.naturalDelay(50, 150);
            }
        } else {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.blur();
    }

    async selectDropdownOption(dropdownInfo) {
        const { element, options } = dropdownInfo;
        
        if (options && options.length > 1) {
            // Skip first option (usually empty/placeholder)
            const validOptions = options.slice(1).filter(option => 
                option.value && 
                !this.config.avoidOther || 
                !option.text.toLowerCase().includes('other')
            );
            
            if (validOptions.length > 0) {
                const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];
                element.value = randomOption.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    async waitForElements(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            function check() {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    resolve(elements);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for elements: ${selector}`));
                } else {
                    setTimeout(check, 100);
                }
            }
            
            check();
        });
    }

    naturalDelay(min = 200, max = 800) {
        const time = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, time));
    }
}

// Initialize the advanced handler
try {
    if (typeof window !== 'undefined') {
        window.advancedQuickFillHandler = new AdvancedMicrosoftFormsHandler();
        console.log('✅ QuickFill Advanced Content Script initialized successfully');
    } else {
        console.error('❌ Window object not available');
    }
} catch (error) {
    console.error('❌ Error initializing QuickFill Advanced Content Script:', error);
}

console.log('✅ QuickFill Advanced Content Script loaded with conditional logic support');