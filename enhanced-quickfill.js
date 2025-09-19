// 🚀 QuickFill Microsoft Forms - Enhanced Console Script
// Optimized for Microsoft Forms actual DOM structure

(function() {
    'use strict';
    
    console.log('🚀 QuickFill Microsoft Forms Enhanced Script Starting...');
    
    // Configuration
    const CONFIG = {
        ratingMin: 4,  // For Likert scales (4-5)
        ratingMax: 5,
        avoidOther: true,
        naturalDelay: false, // Tắt natural delay để tăng tốc
        maxRetries: 15, // Giảm số lần retry
        retryInterval: 800, // Faster retry
        waitBetweenClicks: 100, // Faster clicking
        pageTransitionWait: 2000, // Wait time for page transitions
        
        // Advanced selection preferences
        preferPositiveAnswers: true, // Choose positive answers when possible
        multipleChoiceStrategy: 'smart', // 'smart', 'random', 'first'
        checkboxMaxSelections: 3, // Max checkboxes to select
        
        // Text field preferences
        useSmartTextGeneration: true,
        textLanguage: 'vi', // 'vi' for Vietnamese, 'en' for English
        
        // Auto-repeat settings
        autoSubmitAnother: true, // Automatically click "Submit another response"
        maxFormSubmissions: 0, // 0 = unlimited, set number to limit submissions
        
        // Special radio questions with predefined answers
        specialRadioQuestions: [
            {
                keywords: ['Bạn có đồng ý tham gia buổi phỏng vấn sâu / thảo luận nhóm về chủ đề chất lượng dịch vụ của trường không?'],
                defaultAnswer: 'Không', // or specific age ranges
                priority: 1
            },
            {
                keywords: ['Bạn có đồng ý tham gia khảo sát và cho phép sử dụng thông tin cung cấp cho mục đích nghiên cứu không?'],
                defaultAnswer: 'Có', // hoặc 'Không'
                priority: 1
            },
            {
                keywords: ['Phân loại trường đại học của bạn?'],
                defaultAnswer: 'Tư Thục', // hoặc 'Không'
                priority: 1
            }
            
        ],
        
        geminiApiKey: '', // Optional AI integration
    };
    
    let currentRetry = 0;
    let totalFilled = 0;
    let processedQuestions = new Set();
    let formSubmissionCount = 0;
    
    // Utility Functions
    function log(message, type = 'info') {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${emoji} QuickFill: ${message}`);
    }
    
    function randomDelay(min = 50, max = 200) {
        return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
    }
    
    function isElementVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               element.offsetParent !== null;
    }
    
    function isElementClickable(element) {
        if (!isElementVisible(element)) return false;
        const style = window.getComputedStyle(element);
        return style.pointerEvents !== 'none' && !element.disabled;
    }
    
    function getQuestionText(questionElement) {
        const titleElement = questionElement.querySelector('[data-automation-id="questionTitle"]');
        return titleElement ? titleElement.textContent.trim() : 'Unknown Question';
    }
    
    async function simulateClick(element) {
        // Scroll element into view first
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await randomDelay(100, 200);
        
        // Debug: Log element details
        log(`🔍 Attempting to click element: ${element.textContent.trim()}`);
        log(`   - Tag: ${element.tagName}, ID: ${element.id || 'none'}`);
        log(`   - Classes: ${element.className || 'none'}`);
        log(`   - Data attributes: ${Array.from(element.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}=${attr.value}`).join(', ')}`);
        
        let success = false;
        
        // Method 1: Try finding and clicking the hidden radio input first
        try {
            const radioInput = element.querySelector('input[type="radio"]');
            if (radioInput && !radioInput.disabled) {
                log(`🎯 Found radio input, clicking directly`);
                radioInput.checked = true;
                radioInput.dispatchEvent(new Event('change', { bubbles: true }));
                radioInput.dispatchEvent(new Event('click', { bubbles: true }));
                await randomDelay(100, 200);
                success = await verifySelection(element);
                if (success) {
                    log(`✅ Radio input click successful`);
                    return true;
                }
            }
        } catch (e) {
            log(`Radio input click failed: ${e.message}`, 'warning');
        }
        
        // Method 2: Direct click on the choice item
        try {
            log(`🖱️ Trying direct element click`);
            element.click();
            await randomDelay(150, 300);
            success = await verifySelection(element);
            if (success) {
                log(`✅ Direct click successful`);
                return true;
            }
        } catch (e) {
            log(`Direct click failed: ${e.message}`, 'warning');
        }
        
        // Method 3: Click on specific child elements
        try {
            const clickableChildren = element.querySelectorAll('span, div, label');
            for (const child of clickableChildren) {
                if (child.textContent.trim()) {
                    log(`🎯 Trying child element: ${child.tagName}`);
                    child.click();
                    await randomDelay(100, 200);
                    success = await verifySelection(element);
                    if (success) {
                        log(`✅ Child element click successful`);
                        return true;
                    }
                }
            }
        } catch (e) {
            log(`Child element click failed: ${e.message}`, 'warning');
        }
        
        // Method 4: MouseEvent simulation with coordinates
        try {
            log(`🖱️ Trying MouseEvent simulation`);
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            element.dispatchEvent(new MouseEvent('mousedown', { 
                bubbles: true, 
                cancelable: true,
                clientX: centerX,
                clientY: centerY
            }));
            await randomDelay(20, 50);
            element.dispatchEvent(new MouseEvent('mouseup', { 
                bubbles: true, 
                cancelable: true,
                clientX: centerX,
                clientY: centerY
            }));
            element.dispatchEvent(new MouseEvent('click', { 
                bubbles: true, 
                cancelable: true,
                clientX: centerX,
                clientY: centerY
            }));
            await randomDelay(150, 300);
            success = await verifySelection(element);
            if (success) {
                log(`✅ MouseEvent simulation successful`);
                return true;
            }
        } catch (e) {
            log(`MouseEvent simulation failed: ${e.message}`, 'warning');
        }
        
        // Method 5: Focus and keyboard interaction
        try {
            log(`⌨️ Trying keyboard interaction`);
            element.focus();
            await randomDelay(50, 100);
            element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
            element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true, cancelable: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true }));
            await randomDelay(150, 300);
            success = await verifySelection(element);
            if (success) {
                log(`✅ Keyboard interaction successful`);
                return true;
            }
        } catch (e) {
            log(`Keyboard interaction failed: ${e.message}`, 'warning');
        }
        
        // Method 6: Try clicking parent or grandparent
        try {
            const parent = element.parentElement;
            const grandparent = parent?.parentElement;
            
            for (const target of [parent, grandparent]) {
                if (target && target !== element) {
                    log(`🎯 Trying parent/grandparent: ${target.tagName}`);
                    target.click();
                    await randomDelay(100, 200);
                    success = await verifySelection(element);
                    if (success) {
                        log(`✅ Parent/grandparent click successful`);
                        return true;
                    }
                }
            }
        } catch (e) {
            log(`Parent/grandparent click failed: ${e.message}`, 'warning');
        }
        
        log(`❌ All click methods failed for: ${element.textContent.trim()}`, 'error');
        return false;
    }
    
    async function verifySelection(element) {
        // Wait a moment for UI to update
        await randomDelay(50, 100);
        
        // Multiple verification methods
        const checks = [];
        
        // Check 1: aria-checked attribute
        const ariaChecked = element.getAttribute('aria-checked') === 'true';
        checks.push({ method: 'aria-checked', result: ariaChecked });
        
        // Check 2: Various selection classes
        const hasSelectionClass = element.classList.contains('selected') ||
                                element.classList.contains('is-checked') ||
                                element.classList.contains('is-selected') ||
                                element.classList.contains('active') ||
                                element.classList.contains('checked');
        checks.push({ method: 'selection-class', result: hasSelectionClass });
        
        // Check 3: Radio input checked state
        const radioInput = element.querySelector('input[type="radio"]');
        const radioChecked = radioInput?.checked || false;
        checks.push({ method: 'radio-checked', result: radioChecked });
        
        // Check 4: Data attributes
        const dataSelected = element.getAttribute('data-selected') === 'true' ||
                           element.getAttribute('data-checked') === 'true';
        checks.push({ method: 'data-attributes', result: dataSelected });
        
        // Check 5: Visual indicators (background color, etc.)
        const computedStyle = window.getComputedStyle(element);
        const hasVisualSelection = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                                 computedStyle.backgroundColor !== 'transparent' &&
                                 computedStyle.backgroundColor !== 'rgb(255, 255, 255)';
        checks.push({ method: 'visual-style', result: hasVisualSelection });
        
        // Log verification details
        const positiveChecks = checks.filter(check => check.result);
        log(`🔍 Selection verification for "${element.textContent.trim().substring(0, 30)}..."`);
        log(`   Positive checks: ${positiveChecks.map(c => c.method).join(', ') || 'none'}`);
        
        // Return true if any check is positive
        const isSelected = positiveChecks.length > 0;
        
        if (isSelected) {
            log(`✅ Selection verified via: ${positiveChecks.map(c => c.method).join(', ')}`);
        } else {
            log(`❌ No selection indicators found`);
            // Debug: log all attributes and classes
            log(`   Attributes: ${Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
            log(`   Classes: ${element.className}`);
            if (radioInput) {
                log(`   Radio input checked: ${radioInput.checked}, disabled: ${radioInput.disabled}`);
            }
        }
        
        return isSelected;
    }
    
    // Find and fill choice questions (radio/checkbox style)
    async function fillChoiceQuestions() {
        const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
        let filled = 0;
        
        log(`Found ${questions.length} questions to process`);
        
        for (const question of questions) {
            if (!isElementVisible(question)) continue;
            
            const questionText = getQuestionText(question);
            const questionId = question.id || questionText;
            
            // Skip if already processed
            if (processedQuestions.has(questionId)) {
                log(`Skipping already processed: ${questionText.substring(0, 50)}...`);
                continue;
            }
            
            // Check if this is a Likert table - try multiple selectors
            let likertTable = question.querySelector('table[aria-labelledby]');
            
            if (!likertTable) {
                // Try alternative Likert table selectors
                likertTable = question.querySelector('table') || 
                             question.querySelector('[class*="liker"]') ||
                             question.querySelector('[class*="Liker"]');
                
                if (likertTable) {
                    log(`🔍 Found Likert table via alternative selector`);
                }
            }
            
            if (likertTable) {
                log(`🎯 Processing Likert table: ${questionText.substring(0, 80)}...`);
                const likertFilled = await fillLikertTable(question, likertTable);
                filled += likertFilled;
                if (likertFilled > 0) {
                    processedQuestions.add(questionId);
                } else {
                    log(`⚠️ Likert table found but no rows filled`, 'warning');
                }
                continue;
            }
            
            // Find choice items within this question (standard radio/checkbox)
            let choiceItems = question.querySelectorAll('[data-automation-id="choiceItem"]');
            
            // Try alternative selectors if no choice items found
            if (choiceItems.length === 0) {
                const alternativeSelectors = [
                    'input[type="radio"] + *', // Radio with label
                    'input[type="checkbox"] + *', // Checkbox with label
                    '[role="radio"]',
                    '[role="checkbox"]',
                    '.form-control-choice',
                    '.choice-item',
                    '[data-choice-id]'
                ];
                
                for (const selector of alternativeSelectors) {
                    const altChoices = question.querySelectorAll(selector);
                    if (altChoices.length > 0) {
                        choiceItems = altChoices;
                        log(`🔍 Found ${altChoices.length} choices via alternative selector: ${selector}`);
                        break;
                    }
                }
            }
            
            if (choiceItems.length === 0) {
                log(`No choice items found in: ${questionText.substring(0, 50)}...`);
                continue;
            }
            
            log(`Processing standard question: ${questionText.substring(0, 80)}...`);
            log(`Found ${choiceItems.length} choice options`);
            
            // Detect question type
            const questionType = detectQuestionType(question, choiceItems);
            log(`🎯 Question type detected: ${questionType}`);
            
            // Filter out "Other" options if configured
            let validChoices = Array.from(choiceItems).filter(choice => 
                isElementClickable(choice)
            );
            
            if (CONFIG.avoidOther && validChoices.length > 1) {
                const nonOtherChoices = validChoices.filter(choice => {
                    const text = choice.textContent.toLowerCase();
                    return !text.includes('other') && 
                           !text.includes('khác') && 
                           !text.includes('others') &&
                           !text.includes('altro') &&
                           !text.includes('其他') &&
                           !text.includes('другой') &&
                           !text.includes('specify') &&
                           !text.includes('chi tiết') &&
                           !text.includes('khác (xin ghi rõ)');
                });
                
                if (nonOtherChoices.length > 0) {
                    validChoices = nonOtherChoices;
                    log(`Filtered out "Other" options, ${validChoices.length} valid choices remain`);
                }
            }
            
            if (validChoices.length === 0) {
                log(`No valid choices found for: ${questionText.substring(0, 50)}...`, 'warning');
                continue;
            }
            
            // Handle different question types
            let selectedChoices = [];
            
            if (questionType === 'rating') {
                log('🎯 Processing rating question...');
                selectedChoices = selectRatingChoices(validChoices, questionText);
            } else if (questionType === 'checkbox') {
                log('☑️ Processing checkbox question...');
                selectedChoices = selectCheckboxChoices(validChoices, questionText);
            } else if (questionType === 'radio') {
                log('🔘 Processing radio question...');
                selectedChoices = selectRadioChoice(validChoices, questionText);
            } else {
                log('📋 Processing general question...');
                selectedChoices = selectSmartChoice(validChoices, questionText);
            }
            
            // Process selected choices
            if (selectedChoices.length > 0) {
                let successCount = 0;
                
                for (const selectedChoice of selectedChoices) {
                    try {
                        log(`🎯 Attempting to select: "${selectedChoice.textContent.trim()}"`);
                        
                        // Simulate natural user interaction
                        await randomDelay(CONFIG.waitBetweenClicks / 2, CONFIG.waitBetweenClicks);
                        
                        // Try multiple attempts if first fails
                        let clickSuccess = false;
                        let attempts = 0;
                        const maxAttempts = 3;
                        
                        while (!clickSuccess && attempts < maxAttempts) {
                            attempts++;
                            log(`   Attempt ${attempts}/${maxAttempts} for: ${selectedChoice.textContent.trim()}`);
                            
                            clickSuccess = await simulateClick(selectedChoice);
                            
                            if (!clickSuccess && attempts < maxAttempts) {
                                log(`   Attempt ${attempts} failed, waiting before retry...`);
                                await randomDelay(600, 1000);
                            }
                        }
                        
                        if (clickSuccess) {
                            log(`✅ Successfully selected: ${selectedChoice.textContent.trim()}`);
                            successCount++;
                        } else {
                            log(`❌ Failed to select after ${maxAttempts} attempts: ${selectedChoice.textContent.trim()}`, 'error');
                        }
                        
                        if (CONFIG.naturalDelay && selectedChoices.length > 1) {
                            await randomDelay(50, 100);
                        }
                        
                    } catch (error) {
                        log(`Error selecting choice: ${error.message}`, 'error');
                        console.error('Full error details:', error);
                    }
                }
                
                if (successCount > 0) {
                    filled += successCount;
                    processedQuestions.add(questionId);
                    log(`✅ Question completed: ${successCount}/${selectedChoices.length} selections successful`);
                }
                
                if (CONFIG.naturalDelay) {
                    await randomDelay(50, 100);
                }
            }
        }
        
        return filled;
    }
    
    // Detect question type based on DOM structure and content
    function detectQuestionType(questionElement, choiceItems) {
        // Check for checkboxes
        const hasCheckboxes = questionElement.querySelector('input[type="checkbox"]') || 
                             Array.from(choiceItems).some(choice => 
                                 choice.getAttribute('role') === 'checkbox' ||
                                 choice.querySelector('input[type="checkbox"]')
                             );
        
        if (hasCheckboxes) return 'checkbox';
        
        // Check for radio buttons  
        const hasRadios = questionElement.querySelector('input[type="radio"]') ||
                         Array.from(choiceItems).some(choice => 
                             choice.getAttribute('role') === 'radio' ||
                             choice.querySelector('input[type="radio"]')
                         );
        
        if (hasRadios) {
            // Check if it's a rating question
            const questionText = getQuestionText(questionElement).toLowerCase();
            const isRating = Array.from(choiceItems).some(choice => {
                const text = choice.textContent.trim();
                return /^\d+$/.test(text);
            }) || /rating|điểm|đánh giá|point|scale|sao|star/i.test(questionText);
            
            return isRating ? 'rating' : 'radio';
        }
        
        return 'general';
    }
    
    // Smart selection for rating questions
    function selectRatingChoices(validChoices, questionText) {
        log('🎯 Applying smart rating selection...');
        
        // For rating questions, prefer higher ratings within configured range
        const ratingChoices = validChoices.filter(choice => {
            const text = choice.textContent.trim();
            const value = parseInt(text);
            return !isNaN(value) && value >= CONFIG.ratingMin && value <= CONFIG.ratingMax;
        });
        
        if (ratingChoices.length > 0) {
            // Weighted selection favoring higher ratings
            const weights = ratingChoices.map((_, index) => Math.pow(2, index + 1));
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let random = Math.random() * totalWeight;
            
            for (let i = weights.length - 1; i >= 0; i--) {
                random -= weights[i];
                if (random <= 0) {
                    return [ratingChoices[i]];
                }
            }
        }
        
        // Fallback: select highest available rating
        const numericChoices = validChoices.filter(choice => {
            const text = choice.textContent.trim();
            return !isNaN(parseInt(text));
        });
        
        if (numericChoices.length > 0) {
            // Sort by numeric value and pick the highest
            numericChoices.sort((a, b) => {
                const aVal = parseInt(a.textContent.trim());
                const bVal = parseInt(b.textContent.trim());
                return bVal - aVal; // Descending order
            });
            return [numericChoices[0]];
        }
        
        return [validChoices[Math.floor(Math.random() * validChoices.length)]];
    }
    
    // Smart selection for checkbox questions (multiple selections allowed)
    function selectCheckboxChoices(validChoices, questionText) {
        log('☑️ Applying smart checkbox selection...');
        
        const selectedChoices = [];
        const maxSelections = Math.min(CONFIG.checkboxMaxSelections, validChoices.length);
        const numSelections = Math.floor(Math.random() * maxSelections) + 1; // At least 1, max configured
        
        log(`   Selecting ${numSelections} out of ${validChoices.length} options`);
        
        if (CONFIG.preferPositiveAnswers) {
            // Prefer positive answers
            const positiveChoices = validChoices.filter(choice => {
                const text = choice.textContent.toLowerCase();
                return text.includes('có') || text.includes('yes') || text.includes('đồng ý') ||
                       text.includes('hài lòng') || text.includes('satisfied') || text.includes('good') ||
                       text.includes('tốt') || text.includes('thích') || text.includes('like') ||
                       text.includes('rất') || text.includes('very') || text.includes('excellent');
            });
            
            if (positiveChoices.length > 0) {
                log(`   Found ${positiveChoices.length} positive options`);
                
                // Select from positive choices first
                const shuffled = [...positiveChoices].sort(() => Math.random() - 0.5);
                selectedChoices.push(...shuffled.slice(0, Math.min(numSelections, positiveChoices.length)));
            }
        }
        
        // Fill remaining selections randomly
        if (selectedChoices.length < numSelections) {
            const remaining = validChoices.filter(choice => !selectedChoices.includes(choice));
            const shuffled = [...remaining].sort(() => Math.random() - 0.5);
            selectedChoices.push(...shuffled.slice(0, numSelections - selectedChoices.length));
        }
        
        return selectedChoices;
    }
    
    // Smart selection for radio questions (single selection)
    function selectRadioChoice(validChoices, questionText) {
        log('🔘 Applying smart radio selection...');
        
        // Check for special radio questions with predefined answers
        const lowerQuestionText = questionText.toLowerCase();
        log(`🔍 Checking special questions for: "${questionText.substring(0, 60)}..."`);
        
        // Sort special questions by priority (1 = highest priority)
        const sortedSpecialQuestions = CONFIG.specialRadioQuestions.sort((a, b) => a.priority - b.priority);
        
        for (const specialQuestion of sortedSpecialQuestions) {
            const matchedKeyword = specialQuestion.keywords.find(keyword => 
                lowerQuestionText.includes(keyword.toLowerCase())
            );
            
            if (matchedKeyword) {
                log(`🎯 Found special question match: "${matchedKeyword}" -> Default: "${specialQuestion.defaultAnswer}"`);
                
                // Try to find exact match first
                let targetChoice = validChoices.find(choice => {
                    const choiceText = choice.textContent.trim().toLowerCase();
                    return choiceText === specialQuestion.defaultAnswer.toLowerCase();
                });
                
                // If exact match not found, try partial match
                if (!targetChoice) {
                    targetChoice = validChoices.find(choice => {
                        const choiceText = choice.textContent.trim().toLowerCase();
                        return choiceText.includes(specialQuestion.defaultAnswer.toLowerCase()) ||
                               specialQuestion.defaultAnswer.toLowerCase().includes(choiceText);
                    });
                }
                
                // If still not found, try intelligent matching based on question type
                if (!targetChoice) {
                    if (matchedKeyword.includes('tuổi') || matchedKeyword.includes('age')) {
                        // Find age range or number
                        targetChoice = validChoices.find(choice => {
                            const text = choice.textContent.trim();
                            return /\d+(-\d+)?/.test(text) || text.includes('25') || text.includes('30');
                        });
                    } else if (matchedKeyword.includes('giới tính') || matchedKeyword.includes('gender')) {
                        // Find gender options
                        targetChoice = validChoices.find(choice => {
                            const text = choice.textContent.toLowerCase();
                            return text.includes('nam') || text.includes('male') || 
                                   text.includes('nữ') || text.includes('female');
                        });
                    } else if (matchedKeyword.includes('học vấn') || matchedKeyword.includes('education')) {
                        // Find education level
                        targetChoice = validChoices.find(choice => {
                            const text = choice.textContent.toLowerCase();
                            return text.includes('đại học') || text.includes('university') ||
                                   text.includes('college') || text.includes('bachelor');
                        });
                    } else if (matchedKeyword.includes('hài lòng') || matchedKeyword.includes('satisfied')) {
                        // Find satisfaction levels
                        targetChoice = validChoices.find(choice => {
                            const text = choice.textContent.toLowerCase();
                            return text.includes('hài lòng') || text.includes('satisfied') ||
                                   text.includes('tốt') || text.includes('good');
                        });
                    } else if (matchedKeyword.includes('khuyến nghị') || matchedKeyword.includes('recommend')) {
                        // Find yes/no answers
                        targetChoice = validChoices.find(choice => {
                            const text = choice.textContent.toLowerCase();
                            return text.includes('có') || text.includes('yes') ||
                                   text.includes('đồng ý') || text.includes('agree');
                        });
                    }
                }
                
                if (targetChoice) {
                    log(`✅ Selected special answer: "${targetChoice.textContent.trim()}" for question type: ${matchedKeyword}`);
                    return [targetChoice];
                } else {
                    log(`⚠️ Could not find matching choice for "${specialQuestion.defaultAnswer}", falling back to smart selection`);
                }
            }
        }
        
        if (CONFIG.preferPositiveAnswers) {
            // Prefer positive answers for subjective questions
            const subjectiveKeywords = ['cảm thấy', 'feel', 'think', 'nghĩ', 'đánh giá', 'opinion', 'ý kiến'];
            const isSubjective = subjectiveKeywords.some(keyword => 
                questionText.toLowerCase().includes(keyword)
            );
            
            if (isSubjective) {
                const positiveChoice = validChoices.find(choice => {
                    const text = choice.textContent.toLowerCase();
                    return text.includes('có') || text.includes('yes') || text.includes('đồng ý') ||
                           text.includes('hài lòng') || text.includes('satisfied') || text.includes('tốt') ||
                           text.includes('thích') || text.includes('rất') || text.includes('excellent');
                });
                
                if (positiveChoice) {
                    log(`   Selected positive answer: ${positiveChoice.textContent.trim()}`);
                    return [positiveChoice];
                }
            }
        }
        
        // Smart strategy selection
        switch (CONFIG.multipleChoiceStrategy) {
            case 'first':
                return [validChoices[0]];
            case 'smart':
                // Avoid obviously negative answers
                const nonNegativeChoices = validChoices.filter(choice => {
                    const text = choice.textContent.toLowerCase();
                    return !text.includes('không') && !text.includes('no') && 
                           !text.includes('never') && !text.includes('không bao giờ') &&
                           !text.includes('disagree') && !text.includes('không đồng ý');
                });
                
                if (nonNegativeChoices.length > 0) {
                    return [nonNegativeChoices[Math.floor(Math.random() * nonNegativeChoices.length)]];
                }
                // Fall through to random if no non-negative found
            case 'random':
            default:
                return [validChoices[Math.floor(Math.random() * validChoices.length)]];
        }
    }
    
    // General smart selection fallback
    function selectSmartChoice(validChoices, questionText) {
        log('📋 Applying general smart selection...');
        
        // Default to radio selection logic for unknown question types
        return selectRadioChoice(validChoices, questionText);
    }
    
    // Fill Likert scale tables
    async function fillLikertTable(questionElement, likertTable) {
        let filled = 0;
        
        log(`🔍 Debug Likert table structure:`);
        log(`   Table tagName: ${likertTable.tagName}`);
        log(`   Table classes: ${likertTable.className}`);
        log(`   Table attributes: ${Array.from(likertTable.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
        
        // Find all rows in the Likert table
        const tableRows = likertTable.querySelectorAll('tr[role="radiogroup"]');
        log(`Found ${tableRows.length} Likert scale rows to fill`);
        
        if (tableRows.length === 0) {
            // Try alternative row selectors
            const altRows = likertTable.querySelectorAll('tr');
            log(`🔍 No radiogroup rows found, trying all tr elements: ${altRows.length}`);
            
            for (const altRow of altRows) {
                const radios = altRow.querySelectorAll('input[type="radio"]');
                if (radios.length > 0) {
                    log(`   Found ${radios.length} radio inputs in row`);
                }
            }
        }
        
        for (const row of tableRows) {
            try {
                // Get the statement text for this row
                const statementElement = row.querySelector('[data-automation-id="likerStatementTd"]');
                const statementText = statementElement ? statementElement.textContent.trim() : 'Unknown statement';
                
                log(`📋 Processing Likert row: ${statementText.substring(0, 60)}...`);
                
                // Find all radio inputs in this row - try multiple selectors
                let radioInputs = row.querySelectorAll('input[type="radio"][data-automation-id="radio"]');
                
                if (radioInputs.length === 0) {
                    // Try alternative selectors
                    radioInputs = row.querySelectorAll('input[type="radio"]');
                    log(`🔍 Using fallback selector, found ${radioInputs.length} radio inputs`);
                }
                
                if (radioInputs.length === 0) {
                    log(`⚠️ No radio inputs found in row`, 'warning');
                    continue;
                }
                
                log(`Found ${radioInputs.length} rating options (1-${radioInputs.length})`);
                
                // Debug: Log all radio inputs found
                Array.from(radioInputs).forEach((radio, index) => {
                    const value = radio.value;
                    const automationValue = radio.getAttribute('data-automation-value');
                    const ariaLabel = radio.getAttribute('aria-label');
                    log(`   Radio ${index + 1}: value="${value}", automation-value="${automationValue}", aria-label="${ariaLabel}"`);
                });
                
                // Filter radio inputs based on configuration (prefer 3-5 ratings)
                let targetInputs = [];
                
                // Try multiple approaches to identify high rating inputs
                log(`🔍 Analyzing rating structure for range ${CONFIG.ratingMin}-${CONFIG.ratingMax}:`);
                
                // Method 1: Check by position (aria-label indicates position 1-5)
                // Since values are mixed up, we rely on position - positions 4-5 are typically high ratings
                const ariaLabelInputs = Array.from(radioInputs).filter(input => {
                    const position = parseInt(input.getAttribute('aria-label'));
                    if (!isNaN(position)) {
                        // For 5-point scale, select last 2 positions (4-5) as they represent highest ratings
                        const totalPositions = radioInputs.length;
                        const minHighPosition = totalPositions - 1; // Position 4 for 5-point scale
                        const maxHighPosition = totalPositions;     // Position 5 for 5-point scale
                        const isHighPosition = position >= minHighPosition && position <= maxHighPosition;
                        log(`   Position method: position=${position}/${totalPositions}, high positions=${minHighPosition}-${maxHighPosition}, selected=${isHighPosition}`);
                        return isHighPosition;
                    }
                    return false;
                });
                
                // Method 2: Try value attribute (but values might be mixed up)
                const valueInputs = Array.from(radioInputs).filter(input => {
                    const value = parseInt(input.value);
                    if (!isNaN(value)) {
                        const isTargetValue = value >= CONFIG.ratingMin && value <= CONFIG.ratingMax;
                        log(`   Value method: value=${value}, target range=${CONFIG.ratingMin}-${CONFIG.ratingMax}, selected=${isTargetValue}`);
                        return isTargetValue;
                    }
                    return false;
                });
                
                // Method 3: Check data-automation-value (usually null, but check anyway)
                const automationInputs = Array.from(radioInputs).filter(input => {
                    const automationValue = parseInt(input.getAttribute('data-automation-value'));
                    if (!isNaN(automationValue)) {
                        const isTargetValue = automationValue >= CONFIG.ratingMin && automationValue <= CONFIG.ratingMax;
                        log(`   Automation-value method: value=${automationValue}, target range=${CONFIG.ratingMin}-${CONFIG.ratingMax}, selected=${isTargetValue}`);
                        return isTargetValue;
                    }
                    return false;
                });
                
                // Choose the best method (prefer position method as it's more reliable)
                if (ariaLabelInputs.length > 0) {
                    targetInputs = ariaLabelInputs;
                    log(`🎯 Using position method: Found ${targetInputs.length} high rating options`);
                } else if (valueInputs.length > 0) {
                    targetInputs = valueInputs;
                    log(`🎯 Using value method: Found ${targetInputs.length} high rating options`);
                } else if (automationInputs.length > 0) {
                    targetInputs = automationInputs;
                    log(`🎯 Using automation-value method: Found ${targetInputs.length} high rating options`);
                } else {
                    // Fallback: use positional selection (last 2 options for high ratings)
                    // For 5-point scale, last 2 positions (4th and 5th) are typically highest
                    const totalOptions = radioInputs.length;
                    const highPositionCount = Math.min(2, totalOptions); // Select last 2 or all if less than 2
                    targetInputs = Array.from(radioInputs).slice(-highPositionCount);
                    log(`📊 Using positional fallback: last ${highPositionCount} out of ${totalOptions} options as high ratings`);
                }
                
                if (targetInputs.length === 0) {
                    log(`❌ No suitable rating options found`, 'error');
                    continue;
                }
                
                // Randomly select from target inputs (weighted toward higher)
                let selectedInput;
                if (targetInputs.length === 1) {
                    selectedInput = targetInputs[0];
                } else {
                    // Weighted selection favoring the last option (highest rating)
                    const weights = targetInputs.map((_, index) => Math.pow(2, index + 1));
                    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                    let random = Math.random() * totalWeight;
                    
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
                
                // Get the display value (prefer aria-label for position, then value)
                const ariaLabel = selectedInput.getAttribute('aria-label');
                const value = selectedInput.value;
                const automationValue = selectedInput.getAttribute('data-automation-value');
                
                const displayValue = ariaLabel || value || automationValue || 'unknown';
                const actualPosition = ariaLabel ? `position ${ariaLabel}` : `value ${value}`;
                
                log(`🎯 Selecting rating: ${displayValue} (${actualPosition}) for "${statementText.substring(0, 40)}..."`);
                log(`   📊 Selected input details: aria-label="${ariaLabel}", value="${value}", automation-value="${automationValue}"`);
                
                // Click the selected radio input
                let attempts = 0;
                let success = false;
                const maxAttempts = 3;
                
                while (!success && attempts < maxAttempts) {
                    attempts++;
                    log(`🔄 Likert attempt ${attempts}/${maxAttempts} for rating ${displayValue}`);
                    
                    try {
                        // Scroll into view
                        selectedInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await randomDelay(100, 200);
                        
                        // Method 1: Direct radio input manipulation
                        log(`   Method 1: Direct radio input`);
                        selectedInput.checked = true;
                        selectedInput.dispatchEvent(new Event('change', { bubbles: true }));
                        selectedInput.dispatchEvent(new Event('click', { bubbles: true }));
                        
                        await randomDelay(100, 200);
                        
                        // Verify selection
                        if (selectedInput.checked) {
                            log(`✅ Method 1 successful: rating ${displayValue} (${actualPosition})`);
                            success = true;
                            filled++;
                        } else {
                            log(`   Method 1 failed, trying alternatives...`);
                            
                            // Method 2: Click the label wrapper
                            const label = selectedInput.closest('label');
                            if (label) {
                                log(`   Method 2: Label click`);
                                label.click();
                                await randomDelay(100, 200);
                                if (selectedInput.checked) {
                                    log(`✅ Method 2 successful: label click for ${displayValue}`);
                                    success = true;
                                    filled++;
                                }
                            }
                            
                            // Method 3: Click the span wrapper
                            if (!success) {
                                const span = selectedInput.closest('[data-automation-id="radio"]');
                                if (span) {
                                    log(`   Method 3: Span wrapper click`);
                                    span.click();
                                    await randomDelay(100, 200);
                                    if (selectedInput.checked) {
                                        log(`✅ Method 3 successful: span click for ${displayValue}`);
                                        success = true;
                                        filled++;
                                    }
                                }
                            }
                            
                            // Method 4: Click the table cell
                            if (!success) {
                                const td = selectedInput.closest('td');
                                if (td) {
                                    log(`   Method 4: Table cell click`);
                                    td.click();
                                    await randomDelay(100, 200);
                                    if (selectedInput.checked) {
                                        log(`✅ Method 4 successful: cell click for ${displayValue}`);
                                        success = true;
                                        filled++;
                                    }
                                }
                            }
                            
                            // Method 5: MouseEvent simulation
                            if (!success) {
                                log(`   Method 5: MouseEvent simulation`);
                                const rect = selectedInput.getBoundingClientRect();
                                selectedInput.dispatchEvent(new MouseEvent('mousedown', {
                                    bubbles: true,
                                    cancelable: true,
                                    clientX: rect.left + rect.width / 2,
                                    clientY: rect.top + rect.height / 2
                                }));
                                await randomDelay(20, 50);
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
                                await randomDelay(100, 200);
                                if (selectedInput.checked) {
                                    log(`✅ Method 5 successful: MouseEvent for ${displayValue}`);
                                    success = true;
                                    filled++;
                                }
                            }
                        }
                        
                        if (!success && attempts < maxAttempts) {
                            log(`⚠️ All methods failed in attempt ${attempts}, retrying...`);
                            await randomDelay(300, 500);
                        }
                        
                    } catch (error) {
                        log(`❌ Error in attempt ${attempts}: ${error.message}`, 'error');
                        console.error('Likert click error details:', error);
                    }
                }
                
                if (!success) {
                    log(`❌ Failed to select rating after ${maxAttempts} attempts`, 'error');
                }
                
                // Natural delay between row selections
                if (CONFIG.naturalDelay) {
                    await randomDelay(100, 200);
                }
                
            } catch (error) {
                log(`❌ Error processing Likert row: ${error.message}`, 'error');
            }
        }
        
        return filled;
    }
    
    // Find and fill text input fields
    async function fillTextFields() {
        // Look for various text input patterns in Microsoft Forms
        const textSelectors = [
            'input[type="text"]',
            'input[type="email"]', 
            'input[type="tel"]',
            'input[type="number"]',
            'textarea',
            '[contenteditable="true"]',
            '[role="textbox"]'
        ];
        
        let filled = 0;
        
        for (const selector of textSelectors) {
            const fields = document.querySelectorAll(selector);
            
            for (const field of fields) {
                if (!isElementVisible(field) || 
                    (field.value && field.value.trim()) ||
                    (field.textContent && field.textContent.trim())) {
                    continue;
                }
                
                // Generate appropriate text based on field context
                let text = generateContextualText(field);
                
                if (text) {
                    try {
                        field.focus();
                        
                        // Clear existing content
                        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                            field.value = '';
                        } else {
                            field.textContent = '';
                        }
                        
                        // Simulate typing if natural delay is enabled
                        if (CONFIG.naturalDelay) {
                            for (let i = 0; i < text.length; i++) {
                                if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                                    field.value += text[i];
                                } else {
                                    field.textContent += text[i];
                                }
                                field.dispatchEvent(new Event('input', { bubbles: true }));
                                await randomDelay(10, 30);
                            }
                        } else {
                            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                                field.value = text;
                            } else {
                                field.textContent = text;
                            }
                            field.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        
                        field.dispatchEvent(new Event('change', { bubbles: true }));
                        field.blur();
                        
                        filled++;
                        log(`Filled text field: ${text.substring(0, 30)}...`);
                        
                        if (CONFIG.naturalDelay) {
                            await randomDelay(50, 100);
                        }
                        
                    } catch (error) {
                        log(`Error filling text field: ${error.message}`, 'error');
                    }
                }
            }
        }
        
        return filled;
    }
    
    function generateContextualText(field) {
        const context = (field.placeholder || field.getAttribute('aria-label') || '').toLowerCase();
        const questionElement = field.closest('[data-automation-id="questionItem"]');
        const questionText = questionElement ? getQuestionText(questionElement).toLowerCase() : '';
        
        const combined = context + ' ' + questionText;
        
        // Vietnamese responses
        if (CONFIG.textLanguage === 'vi') {
            if (combined.includes('name') || combined.includes('tên') || combined.includes('họ và tên')) {
                const names = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Thu Dung', 'Hoàng Văn Em', 'Vũ Thị Giang', 'Đặng Minh Hiếu'];
                return names[Math.floor(Math.random() * names.length)];
            } else if (combined.includes('email') || combined.includes('thư điện tử')) {
                const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
                const domain = domains[Math.floor(Math.random() * domains.length)];
                return `user${Math.floor(Math.random() * 9999)}@${domain}`;
            } else if (combined.includes('phone') || combined.includes('điện thoại') || combined.includes('số điện thoại')) {
                const prefixes = ['098', '097', '096', '086', '083', '084', '085', '088', '091', '094'];
                const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                return `${prefix}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
            } else if (combined.includes('age') || combined.includes('tuổi')) {
                return Math.floor(Math.random() * 45 + 18).toString();
            } else if (combined.includes('company') || combined.includes('công ty') || combined.includes('nơi làm việc')) {
                const companies = ['Công ty TNHH ABC', 'Doanh nghiệp XYZ', 'Tập đoàn DEF', 'Công ty Cổ phần GHI', 'Doanh nghiệp JKL'];
                return companies[Math.floor(Math.random() * companies.length)];
            } else if (combined.includes('address') || combined.includes('địa chỉ')) {
                const addresses = ['123 Trần Hưng Đạo, Q1, TP.HCM', '456 Nguyễn Huệ, Q3, TP.HCM', '789 Lê Lợi, Q5, TP.HCM', '321 Võ Văn Tần, Q7, TP.HCM'];
                return addresses[Math.floor(Math.random() * addresses.length)];
            } else if (combined.includes('school') || combined.includes('trường') || combined.includes('đại học')) {
                const schools = ['Đại học Bách Khoa', 'Đại học Kinh tế', 'Đại học Sư phạm', 'Đại học Y Dược', 'Đại học Khoa học Tự nhiên'];
                return schools[Math.floor(Math.random() * schools.length)];
            } else if (combined.includes('feedback') || combined.includes('comment') || combined.includes('ý kiến') || combined.includes('nhận xét') || combined.includes('góp ý')) {
                const feedback = [
                    'Dịch vụ rất tốt, tôi hoàn toàn hài lòng.',
                    'Chất lượng sản phẩm vượt mong đợi.',
                    'Nhân viên phục vụ nhiệt tình và chu đáo.',
                    'Trải nghiệm tuyệt vời, sẽ quay lại lần sau.',
                    'Giá cả hợp lý, chất lượng đảm bảo.',
                    'Thời gian phục vụ nhanh chóng.',
                    'Môi trường sạch sẽ và thoải mái.',
                    'Sản phẩm đúng như mô tả, rất hài lòng.'
                ];
                return feedback[Math.floor(Math.random() * feedback.length)];
            } else if (combined.includes('suggestion') || combined.includes('đề xuất') || combined.includes('gợi ý')) {
                const suggestions = [
                    'Có thể cải thiện thời gian phản hồi.',
                    'Nên tăng cường tương tác với khách hàng.',
                    'Đa dạng hóa sản phẩm và dịch vụ.',
                    'Cải thiện giao diện website.',
                    'Tăng cường chương trình khuyến mãi.'
                ];
                return suggestions[Math.floor(Math.random() * suggestions.length)];
            }
            
            // Default Vietnamese responses
            const defaults = [
                'Tôi đồng ý với điều này.',
                'Rất hài lòng với chất lượng.',
                'Sản phẩm/dịch vụ tuyệt vời.',
                'Đáp ứng tốt nhu cầu của tôi.',
                'Trải nghiệm rất tích cực.',
                'Chất lượng vượt mong đợi.',
                'Dịch vụ chuyên nghiệp.'
            ];
            return defaults[Math.floor(Math.random() * defaults.length)];
        } else {
            // English responses
            if (combined.includes('name')) {
                const names = ['John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis', 'Robert Miller'];
                return names[Math.floor(Math.random() * names.length)];
            } else if (combined.includes('email')) {
                const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
                const domain = domains[Math.floor(Math.random() * domains.length)];
                return `user${Math.floor(Math.random() * 9999)}@${domain}`;
            } else if (combined.includes('phone')) {
                return `+1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            } else if (combined.includes('age')) {
                return Math.floor(Math.random() * 45 + 18).toString();
            } else if (combined.includes('company')) {
                const companies = ['ABC Corp', 'XYZ Ltd', 'Tech Solutions Inc', 'Global Systems', 'Innovation Labs'];
                return companies[Math.floor(Math.random() * companies.length)];
            } else if (combined.includes('feedback') || combined.includes('comment')) {
                const feedback = [
                    'Excellent service, highly satisfied.',
                    'Great quality, exceeded expectations.',
                    'Professional and friendly staff.',
                    'Outstanding experience overall.',
                    'Good value for money.',
                    'Quick and efficient service.',
                    'Clean and comfortable environment.'
                ];
                return feedback[Math.floor(Math.random() * feedback.length)];
            }
            
            // Default English responses
            const defaults = [
                'I agree with this.',
                'Very satisfied with the quality.',
                'Excellent product/service.',
                'Meets my needs perfectly.',
                'Very positive experience.',
                'Quality exceeded expectations.',
                'Professional service.'
            ];
            return defaults[Math.floor(Math.random() * defaults.length)];
        }
    }
    
    // Check for validation errors
    function checkValidationErrors() {
        const errorSelectors = [
            '[role="alert"]',
            '[data-automation-id="validationError"]',
            '[data-automation-id="submitError"]'
        ];
        
        const errors = [];
        errorSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (isElementVisible(el) && el.textContent.trim()) {
                    errors.push(el.textContent.trim());
                }
            });
        });
        
        return errors;
    }
    
    // Check if we can proceed to next page
    function canProceedToNext() {
        const errors = checkValidationErrors();
        return errors.length === 0;
    }
    
    // Find and click next/submit button
    async function proceedToNext() {
        log('🔍 Looking for navigation buttons...');
        
        // Priority order: Next button first, then Submit button
        const buttonSelectors = [
            { selector: '[data-automation-id="nextButton"]', type: 'next' },
            { selector: 'button[aria-label*="Next"]', type: 'next' },
            { selector: '[data-automation-id="submitButton"]', type: 'submit' },
            { selector: 'button[type="submit"]', type: 'submit' },
            { selector: 'button[aria-label*="Submit"]', type: 'submit' }
        ];
        
        // Also search by text content
        const textSearches = [
            { text: 'Next', type: 'next' },
            { text: 'Tiếp', type: 'next' },
            { text: 'Continue', type: 'next' },
            { text: 'Submit', type: 'submit' },
            { text: 'Gửi', type: 'submit' },
            { text: 'Hoàn thành', type: 'submit' }
        ];
        
        // First try selector-based search
        for (const { selector, type } of buttonSelectors) {
            const button = document.querySelector(selector);
            if (button && isElementClickable(button)) {
                log(`Found ${type} button via selector: ${button.textContent.trim()}`);
                return await clickNavigationButton(button, type);
            }
        }
        
        // Then try text-based search
        const allButtons = document.querySelectorAll('button');
        for (const { text, type } of textSearches) {
            const button = Array.from(allButtons).find(btn => 
                btn.textContent.toLowerCase().includes(text.toLowerCase()) && 
                isElementClickable(btn)
            );
            
            if (button) {
                log(`Found ${type} button via text: ${button.textContent.trim()}`);
                return await clickNavigationButton(button, type);
            }
        }
        
        log('❌ No navigation buttons found', 'warning');
        return false;
    }
    
    // Find and click "Submit another response" button
    async function clickSubmitAnother() {
        log('🔍 Looking for "Submit another response" button...');
        
        // Multiple selectors to find the submit another button
        const selectors = [
            '[data-automation-id="submitAnother"]',
            'div[class*="hw-"] span[data-automation-id="submitAnother"]',
            'div[tabindex="0"][role="link"] span[data-automation-id="submitAnother"]',
            'span[data-automation-id="submitAnother"]'
        ];
        
        // Also search by text content
        const textSearches = [
            'Submit another response',
            'Gửi phản hồi khác',
            'Submit another',
            'Gửi thêm'
        ];
        
        // Try selector-based search first
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && isElementVisible(element)) {
                // Check if it's clickable (the element or its parent)
                let clickableElement = element;
                if (!isElementClickable(element)) {
                    // Try parent elements
                    clickableElement = element.closest('div[role="link"]') || 
                                     element.closest('div[tabindex="0"]') || 
                                     element.parentElement;
                }
                
                if (clickableElement && isElementClickable(clickableElement)) {
                    log(`Found submit another button via selector: ${selector}`);
                    return await performSubmitAnotherClick(clickableElement);
                }
            }
        }
        
        // Try text-based search
        const allElements = document.querySelectorAll('div, span, button, a');
        for (const text of textSearches) {
            const element = Array.from(allElements).find(el => 
                el.textContent.toLowerCase().includes(text.toLowerCase()) && 
                isElementVisible(el)
            );
            
            if (element) {
                let clickableElement = element;
                if (!isElementClickable(element)) {
                    clickableElement = element.closest('div[role="link"]') || 
                                     element.closest('div[tabindex="0"]') || 
                                     element.parentElement;
                }
                
                if (clickableElement && isElementClickable(clickableElement)) {
                    log(`Found submit another button via text: "${text}"`);
                    return await performSubmitAnotherClick(clickableElement);
                }
            }
        }
        
        log('❌ Submit another response button not found', 'warning');
        return false;
    }
    
    async function performSubmitAnotherClick(element) {
        try {
            log(`🎯 Clicking submit another response: "${element.textContent.trim()}"`);
            
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(800, 1200);
            
            // Try multiple click methods
            let success = false;
            
            // Method 1: Direct click
            try {
                element.click();
                await randomDelay(1000, 1500);
                
                // Check if we're back to form (look for question elements)
                const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
                if (questions.length > 0) {
                    log('✅ Submit another response successful - form reloaded');
                    success = true;
                }
            } catch (e) {
                log(`Direct click failed: ${e.message}`, 'warning');
            }
            
            // Method 2: MouseEvent simulation
            if (!success) {
                try {
                    const rect = element.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    element.dispatchEvent(new MouseEvent('mousedown', { 
                        bubbles: true, 
                        cancelable: true,
                        clientX: centerX,
                        clientY: centerY
                    }));
                    await randomDelay(50, 100);
                    element.dispatchEvent(new MouseEvent('mouseup', { 
                        bubbles: true, 
                        cancelable: true,
                        clientX: centerX,
                        clientY: centerY
                    }));
                    element.dispatchEvent(new MouseEvent('click', { 
                        bubbles: true, 
                        cancelable: true,
                        clientX: centerX,
                        clientY: centerY
                    }));
                    
                    await randomDelay(1000, 1500);
                    
                    // Check if we're back to form
                    const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
                    if (questions.length > 0) {
                        log('✅ Submit another response successful via MouseEvent - form reloaded');
                        success = true;
                    }
                } catch (e) {
                    log(`MouseEvent simulation failed: ${e.message}`, 'warning');
                }
            }
            
            // Method 3: Keyboard interaction
            if (!success) {
                try {
                    element.focus();
                    await randomDelay(200, 300);
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true }));
                    
                    await randomDelay(1000, 1500);
                    
                    // Check if we're back to form
                    const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
                    if (questions.length > 0) {
                        log('✅ Submit another response successful via keyboard - form reloaded');
                        success = true;
                    }
                } catch (e) {
                    log(`Keyboard interaction failed: ${e.message}`, 'warning');
                }
            }
            
            return success;
            
        } catch (error) {
            log(`Error clicking submit another response: ${error.message}`, 'error');
            return false;
        }
    }

    async function clickNavigationButton(button, type) {
        try {
            log(`🎯 Clicking ${type} button: "${button.textContent.trim()}"`);
            
            // Scroll to button and wait
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(500, 800);
            
            // Click the button
            button.click();
            
            if (type === 'next') {
                // For next button, prepare for new page
                log('📄 Navigating to next page...');
                
                // Reset state for new page
                processedQuestions.clear();
                currentRetry = 0;
                totalFilled = 0; // Reset counter for new page
                
                // Wait for page transition
                await randomDelay(1000, 1500);
                
                // Restart the filling process on new page
                setTimeout(() => {
                    log('🔄 New page loaded, restarting QuickFill...');
                    quickFillForm();
                }, 1000);
                
                return true;
            } else if (type === 'submit') {
                // For submit button, we're done
                formSubmissionCount++;
                log('🎉 Form submitted successfully!', 'success');
                log(`📊 Total fields filled across all pages: ${totalFilled}`, 'success');
                log(`📈 Form submission #${formSubmissionCount}`, 'success');
                
                // Check if we should submit another response
                if (CONFIG.autoSubmitAnother && 
                    (CONFIG.maxFormSubmissions === 0 || formSubmissionCount < CONFIG.maxFormSubmissions)) {
                    
                    log(`🔄 Auto-submit another enabled. Submission ${formSubmissionCount}/${CONFIG.maxFormSubmissions === 0 ? '∞' : CONFIG.maxFormSubmissions}`);
                    
                    // Wait for submit confirmation page to load
                    await randomDelay(2000, 3000);
                    
                    // Look for "Submit another response" button
                    const submitAnotherSuccess = await clickSubmitAnother();
                    if (submitAnotherSuccess) {
                        log('🔄 Starting new form cycle...', 'success');
                        // Reset state for new form (but keep submission count)
                        processedQuestions.clear();
                        currentRetry = 0;
                        totalFilled = 0;
                        
                        // Wait for new form to load and restart
                        setTimeout(() => {
                            log(`🆕 New form loaded, restarting QuickFill... (Cycle #${formSubmissionCount + 1})`);
                            quickFillForm();
                        }, 2000);
                    } else {
                        log('ℹ️ Submit another response button not found - stopping auto-repeat', 'warning');
                    }
                } else if (CONFIG.maxFormSubmissions > 0 && formSubmissionCount >= CONFIG.maxFormSubmissions) {
                    log(`🏁 Reached maximum form submissions (${CONFIG.maxFormSubmissions}). Stopping.`, 'success');
                } else {
                    log('ℹ️ Auto-submit another disabled in config', 'info');
                }
                
                return true;
            }
            
        } catch (error) {
            log(`Error clicking ${type} button: ${error.message}`, 'error');
            return false;
        }
        
        return false;
    }
    
    // Main execution function
    async function quickFillForm() {
        try {
            log(`Starting QuickFill attempt ${currentRetry + 1}/${CONFIG.maxRetries}`);
            
            let sessionFilled = 0;
            
            // Fill choice questions (main content)
            log('🔄 Filling choice questions...');
            sessionFilled += await fillChoiceQuestions();
            
            // Fill text fields
            log('🔄 Filling text fields...');
            sessionFilled += await fillTextFields();
            
            totalFilled += sessionFilled;
            
            if (sessionFilled > 0) {
                log(`Filled ${sessionFilled} fields in this session (Total: ${totalFilled})`, 'success');
                
                // Wait for form to update
                await randomDelay(500, 800);
            }
            
            // Check validation errors
            const errors = checkValidationErrors();
            if (errors.length > 0) {
                log('⚠️ Validation errors found:', 'warning');
                errors.forEach(error => log(`  • ${error}`, 'warning'));
                
                // If we filled something this session but still have errors, retry
                if (sessionFilled > 0 && currentRetry < CONFIG.maxRetries - 1) {
                    currentRetry++;
                    log(`🔄 Retrying after filling ${sessionFilled} fields in ${CONFIG.retryInterval/1000} seconds...`);
                    setTimeout(quickFillForm, CONFIG.retryInterval);
                    return;
                } else if (sessionFilled === 0 && currentRetry < CONFIG.maxRetries - 1) {
                    // If we didn't fill anything, try harder
                    currentRetry++;
                    log(`🔄 No progress made, retrying with different approach in ${CONFIG.retryInterval/1000} seconds...`);
                    setTimeout(quickFillForm, CONFIG.retryInterval);
                    return;
                } else {
                    log('⚠️ Max retries reached with validation errors remaining', 'warning');
                    // Still try to proceed in case validation is overly strict
                    const proceeded = await proceedToNext();
                    if (!proceeded) {
                        log('❌ Cannot proceed due to validation errors and max retries reached', 'error');
                    }
                    return;
                }
            } else {
                log('✅ No validation errors found!', 'success');
                
                // Try to proceed to next page or submit
                const proceeded = await proceedToNext();
                if (proceeded) {
                    // proceedToNext handles the continuation logic
                    return;
                } else {
                    log('🎉 Form appears to be complete! No navigation buttons found.', 'success');
                }
            }
            
            // Final summary
            log(`🎯 QuickFill Session Complete!`, 'success');
            log(`📊 Total fields filled: ${totalFilled}`);
            
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
    
    // Initialize
    log('🎯 QuickFill Microsoft Forms Enhanced Script v2.0');
    log('⚙️ Configuration:');
    log(`  📊 Rating range: ${CONFIG.ratingMin}-${CONFIG.ratingMax} (Likert: 3-5)`);
    log(`  🚫 Avoid "Other": ${CONFIG.avoidOther}`);
    log(`  ⏱️ Natural delays: ${CONFIG.naturalDelay} (Tăng tốc)`);
    log(`  🔄 Max retries: ${CONFIG.maxRetries}`);
    log(`  🎯 Multiple choice strategy: ${CONFIG.multipleChoiceStrategy}`);
    log(`  ☑️ Max checkbox selections: ${CONFIG.checkboxMaxSelections}`);
    log(`  👍 Prefer positive answers: ${CONFIG.preferPositiveAnswers}`);
    log(`  🌐 Text language: ${CONFIG.textLanguage}`);
    log(`  🎯 Special radio questions: ${CONFIG.specialRadioQuestions.length} configured`);
    log(`  🔄 Auto-submit another: ${CONFIG.autoSubmitAnother}`);
    log(`  🔢 Max submissions: ${CONFIG.maxFormSubmissions === 0 ? 'Unlimited' : CONFIG.maxFormSubmissions}`);
    
    // Log special questions for reference
    log('📋 Special Radio Questions:');
    CONFIG.specialRadioQuestions.forEach((sq, index) => {
        log(`  ${index + 1}. [${sq.keywords.join(', ')}] → "${sq.defaultAnswer}"`);
    });
    log('');
    
    // Analyze current page
    const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
    const choiceItems = document.querySelectorAll('[data-automation-id="choiceItem"]');
    const likertTables = document.querySelectorAll('table[aria-labelledby], table');
    const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const radios = document.querySelectorAll('input[type="radio"]');
    
    log('📊 Page Analysis:');
    log(`  � Total questions: ${questions.length}`);
    log(`  🎯 Choice items: ${choiceItems.length}`);
    log(`  📊 Likert tables: ${likertTables.length}`);
    log(`  ✍️ Text inputs: ${textInputs.length}`);
    log(`  ☑️ Checkboxes: ${checkboxes.length}`);
    log(`  🔘 Radio buttons: ${radios.length}`);
    log('');
    
    // Start filling after a short delay
    setTimeout(quickFillForm, 1000);
    
})();

// 📋 Instructions:
// 1. Open Microsoft Forms page
// 2. Press F12 → Console tab  
// 3. Copy-paste this entire script and press Enter
// 4. Script will automatically fill all questions and navigate through pages
// 
// 🎯 Features:
// ✅ Likert scale tables (smart 4-5 rating selection)
// ✅ Multiple choice questions (radio buttons)
// ✅ Checkbox questions (multiple selections)
// ✅ Text fields (contextual content generation)
// ✅ Rating questions (high rating preference)
// ✅ Smart positive answer preference
// ✅ Multi-language support (Vietnamese/English)
// ✅ Auto page navigation and form submission
// ✅ Comprehensive error handling and retry logic
// ✅ Natural typing simulation
// ✅ "Other" option avoidance

console.log('🚀 QuickFill Enhanced Script v2.0 loaded! Starting in 1 second...');