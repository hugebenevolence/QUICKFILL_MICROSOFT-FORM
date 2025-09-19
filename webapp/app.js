// QuickFill Microsoft Forms - Web Application
class QuickFillWebApp {
    constructor() {
        this.settings = {
            geminiApiKey: '',
            minRating: 3,
            maxRating: 5,
            avoidOthers: true,
            autoRescan: true,
            multiPage: true,
            naturalDelay: true
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
        this.log('QuickFill Web App khởi tạo thành công', 'info');
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

        // Iframe load event
        this.elements.formsIframe.addEventListener('load', () => this.onIframeLoad());
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
            naturalDelay: this.elements.naturalDelay.checked
        };
        
        localStorage.setItem('quickfill-settings', JSON.stringify(this.settings));
        this.log('Cài đặt đã được lưu', 'info');
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
            this.log('Vui lòng nhập URL của Microsoft Forms', 'error');
            return;
        }

        if (!this.isValidFormsUrl(url)) {
            this.log('URL không hợp lệ. Chỉ hỗ trợ Microsoft Forms', 'error');
            return;
        }

        this.log('Đang tải form...', 'info');
        this.updateStatus('Đang tải...', 'loading');
        
        this.currentFormUrl = url;
        this.elements.formsIframe.src = url;
        this.elements.formPreview.style.display = 'block';
        
