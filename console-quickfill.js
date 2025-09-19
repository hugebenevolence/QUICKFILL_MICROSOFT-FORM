// 🚀 QuickFill Microsoft Forms - Console Script
// Copy-paste script này vào Console (F12) trên trang Microsoft Forms

(function() {
    'use strict';
    
    console.log('🚀 QuickFill Microsoft Forms Console Script Starting...');
    
    // Configuration
    const CONFIG = {
        ratingMin: 3,
        ratingMax: 5,
        avoidOther: true,
        naturalDelay: true,
        autoRescan: true,
        maxRetries: 8, // Increased retries for sequential forms
        retryInterval: 1500, // Faster retry for sequential filling
        sequentialFill: true, // Fill fields in order and wait for conditionals
        waitForConditional: true, // Wait for conditional fields to appear
        geminiApiKey: '', // Để trống nếu không dùng AI
    };
    
    // Gemini API key (optional)
    // CONFIG.geminiApiKey = 'your-api-key-here';
    
    let currentRetry = 0;
    let totalFilled = 0;
    
    // Utility Functions
    function log(message, type = 'info') {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${emoji} QuickFill: ${message}`);
    }
    
    function randomDelay(min = 200, max = 800) {
        return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
    }
    
    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return element.offsetParent !== null && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }
    
    function getFieldLabel(element) {
        // Try multiple methods to get field label
        const methods = [
            () => document.querySelector(`label[for="${element.id}"]`)?.textContent?.trim(),
            () => element.closest('.form-group, .field-group, .question')?.querySelector('label')?.textContent?.trim(),
            () => element.getAttribute('aria-label'),
            () => element.getAttribute('placeholder'),
            () => element.previousElementSibling?.textContent?.trim(),
            () => element.parentNode?.querySelector('label')?.textContent?.trim()
        ];
        
        for (const method of methods) {
            try {
                const label = method();
                if (label && label.length > 0) return label;
            } catch (e) {}
        }
        return '';
    }
    
    function getQuestionText(element) {
        const methods = [
            () => element.closest('[data-automation-id="questionTitle"]')?.textContent?.trim(),
            () => element.closest('.office-form-question')?.querySelector('.question-title')?.textContent?.trim(),
            () => element.closest('.form-question')?.querySelector('h3, h4, .question-text')?.textContent?.trim(),
            () => element.closest('.question')?.querySelector('.question-text, h3, h4')?.textContent?.trim()
        ];
        
        for (const method of methods) {
            try {
                const question = method();
                if (question && question.length > 3) return question;
            } catch (e) {}
        }
        return '';
    }
    
    // AI Text Generation
    async function generateTextWithAI(question) {
        if (!CONFIG.geminiApiKey || !question) return null;
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Provide a short, natural Vietnamese response to this form question: "${question}". Keep it concise and appropriate.` }] }]
                })
            });
            
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                log(`AI Generated: ${text.substring(0, 50)}...`);
                return text.trim();
            }
        } catch (error) {
            log(`AI Error: ${error.message}`, 'warning');
        }
        
        return null;
    }
    
    // Fallback text responses
    function generateFallbackText(question, label) {
        const q = (question || '').toLowerCase();
        const l = (label || '').toLowerCase();
        const combined = q + ' ' + l;
        
        if (combined.includes('name') || combined.includes('tên')) {
            const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Minh C', 'Phạm Thu D'];
            return names[Math.floor(Math.random() * names.length)];
        } else if (combined.includes('email')) {
            return `test${Math.floor(Math.random() * 1000)}@example.com`;
        } else if (combined.includes('phone') || combined.includes('số điện thoại')) {
            return `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        } else if (combined.includes('company') || combined.includes('công ty')) {
            const companies = ['Công ty ABC', 'Doanh nghiệp XYZ', 'Tập đoàn DEF'];
            return companies[Math.floor(Math.random() * companies.length)];
        } else if (combined.includes('feedback') || combined.includes('comment') || combined.includes('ý kiến')) {
            const feedback = [
                'Dịch vụ tốt, tôi rất hài lòng.',
                'Chất lượng ổn, có thể cải thiện thêm.',
                'Nhân viên nhiệt tình, chu đáo.',
                'Sản phẩm đúng như mong đợi.',
                'Trải nghiệm khá tốt, sẽ giới thiệu cho bạn bè.'
            ];
            return feedback[Math.floor(Math.random() * feedback.length)];
        }
        
        // Default responses
        const defaults = [
            'Tôi đồng ý với điều này.',
            'Khá hài lòng với dịch vụ.',
            'Sản phẩm/dịch vụ tốt.',
            'Có thể cải thiện thêm.',
            'Đáp ứng được nhu cầu.',
            'Trải nghiệm tích cực.'
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }
    
    // Main filling functions
    async function fillRadioGroups() {
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        const groups = {};
        let filled = 0;
        
        // Group radios by name
        radioInputs.forEach(radio => {
            const name = radio.name || radio.getAttribute('aria-describedby') || 'unnamed';
            if (!groups[name]) groups[name] = [];
            groups[name].push(radio);
        });
        
        for (const [groupName, radios] of Object.entries(groups)) {
            const visibleRadios = radios.filter(r => isElementVisible(r) && !r.checked);
            if (visibleRadios.length === 0) continue;
            
            let validOptions = visibleRadios;
            
            // Filter out "other" options
            if (CONFIG.avoidOther) {
                const nonOtherOptions = visibleRadios.filter(radio => {
                    const label = getFieldLabel(radio).toLowerCase();
                    return !label.includes('other') && !label.includes('khác') && 
                           !label.includes('others') && !label.includes('altro');
                });
                
                if (nonOtherOptions.length > 0) {
                    validOptions = nonOtherOptions;
                }
            }
            
            // Check if it's a rating question
            const question = getQuestionText(validOptions[0]);
            const isRating = validOptions.some(radio => {
                const label = getFieldLabel(radio);
                return /^\d+$/.test(label) || /rating|điểm|đánh giá|point/i.test(question);
            });
            
            let selectedRadio;
            
            if (isRating) {
                // Smart rating selection
                const ratingOptions = validOptions.filter(radio => {
                    const value = parseInt(getFieldLabel(radio)) || parseInt(radio.value);
                    return value >= CONFIG.ratingMin && value <= CONFIG.ratingMax;
                });
                
                if (ratingOptions.length > 0) {
                    // Weighted selection favoring higher ratings
                    const weights = ratingOptions.map((_, index) => index + 1);
                    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                    let random = Math.random() * totalWeight;
                    
                    for (let i = weights.length - 1; i >= 0; i--) {
                        random -= weights[i];
                        if (random <= 0) {
                            selectedRadio = ratingOptions[i];
                            break;
                        }
                    }
                } else {
                    selectedRadio = validOptions[Math.floor(Math.random() * validOptions.length)];
                }
            } else {
                selectedRadio = validOptions[Math.floor(Math.random() * validOptions.length)];
            }
            
            if (selectedRadio) {
                selectedRadio.focus();
                selectedRadio.click();
                selectedRadio.dispatchEvent(new Event('change', { bubbles: true }));
                
                filled++;
                log(`Selected radio: ${getFieldLabel(selectedRadio)} (${question})`);
                
                if (CONFIG.naturalDelay) {
                    await randomDelay();
                }
            }
        }
        
        return filled;
    }
    
    async function fillTextFields() {
        const textFields = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"], input[type="tel"]');
        let filled = 0;
        
        for (const field of textFields) {
            if (!isElementVisible(field) || field.value.trim()) continue;
            
            const question = getQuestionText(field);
            const label = getFieldLabel(field);
            let text = '';
            
            // Try AI generation first
            if (CONFIG.geminiApiKey && question) {
                text = await generateTextWithAI(question);
            }
            
            // Fallback to context-based generation
            if (!text) {
                text = generateFallbackText(question, label);
            }
            
            if (text) {
                field.focus();
                field.value = '';
                
                // Simulate typing
                if (CONFIG.naturalDelay) {
                    for (let i = 0; i < text.length; i++) {
                        field.value += text[i];
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                        await randomDelay(50, 150);
                    }
                } else {
                    field.value = text;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.blur();
                
                filled++;
                log(`Filled text field: ${text.substring(0, 30)}... (${question || label})`);
                
                if (CONFIG.naturalDelay) {
                    await randomDelay();
                }
            }
        }
        
        return filled;
    }
    
    async function fillCheckboxes() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        let filled = 0;
        
        for (const checkbox of checkboxes) {
            if (!isElementVisible(checkbox) || checkbox.checked) continue;
            
            // 70% chance to check each checkbox
            if (Math.random() > 0.3) {
                checkbox.focus();
                checkbox.click();
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                
                filled++;
                log(`Checked: ${getFieldLabel(checkbox)}`);
                
                if (CONFIG.naturalDelay) {
                    await randomDelay();
                }
            }
        }
        
        return filled;
    }
    
    async function fillDropdowns() {
        const dropdowns = document.querySelectorAll('select');
        let filled = 0;
        
        for (const dropdown of dropdowns) {
            if (!isElementVisible(dropdown) || dropdown.selectedIndex > 0) continue;
            
            const options = Array.from(dropdown.options).slice(1); // Skip first empty option
            let validOptions = options;
            
            if (CONFIG.avoidOther) {
                const nonOtherOptions = options.filter(option => {
                    const text = option.textContent.toLowerCase();
                    return !text.includes('other') && !text.includes('khác');
                });
                
                if (nonOtherOptions.length > 0) {
                    validOptions = nonOtherOptions;
                }
            }
            
            if (validOptions.length > 0) {
                const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];
                dropdown.value = randomOption.value;
                dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                
                filled++;
                log(`Selected dropdown: ${randomOption.textContent.trim()}`);
                
                if (CONFIG.naturalDelay) {
                    await randomDelay();
                }
            }
        }
        
        return filled;
    }
    
    // Check for validation errors and incomplete fields
    function checkFormValidation() {
        const validationMessages = [
            // Common validation selectors
            '.validation-error',
            '.error-message', 
            '.field-error',
            '[role="alert"]',
            '.ms-TextField-errorMessage',
            '.office-form-question-error',
            // Microsoft Forms specific
            '[data-automation-id="errorMessage"]',
            '[data-automation-id="validationError"]'
        ];
        
        const errors = [];
        for (const selector of validationMessages) {
            const errorElements = document.querySelectorAll(selector);
            errorElements.forEach(el => {
                if (isElementVisible(el) && el.textContent.trim()) {
                    errors.push(el.textContent.trim());
                }
            });
        }
        
        return errors;
    }
    
    // Check if all required fields are filled
    function getIncompleteFields() {
        const incomplete = [];
        
        // Check radio groups that need selection
        const radioGroups = {};
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            const name = radio.name || radio.getAttribute('aria-describedby') || 'unnamed';
            if (!radioGroups[name]) radioGroups[name] = [];
            radioGroups[name].push(radio);
        });
        
        for (const [groupName, radios] of Object.entries(radioGroups)) {
            const hasSelection = radios.some(r => r.checked);
            const visibleRadios = radios.filter(r => isElementVisible(r));
            
            if (visibleRadios.length > 0 && !hasSelection) {
                const question = getQuestionText(visibleRadios[0]);
                incomplete.push({
                    type: 'radio',
                    question: question || `Radio group: ${groupName}`,
                    elements: visibleRadios
                });
            }
        }
        
        // Check required text fields
        const textFields = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"], input[type="tel"]');
        textFields.forEach(field => {
            if (isElementVisible(field) && !field.value.trim()) {
                // Check if field is required
                const isRequired = field.hasAttribute('required') ||
                                 field.getAttribute('aria-required') === 'true' ||
                                 field.closest('.required') ||
                                 field.closest('[data-required="true"]');
                                 
                if (isRequired) {
                    const question = getQuestionText(field);
                    const label = getFieldLabel(field);
                    incomplete.push({
                        type: 'text',
                        question: question || label || 'Text field',
                        elements: [field]
                    });
                }
            }
        });
        
        // Check required dropdowns
        const dropdowns = document.querySelectorAll('select');
        dropdowns.forEach(dropdown => {
            if (isElementVisible(dropdown) && dropdown.selectedIndex <= 0) {
                const isRequired = dropdown.hasAttribute('required') ||
                                 dropdown.getAttribute('aria-required') === 'true';
                                 
                if (isRequired) {
                    const question = getQuestionText(dropdown);
                    incomplete.push({
                        type: 'dropdown',
                        question: question || 'Dropdown field',
                        elements: [dropdown]
                    });
                }
            }
        });
        
        return incomplete;
    }
    
    // Wait for new fields to appear after filling
    async function waitForConditionalFields() {
        log('Waiting for conditional fields to appear...');
        
        const initialFieldCount = document.querySelectorAll('input, textarea, select').length;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            await randomDelay(500, 1000);
            const currentFieldCount = document.querySelectorAll('input, textarea, select').length;
            
            if (currentFieldCount > initialFieldCount) {
                log(`Found ${currentFieldCount - initialFieldCount} new fields!`);
                return true;
            }
            
            attempts++;
        }
        
        return false;
    }

    // Main execution function
    async function quickFillForm() {
        try {
            log(`Starting QuickFill attempt ${currentRetry + 1}/${CONFIG.maxRetries}`);
            
            let sessionFilled = 0;
            
            // Fill different field types in order
            log('🔄 Phase 1: Filling radio buttons...');
            sessionFilled += await fillRadioGroups();
            
            // Wait for conditional fields to appear
            if (sessionFilled > 0) {
                await waitForConditionalFields();
            }
            
            log('🔄 Phase 2: Filling text fields...');
            sessionFilled += await fillTextFields();
            
            log('🔄 Phase 3: Filling checkboxes...');
            sessionFilled += await fillCheckboxes();
            
            log('🔄 Phase 4: Filling dropdowns...');
            sessionFilled += await fillDropdowns();
            
            totalFilled += sessionFilled;
            
            if (sessionFilled > 0) {
                log(`Filled ${sessionFilled} fields in this session (Total: ${totalFilled})`, 'success');
                
                // Wait for any final conditional fields
                await randomDelay(1000, 2000);
            }
            
            // Check for validation errors
            const validationErrors = checkFormValidation();
            if (validationErrors.length > 0) {
                log('⚠️ Validation errors found:', 'warning');
                validationErrors.forEach(error => log(`  • ${error}`, 'warning'));
            }
            
            // Check for incomplete required fields
            const incompleteFields = getIncompleteFields();
            
            if (incompleteFields.length > 0) {
                log(`❌ Found ${incompleteFields.length} incomplete required fields:`);
                incompleteFields.forEach((field, index) => {
                    log(`  ${index + 1}. ${field.question} (${field.type})`);
                });
                
                // Try to fill incomplete fields
                if (currentRetry < CONFIG.maxRetries - 1) {
                    currentRetry++;
                    log(`🔄 Retrying to fill incomplete fields in ${CONFIG.retryInterval/1000} seconds...`);
                    setTimeout(quickFillForm, CONFIG.retryInterval);
                    return;
                } else {
                    log('⚠️ Max retries reached. Some fields may still be incomplete.', 'warning');
                }
            } else {
                log('✅ All required fields appear to be filled!', 'success');
            }
            
            // Only proceed to next page if no validation errors and all fields are filled
            if (validationErrors.length === 0 && incompleteFields.length === 0) {
                // Check for next page button
                const nextButtonSelectors = [
                    '[data-automation-id="nextButton"]',
                    'button[title*="Next"]',
                    'button[aria-label*="Next"]',
                    'button:contains("Next")',
                    'input[value*="Next"]',
                    'button:contains("Tiếp")',
                    'button:contains("Continue")',
                    // Additional selectors for Microsoft Forms
                    '[data-automation-id="submitButton"]',
                    'button[type="submit"]'
                ];
                
                let nextButton = null;
                for (const selector of nextButtonSelectors) {
                    try {
                        if (selector.includes(':contains(')) {
                            // Handle :contains() selector manually
                            const buttonText = selector.match(/contains\("([^"]+)"\)/)[1];
                            const buttons = document.querySelectorAll('button');
                            nextButton = Array.from(buttons).find(btn => 
                                btn.textContent.includes(buttonText) && 
                                isElementVisible(btn) && 
                                !btn.disabled
                            );
                        } else {
                            nextButton = document.querySelector(selector);
                        }
                        
                        if (nextButton && isElementVisible(nextButton) && !nextButton.disabled) {
                            break;
                        }
                    } catch (e) {
                        // Continue to next selector
                    }
                }
                
                if (nextButton) {
                    log(`🎯 All fields completed! Proceeding to next page...`, 'success');
                    
                    // Scroll button into view
                    nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await randomDelay(500, 1000);
                    
                    nextButton.click();
                    
                    // Reset for next page
                    currentRetry = 0;
                    totalFilled = 0; // Reset for new page
                    
                    // Wait longer for page transition
                    setTimeout(() => {
                        log('📄 New page loaded, starting fill process...');
                        quickFillForm();
                    }, 3000);
                    return;
                } else {
                    log('🎉 Form appears to be complete! No next button found.', 'success');
                }
            } else {
                log('❌ Cannot proceed to next page due to validation errors or incomplete fields', 'error');
                
                // Continue trying if we haven't filled anything new in a while
                if (sessionFilled === 0 && currentRetry < CONFIG.maxRetries - 1) {
                    currentRetry++;
                    log(`🔄 Retrying in ${CONFIG.retryInterval/1000} seconds...`);
                    setTimeout(quickFillForm, CONFIG.retryInterval);
                }
            }
            
            // Final summary
            if (currentRetry >= CONFIG.maxRetries - 1 || sessionFilled === 0) {
                log(`� QuickFill Session Complete!`, 'success');
                log(`📊 Total fields filled: ${totalFilled}`);
                
                if (incompleteFields.length > 0) {
                    log('⚠️ Some fields may need manual attention:', 'warning');
                    incompleteFields.forEach(field => {
                        log(`  • ${field.question}`, 'warning');
                    });
                }
                
                if (validationErrors.length > 0) {
                    log('❌ Validation errors that need fixing:', 'error');
                    validationErrors.forEach(error => log(`  • ${error}`, 'error'));
                }
            }
            
        } catch (error) {
            log(`Error during filling: ${error.message}`, 'error');
            console.error('QuickFill Error Details:', error);
            
            if (currentRetry < CONFIG.maxRetries - 1) {
                currentRetry++;
                log(`Retrying in ${CONFIG.retryInterval/1000} seconds...`);
                setTimeout(quickFillForm, CONFIG.retryInterval);
            }
        }
    }
    
    // Display current page info
    function displayPageInfo() {
        const radioCount = document.querySelectorAll('input[type="radio"]').length;
        const textCount = document.querySelectorAll('input[type="text"], textarea').length;
        const checkboxCount = document.querySelectorAll('input[type="checkbox"]').length;
        const dropdownCount = document.querySelectorAll('select').length;
        
        log('📊 Form Analysis:');
        log(`  🔘 Radio buttons: ${radioCount}`);
        log(`  📝 Text fields: ${textCount}`);
        log(`  ☑️ Checkboxes: ${checkboxCount}`);
        log(`  📋 Dropdowns: ${dropdownCount}`);
        log('');
    }
    
    // Start the process
    log('🎯 QuickFill Microsoft Forms Console Script');
    log('⚙️ Configuration:');
    log(`  Rating range: ${CONFIG.ratingMin}-${CONFIG.ratingMax}`);
    log(`  Avoid "Other": ${CONFIG.avoidOther}`);
    log(`  Natural delays: ${CONFIG.naturalDelay}`);
    log(`  Auto rescan: ${CONFIG.autoRescan}`);
    log(`  AI enabled: ${!!CONFIG.geminiApiKey}`);
    log('');
    
    displayPageInfo();
    
    // Start filling after a short delay
    setTimeout(quickFillForm, 1000);
    
})();

// 📋 Instructions:
// 1. Open Microsoft Forms page
// 2. Press F12 → Console tab
// 3. Copy-paste this entire script and press Enter
// 4. Script will automatically fill the form
// 5. It will continue to next pages if available
// 6. Run again if needed for complex forms

console.log('📋 QuickFill Console Script loaded! Starting in 1 second...');