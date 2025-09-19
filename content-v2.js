// QuickFill Microsoft Forms - Content Script v2.0
// Enhanced form filling with auto-submit and special questions support

class QuickFillFormsV2 {
    constructor() {
        this.isRunning = false;
        this.settings = {};
        this.submissionCount = 0;
        this.specialQuestions = [];
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep channel open for async responses
        });

        console.log('🚀 QuickFill Microsoft Forms v2.0 loaded');
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'startFilling':
                    const result = await this.startFilling(message.settings);
                    sendResponse({ success: true, result });
                    break;

                case 'stopFilling':
                    this.stopFilling();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async startFilling(settings) {
        if (this.isRunning) {
            return { message: 'Đang chạy rồi!' };
        }

        this.settings = {
            ratingMin: settings.ratingMin || 4,
            ratingMax: settings.ratingMax || 5,
            preferPositiveAnswers: settings.preferPositiveAnswers !== false,
            avoidOther: settings.avoidOther !== false,
            autoSubmitAnother: settings.autoSubmitAnother !== false,
            textLanguage: settings.textLanguage || 'vi',
            maxFormSubmissions: settings.maxFormSubmissions || 0,
            submitDelay: settings.submitDelay || 3,
            useRandomDelay: settings.useRandomDelay !== false,
            delayMin: settings.delayMin || 500,
            delayMax: settings.delayMax || 2000,
            maxRetries: settings.maxRetries || 3,
            questionTimeout: settings.questionTimeout || 5000,
            specialQuestions: settings.specialQuestions || [],
            radioStrategy: settings.radioStrategy || 'random'
        };

        this.specialQuestions = this.settings.specialQuestions;
        this.isRunning = true;
        this.submissionCount = 0;

        this.sendStatusToPopup('Bắt đầu điền form...', 'info');

        try {
            await this.fillCurrentForm();
        } catch (error) {
            console.error('Error filling form:', error);
            this.sendStatusToPopup(`Lỗi: ${error.message}`, 'error');
            this.isRunning = false;
        }

        return { message: 'Đã bắt đầu quá trình điền form' };
    }

    stopFilling() {
        this.isRunning = false;
        this.sendStatusToPopup('Đã dừng điền form', 'info');
        chrome.runtime.sendMessage({ action: 'fillingStopped' });
    }

    sendStatusToPopup(status, type = 'info') {
        try {
            chrome.runtime.sendMessage({
                action: 'updateStatus',
                status: status,
                type: type
            });
        } catch (error) {
            console.log('Status:', status);
        }
    }

    async fillCurrentForm() {
        while (this.isRunning) {
            try {
                this.sendStatusToPopup(`Điền form lần ${this.submissionCount + 1}...`, 'info');

                // Fill the form
                await this.fillAllQuestions();

                // Submit the form
                await this.submitForm();

                this.submissionCount++;
                this.sendStatusToPopup(`Đã gửi ${this.submissionCount} form`, 'success');

                // Check if we should stop
                if (this.settings.maxFormSubmissions > 0 && 
                    this.submissionCount >= this.settings.maxFormSubmissions) {
                    this.sendStatusToPopup(`Đã hoàn thành ${this.submissionCount} form`, 'success');
                    break;
                }

                // Check if auto-submit another is enabled
                if (!this.settings.autoSubmitAnother) {
                    break;
                }

                // Wait for "Submit another response" button and click it
                await this.waitAndClickSubmitAnother();

            } catch (error) {
                console.error('Error in form filling loop:', error);
                this.sendStatusToPopup(`Lỗi: ${error.message}`, 'error');
                break;
            }
        }

        this.isRunning = false;
        chrome.runtime.sendMessage({ action: 'fillingStopped' });
    }

    async fillAllQuestions() {
        const questions = this.findAllQuestions();
        this.sendStatusToPopup(`Tìm thấy ${questions.length} câu hỏi`, 'info');

        for (let i = 0; i < questions.length; i++) {
            if (!this.isRunning) break;

            try {
                await this.fillQuestion(questions[i], i + 1, questions.length);
                await this.randomDelay();
            } catch (error) {
                console.error(`Error filling question ${i + 1}:`, error);
            }
        }
    }

    findAllQuestions() {
        const questions = [];
        
        // Find various question types
        const selectors = [
            '.office-form-question-element',
            '[data-automation-id="questionItem"]',
            '.office-form-content .question-item',
            '.office-form-theme-primary-background-brighter .office-form-content > div',
            'div[role="group"]'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isValidQuestion(el) && !questions.includes(el)) {
                    questions.push(el);
                }
            });
        });

        return questions;
    }

    isValidQuestion(element) {
        if (!element) return false;
        
        // Check if it contains form controls
        const hasInput = element.querySelector('input, select, textarea');
        const hasClickable = element.querySelector('[role="radio"], [role="checkbox"], [role="button"]');
        
        return hasInput || hasClickable;
    }

    async fillQuestion(questionElement, index, total) {
        this.sendStatusToPopup(`Điền câu hỏi ${index}/${total}`, 'info');

        try {
            // Get question text for special handling
            const questionText = this.getQuestionText(questionElement);
            const specialAnswer = this.findSpecialAnswer(questionText);

            if (specialAnswer) {
                this.sendStatusToPopup(`Sử dụng câu trả lời cố định: ${specialAnswer}`, 'info');
                await this.fillSpecialAnswer(questionElement, specialAnswer);
                return;
            }

            // Determine question type and fill accordingly
            if (this.isLikertScale(questionElement)) {
                await this.fillLikertScale(questionElement);
            } else if (this.isRadioQuestion(questionElement)) {
                await this.fillRadioQuestion(questionElement);
            } else if (this.isCheckboxQuestion(questionElement)) {
                await this.fillCheckboxQuestion(questionElement);
            } else if (this.isTextQuestion(questionElement)) {
                await this.fillTextQuestion(questionElement, questionText);
            } else if (this.isDropdownQuestion(questionElement)) {
                await this.fillDropdownQuestion(questionElement);
            }

        } catch (error) {
            console.error(`Error filling question ${index}:`, error);
        }
    }

    getQuestionText(element) {
        const textSelectors = [
            '.office-form-question-title',
            '.question-title',
            '[aria-label]',
            'h3', 'h4', 'h5',
            '.office-form-content span'
        ];

        for (const selector of textSelectors) {
            const textEl = element.querySelector(selector);
            if (textEl && textEl.textContent.trim()) {
                return textEl.textContent.trim().toLowerCase();
            }
        }

        return element.textContent.trim().toLowerCase();
    }

    findSpecialAnswer(questionText) {
        for (const special of this.specialQuestions) {
            if (questionText.includes(special.keyword.toLowerCase())) {
                return special.answer;
            }
        }
        return null;
    }

    async fillSpecialAnswer(questionElement, answer) {
        // Try to find text input first
        const textInput = questionElement.querySelector('input[type="text"], textarea');
        if (textInput) {
            await this.fillTextInput(textInput, answer);
            return;
        }

        // Try to find matching radio button
        const radioOptions = questionElement.querySelectorAll('[role="radio"], input[type="radio"]');
        for (const radio of radioOptions) {
            const label = this.getElementText(radio);
            if (label.toLowerCase().includes(answer.toLowerCase())) {
                await this.clickElement(radio);
                return;
            }
        }

        // Try to find matching option in dropdown
        const select = questionElement.querySelector('select');
        if (select) {
            const options = select.querySelectorAll('option');
            for (const option of options) {
                if (option.textContent.toLowerCase().includes(answer.toLowerCase())) {
                    select.value = option.value;
                    this.triggerEvent(select, 'change');
                    return;
                }
            }
        }
    }

    isLikertScale(element) {
        const text = element.textContent.toLowerCase();
        const hasLikertKeywords = /strongly\s+(agree|disagree)|rất\s+(đồng\s+ý|không\s+đồng\s+ý)|scale|rating|điểm/i.test(text);
        const hasMultipleRadios = element.querySelectorAll('[role="radio"], input[type="radio"]').length >= 3;
        
        return hasLikertKeywords || hasMultipleRadios;
    }

    async fillLikertScale(element) {
        const radios = element.querySelectorAll('[role="radio"], input[type="radio"]');
        if (radios.length === 0) return;

        // Enhanced Likert filling - use position-based selection
        const totalOptions = radios.length;
        let targetIndex;

        if (totalOptions === 5) {
            // For 5-point scale, map our settings to positions
            const ratingRange = this.settings.ratingMax - this.settings.ratingMin + 1;
            const randomRating = this.settings.ratingMin + Math.floor(Math.random() * ratingRange);
            targetIndex = randomRating - 1; // Convert to 0-based index
        } else {
            // For other scales, use proportional mapping
            const minRatio = (this.settings.ratingMin - 1) / 4; // Normalize to 0-1
            const maxRatio = (this.settings.ratingMax - 1) / 4;
            const randomRatio = minRatio + Math.random() * (maxRatio - minRatio);
            targetIndex = Math.floor(randomRatio * totalOptions);
        }

        // Ensure index is within bounds
        targetIndex = Math.max(0, Math.min(targetIndex, totalOptions - 1));

        await this.clickElement(radios[targetIndex]);
    }

    isRadioQuestion(element) {
        const radios = element.querySelectorAll('[role="radio"], input[type="radio"]');
        return radios.length > 0 && !this.isLikertScale(element);
    }

    async fillRadioQuestion(element) {
        const radios = element.querySelectorAll('[role="radio"], input[type="radio"]');
        if (radios.length === 0) return;

        let selectedRadio;

        switch (this.settings.radioStrategy) {
            case 'first':
                selectedRadio = radios[0];
                break;
            case 'middle':
                selectedRadio = radios[Math.floor(radios.length / 2)];
                break;
            case 'positive':
                selectedRadio = this.findPositiveOption(radios);
                break;
            default:
                selectedRadio = radios[Math.floor(Math.random() * radios.length)];
        }

        // Avoid "Other" options if setting is enabled
        if (this.settings.avoidOther && this.isOtherOption(selectedRadio)) {
            const nonOtherRadios = Array.from(radios).filter(r => !this.isOtherOption(r));
            if (nonOtherRadios.length > 0) {
                selectedRadio = nonOtherRadios[Math.floor(Math.random() * nonOtherRadios.length)];
            }
        }

        await this.clickElement(selectedRadio);
    }

    findPositiveOption(options) {
        const positiveKeywords = {
            en: ['yes', 'agree', 'good', 'excellent', 'satisfied', 'positive', 'definitely'],
            vi: ['có', 'đồng ý', 'tốt', 'xuất sắc', 'hài lòng', 'tích cực', 'chắc chắn']
        };

        const keywords = positiveKeywords[this.settings.textLanguage] || positiveKeywords.en;

        for (const option of options) {
            const text = this.getElementText(option).toLowerCase();
            if (keywords.some(keyword => text.includes(keyword))) {
                return option;
            }
        }

        // If no positive option found, return random
        return options[Math.floor(Math.random() * options.length)];
    }

    isOtherOption(element) {
        const text = this.getElementText(element).toLowerCase();
        return /other|khác|khac/.test(text);
    }

    isCheckboxQuestion(element) {
        return element.querySelectorAll('[role="checkbox"], input[type="checkbox"]').length > 0;
    }

    async fillCheckboxQuestion(element) {
        const checkboxes = element.querySelectorAll('[role="checkbox"], input[type="checkbox"]');
        if (checkboxes.length === 0) return;

        // Select 1-3 random checkboxes
        const numToSelect = Math.floor(Math.random() * 3) + 1;
        const shuffled = Array.from(checkboxes).sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(numToSelect, shuffled.length); i++) {
            if (!this.settings.avoidOther || !this.isOtherOption(shuffled[i])) {
                await this.clickElement(shuffled[i]);
                await this.randomDelay(200, 500);
            }
        }
    }

    isTextQuestion(element) {
        return element.querySelector('input[type="text"], textarea') !== null;
    }

    async fillTextQuestion(element, questionText) {
        const input = element.querySelector('input[type="text"], textarea');
        if (!input) return;

        let text = this.generateResponseText(questionText);
        await this.fillTextInput(input, text);
    }

    generateResponseText(questionText) {
        const responses = {
            vi: {
                name: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'],
                email: ['test@example.com', 'user@test.com', 'demo@sample.org'],
                phone: ['0901234567', '0987654321', '0912345678'],
                age: ['25', '30', '28', '35', '22'],
                job: ['Nhân viên', 'Kỹ sư', 'Giáo viên', 'Bác sĩ', 'Sinh viên'],
                feedback: ['Rất tốt', 'Hài lòng', 'Cần cải thiện', 'Xuất sắc', 'Tích cực'],
                comment: ['Cảm ơn', 'Rất hữu ích', 'Tuyệt vời', 'Ấn tượng', 'Thú vị']
            },
            en: {
                name: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
                email: ['test@example.com', 'user@test.com', 'demo@sample.org'],
                phone: ['1234567890', '0987654321', '5551234567'],
                age: ['25', '30', '28', '35', '22'],
                job: ['Employee', 'Engineer', 'Teacher', 'Doctor', 'Student'],
                feedback: ['Very good', 'Satisfied', 'Needs improvement', 'Excellent', 'Positive'],
                comment: ['Thank you', 'Very helpful', 'Great', 'Impressive', 'Interesting']
            }
        };

        const lang = this.settings.textLanguage;
        const langResponses = responses[lang] || responses.en;

        // Determine response type based on question text
        if (/name|tên|họ/i.test(questionText)) {
            return this.randomChoice(langResponses.name);
        } else if (/email|mail/i.test(questionText)) {
            return this.randomChoice(langResponses.email);
        } else if (/phone|số điện thoại|điện thoại/i.test(questionText)) {
            return this.randomChoice(langResponses.phone);
        } else if (/age|tuổi/i.test(questionText)) {
            return this.randomChoice(langResponses.age);
        } else if (/job|nghề|công việc/i.test(questionText)) {
            return this.randomChoice(langResponses.job);
        } else if (/feedback|đánh giá|nhận xét/i.test(questionText)) {
            return this.randomChoice(langResponses.feedback);
        } else {
            return this.randomChoice(langResponses.comment);
        }
    }

    isDropdownQuestion(element) {
        return element.querySelector('select') !== null;
    }

    async fillDropdownQuestion(element) {
        const select = element.querySelector('select');
        if (!select) return;

        const options = Array.from(select.options).filter(opt => opt.value && opt.value !== '');
        if (options.length === 0) return;

        let selectedOption = options[Math.floor(Math.random() * options.length)];

        // Avoid "Other" if setting is enabled
        if (this.settings.avoidOther) {
            const nonOtherOptions = options.filter(opt => !this.isOtherOption(opt));
            if (nonOtherOptions.length > 0) {
                selectedOption = nonOtherOptions[Math.floor(Math.random() * nonOtherOptions.length)];
            }
        }

        select.value = selectedOption.value;
        this.triggerEvent(select, 'change');
    }

    async fillTextInput(input, text) {
        input.focus();
        input.value = text;
        this.triggerEvent(input, 'input');
        this.triggerEvent(input, 'change');
        await this.randomDelay(100, 300);
    }

    async clickElement(element) {
        if (!element) return;

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.randomDelay(100, 300);

        element.focus();
        element.click();
        this.triggerEvent(element, 'click');
        
        await this.randomDelay(200, 500);
    }

    triggerEvent(element, eventType) {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
    }

    getElementText(element) {
        if (!element) return '';
        
        // Try aria-label first
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }
        
        // Try associated label
        const label = element.closest('label') || document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            return label.textContent.trim();
        }
        
        // Try parent text content
        return element.textContent?.trim() || '';
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    async randomDelay(min = null, max = null) {
        if (!this.settings.useRandomDelay) return;

        const minDelay = min || this.settings.delayMin;
        const maxDelay = max || this.settings.delayMax;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async submitForm() {
        this.sendStatusToPopup('Đang gửi form...', 'info');

        const submitButton = this.findSubmitButton();
        if (!submitButton) {
            throw new Error('Không tìm thấy nút Submit');
        }

        await this.clickElement(submitButton);
        
        // Wait for submission to complete
        await this.waitForSubmission();
    }

    findSubmitButton() {
        const selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button[data-automation-id="submitButton"]',
            '.office-form-bottom-button button',
            'button[aria-label*="Submit"]',
            'button[aria-label*="Gửi"]'
        ];

        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button && !button.disabled) {
                return button;
            }
        }

        // Fallback: find buttons with submit-like text
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const text = button.textContent.toLowerCase();
            if (/submit|gửi|send|hoàn thành/.test(text) && !button.disabled) {
                return button;
            }
        }

        return null;
    }

    async waitForSubmission() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for submission'));
            }, 10000);

            // Check for success indicators
            const checkSubmission = () => {
                if (document.querySelector('.thank-you, .success, .submitted') ||
                    document.textContent.includes('Thank you') ||
                    document.textContent.includes('Cảm ơn') ||
                    document.textContent.includes('submitted')) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }

                // Check if URL changed (might indicate submission)
                if (window.location.href.includes('thank') || 
                    window.location.href.includes('success') ||
                    window.location.href.includes('submitted')) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }

                setTimeout(checkSubmission, 500);
            };

            setTimeout(checkSubmission, 1000);
        });
    }

    async waitAndClickSubmitAnother() {
        this.sendStatusToPopup('Chờ nút "Submit another response"...', 'info');

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Không tìm thấy nút "Submit another response"'));
            }, 15000);

            const checkForButton = () => {
                const button = this.findSubmitAnotherButton();
                if (button) {
                    clearTimeout(timeout);
                    this.clickElement(button).then(() => {
                        setTimeout(() => {
                            resolve();
                        }, this.settings.submitDelay * 1000);
                    });
                    return;
                }

                setTimeout(checkForButton, 500);
            };

            setTimeout(checkForButton, 2000);
        });
    }

    findSubmitAnotherButton() {
        const selectors = [
            '[data-automation-id="submitAnotherResponseButton"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        // Fallback: search by text content
        const links = document.querySelectorAll('a, button');
        for (const link of links) {
            const text = link.textContent.toLowerCase();
            if (/submit\s+another|gửi.*khác|another\s+response/.test(text)) {
                return link;
            }
        }

        return null;
    }
}

// Initialize the content script
if (window.location.href.includes('forms.microsoft.com') || 
    window.location.href.includes('forms.office.com')) {
    new QuickFillFormsV2();
}