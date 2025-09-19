// Prevent multiple injections
if (typeof window.quickFillFormsV2Instance !== 'undefined') {
    console.log('⚠️ QuickFill instance already exists, skipping initialization');
} else {

// QuickFill Microsoft Forms v2.1 - Enhanced Content Script
console.log('🚀 QuickFill Microsoft Forms v2.1 loaded');

class QuickFillFormsV2 {
    constructor() {
        this.isRunning = false;
        this.debug = true;
        this.delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
        this.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        this.currentFormData = {};
        this.processedQuestions = new Set(); // Track processed questions per page
        this.setupMessageListener();
        this.log('🎯 QuickFill v2.1 initialized');
    }

    log(message, type = 'info') {
        if (!this.debug) return;
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '🔍';
        console.log(`${prefix} [${timestamp}] QuickFill: ${message}`);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            this.log(`📨 Received message: ${request.action}`);
            this.log(`📋 Message data: ${JSON.stringify(request.data)}`);
            
            switch (request.action) {
                case 'fillForm':
                case 'startFilling':
                    // Handle both action names for compatibility
                    const formData = request.data || request.settings;
                    
                    if (!formData) {
                        this.log('❌ No form data provided', 'error');
                        sendResponse({ success: false, message: 'No form data provided' });
                        break;
                    }
                    
                    this.currentFormData = formData;
                    
                    // Map autoSubmitAnother to autoSubmit for backward compatibility
                    if (this.currentFormData.autoSubmitAnother !== undefined) {
                        this.currentFormData.autoSubmit = this.currentFormData.autoSubmitAnother;
                    }
                    
                    this.log(`🎯 Starting form fill with data: ${JSON.stringify(this.currentFormData)}`);
                    
                    // Debug rating settings
                    this.log(`🎯 Rating settings - Min: ${this.currentFormData.ratingMin}, Max: ${this.currentFormData.ratingMax}`);
                    
                    const result = await this.startFilling();
                    this.log(`📊 Fill result: ${JSON.stringify(result)}`);
                    sendResponse({ success: result.success, message: result.message });
                    break;
                
                case 'stopFilling':
                    this.isRunning = false;
                    this.log('🛑 Form filling stopped by user');
                    sendResponse({ success: true, message: 'Filling stopped' });
                    break;
                
                case 'ping':
                    sendResponse({ success: true, message: 'Content script is active' });
                    break;
                
                default:
                    sendResponse({ success: false, message: 'Unknown action' });
            }
        } catch (error) {
            this.log(`Error handling message: ${error.message}`, 'error');
            sendResponse({ success: false, message: error.message });
        }
    }

    async startFilling() {
        if (this.isRunning) {
            this.log('⚠️ Form filling already in progress', 'warning');
            return { success: false, message: 'Already running' };
        }

        try {
            this.isRunning = true;
            this.log('🚀 Starting form filling process...');
            this.log(`📋 Form data received: ${JSON.stringify(this.currentFormData)}`);
            
            // Validate we're on a Microsoft Forms page
            const isValid = this.isValidFormsPage();
            this.log(`🔍 Page validation result: ${isValid}`);
            
            if (!isValid) {
                throw new Error('Not a valid Microsoft Forms page. Current URL: ' + window.location.href);
            }

            let cycleCount = 0;
            // Handle different property names from popup settings
            const maxCycles = this.currentFormData.repeatCount || 
                            this.currentFormData.maxFormSubmissions || 
                            1;
            
            this.log(`🎯 Max cycles configured: ${maxCycles} (repeatCount=${this.currentFormData.repeatCount}, maxFormSubmissions=${this.currentFormData.maxFormSubmissions})`);
            
            // If maxFormSubmissions is 0, it means unlimited, so set a reasonable limit
            const effectiveMaxCycles = (maxCycles === 0) ? 100 : maxCycles;
            
            while (cycleCount < effectiveMaxCycles && this.isRunning) {
                this.log(`🔄 Starting fill cycle ${cycleCount + 1}/${effectiveMaxCycles}`);
                
                const fillResult = await this.fillCurrentForm();
                if (!fillResult) {
                    throw new Error('Form filling failed');
                }
                
                cycleCount++;
                
                // If this is not the last cycle, try to submit another response
                if (cycleCount < effectiveMaxCycles && this.currentFormData.autoSubmit) {
                    this.log('🔄 Attempting to submit another response...');
                    const submitAnotherResult = await this.clickSubmitAnother();
                    
                    if (!submitAnotherResult) {
                        this.log('⚠️ Could not click "Submit another response", stopping cycles');
                        break;
                    }
                    
                    // Wait for new form to load after clicking submit another
                    this.log('⏳ Waiting for new form to load...');
                    await this.waitForFormToLoad();
                }
            }
            
            this.log(`✅ Completed ${cycleCount} form filling cycles`);
            return { success: true, message: `Completed ${cycleCount} cycles successfully` };
            
        } catch (error) {
            this.log(`❌ Form filling error: ${error.message}`, 'error');
            return { success: false, message: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    isValidFormsPage() {
        const validDomains = [
            'forms.office.com',
            'forms.microsoft.com',
            'forms.office365.com',
            'forms.cloud.microsoft'
        ];
        
        const currentDomain = window.location.hostname;
        const isValid = validDomains.some(domain => currentDomain.includes(domain));
        
        this.log(`🔍 Page validation: ${currentDomain} - ${isValid ? 'Valid' : 'Invalid'}`);
        return isValid;
    }

    async fillCurrentForm() {
        try {
            this.log('📝 Starting form fill process...');
            this.log(`🌐 Current URL: ${window.location.href}`);
            this.log(`📄 Document ready state: ${document.readyState}`);
            
            // Wait for form to be fully loaded
            this.log('⏳ Waiting for form to load...');
            await this.waitForFormLoad();
            
            // Get all questions
            this.log('🔍 Searching for questions...');
            const questions = await this.getAllQuestions();
            this.log(`📋 Found ${questions.length} questions to process`);
            
            if (questions.length === 0) {
                this.log('❌ No questions found. Analyzing page structure...', 'error');
                this.logPageStructure();
                throw new Error('No questions found on the form. Check if the page has loaded correctly.');
            }
            
            // Fill each question
            for (let i = 0; i < questions.length; i++) {
                if (!this.isRunning) break;
                
                const question = questions[i];
                this.log(`📝 Processing question ${i + 1}/${questions.length}: ${question.type}`);
                
                await this.fillQuestion(question);
                await this.delay(300, 800); // Random delay between questions
            }
            
            // After filling all questions on current page, check for navigation
            this.log('🔍 All questions filled, checking for navigation options...');
            const navigationResult = await this.proceedToNext();
            
            if (navigationResult.success) {
                if (navigationResult.type === 'next') {
                    this.log('📄 Successfully navigated to next page');
                    
                    // Reset state for new page
                    await this.resetPageState();
                    
                    // Continue filling on new page (recursive call)
                    this.log('🔄 Continuing form fill on new page...');
                    return await this.fillCurrentForm();
                    
                } else if (navigationResult.type === 'submit') {
                    this.log('🎉 Form submitted successfully');
                    return true;
                }
            } else {
                // No navigation buttons found - try manual submit if auto-submit enabled
                if (this.currentFormData.autoSubmit) {
                    this.log('📤 No navigation buttons found, attempting manual submit...');
                    try {
                        await this.submitForm();
                        return true;
                    } catch (submitError) {
                        this.log(`⚠️ Manual submit failed: ${submitError.message}`, 'warning');
                        this.log('ℹ️ Form may be complete or require manual intervention');
                        return true; // Consider it successful since questions were filled
                    }
                } else {
                    this.log('ℹ️ Auto-submit disabled, form filling complete');
                    return true;
                }
            }
            
            return true;
            
        } catch (error) {
            this.log(`❌ Error in form filling loop: ${error.message}`, 'error');
            throw error;
        }
    }

    async waitForFormLoad() {
        this.log('⏳ Waiting for form to load...');
        
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds max wait
        
        while (attempts < maxAttempts) {
            const questions = document.querySelectorAll('[role="radiogroup"], [data-automation-id="questionItem"], input[type="radio"], input[type="checkbox"]');
            
            this.log(`🔄 Attempt ${attempts + 1}/${maxAttempts}: Found ${questions.length} form elements`);
            
            if (questions.length > 0) {
                this.log(`✅ Form loaded with ${questions.length} interactive elements`);
                await this.sleep(1000); // Extra wait for full rendering
                return;
            }
            
            // Check if page is still loading
            if (document.readyState !== 'complete') {
                this.log(`📄 Document still loading... (${document.readyState})`);
            }
            
            await this.sleep(500);
            attempts++;
        }
        
        this.log('⚠️ Form load timeout - analyzing current page state', 'warning');
        this.logPageStructure();
    }

    async getAllQuestions() {
        // Try multiple selectors to find questions
        const questionSelectors = [
            '[data-automation-id="questionItem"]',
            '[role="radiogroup"]',
            '.office-form-question',
            '.question-title-container',
            '[data-automation-id="choiceGroupView"]'
        ];
        
        let allQuestions = [];
        
        for (const selector of questionSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (!allQuestions.some(q => q.element === element)) {
                    const questionType = this.identifyQuestionType(element);
                    if (questionType) {
                        allQuestions.push({
                            element: element,
                            type: questionType,
                            index: allQuestions.length
                        });
                    }
                }
            }
        }
        
        // Remove duplicates and sort by DOM position
        allQuestions = allQuestions.filter((question, index, self) => 
            index === self.findIndex(q => q.element === question.element)
        );
        
        // Filter out already processed questions for current page
        const unprocessedQuestions = allQuestions.filter(question => {
            const questionId = this.generateQuestionId(question.element);
            const isProcessed = this.processedQuestions.has(questionId);
            if (isProcessed) {
                this.log(`⏭️ Skipping already processed question: ${questionId}`);
            }
            return !isProcessed;
        });
        
        this.log(`📊 Found ${allQuestions.length} total questions, ${unprocessedQuestions.length} unprocessed`);
        
        return unprocessedQuestions;
    }

    generateQuestionId(element) {
        // Generate unique ID for question tracking across pages
        const titleElement = element.querySelector('[data-automation-id="questionTitle"]');
        const questionText = titleElement ? titleElement.textContent.trim() : '';
        
        // Use element ID if available, otherwise use question text hash
        if (element.id) {
            return element.id;
        } else if (questionText) {
            // Create simple hash from question text
            let hash = 0;
            for (let i = 0; i < questionText.length; i++) {
                const char = questionText.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return `question_${Math.abs(hash)}`;
        } else {
            // Fallback: use element position and attributes
            const xpath = this.getElementXPath(element);
            return `question_xpath_${xpath.slice(-20)}`;
        }
    }

    getElementXPath(element) {
        // Simple XPath generation for element identification
        const parts = [];
        let current = element;
        
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
                selector += `[@id="${current.id}"]`;
                parts.unshift(selector);
                break;
            } else if (current.className) {
                selector += `[@class="${current.className.replace(/\s+/g, ' ').trim()}"]`;
            }
            
            // Add position if needed to make unique
            const siblings = Array.from(current.parentNode?.children || []);
            const sameTagSiblings = siblings.filter(sibling => sibling.tagName === current.tagName);
            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(current) + 1;
                selector += `[${index}]`;
            }
            
            parts.unshift(selector);
            current = current.parentNode;
            
            // Limit depth to avoid overly long XPaths
            if (parts.length > 5) break;
        }
        
        return parts.join('/');
    }

    identifyQuestionType(element) {
        // Multiple choice (radio buttons)
        if (element.querySelector('input[type="radio"]') || element.getAttribute('role') === 'radiogroup') {
            return 'radio';
        }
        
        // Checkboxes
        if (element.querySelector('input[type="checkbox"]')) {
            return 'checkbox';
        }
        
        // Text input
        if (element.querySelector('input[type="text"], textarea')) {
            return 'text';
        }
        
        // Rating/Likert scale
        if (element.querySelector('[role="slider"], .rating-component')) {
            return 'rating';
        }
        
        // Dropdown
        if (element.querySelector('select')) {
            return 'select';
        }
        
        // Matrix/Grid questions (Likert scale tables)
        if (element.querySelector('table, .matrix-table, tr[role="radiogroup"], .likert-table')) {
            return 'matrix';
        }
        
        // Check for multiple rows of radio buttons (Likert-style without table)
        const radioRows = element.querySelectorAll('[role="radiogroup"]');
        if (radioRows.length > 1) {
            return 'matrix';
        }
        
        return null;
    }

    async fillQuestion(question) {
        try {
            this.log(`🎯 Filling ${question.type} question (index: ${question.index})`);
            
            switch (question.type) {
                case 'radio':
                    await this.fillRadioQuestion(question);
                    break;
                case 'checkbox':
                    await this.fillCheckboxQuestion(question);
                    break;
                case 'text':
                    await this.fillTextQuestion(question);
                    break;
                case 'rating':
                    await this.fillRatingQuestion(question);
                    break;
                case 'select':
                    await this.fillSelectQuestion(question);
                    break;
                case 'matrix':
                    await this.fillMatrixQuestion(question);
                    break;
                default:
                    this.log(`⚠️ Unknown question type: ${question.type}`, 'warning');
            }
            
            // Mark question as processed after successful fill
            const questionId = this.generateQuestionId(question.element);
            this.processedQuestions.add(questionId);
            this.log(`✅ Question marked as processed: ${questionId}`);
            
            await this.delay(200, 500);
            
        } catch (error) {
            this.log(`❌ Error filling question: ${error.message}`, 'error');
            
            // Still mark as processed to avoid infinite loops on problematic questions
            const questionId = this.generateQuestionId(question.element);
            this.processedQuestions.add(questionId);
            this.log(`⚠️ Question marked as processed despite error: ${questionId}`);
        }
    }

    async fillRadioQuestion(question) {
        const radioInputs = question.element.querySelectorAll('input[type="radio"]');
        
        if (radioInputs.length === 0) {
            this.log('⚠️ No radio inputs found', 'warning');
            return;
        }
        
        this.log(`📊 Found ${radioInputs.length} radio options`);
        
        // Get user preferences for this question
        const customChoice = this.getCustomChoiceForQuestion(question);
        
        let selectedInput = null;
        
        if (customChoice) {
            // Try to find exact match first
            selectedInput = Array.from(radioInputs).find(input => {
                const label = this.getInputLabel(input);
                return label && label.toLowerCase().includes(customChoice.toLowerCase());
            });
            
            if (selectedInput) {
                this.log(`🎯 Found custom choice match: "${customChoice}"`);
            }
        }
        
        // If no custom choice found, use selection strategy
        if (!selectedInput) {
            // Check multiple possible strategy keys from different versions
            let strategy = this.currentFormData.selectionStrategy || this.currentFormData.radioStrategy || 'random';
            
            // If avoidOther is explicitly set to true, override the strategy
            if (this.currentFormData.avoidOther === true) {
                strategy = 'avoid_other';
                this.log(`🎯 Overriding strategy to 'avoid_other' due to avoidOther=true`);
            }
                           
            this.log(`🎯 Using selection strategy: ${strategy}`);
            this.log(`📋 Available strategies from form data: selectionStrategy=${this.currentFormData.selectionStrategy}, radioStrategy=${this.currentFormData.radioStrategy}, avoidOther=${this.currentFormData.avoidOther}`);
            
            selectedInput = this.selectByStrategy(radioInputs, strategy);
        }
        
        if (selectedInput) {
            await this.selectRadioChoice(selectedInput);
        } else {
            this.log('❌ No suitable radio option found', 'error');
        }
    }

    getCustomChoiceForQuestion(question) {
        // Get the question text to match with custom settings
        const questionText = this.getQuestionText(question.element);
        
        if (!questionText || !this.currentFormData.customFields) {
            return null;
        }
        
        // Look for exact question match in custom fields
        for (const field of this.currentFormData.customFields) {
            if (field.question && questionText.toLowerCase().includes(field.question.toLowerCase())) {
                return field.value;
            }
        }
        
        return null;
    }

    getQuestionText(element) {
        // Try multiple selectors to get question text
        const textSelectors = [
            '.question-title',
            '[data-automation-id="questionTitle"]',
            '.office-form-question-title',
            'h2', 'h3', 'h4',
            '.text-format-content'
        ];
        
        for (const selector of textSelectors) {
            const textElement = element.querySelector(selector);
            if (textElement && textElement.textContent.trim()) {
                return textElement.textContent.trim();
            }
        }
        
        // Fallback: get first meaningful text
        const allText = element.textContent.trim();
        return allText.split('\n')[0] || allText.substring(0, 100);
    }

    selectByStrategy(inputs, strategy) {
        const visibleInputs = Array.from(inputs).filter(this.isElementVisible.bind(this));
        
        this.log(`🔍 selectByStrategy: ${inputs.length} total inputs, ${visibleInputs.length} visible inputs`);
        
        if (visibleInputs.length === 0) {
            this.log('❌ No visible inputs found', 'warning');
            return null;
        }
        
        this.log(`🎯 Applying strategy: ${strategy}`);
        
        let selectedInput = null;
        
        // Check if this looks like a rating/Likert scale question
        const isRatingQuestion = this.isRatingScale(visibleInputs);
        this.log(`🔍 Rating scale detection result: ${isRatingQuestion}`);
        
        if (isRatingQuestion) {
            const settingsMin = this.currentFormData.ratingMin || 4;
            const settingsMax = this.currentFormData.ratingMax || 5;
            this.log(`🎯 Detected rating/Likert scale - using rating strategy with range ${settingsMin}-${settingsMax}`);
            
            selectedInput = this.selectRatingFromInputs(visibleInputs, settingsMin, settingsMax);
            
            if (selectedInput) {
                const selectedRating = Array.from(visibleInputs).indexOf(selectedInput) + 1;
                this.log(`🎯 Selected rating ${selectedRating}/${visibleInputs.length} based on settings`);
            } else {
                this.log('⚠️ Rating selection returned null, falling back to strategy');
            }
        }
        
        // If not a rating question or rating selection failed, use original strategy
        if (!selectedInput) {
            switch (strategy) {
                case 'first':
                    selectedInput = visibleInputs[0];
                    this.log(`🎯 Selected first option: "${this.getInputLabel(selectedInput)}"`);
                    break;
                case 'last':
                    selectedInput = visibleInputs[visibleInputs.length - 1];
                    this.log(`🎯 Selected last option: "${this.getInputLabel(selectedInput)}"`);
                    break;
                case 'middle':
                    selectedInput = visibleInputs[Math.floor(visibleInputs.length / 2)];
                    this.log(`🎯 Selected middle option: "${this.getInputLabel(selectedInput)}"`);
                    break;
                case 'avoid_other':
                    this.log('🔍 Calling selectAvoidingOther...');
                    selectedInput = this.selectAvoidingOther(visibleInputs);
                    break;
                case 'random':
                default:
                    selectedInput = visibleInputs[Math.floor(Math.random() * visibleInputs.length)];
                    this.log(`🎯 Selected random option: "${this.getInputLabel(selectedInput)}"`);
                    break;
            }
        }
        
        if (!selectedInput) {
            this.log('❌ Strategy returned null - no option selected', 'error');
        }
        
        return selectedInput;
    }

    isRatingScale(inputs) {
        if (inputs.length < 3) {
            this.log(`🔍 Not rating scale: too few inputs (${inputs.length})`);
            return false; // Rating scales usually have at least 3 options
        }
        
        // Check if labels are numeric (1, 2, 3, 4, 5) or contain rating-related keywords
        let numericCount = 0;
        let ratingKeywordCount = 0;
        const labelsToCheck = inputs.slice(0, Math.min(5, inputs.length));
        
        this.log(`🔍 Checking ${labelsToCheck.length} inputs for rating scale patterns`);
        
        for (const input of labelsToCheck) {
            const label = this.getInputLabel(input);
            this.log(`🔍 Input label: "${label}"`);
            
            if (label) {
                const cleanLabel = label.trim().toLowerCase();
                
                // Check for pure numeric labels (1, 2, 3, etc.)
                if (/^\d+$/.test(cleanLabel)) {
                    numericCount++;
                    this.log(`📊 Found numeric label: ${cleanLabel}`);
                }
                
                // Check for rating-related keywords
                const ratingKeywords = [
                    'strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree',
                    'rất không đồng ý', 'không đồng ý', 'trung tính', 'đồng ý', 'rất đồng ý',
                    'very dissatisfied', 'dissatisfied', 'satisfied', 'very satisfied',
                    'rất không hài lòng', 'không hài lòng', 'hài lòng', 'rất hài lòng',
                    'never', 'rarely', 'sometimes', 'often', 'always',
                    'không bao giờ', 'hiếm khi', 'thỉnh thoảng', 'thường xuyên', 'luôn luôn',
                    'poor', 'fair', 'good', 'very good', 'excellent',
                    'kém', 'tạm được', 'tốt', 'rất tốt', 'xuất sắc'
                ];
                
                const matchedKeyword = ratingKeywords.find(keyword => cleanLabel.includes(keyword));
                if (matchedKeyword) {
                    ratingKeywordCount++;
                    this.log(`🔍 Found rating keyword: "${matchedKeyword}" in "${cleanLabel}"`);
                }
            }
        }
        
        // It's a rating scale if:
        // 1. Most labels are numeric (like 1, 2, 3, 4, 5)
        // 2. Contains rating-related keywords in sequence
        const isNumericScale = numericCount >= Math.min(3, inputs.length * 0.6);
        const hasRatingKeywords = ratingKeywordCount >= Math.min(2, inputs.length * 0.4);
        
        const isRating = isNumericScale || hasRatingKeywords;
        
        this.log(`🔍 Rating scale analysis: numeric=${numericCount}/${inputs.length} (threshold: ${Math.min(3, inputs.length * 0.6)}), keywords=${ratingKeywordCount}/${inputs.length} (threshold: ${Math.min(2, inputs.length * 0.4)})`);
        this.log(`🎯 Final rating scale result: ${isRating} (numeric: ${isNumericScale}, keywords: ${hasRatingKeywords})`);
        
        return isRating;
    }

    selectAvoidingOther(inputs) {
        // Try to avoid "Other", "Khác", "N/A" options using multiple methods
        const avoidKeywords = ['other', 'khác', 'n/a', 'không có', 'không', 'none', 'khác (xin ghi rõ)', 'specify', 'chi tiết'];
        
        this.log(`🔍 Analyzing ${inputs.length} inputs to avoid "other" options`);
        
        const preferredInputs = inputs.filter(input => {
            const label = this.getInputLabel(input).toLowerCase();
            
            // Method 1: Check label text
            const hasOtherKeyword = avoidKeywords.some(keyword => label.includes(keyword));
            
            // Method 2: Check if this is likely an "Other" option by DOM structure
            let isLikelyOther = false;
            
            // Check if there's a text input nearby (common for "Other" options)
            const parent = input.parentElement;
            const hasTextInput = parent && (
                parent.querySelector('input[type="text"]') ||
                parent.querySelector('textarea') ||
                parent.nextElementSibling?.querySelector('input[type="text"]') ||
                parent.nextElementSibling?.querySelector('textarea')
            );
            
            // Check for common "Other" attributes or classes
            const hasOtherAttributes = 
                input.value?.toLowerCase().includes('other') ||
                input.id?.toLowerCase().includes('other') ||
                input.className?.toLowerCase().includes('other') ||
                parent?.className?.toLowerCase().includes('other');
            
            // Check if this is the last option (often "Other" is placed last)
            const allInputsInGroup = inputs;
            const isLastOption = allInputsInGroup.indexOf(input) === allInputsInGroup.length - 1;
            
            isLikelyOther = hasTextInput || hasOtherAttributes || (isLastOption && hasOtherKeyword);
            
            const shouldAvoid = hasOtherKeyword || isLikelyOther;
            
            this.log(`📋 Option: "${label}" - Text:${hasOtherKeyword ? 'OTHER' : 'OK'}, Structure:${isLikelyOther ? 'OTHER' : 'OK'} -> ${shouldAvoid ? 'AVOIDED' : 'OK'}`);
            
            return !shouldAvoid;
        });
        
        this.log(`✅ Found ${preferredInputs.length} preferred options out of ${inputs.length} total`);
        
        if (preferredInputs.length > 0) {
            const selected = preferredInputs[Math.floor(Math.random() * preferredInputs.length)];
            this.log(`🎯 Selected preferred option: "${this.getInputLabel(selected)}"`);
            return selected;
        }
        
        // If all options are flagged as "other", select the first non-last option
        this.log(`⚠️ All options flagged as "other", trying to select non-last option...`);
        if (inputs.length > 1) {
            // Select from first n-1 options (avoid the last one which is most likely "Other")
            const nonLastOptions = inputs.slice(0, -1);
            const selected = nonLastOptions[Math.floor(Math.random() * nonLastOptions.length)];
            this.log(`🎯 Selected non-last option: "${this.getInputLabel(selected)}"`);
            return selected;
        }
        
        // Last resort - pick randomly
        const selected = inputs[Math.floor(Math.random() * inputs.length)];
        this.log(`⚠️ Last resort random selection: "${this.getInputLabel(selected)}"`);
        return selected;
    }

    getInputLabel(input) {
        let labelText = '';
        
        // Method 1: Check aria-label first
        labelText = input.getAttribute('aria-label');
        if (labelText && labelText.trim()) {
            return labelText.trim();
        }
        
        // Method 2: Try closest label element
        const labelElement = input.closest('label');
        if (labelElement) {
            labelText = labelElement.textContent.trim();
            if (labelText) return labelText;
        }
        
        // Method 3: Try label[for] association
        if (input.id) {
            const associatedLabel = document.querySelector(`label[for="${input.id}"]`);
            if (associatedLabel) {
                labelText = associatedLabel.textContent.trim();
                if (labelText) return labelText;
            }
        }
        
        // Method 4: Microsoft Forms specific - look for span siblings
        const parent = input.parentElement;
        if (parent) {
            // Look for span elements with text content
            const spans = parent.querySelectorAll('span');
            for (const span of spans) {
                const text = span.textContent.trim();
                if (text && text !== input.value && !span.contains(input)) {
                    labelText = text;
                    break;
                }
            }
            if (labelText) return labelText;
        }
        
        // Method 5: Try parent's text content (excluding input)
        if (parent) {
            let parentText = parent.textContent.trim();
            // Remove input value from parent text if it exists
            if (input.value) {
                parentText = parentText.replace(input.value, '').trim();
            }
            if (parentText) {
                labelText = parentText;
            }
        }
        
        // Method 6: Look in grandparent or higher ancestors
        let ancestor = parent?.parentElement;
        let attempts = 0;
        while (ancestor && attempts < 3 && !labelText) {
            const ancestorSpans = ancestor.querySelectorAll('span');
            for (const span of ancestorSpans) {
                const text = span.textContent.trim();
                if (text && 
                    text !== input.value && 
                    !span.contains(input) && 
                    text.length > 1 && 
                    text.length < 200) { // Reasonable text length
                    labelText = text;
                    break;
                }
            }
            ancestor = ancestor.parentElement;
            attempts++;
        }
        
        // Method 7: Try div siblings with text
        if (!labelText && parent) {
            const siblings = Array.from(parent.parentElement?.children || []);
            for (const sibling of siblings) {
                if (sibling !== parent && sibling.textContent.trim() && !sibling.contains(input)) {
                    const text = sibling.textContent.trim();
                    if (text.length > 1 && text.length < 200) {
                        labelText = text;
                        break;
                    }
                }
            }
        }
        
        // Method 8: Last resort - use input value or placeholder
        if (!labelText) {
            labelText = input.value || input.placeholder || input.getAttribute('title') || '';
        }
        
        // Clean up the label text
        if (labelText) {
            labelText = labelText.trim();
            // Remove common artifacts
            labelText = labelText.replace(/^\s*\|\s*/, '').trim(); // Remove leading |
            labelText = labelText.replace(/\s+/g, ' '); // Normalize whitespace
        }
        
        return labelText || 'Unknown Option';
    }

    async selectRadioChoice(input) {
        try {
            this.log(`🎯 Selecting radio choice: "${this.getInputLabel(input)}"`);
            
            // Scroll into view
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(300);
            
            // Try multiple click methods
            const clickMethods = [
                () => input.click(),
                () => input.focus() && input.click(),
                () => {
                    const label = input.closest('label') || input.parentElement;
                    if (label) label.click();
                },
                () => input.dispatchEvent(new MouseEvent('click', { bubbles: true })),
                () => {
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                },
                () => {
                    const parent = input.closest('[role="radio"]');
                    if (parent) parent.click();
                }
            ];
            
            for (let i = 0; i < clickMethods.length; i++) {
                try {
                    this.log(`🔄 Trying click method ${i + 1}`);
                    clickMethods[i]();
                    await this.sleep(200);
                    
                    if (input.checked) {
                        this.log(`✅ Successfully selected radio option using method ${i + 1}`);
                        return true;
                    }
                } catch (error) {
                    this.log(`⚠️ Click method ${i + 1} failed: ${error.message}`);
                }
            }
            
            this.log('❌ All click methods failed for radio selection', 'error');
            return false;
            
        } catch (error) {
            this.log(`❌ Error selecting radio choice: ${error.message}`, 'error');
            return false;
        }
    }

    async fillCheckboxQuestion(question) {
        const checkboxInputs = question.element.querySelectorAll('input[type="checkbox"]');
        
        if (checkboxInputs.length === 0) {
            this.log('⚠️ No checkbox inputs found', 'warning');
            return;
        }
        
        this.log(`☑️ Found ${checkboxInputs.length} checkbox options`);
        
        // For checkboxes, we can select multiple options
        const maxSelections = Math.min(
            checkboxInputs.length,
            this.currentFormData.maxCheckboxSelections || Math.ceil(checkboxInputs.length / 2)
        );
        
        const numToSelect = Math.floor(Math.random() * maxSelections) + 1;
        const shuffled = Array.from(checkboxInputs).sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numToSelect; i++) {
            await this.selectCheckboxChoice(shuffled[i]);
            await this.delay(200, 400);
        }
    }

    async selectCheckboxChoice(input) {
        try {
            this.log(`☑️ Selecting checkbox: "${this.getInputLabel(input)}"`);
            
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(200);
            
            input.click();
            await this.sleep(100);
            
            if (input.checked) {
                this.log('✅ Checkbox selected successfully');
            } else {
                this.log('⚠️ Checkbox selection may have failed');
            }
            
        } catch (error) {
            this.log(`❌ Error selecting checkbox: ${error.message}`, 'error');
        }
    }

    async fillTextQuestion(question) {
        const textInputs = question.element.querySelectorAll('input[type="text"], textarea');
        
        if (textInputs.length === 0) {
            this.log('⚠️ No text inputs found', 'warning');
            return;
        }
        
        for (const input of textInputs) {
            const customText = this.getCustomTextForQuestion(question) || 
                             this.generateRandomText(input);
            
            await this.fillTextInput(input, customText);
            await this.delay(200, 400);
        }
    }

    getCustomTextForQuestion(question) {
        const questionText = this.getQuestionText(question.element);
        
        if (!questionText || !this.currentFormData.customFields) {
            return null;
        }
        
        for (const field of this.currentFormData.customFields) {
            if (field.question && questionText.toLowerCase().includes(field.question.toLowerCase())) {
                return field.value;
            }
        }
        
        return null;
    }

    generateRandomText(input) {
        const placeholder = input.placeholder || input.getAttribute('aria-label') || '';
        
        // Generate appropriate text based on input type or placeholder
        if (placeholder.toLowerCase().includes('email')) {
            return `user${Math.floor(Math.random() * 1000)}@example.com`;
        } else if (placeholder.toLowerCase().includes('phone')) {
            return `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        } else if (placeholder.toLowerCase().includes('name')) {
            const names = ['Nguyen Van A', 'Tran Thi B', 'Le Van C', 'Pham Thi D'];
            return names[Math.floor(Math.random() * names.length)];
        } else {
            return `Sample text ${Math.floor(Math.random() * 1000)}`;
        }
    }

    async fillTextInput(input, text) {
        try {
            this.log(`📝 Filling text input with: "${text}"`);
            
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(200);
            
            input.focus();
            input.value = '';
            await this.sleep(100);
            
            // Type character by character for more natural behavior
            for (const char of text) {
                input.value += char;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await this.sleep(50);
            }
            
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.blur();
            
            this.log('✅ Text input filled successfully');
            
        } catch (error) {
            this.log(`❌ Error filling text input: ${error.message}`, 'error');
        }
    }

    async fillRatingQuestion(question) {
        const ratingElements = question.element.querySelectorAll('[role="slider"], .rating-component input, .rating-scale input');
        
        if (ratingElements.length === 0) {
            this.log('⚠️ No rating elements found', 'warning');
            return;
        }
        
        for (const ratingElement of ratingElements) {
            await this.setRatingValue(ratingElement);
            await this.delay(200, 400);
        }
    }

    async setRatingValue(element) {
        try {
            const elementMin = parseInt(element.getAttribute('aria-valuemin') || '1');
            const elementMax = parseInt(element.getAttribute('aria-valuemax') || '5');
            
            // Use settings from popup for rating range
            const settingsMin = this.currentFormData.ratingMin || 4;
            const settingsMax = this.currentFormData.ratingMax || 5;
            
            this.log(`🎯 Rating settings loaded - Min: ${settingsMin}, Max: ${settingsMax}`);
            this.log(`📊 Element bounds - Min: ${elementMin}, Max: ${elementMax}`);
            
            // Make sure the settings range is within element bounds
            const actualMin = Math.max(elementMin, settingsMin);
            const actualMax = Math.min(elementMax, settingsMax);
            
            // If settings range is invalid, use element range
            const finalMin = actualMin <= actualMax ? actualMin : elementMin;
            const finalMax = actualMin <= actualMax ? actualMax : elementMax;
            
            // Generate weighted random value favoring higher ratings
            let selectedValue;
            if (finalMin === finalMax) {
                selectedValue = finalMin;
            } else {
                // Weighted selection favoring higher values
                const range = finalMax - finalMin + 1;
                const weights = [];
                for (let i = 0; i < range; i++) {
                    weights.push(Math.pow(2, i + 1)); // Exponential weight favoring higher values
                }
                const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let i = weights.length - 1; i >= 0; i--) {
                    random -= weights[i];
                    if (random <= 0) {
                        selectedValue = finalMax - i;
                        break;
                    }
                }
                
                if (!selectedValue) {
                    selectedValue = finalMax; // fallback to highest
                }
            }
            
            this.log(`⭐ Setting rating to: ${selectedValue}/${elementMax} (range: ${finalMin}-${finalMax}, settings: ${settingsMin}-${settingsMax})`);
            
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(200);
            
            if (element.tagName === 'INPUT') {
                element.value = selectedValue;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                element.setAttribute('aria-valuenow', selectedValue);
                element.click();
            }
            
            this.log('✅ Rating set successfully');
            
        } catch (error) {
            this.log(`❌ Error setting rating: ${error.message}`, 'error');
        }
    }

    async fillSelectQuestion(question) {
        const selectElements = question.element.querySelectorAll('select');
        
        if (selectElements.length === 0) {
            this.log('⚠️ No select elements found', 'warning');
            return;
        }
        
        for (const select of selectElements) {
            await this.selectRandomOption(select);
            await this.delay(200, 400);
        }
    }

    async selectRandomOption(select) {
        try {
            const options = Array.from(select.options).filter(option => option.value && option.value !== '');
            
            if (options.length === 0) {
                this.log('⚠️ No valid options found in select', 'warning');
                return;
            }
            
            const randomOption = options[Math.floor(Math.random() * options.length)];
            
            this.log(`🔽 Selecting option: "${randomOption.text}"`);
            
            select.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(200);
            
            select.value = randomOption.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            this.log('✅ Select option chosen successfully');
            
        } catch (error) {
            this.log(`❌ Error selecting option: ${error.message}`, 'error');
        }
    }

    async fillMatrixQuestion(question) {
        // Find Likert table rows using multiple selectors like console script
        let matrixRows = question.element.querySelectorAll('tr[role="radiogroup"]');
        
        if (matrixRows.length === 0) {
            // Try alternative row selectors like console script
            matrixRows = question.element.querySelectorAll('tr');
            this.log(`🔍 No radiogroup rows found, trying all tr elements: ${matrixRows.length}`);
            
            // Filter for rows that have radio inputs
            matrixRows = Array.from(matrixRows).filter(row => {
                const radios = row.querySelectorAll('input[type="radio"]');
                return radios.length > 0;
            });
        }
        
        if (matrixRows.length === 0) {
            this.log('⚠️ No matrix rows found', 'warning');
            return;
        }
        
        this.log(`📊 Found ${matrixRows.length} Likert scale rows to fill`);
        
        // Get rating settings from popup
        const settingsMin = this.currentFormData.ratingMin || 4;
        const settingsMax = this.currentFormData.ratingMax || 5;
        
        this.log(`📊 Matrix question rating settings - Min: ${settingsMin}, Max: ${settingsMax}`);
        
        for (const row of matrixRows) {
            try {
                // Get the statement text for this row
                const statementElement = row.querySelector('[data-automation-id="likerStatementTd"]');
                const statementText = statementElement ? statementElement.textContent.trim() : 'Unknown statement';
                
                this.log(`📋 Processing Likert row: ${statementText.substring(0, 60)}...`);
                
                // Find all radio inputs in this row - try multiple selectors like console script
                let radioInputs = row.querySelectorAll('input[type="radio"][data-automation-id="radio"]');
                
                if (radioInputs.length === 0) {
                    // Try alternative selectors
                    radioInputs = row.querySelectorAll('input[type="radio"]');
                    this.log(`🔍 Using fallback selector, found ${radioInputs.length} radio inputs`);
                }
                
                if (radioInputs.length === 0) {
                    this.log(`⚠️ No radio inputs found in row`, 'warning');
                    continue;
                }
                
                this.log(`Found ${radioInputs.length} rating options (1-${radioInputs.length})`);
                
                // Debug: Log all radio inputs found (like console script)
                Array.from(radioInputs).forEach((radio, index) => {
                    const value = radio.value;
                    const automationValue = radio.getAttribute('data-automation-value');
                    const ariaLabel = radio.getAttribute('aria-label');
                    this.log(`   Radio ${index + 1}: value="${value}", automation-value="${automationValue}", aria-label="${ariaLabel}"`);
                });
                
                // Use position-based selection like console script
                const selectedInput = this.selectRatingFromInputsPositional(radioInputs, settingsMin, settingsMax);
                
                if (selectedInput) {
                    // Get display information
                    const ariaLabel = selectedInput.getAttribute('aria-label');
                    const value = selectedInput.value;
                    const automationValue = selectedInput.getAttribute('data-automation-value');
                    const displayValue = ariaLabel || value || automationValue || 'unknown';
                    const actualPosition = ariaLabel ? `position ${ariaLabel}` : `value ${value}`;
                    
                    this.log(`🎯 Selecting rating: ${displayValue} (${actualPosition}) for "${statementText.substring(0, 40)}..."`);
                    
                    // Use comprehensive click method like console script
                    const success = await this.selectRadioInputComprehensive(selectedInput);
                    
                    if (success) {
                        this.log(`✅ Successfully selected: ${displayValue}`);
                    } else {
                        this.log(`❌ Failed to select: ${displayValue}`, 'error');
                    }
                } else {
                    this.log(`❌ No suitable rating found for row`, 'error');
                }
                
                await this.delay(200, 400);
                
            } catch (error) {
                this.log(`❌ Error processing Likert row: ${error.message}`, 'error');
            }
        }
    }

    selectRatingFromInputsPositional(inputs, settingsMin, settingsMax) {
        if (inputs.length === 0) return null;
        
        this.log(`🔍 Analyzing rating structure for range ${settingsMin}-${settingsMax}:`);
        
        let targetInputs = [];
        
        // Method 1: Position-based selection (most reliable like console script)
        const ariaLabelInputs = Array.from(inputs).filter(input => {
            const position = parseInt(input.getAttribute('aria-label'));
            if (!isNaN(position)) {
                // For 5-point scale, select last 2 positions (4-5) as they represent highest ratings
                const totalPositions = inputs.length;
                const minHighPosition = totalPositions - 1; // Position 4 for 5-point scale  
                const maxHighPosition = totalPositions;     // Position 5 for 5-point scale
                const isHighPosition = position >= minHighPosition && position <= maxHighPosition;
                this.log(`   Position method: position=${position}/${totalPositions}, high positions=${minHighPosition}-${maxHighPosition}, selected=${isHighPosition}`);
                return isHighPosition;
            }
            return false;
        });

        // Method 2: Value-based selection (backup)
        const valueInputs = Array.from(inputs).filter(input => {
            const value = parseInt(input.value);
            if (!isNaN(value)) {
                const isTargetValue = value >= settingsMin && value <= settingsMax;
                this.log(`   Value method: value=${value}, target range=${settingsMin}-${settingsMax}, selected=${isTargetValue}`);
                return isTargetValue;
            }
            return false;
        });

        // Method 3: Automation value selection (rarely works)
        const automationInputs = Array.from(inputs).filter(input => {
            const automationValue = parseInt(input.getAttribute('data-automation-value'));
            if (!isNaN(automationValue)) {
                const isTargetValue = automationValue >= settingsMin && automationValue <= settingsMax;
                this.log(`   Automation-value method: value=${automationValue}, target range=${settingsMin}-${settingsMax}, selected=${isTargetValue}`);
                return isTargetValue;
            }
            return false;
        });

        // Choose the best method (prefer position method as it's most reliable)
        if (ariaLabelInputs.length > 0) {
            targetInputs = ariaLabelInputs;
            this.log(`🎯 Using position method: Found ${targetInputs.length} high rating options`);
        } else if (valueInputs.length > 0) {
            targetInputs = valueInputs;
            this.log(`🎯 Using value method: Found ${targetInputs.length} high rating options`);
        } else if (automationInputs.length > 0) {
            targetInputs = automationInputs;
            this.log(`🎯 Using automation-value method: Found ${targetInputs.length} high rating options`);
        } else {
            // Fallback: use positional selection (last 2 options for high ratings)
            // For 5-point scale, last 2 positions (4th and 5th) are typically highest
            const totalOptions = inputs.length;
            const highPositionCount = Math.min(2, totalOptions); // Select last 2 or all if less than 2
            targetInputs = Array.from(inputs).slice(-highPositionCount);
            this.log(`📊 Using positional fallback: last ${highPositionCount} out of ${totalOptions} options as high ratings`);
        }

        if (targetInputs.length === 0) {
            this.log(`❌ No suitable rating options found`);
            return null;
        }

        // Weighted selection favoring higher ratings (like console script)
        let selectedInput;
        if (targetInputs.length === 1) {
            selectedInput = targetInputs[0];
        } else {
            // Weighted selection favoring the last option (highest rating)
            const weights = targetInputs.map((_, index) => Math.pow(2, index + 1));
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);  
            let random = Math.random() * totalWeight;
            
            this.log(`🎲 Weighted selection: weights=${weights}, total=${totalWeight}, random=${random}`);

            for (let i = weights.length - 1; i >= 0; i--) {
                random -= weights[i];
                if (random <= 0) {
                    selectedInput = targetInputs[i];
                    break;
                }
            }
            
            if (!selectedInput) {
                selectedInput = targetInputs[targetInputs.length - 1]; // fallback to highest
            }
        }

        return selectedInput;
    }

    async selectRadioInputComprehensive(selectedInput) {
        // Comprehensive radio input selection like console script
        let attempts = 0;
        let success = false;
        const maxAttempts = 3;
        
        while (!success && attempts < maxAttempts) {
            attempts++;
            this.log(`🔄 Attempt ${attempts}/${maxAttempts} for radio input`);
            
            try {
                // Scroll into view
                selectedInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.sleep(200);
                
                // Method 1: Direct radio input manipulation
                this.log(`   Method 1: Direct radio input`);
                selectedInput.checked = true;
                selectedInput.dispatchEvent(new Event('change', { bubbles: true }));
                selectedInput.dispatchEvent(new Event('click', { bubbles: true }));
                
                await this.sleep(200);
                
                // Verify selection
                if (selectedInput.checked) {
                    this.log(`✅ Method 1 successful: direct input manipulation`);
                    success = true;
                } else {
                    this.log(`   Method 1 failed, trying alternatives...`);
                    
                    // Method 2: Click the label wrapper
                    const label = selectedInput.closest('label');
                    if (label) {
                        this.log(`   Method 2: Label click`);
                        label.click();
                        await this.sleep(200);
                        if (selectedInput.checked) {
                            this.log(`✅ Method 2 successful: label click`);
                            success = true;
                        }
                    }
                    
                    // Method 3: Click the span wrapper
                    if (!success) {
                        const span = selectedInput.closest('[data-automation-id="radio"]');
                        if (span) {
                            this.log(`   Method 3: Span wrapper click`);
                            span.click();
                            await this.sleep(200);
                            if (selectedInput.checked) {
                                this.log(`✅ Method 3 successful: span click`);
                                success = true;
                            }
                        }
                    }
                    
                    // Method 4: Click the table cell
                    if (!success) {
                        const td = selectedInput.closest('td');
                        if (td) {
                            this.log(`   Method 4: Table cell click`);
                            td.click();
                            await this.sleep(200);
                            if (selectedInput.checked) {
                                this.log(`✅ Method 4 successful: cell click`);
                                success = true;
                            }
                        }
                    }
                    
                    // Method 5: MouseEvent simulation
                    if (!success) {
                        this.log(`   Method 5: MouseEvent simulation`);
                        const rect = selectedInput.getBoundingClientRect();
                        selectedInput.dispatchEvent(new MouseEvent('mousedown', {
                            bubbles: true,
                            cancelable: true,
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2
                        }));
                        await this.sleep(20);
                        selectedInput.dispatchEvent(new MouseEvent('mouseup', {
                            bubbles: true,
                            cancelable: true,
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2
                        }));
                        selectedInput.dispatchEvent(new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2
                        }));
                        await this.sleep(200);
                        if (selectedInput.checked) {
                            this.log(`✅ Method 5 successful: MouseEvent`);
                            success = true;
                        }
                    }
                }
                
                if (!success && attempts < maxAttempts) {
                    this.log(`⚠️ All methods failed in attempt ${attempts}, retrying...`);
                    await this.sleep(500);
                }
                
            } catch (error) {
                this.log(`❌ Error in attempt ${attempts}: ${error.message}`, 'error');
            }
        }
        
        return success;
    }

    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        // Standard visibility check
        const isStandardVisible = rect.width > 0 && 
                                rect.height > 0 && 
                                style.display !== 'none' && 
                                style.visibility !== 'hidden' && 
                                style.opacity !== '0';
        
        // For radio inputs, they might be hidden but their parent/label is visible
        if (!isStandardVisible && element.type === 'radio') {
            // Check if parent container is visible
            const parent = element.closest('label') || 
                          element.closest('[role="radio"]') || 
                          element.parentElement;
            
            if (parent) {
                const parentRect = parent.getBoundingClientRect();
                const parentStyle = window.getComputedStyle(parent);
                
                const isParentVisible = parentRect.width > 0 && 
                                      parentRect.height > 0 && 
                                      parentStyle.display !== 'none' && 
                                      parentStyle.visibility !== 'hidden' && 
                                      parentStyle.opacity !== '0';
                
                if (isParentVisible) {
                    this.log(`🔍 Radio input hidden but parent is visible: ${this.getInputLabel(element)}`);
                    return true;
                }
            }
        }
        
        if (!isStandardVisible) {
            // Debug info for invisible elements
            this.log(`❌ Element not visible: rect=${rect.width}x${rect.height}, display=${style.display}, visibility=${style.visibility}, opacity=${style.opacity}`, 'warning');
        }
        
        return isStandardVisible;
    }

    async submitForm() {
        this.log('📤 Looking for submit button...');
        
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button[data-automation-id="submitButton"]',
            'button[data-automation-id="questionnaireSubmitButton"]',
            '.submit-button',
            '[role="button"][aria-label*="Submit"]',
            '[role="button"][aria-label*="Gửi"]',
            '[data-automation-id*="submit"]',
            '[data-automation-id*="Submit"]'
        ];
        
        // Also search by text content
        const allButtons = document.querySelectorAll('button, input[type="submit"], [role="button"], div[role="button"]');
        
        let submitButton = null;
        
        this.log(`🔍 Found ${allButtons.length} potential button elements`);
        
        // Try selectors first
        for (const selector of submitSelectors) {
            submitButton = document.querySelector(selector);
            if (submitButton && this.isElementVisible(submitButton)) {
                this.log(`🎯 Found submit button via selector: ${selector}`);
                break;
            }
        }
        
        // If no button found via selectors, search by text
        if (!submitButton) {
            const submitTexts = ['submit', 'gửi', 'send', 'continue', 'tiếp tục', 'hoàn thành'];
            
            for (const button of allButtons) {
                const text = button.textContent.toLowerCase().trim();
                this.log(`🔍 Checking button: "${text}"`);
                
                if (submitTexts.some(submitText => text.includes(submitText)) && 
                    this.isElementVisible(button)) {
                    submitButton = button;
                    this.log(`🎯 Found submit button via text search: "${text}"`);
                    break;
                }
            }
        }
        
        if (!submitButton) {
            throw new Error('Không tìm thấy nút Submit');
        }
        
        try {
            this.log('🚀 Clicking submit button...');
            
            submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(500);
            
            submitButton.click();
            await this.sleep(2000);
            
            this.log('✅ Form submitted successfully');
            return true;
            
        } catch (error) {
            this.log(`❌ Error submitting form: ${error.message}`, 'error');
            throw error;
        }
    }

    async waitForSuccessPage() {
        this.log('⏳ Waiting for form submission success page...');
        
        const maxWait = 10000; // 10 seconds max wait
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            // Look for success indicators
            const successIndicators = [
                'span[data-automation-id="submitAnother"]',
                'div:contains("Your response has been recorded")',
                'div:contains("Phản hồi của bạn đã được ghi lại")',
                '[data-automation-id*="success"]',
                '[data-automation-id*="Success"]'
            ];
            
            for (const selector of successIndicators) {
                const element = document.querySelector(selector);
                if (element && this.isElementVisible(element)) {
                    this.log('✅ Success page loaded, submit another button available');
                    return true;
                }
            }
            
            // Also check if the form questions are no longer visible (indicating success page)
            const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
            if (questions.length === 0) {
                this.log('✅ Form questions disappeared, likely on success page');
                await this.sleep(1000); // Extra wait for success page elements to fully load
                return true;
            }
            
            await this.sleep(500);
        }
        
        this.log('⚠️ Timed out waiting for success page', 'warning');
        return false;
    }

    async waitForFormToLoad() {
        this.log('⏳ Waiting for new form to load...');
        
        const maxWait = 10000; // 10 seconds max wait
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            // Look for form elements that indicate a new form has loaded
            const formIndicators = [
                '[data-automation-id="questionItem"]',
                '[data-automation-id="question"]',
                'div[role="radiogroup"]',
                'input[type="radio"]',
                'div[class*="question"]'
            ];
            
            for (const selector of formIndicators) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    // Make sure at least one element is visible
                    const visibleElements = Array.from(elements).filter(el => this.isElementVisible(el));
                    if (visibleElements.length > 0) {
                        this.log(`✅ New form loaded with ${visibleElements.length} form elements`);
                        await this.sleep(1000); // Extra time for all elements to fully load
                        return true;
                    }
                }
            }
            
            await this.sleep(500);
        }
        
        this.log('⚠️ Timed out waiting for new form to load', 'warning');
        return false;
    }

    async clickSubmitAnother() {
        this.log('🔍 Waiting for success page and "Submit another response" button...');
        
        // Wait for the success page to load after form submission
        await this.waitForSuccessPage();
        
        // Try to find the span with data-automation-id="submitAnother" first
        let submitAnotherSpan = document.querySelector('span[data-automation-id="submitAnother"]');
        
        if (submitAnotherSpan && this.isElementVisible(submitAnotherSpan)) {
            this.log('🎯 Found submit another span element');
            
            // Find the clickable parent - should be div with role="link" and tabindex="0"
            let clickableParent = submitAnotherSpan.closest('div[role="link"][tabindex="0"]');
            
            if (!clickableParent) {
                // Try alternative parent patterns
                clickableParent = submitAnotherSpan.closest('div[tabindex="0"]') ||
                                 submitAnotherSpan.closest('div[role="link"]') ||
                                 submitAnotherSpan.closest('div[class*="-hw-"]') ||
                                 submitAnotherSpan.parentElement;
            }
            
            if (clickableParent && this.isElementVisible(clickableParent)) {
                this.log(`✅ Found clickable parent: ${clickableParent.tagName} with classes: ${clickableParent.className}`);
                return await this.performSubmitAnotherClick(clickableParent);
            } else {
                this.log('⚠️ Clickable parent not found, trying to click span directly');
                return await this.performSubmitAnotherClick(submitAnotherSpan);
            }
        }
        
        // Fallback: Multiple selectors to find the submit another button
        const selectors = [
            'div[class*="-hw-"][tabindex="0"][role="link"] span[data-automation-id="submitAnother"]',
            'div[tabindex="0"][role="link"] span[data-automation-id="submitAnother"]',
            'div[class*="hw-"] span[data-automation-id="submitAnother"]',
            '[data-automation-id="submitAnother"]'
        ];
        
        // Also search by text content
        const textSearches = [
            'Submit another response',
            'Gửi phản hồi khác',
            'Submit another',
            'Gửi thêm'
        ];
        
        // Try selector-based search
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                this.log(`🔍 Found element via selector: ${selector}`);
                
                // If it's the span, get the parent
                let clickableElement = element;
                if (element.tagName === 'SPAN') {
                    clickableElement = element.closest('div[role="link"]') || 
                                     element.closest('div[tabindex="0"]') || 
                                     element.parentElement;
                }
                
                if (!this.isElementClickable(clickableElement)) {
                    // Try parent elements
                    clickableElement = clickableElement.closest('div[role="link"]') || 
                                     clickableElement.closest('div[tabindex="0"]') || 
                                     clickableElement.parentElement;
                }
                
                if (clickableElement && this.isElementVisible(clickableElement)) {
                    this.log(`✅ Found submit another button via selector: ${selector}`);
                    return await this.performSubmitAnotherClick(clickableElement);
                }
            }
        }
        
        // Try text-based search
        const allElements = document.querySelectorAll('div, span, button, a');
        for (const text of textSearches) {
            const element = Array.from(allElements).find(el => 
                el.textContent.toLowerCase().includes(text.toLowerCase()) && 
                this.isElementVisible(el)
            );
            
            if (element) {
                let clickableElement = element;
                if (!this.isElementClickable(element)) {
                    clickableElement = element.closest('div[role="link"]') || 
                                     element.closest('div[tabindex="0"]') || 
                                     element.parentElement;
                }
                
                if (clickableElement && this.isElementVisible(clickableElement)) {
                    this.log(`✅ Found submit another button via text: "${text}"`);
                    return await this.performSubmitAnotherClick(clickableElement);
                }
            }
        }
        
        this.log('❌ Submit another response button not found', 'warning');
        return false;
    }

    // Multi-page form navigation functions
    async proceedToNext() {
        this.log('🔍 Looking for navigation buttons (Next/Submit)...');
        
        // Priority order: Next button first, then Submit button
        const buttonSelectors = [
            { selector: '[data-automation-id="nextButton"]', type: 'next' },
            { selector: 'button[aria-label*="Next"]', type: 'next' },
            { selector: 'button[aria-label*="Tiếp"]', type: 'next' },
            { selector: '[data-automation-id="submitButton"]', type: 'submit' },
            { selector: 'button[type="submit"]', type: 'submit' },
            { selector: 'button[aria-label*="Submit"]', type: 'submit' },
            { selector: 'button[aria-label*="Gửi"]', type: 'submit' },
            { selector: 'button[data-automation-id="questionnaireSubmitButton"]', type: 'submit' }
        ];
        
        // Also search by text content
        const textSearches = [
            { text: 'Next', type: 'next' },
            { text: 'Tiếp', type: 'next' },
            { text: 'Continue', type: 'next' },
            { text: 'Tiếp tục', type: 'next' },
            { text: 'Submit', type: 'submit' },
            { text: 'Gửi', type: 'submit' },
            { text: 'Hoàn thành', type: 'submit' },
            { text: 'Send', type: 'submit' }
        ];
        
        // First try selector-based search
        for (const { selector, type } of buttonSelectors) {
            const button = document.querySelector(selector);
            if (button && this.isElementClickable(button)) {
                this.log(`🎯 Found ${type} button via selector: "${selector}" - "${button.textContent.trim()}"`);
                return await this.clickNavigationButton(button, type);
            }
        }
        
        // Then try text-based search on all buttons
        const allButtons = document.querySelectorAll('button, input[type="submit"], [role="button"]');
        for (const { text, type } of textSearches) {
            const button = Array.from(allButtons).find(btn => 
                btn.textContent.toLowerCase().includes(text.toLowerCase()) && 
                this.isElementClickable(btn)
            );
            
            if (button) {
                this.log(`🎯 Found ${type} button via text: "${text}" - "${button.textContent.trim()}"`);
                return await this.clickNavigationButton(button, type);
            }
        }
        
        this.log('❌ No navigation buttons found - form may be complete or have issues', 'warning');
        return { success: false, type: 'none' };
    }

    async clickNavigationButton(button, type) {
        try {
            this.log(`🎯 Clicking ${type} button: "${button.textContent.trim()}"`);
            
            // Scroll to button and wait
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(500);
            
            // Click the button
            const clickSuccess = await this.performClick(button);
            if (!clickSuccess) {
                this.log(`❌ Failed to click ${type} button`, 'error');
                return { success: false, type: type };
            }
            
            if (type === 'next') {
                this.log('📄 Navigating to next page...');
                
                // Wait for page transition
                await this.sleep(1500);
                
                // Wait for new page to load properly
                const pageLoaded = await this.waitForFormToLoad();
                if (!pageLoaded) {
                    this.log('⚠️ New page may not have loaded properly', 'warning');
                }
                
                return { success: true, type: 'next' };
                
            } else if (type === 'submit') {
                this.log('🎉 Form submitted successfully!', 'success');
                
                // Wait for submission to complete
                await this.sleep(2000);
                
                return { success: true, type: 'submit' };
            }
            
        } catch (error) {
            this.log(`❌ Error clicking ${type} button: ${error.message}`, 'error');
            return { success: false, type: type, error: error.message };
        }
        
        return { success: false, type: type };
    }

    async resetPageState() {
        this.log('🔄 Resetting state for new page...');
        
        // Reset processed questions tracking
        this.processedQuestions = new Set();
        
        // Reset any other page-specific state if needed
        this.log('✅ Page state reset complete');
    }

    async performClick(element) {
        if (!element) return false;
        
        try {
            this.log(`🖱️ Attempting to click element: ${element.tagName}.${element.className}`);
            
            // Multiple click methods to ensure success
            let success = false;
            
            // Method 1: Direct click
            try {
                element.click();
                await this.sleep(100);
                success = true;
                this.log('✅ Direct click successful');
            } catch (e) {
                this.log(`⚠️ Direct click failed: ${e.message}`);
            }
            
            // Method 2: MouseEvent simulation if direct click failed
            if (!success) {
                try {
                    const rect = element.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    const mouseEvents = ['mousedown', 'mouseup', 'click'];
                    for (const eventType of mouseEvents) {
                        element.dispatchEvent(new MouseEvent(eventType, {
                            bubbles: true,
                            cancelable: true,
                            clientX: centerX,
                            clientY: centerY
                        }));
                        await this.sleep(20);
                    }
                    
                    success = true;
                    this.log('✅ MouseEvent simulation successful');
                } catch (e) {
                    this.log(`⚠️ MouseEvent simulation failed: ${e.message}`);
                }
            }
            
            // Method 3: Focus and keyboard if mouse events failed
            if (!success) {
                try {
                    element.focus();
                    await this.sleep(50);
                    
                    const keyEvents = ['keydown', 'keypress', 'keyup'];
                    for (const eventType of keyEvents) {
                        element.dispatchEvent(new KeyboardEvent(eventType, {
                            key: 'Enter',
                            bubbles: true,
                            cancelable: true
                        }));
                        await this.sleep(20);
                    }
                    
                    success = true;
                    this.log('✅ Keyboard interaction successful');
                } catch (e) {
                    this.log(`⚠️ Keyboard interaction failed: ${e.message}`);
                }
            }
            
            return success;
            
        } catch (error) {
            this.log(`❌ Error performing click: ${error.message}`, 'error');
            return false;
        }
    }

    isElementClickable(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.pointerEvents !== 'none' && 
               !element.disabled && 
               this.isElementVisible(element);
    }

    async performSubmitAnotherClick(element) {
        this.log(`🔄 Attempting to click submit another button: ${element.tagName}.${element.className}`);
        
        // Store the element info for debugging
        const elementInfo = {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            role: element.getAttribute('role'),
            tabindex: element.getAttribute('tabindex'),
            text: element.textContent?.trim()
        };
        
        this.log(`📋 Element info: ${JSON.stringify(elementInfo)}`);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.sleep(500);
        
        // Method 1: Direct click
        try {
            this.log('🔄 Method 1: Direct click');
            element.click();
            await this.sleep(1500);
            
            // Check if we're back to the form (indicating success)
            if (this.isBackToForm()) {
                this.log('✅ Submit another successful - back to form');
                return true;
            }
        } catch (error) {
            this.log(`⚠️ Method 1 failed: ${error.message}`);
        }
        
        // Method 2: Mouse event
        try {
            this.log('🔄 Method 2: Mouse event');
            const rect = element.getBoundingClientRect();
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
            element.dispatchEvent(clickEvent);
            await this.sleep(1500);
            
            if (this.isBackToForm()) {
                this.log('✅ Submit another successful via mouse event');
                return true;
            }
        } catch (error) {
            this.log(`⚠️ Method 2 failed: ${error.message}`);
        }
        
        // Method 3: Keyboard activation
        try {
            this.log('🔄 Method 3: Keyboard activation');
            element.focus();
            await this.sleep(200);
            
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(enterEvent);
            await this.sleep(1500);
            
            if (this.isBackToForm()) {
                this.log('✅ Submit another successful via keyboard');
                return true;
            }
        } catch (error) {
            this.log(`⚠️ Method 3 failed: ${error.message}`);
        }
        
        // Method 4: Try clicking child span if exists
        try {
            this.log('🔄 Method 4: Looking for child span element');
            const childSpan = element.querySelector('span[data-automation-id="submitAnother"]');
            if (childSpan) {
                this.log('🎯 Found child span element, clicking it');
                childSpan.click();
                await this.sleep(1500);
                
                if (this.isBackToForm()) {
                    this.log('✅ Submit another successful via child span');
                    return true;
                }
            }
        } catch (error) {
            this.log(`⚠️ Method 4 failed: ${error.message}`);
        }
        
        this.log('❌ All submit another click methods failed');
        return false;
    }
    
    isBackToForm() {
        // Check if we're back to the form by looking for form elements
        const formIndicators = [
            '[data-automation-id="questionItem"]',
            'input[type="radio"]',
            'input[type="checkbox"]',
            'input[type="text"]',
            'textarea',
            'select',
            '.office-form-question',
            '[role="radiogroup"]'
        ];
        
        for (const selector of formIndicators) {
            if (document.querySelector(selector)) {
                return true;
            }
        }
        
        // Also check if we're no longer on a "thank you" or completion page
        const completionIndicators = [
            'Your response has been recorded',
            'Thank you',
            'Cảm ơn bạn',
            'Đã ghi lại phản hồi',
            'response has been submitted'
        ];
        
        const pageText = document.body.textContent?.toLowerCase() || '';
        const hasCompletionText = completionIndicators.some(text => 
            pageText.includes(text.toLowerCase())
        );
        
        return !hasCompletionText;
    }

    logPageStructure() {
        this.log('🔍 Analyzing page structure for debugging...');
        
        // Check for common form elements
        const elements = [
            { selector: '[data-automation-id="questionItem"]', name: 'Question Items' },
            { selector: '[role="radiogroup"]', name: 'Radio Groups' },
            { selector: 'input[type="radio"]', name: 'Radio Inputs' },
            { selector: 'input[type="checkbox"]', name: 'Checkboxes' },
            { selector: 'input[type="text"]', name: 'Text Inputs' },
            { selector: 'textarea', name: 'Text Areas' },
            { selector: 'select', name: 'Select Dropdowns' },
            { selector: '.office-form-question', name: 'Office Form Questions' },
            { selector: '.question-title-container', name: 'Question Titles' },
            { selector: '[data-automation-id="choiceGroupView"]', name: 'Choice Groups' }
        ];
        
        elements.forEach(({ selector, name }) => {
            const found = document.querySelectorAll(selector);
            this.log(`📊 ${name}: ${found.length} found`);
        });
        
        // Log page content hints
        const bodyText = document.body.textContent.substring(0, 500);
        this.log(`📄 Page content preview: ${bodyText}...`);
    }
}

// Initialize the content script
console.log('🔍 QuickFill: Initializing on URL:', window.location.href);
window.quickFillFormsV2Instance = new QuickFillFormsV2();
console.log('🚀 QuickFill: Instance created and stored');

}