        // Enable buttons after a delay
        setTimeout(() => {
            this.elements.scanForm.disabled = false;
            this.elements.startFilling.disabled = false;
            this.updateStatus('Form đã tải', 'success');
            this.log(`Form đã được tải: ${url}`, 'success');
        }, 2000);
    }

    onIframeLoad() {
        // Remove overlay after iframe loads
        setTimeout(() => {
            this.elements.iframeOverlay.style.display = 'none';
        }, 1000);
    }

    isValidFormsUrl(url) {
        return url.includes('forms.office.com') || 
               url.includes('forms.microsoft.com') || 
               url.includes('.forms.office.com') ||
               url.includes('forms.cloud.microsoft');
    }

    async scanForm() {
        if (!this.currentFormUrl) {
            this.log('Vui lòng tải form trước', 'error');
            return;
        }

        this.log('Đang quét form...', 'info');
        this.updateStatus('Đang quét...', 'loading');

        try {
            // Inject script into iframe to scan form
            const script = this.generateScanScript();
            await this.executeScriptInIframe(script);
            
        } catch (error) {
            this.log(`Lỗi khi quét form: ${error.message}`, 'error');
            this.updateStatus('Lỗi quét form', 'error');
        }
    }

    generateScanScript() {
        return `
            // QuickFill Advanced Form Scanner with Dynamic Detection
            (function() {
                let scanResults = {
                    currentPage: 1,
                    totalPages: 1,
                    fields: [],
                    conditionalFields: [],
                    navigationElements: {}
                };
                
                function findAllFormFields() {
                    const fields = [];
                    
                    // Detect current page and total pages
                    detectPageInfo();
                    
                    // Find all visible fields first
                    const visibleFields = findVisibleFields();
                    fields.push(...visibleFields);
                    
                    // Find conditional/hidden fields that might appear
                    const conditionalFields = findConditionalFields();
                    scanResults.conditionalFields = conditionalFields;
                    
                    // Find navigation elements
                    scanResults.navigationElements = findNavigationElements();
                    
                    return fields;
                }
                
                function detectPageInfo() {
                    // Microsoft Forms page indicators
                    const pageIndicators = [
                        '[data-automation-id="pageIndicator"]',
                        '.progress-indicator',
                        '[aria-label*="page"]',
                        '[aria-label*="trang"]'
                    ];
                    
                    for (const selector of pageIndicators) {
                        const indicator = document.querySelector(selector);
                        if (indicator) {
                            const text = indicator.textContent;
                            const match = text.match(/(\\d+)\\s*(?:of|\/|trên)\\s*(\\d+)/i);
                            if (match) {
                                scanResults.currentPage = parseInt(match[1]);
                                scanResults.totalPages = parseInt(match[2]);
                                break;
                            }
                        }
                    }
                    
                    console.log('QuickFill: Detected page', scanResults.currentPage, 'of', scanResults.totalPages);
                }
                
                function findVisibleFields() {
                    const fields = [];
                    
                    // Find radio button groups
                    const radioGroups = new Map();
                    document.querySelectorAll('input[type="radio"]:not([style*="display: none"]):not([hidden])').forEach(radio => {
                        if (!isElementVisible(radio)) return;
                        
                        const name = radio.name;
                        if (!name) return;
                        
                        if (!radioGroups.has(name)) {
                            radioGroups.set(name, []);
                        }
                        radioGroups.get(name).push(radio);
                    });
                    
                    radioGroups.forEach((radios, name) => {
                        const options = radios.map(r => {
                            const label = findLabelForInput(r);
                            return {
                                text: label ? label.textContent.trim() : '',
                                isOther: isOtherOption(label ? label.textContent : ''),
                                triggersConditional: checkIfTriggersConditional(r)
                            };
                        });
                        
                        if (options.length > 0) {
                            const question = findQuestionForField(radios[0]);
                            fields.push({
                                type: 'radio',
                                question: question,
                                options: options,
                                hasConditionalLogic: options.some(opt => opt.triggersConditional)
                            });
                        }
                    });
                    
                    // Find text inputs (only visible ones)
                    document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"]').forEach(input => {
                        if (!isElementVisible(input)) return;
                        
                        fields.push({
                            type: 'text',
                            question: findQuestionForField(input),
                            required: isFieldRequired(input),
                            fieldType: input.type,
                            isConditional: isConditionalField(input)
                        });
                    });
                    
                    // Find checkboxes (only visible ones)
                    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
                        if (!isElementVisible(input)) return;
                        
                        const label = findLabelForInput(input);
                        if (label && !isOtherOption(label.textContent)) {
                            fields.push({
                                type: 'checkbox',
                                question: findQuestionForField(input),
                                text: label.textContent.trim(),
                                isConditional: isConditionalField(input)
                            });
                        }
                    });
                    
                    // Find dropdowns (only visible ones)
                    document.querySelectorAll('select').forEach(select => {
                        if (!isElementVisible(select)) return;
                        
                        const options = Array.from(select.options).map(option => ({
                            text: option.textContent.trim(),
                            value: option.value
                        }));
                        
                        fields.push({
                            type: 'dropdown',
                            question: findQuestionForField(select),
                            options: options,
                            isConditional: isConditionalField(select)
                        });
                    });
                    
                    return fields;
                }
                
                function findConditionalFields() {
                    const conditionalFields = [];
                    
                    // Find hidden sections that might become visible
                    const hiddenSections = document.querySelectorAll('[style*="display: none"], [hidden], .conditional-section');
                    
                    hiddenSections.forEach(section => {
                        const fields = section.querySelectorAll('input, textarea, select');
                        fields.forEach(field => {
                            const question = findQuestionForField(field);
                            conditionalFields.push({
                                type: field.type || 'unknown',
                                question: question,
                                trigger: findConditionalTrigger(section),
                                section: section
                            });
                        });
                    });
                    
                    return conditionalFields;
                }
                
                function findNavigationElements() {
                    const nav = {};
                    
                    // Find Next/Continue buttons
                    const nextSelectors = [
                        'button[data-automation-id="nextButton"]',
                        'button[data-automation-id="submitButton"]',
                        'button:contains("Next")',
                        'button:contains("Continue")',
                        'button:contains("Tiếp tục")',
                        'button:contains("Tiếp theo")',
                        '.next-button',
                        '[aria-label*="next"]'
                    ];
                    
                    for (const selector of nextSelectors) {
                        const btn = document.querySelector(selector);
                        if (btn && isElementVisible(btn)) {
                            nav.nextButton = btn;
                            break;
                        }
                    }
                    
                    // Find Previous/Back buttons
                    const prevSelectors = [
                        'button[data-automation-id="previousButton"]',
                        'button:contains("Previous")',
                        'button:contains("Back")',
                        'button:contains("Quay lại")',
                        '.prev-button',
                        '[aria-label*="previous"]'
                    ];
                    
                    for (const selector of prevSelectors) {
                        const btn = document.querySelector(selector);
                        if (btn && isElementVisible(btn)) {
                            nav.previousButton = btn;
                            break;
                        }
                    }
                    
                    return nav;
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
                
                function isConditionalField(field) {
                    // Check if field is inside a conditional section
                    const conditionalParent = field.closest('[data-conditional], .conditional-section, [style*="display: none"]');
                    return !!conditionalParent;
                }
                
                function checkIfTriggersConditional(radioElement) {
                    // Check if selecting this radio shows/hides other fields
                    const name = radioElement.name;
                    const value = radioElement.value;
                    
                    // Look for elements with data attributes indicating conditional logic
                    const conditionalElements = document.querySelectorAll(
                        '[data-show-when*="' + name + '"], ' +
                        '[data-hide-when*="' + name + '"], ' +
                        '[data-conditional-field*="' + name + '"]'
                    );
                    
                    return conditionalElements.length > 0;
                }
                
                function findConditionalTrigger(section) {
                    // Try to find what radio/checkbox triggers this section
                    const triggers = [];
                    
                    // Look for data attributes
                    if (section.dataset.showWhen) triggers.push(section.dataset.showWhen);
                    if (section.dataset.hideWhen) triggers.push(section.dataset.hideWhen);
                    
                    return triggers.length > 0 ? triggers : null;
                }
                
                function findLabelForInput(input) {
                    if (input.id) {
                        const label = document.querySelector('label[for="' + input.id + '"]');
                        if (label) return label;
                    }
                    
                    const parentLabel = input.closest('label');
                    if (parentLabel) return parentLabel;
                    
                    const siblingLabel = input.parentElement?.querySelector('label');
                    if (siblingLabel) return siblingLabel;
                    
                    return null;
                }
                
                function findQuestionForField(field) {
                    const questionSelectors = [
                        '[data-automation-id="questionTitle"]',
                        '.question-title',
                        '.form-question',
                        'h3', 'h4', 'h5',
                        '[role="heading"]'
                    ];
                    
                    let current = field.parentElement;
                    let attempts = 0;
                    
                    while (current && attempts < 10) {
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
                    const otherKeywords = ['other', 'others', 'another', 'specify', 'khác', 'khác...', 'other...'];
                    const lowerText = text.toLowerCase().trim();
                    return otherKeywords.some(keyword => lowerText.includes(keyword));
                }
                
                function isFieldRequired(field) {
                    const container = field.closest('[data-automation-id="questionContainer"]') || field.parentElement;
                    if (!container) return false;
                    
                    const text = container.textContent || '';
                    return text.includes('*') || text.toLowerCase().includes('required') || text.includes('bắt buộc');
                }
                
                // Execute scan
                const fields = findAllFormFields();
                console.log('QuickFill: Found', fields.length, 'fields');
                
                // Send results back to parent
                window.parent.postMessage({
                    type: 'quickfill-scan-result',
                    data: {
                        success: true,
                        fields: fields,
                        totalFields: fields.length
                    }
                }, '*');
            })();
        `;
    }

    async executeScriptInIframe(script) {
        // Try different approaches to handle cross-origin restrictions
        return new Promise((resolve, reject) => {
            const messageHandler = (event) => {
                if (event.data && event.data.type === 'quickfill-scan-result') {
                    window.removeEventListener('message', messageHandler);
                    
                    if (event.data.data.success) {
                        this.displayScanResults(event.data.data);
                        this.updateStatus('Quét thành công', 'success');
                        resolve(event.data.data);
                    } else {
                        reject(new Error(event.data.data.error || 'Scan failed'));
                    }
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Method 1: Try direct iframe access
            try {
                const iframe = this.elements.formsIframe;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                if (iframeDoc) {
                    const scriptEl = iframeDoc.createElement('script');
                    scriptEl.textContent = script;
                    iframeDoc.head.appendChild(scriptEl);
                    this.log('Đã inject script trực tiếp vào iframe', 'info');
                    return;
                }
            } catch (corsError) {
                this.log('Không thể truy cập trực tiếp iframe (CORS), thử phương pháp khác...', 'warning');
            }
            
            // Method 2: Use browser extension approach (if available)
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                this.log('Thử sử dụng Chrome Extension API...', 'info');
                this.executeViaExtension(script, resolve, reject);
                return;
            }
            
            // Method 3: User manual injection
            this.promptUserManualInjection(script, resolve, reject);
            
            // Timeout
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                reject(new Error('Timeout - Không thể inject script. Vui lòng thử phương pháp thủ công.'));
            }, 15000);
        });
    }

    promptUserManualInjection(script, resolve, reject) {
        this.log('⚠️ Không thể tự động inject script do CORS policy', 'warning');
        this.log('📋 Hướng dẫn inject thủ công:', 'info');
        this.log('1. Mở Microsoft Forms trong tab khác', 'info');
        this.log('2. Nhấn F12 để mở Developer Console', 'info');
        this.log('3. Copy và paste đoạn script dưới đây:', 'info');
        
        // Show script in console for manual copy
        const consoleEl = this.elements.console;
        const scriptDiv = document.createElement('div');
        scriptDiv.className = 'log-entry warning';
        scriptDiv.style.cssText = 'background: #2d3748; color: #e2e8f0; font-family: monospace; font-size: 11px; padding: 15px; margin: 10px 0; border-radius: 5px; max-height: 200px; overflow-y: auto; cursor: text; user-select: text;';
        scriptDiv.textContent = script;
        
        consoleEl.appendChild(scriptDiv);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copy Script';
        copyBtn.className = 'btn btn-secondary';
        copyBtn.style.cssText = 'margin: 10px 0; font-size: 12px; padding: 5px 10px;';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(script).then(() => {
                this.log('✅ Script đã được copy vào clipboard!', 'success');
                copyBtn.textContent = '✅ Đã copy!';
                setTimeout(() => copyBtn.textContent = '📋 Copy Script', 2000);
            });
        };
        consoleEl.appendChild(copyBtn);
        
        this.log('4. Nhấn Enter để chạy script', 'info');
        this.log('5. Kết quả sẽ hiển thị ở đây tự động', 'info');
        
        // Still listen for manual results
        this.updateStatus('Chờ injection thủ công', 'warning');
    }

    executeViaExtension(script, resolve, reject) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && this.isValidFormsUrl(tabs[0].url)) {
                chrome.tabs.executeScript(tabs[0].id, {code: script}, (result) => {
                    if (chrome.runtime.lastError) {
                        this.log('Extension injection failed: ' + chrome.runtime.lastError.message, 'error');
                        this.promptUserManualInjection(script, resolve, reject);
                    } else {
                        this.log('Script injected via Chrome Extension', 'success');
                    }
                });
            } else {
                this.promptUserManualInjection(script, resolve, reject);
            }
        });
    }

    displayScanResults(data) {
        this.formFields = data.fields;
        
        // Display found fields
        const fieldsHtml = data.fields.map((field, index) => `
            <div class="field-item">
                <span class="field-type">${field.type.toUpperCase()}:</span>
                <span class="field-question">${field.question}</span>
                <div class="field-options">
                    ${field.options ? `${field.options.length} options` : 
                      field.required ? 'Bắt buộc' : 'Tùy chọn'}
                </div>
            </div>
        `).join('');
        
        this.elements.fieldsFound.innerHTML = fieldsHtml;

        // Create fixed fields configuration
        const configHtml = data.fields.map((field, index) => `
            <div class="field-config">
                <span title="${field.question}">${field.question.substring(0, 40)}${field.question.length > 40 ? '...' : ''}</span>
                <label class="checkbox-label">
                    <input type="checkbox" data-field-index="${index}">
                    <span class="checkmark"></span>
                    Cố định
                </label>
            </div>
        `).join('');
        
        this.elements.fixedFieldsConfig.innerHTML = configHtml;
        
        // Show scan results
        this.elements.scanResults.style.display = 'block';
        this.elements.scanResults.classList.add('full-width');
        
        this.log(`Tìm thấy ${data.totalFields} trường trong form`, 'success');
    }

    async startFilling() {
        if (!this.currentFormUrl) {
            this.log('Vui lòng tải form trước', 'error');
            return;
        }

        if (this.formFields.length === 0) {
            this.log('Vui lòng quét form trước', 'error');
            return;
        }

        this.log('Bắt đầu điền form...', 'info');
        this.updateStatus('Đang điền...', 'loading');

        // Get fixed fields
        this.fixedFields = [];
        document.querySelectorAll('#fixedFieldsConfig input[type="checkbox"]:checked')
            .forEach(checkbox => {
                this.fixedFields.push(parseInt(checkbox.dataset.fieldIndex));
            });

        try {
            const script = this.generateFillScript();
            await this.executeScriptInIframe(script);
            
        } catch (error) {
            this.log(`Lỗi khi điền form: ${error.message}`, 'error');
            this.updateStatus('Lỗi điền form', 'error');
        }
    }

    generateFillScript() {
        const settings = this.settings;
        const fixedFields = this.fixedFields;
        
        return `
            // QuickFill Form Filler
            (function() {
                const settings = ${JSON.stringify(settings)};
                const fixedFields = ${JSON.stringify(fixedFields)};
                let filledCount = 0;
                
                async function fillAllFields() {
                    // Get all fields again (fresh scan)
                    const fields = findAllFormFields();
                    
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        
                        // Skip fixed fields
                        if (fixedFields.includes(i)) {
                            console.log('QuickFill: Skipping fixed field:', field.question);
                            continue;
                        }
                        
                        const success = await fillField(field, i);
                        if (success) {
                            filledCount++;
                            
                            // Natural delay
                            if (settings.naturalDelay) {
                                await sleep(200 + Math.random() * 300);
                            }
                        }
                    }
                    
                    // Auto rescan if enabled
                    if (settings.autoRescan) {
                        await sleep(1000);
                        await performRescan();
                    }
                    
                    // Send results back
                    window.parent.postMessage({
                        type: 'quickfill-fill-result',
                        data: {
                            success: true,
                            filledCount: filledCount,
                            message: 'Đã điền ' + filledCount + ' trường thành công!'
                        }
                    }, '*');
                }
                
                async function fillField(field, index) {
                    try {
                        switch (field.type) {
                            case 'radio':
                                return fillRadioField(field);
                            case 'text':
                                return await fillTextField(field);
                            case 'checkbox':
                                return fillCheckboxField(field);
                            case 'dropdown':
                                return fillDropdownField(field);
                            default:
                                return false;
                        }
                    } catch (error) {
                        console.error('QuickFill: Error filling field:', error);
                        return false;
                    }
                }
                
                function fillRadioField(field) {
                    const radios = document.querySelectorAll('input[type="radio"]');
                    const fieldRadios = [];
                    
                    radios.forEach(radio => {
                        const label = findLabelForInput(radio);
                        if (label) {
                            const text = label.textContent.trim();
                            const isOther = isOtherOption(text);
                            
                            if (field.options.some(opt => opt.text === text)) {
                                fieldRadios.push({ element: radio, text: text, isOther: isOther });
                            }
                        }
                    });
                    
                    // Filter out "other" options if needed
                    let availableOptions = fieldRadios;
                    if (settings.avoidOthers) {
                        availableOptions = fieldRadios.filter(option => !option.isOther);
                    }
                    
                    if (availableOptions.length === 0) return false;
                    
                    // Random selection
                    const randomIndex = Math.floor(Math.random() * availableOptions.length);
                    const selected = availableOptions[randomIndex];
                    
                    if (selected.element && !selected.element.checked) {
                        selected.element.click();
                        console.log('QuickFill: Selected radio:', selected.text);
                        return true;
                    }
                    
                    return false;
                }
                
                async function fillTextField(field) {
                    const inputs = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"]');
                    let targetInput = null;
                    
                    // Find the input that matches this field
                    for (const input of inputs) {
                        const question = findQuestionForField(input);
                        if (question === field.question) {
                            targetInput = input;
                            break;
                        }
                    }
                    
                    if (!targetInput || (targetInput.value && targetInput.value.trim() !== '')) {
                        return false;
                    }
                    
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
                        targetInput.focus();
                        targetInput.value = textValue;
                        
                        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        console.log('QuickFill: Filled text field:', textValue.substring(0, 30) + '...');
                        return true;
                    }
                    
                    return false;
                }
                
                function fillCheckboxField(field) {
                    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                    
                    for (const checkbox of checkboxes) {
                        const label = findLabelForInput(checkbox);
                        if (label && label.textContent.trim() === field.text) {
                            if (Math.random() < 0.7 && !checkbox.checked) {
                                checkbox.click();
                                console.log('QuickFill: Checked:', field.text);
                                return true;
                            }
                            break;
                        }
                    }
                    
                    return false;
                }
                
                function fillDropdownField(field) {
                    const selects = document.querySelectorAll('select');
                    let targetSelect = null;
                    
                    for (const select of selects) {
                        const question = findQuestionForField(select);
                        if (question === field.question) {
                            targetSelect = select;
                            break;
                        }
                    }
                    
                    if (!targetSelect || !field.options || field.options.length <= 1) return false;
                    
                    const availableOptions = field.options.filter(option => 
                        option.value && 
                        option.text.trim() !== '' &&
                        (!settings.avoidOthers || !isOtherOption(option.text))
                    );
                    
                    if (availableOptions.length === 0) return false;
                    
                    const randomIndex = Math.floor(Math.random() * availableOptions.length);
                    const selected = availableOptions[randomIndex];
                    
                    targetSelect.value = selected.value;
                    targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    console.log('QuickFill: Selected dropdown:', selected.text);
                    return true;
                }
                
                async function generateTextWithAI(question, fieldType) {
                    if (!settings.geminiApiKey) return '';
                    
                    try {
                        const prompt = buildPromptForQuestion(question, fieldType);
                        
                        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + settings.geminiApiKey, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }]
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                            return data.candidates[0].content.parts[0].text.trim();
                        }
                    } catch (error) {
                        console.error('QuickFill: AI generation failed:', error);
                    }
                    
                    return '';
                }
                
                function buildPromptForQuestion(question, fieldType) {
                    const basePrompt = 'Generate a natural, realistic response to this survey question: "' + question + '"';
                    
                    switch (fieldType) {
                        case 'email':
                            return basePrompt + '\\n\\nProvide a valid email address format. Keep it simple and professional.';
                        case 'number':
                            return basePrompt + '\\n\\nProvide only a realistic number. No explanation needed.';
                        default:
                            return basePrompt + '\\n\\nProvide a natural, conversational response as if from a real person. Keep it concise (1-3 sentences). Respond in the same language as the question.';
                    }
                }
                
                function generateSimpleText(question, fieldType) {
                    switch (fieldType) {
                        case 'email':
                            return 'user' + Math.floor(Math.random() * 1000) + '@example.com';
                        case 'number':
                            return Math.floor(Math.random() * 100) + 1;
                        default:
                            const responses = [
                                'Tôi đồng ý với điều này.',
                                'Khá hài lòng.',
                                'Tốt.',
                                'Bình thường.',
                                'Có thể cải thiện.'
                            ];
                            return responses[Math.floor(Math.random() * responses.length)];
                    }
                }
                
                async function performRescan() {
                    console.log('QuickFill: Performing rescan...');
                    
                    const textInputs = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"]');
                    for (const input of textInputs) {
                        if (!input.value || input.value.trim() === '') {
                            const question = findQuestionForField(input);
                            const isRequired = isFieldRequired(input);
                            
                            await fillField({
                                type: 'text',
                                question: question,
                                required: isRequired,
                                fieldType: input.type
                            });
                            
                            await sleep(100);
                        }
                    }
                }
                
                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                
                // Helper functions (same as scan script)
                function findAllFormFields() {
                    ${this.generateScanScript().match(/function findAllFormFields\(\) \{[\s\S]*?(?=function findLabelForInput)/)[0]}
                
                function findLabelForInput(input) {
                    if (input.id) {
                        const label = document.querySelector('label[for="' + input.id + '"]');
                        if (label) return label;
                    }
                    
                    const parentLabel = input.closest('label');
                    if (parentLabel) return parentLabel;
                    
                    const siblingLabel = input.parentElement?.querySelector('label');
                    if (siblingLabel) return siblingLabel;
                    
                    return null;
                }
                
                function findQuestionForField(field) {
                    const questionSelectors = [
                        '[data-automation-id="questionTitle"]',
                        '.question-title',
                        '.form-question',
                        'h3', 'h4', 'h5',
                        '[role="heading"]'
                    ];
                    
                    let current = field.parentElement;
                    let attempts = 0;
                    
                    while (current && attempts < 10) {
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
                    const otherKeywords = ['other', 'others', 'another', 'specify', 'khác', 'khác...', 'other...'];
                    const lowerText = text.toLowerCase().trim();
                    return otherKeywords.some(keyword => lowerText.includes(keyword));
                }
                
                function isFieldRequired(field) {
                    const container = field.closest('[data-automation-id="questionContainer"]') || field.parentElement;
                    if (!container) return false;
                    
                    const text = container.textContent || '';
                    return text.includes('*') || text.toLowerCase().includes('required') || text.includes('bắt buộc');
                }
                
                // Start filling
                fillAllFields().catch(error => {
                    console.error('QuickFill: Fill error:', error);
                    window.parent.postMessage({
                        type: 'quickfill-fill-result',
                        data: {
                            success: false,
                            error: error.message
                        }
                    }, '*');
                });
            })();
        `;
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
        this.elements.console.innerHTML = '<div class="log-entry info">Console đã được xóa</div>';
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new QuickFillWebApp();
    
    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'quickfill-fill-result') {
            const app = window.quickFillApp || new QuickFillWebApp();
            
            if (event.data.data.success) {
                app.log(event.data.data.message, 'success');
                app.updateStatus('Hoàn thành', 'success');
            } else {
                app.log(`Lỗi: ${event.data.data.error}`, 'error');
                app.updateStatus('Lỗi điền form', 'error');
            }
        }
    });
});