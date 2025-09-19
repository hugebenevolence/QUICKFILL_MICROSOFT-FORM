// 🔍 Microsoft Forms Structure Debug Script
// Copy-paste script này vào Console để phân tích cấu trúc form

(function() {
    'use strict';
    
    console.log('🔍 Microsoft Forms Structure Debug Script');
    console.log('=' .repeat(60));
    
    // Utility function
    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return element.offsetParent !== null && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }
    
    function getElementInfo(element, index) {
        const info = {
            index: index + 1,
            tagName: element.tagName,
            type: element.type || 'N/A',
            id: element.id || 'N/A',
            name: element.name || 'N/A',
            className: element.className || 'N/A',
            value: element.value || 'N/A',
            checked: element.checked || false,
            required: element.required || element.getAttribute('aria-required') === 'true',
            visible: isElementVisible(element),
            innerHTML: element.innerHTML ? element.innerHTML.substring(0, 100) + '...' : 'N/A',
            outerHTML: element.outerHTML ? element.outerHTML.substring(0, 200) + '...' : 'N/A'
        };
        return info;
    }
    
    function findParentWithText(element, levels = 3) {
        let current = element;
        let level = 0;
        
        while (current && level < levels) {
            const textContent = current.textContent?.trim();
            if (textContent && textContent.length > 5 && textContent.length < 200) {
                return {
                    level: level,
                    element: current.tagName,
                    text: textContent.substring(0, 100),
                    className: current.className || 'N/A'
                };
            }
            current = current.parentElement;
            level++;
        }
        return null;
    }
    
    // 1. Analyze all form elements
    console.log('📋 1. ALL FORM ELEMENTS ANALYSIS');
    console.log('-'.repeat(40));
    
    const allInputs = document.querySelectorAll('input, textarea, select, button');
    console.log(`Total form elements found: ${allInputs.length}`);
    
    allInputs.forEach((element, index) => {
        if (isElementVisible(element)) {
            const info = getElementInfo(element, index);
            console.log(`\n🔸 Element ${info.index}:`);
            console.log(`  Tag: ${info.tagName} | Type: ${info.type} | Visible: ${info.visible}`);
            console.log(`  ID: ${info.id} | Name: ${info.name}`);
            console.log(`  Class: ${info.className}`);
            console.log(`  Value: ${info.value} | Checked: ${info.checked} | Required: ${info.required}`);
            
            // Find parent context
            const parentInfo = findParentWithText(element);
            if (parentInfo) {
                console.log(`  Parent Context: ${parentInfo.text}`);
            }
            
            console.log(`  HTML: ${info.outerHTML}`);
        }
    });
    
    // 2. Analyze radio button groups specifically
    console.log('\n\n🔘 2. RADIO BUTTON GROUPS ANALYSIS');
    console.log('-'.repeat(40));
    
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    const radioGroups = {};
    
    radioInputs.forEach(radio => {
        const name = radio.name || radio.getAttribute('aria-describedby') || radio.id || 'unnamed';
        if (!radioGroups[name]) radioGroups[name] = [];
        radioGroups[name].push(radio);
    });
    
    console.log(`Total radio groups found: ${Object.keys(radioGroups).length}`);
    
    Object.entries(radioGroups).forEach(([groupName, radios], groupIndex) => {
        console.log(`\n🔸 Radio Group ${groupIndex + 1}: "${groupName}"`);
        console.log(`  Total options: ${radios.length}`);
        console.log(`  Visible options: ${radios.filter(r => isElementVisible(r)).length}`);
        console.log(`  Checked options: ${radios.filter(r => r.checked).length}`);
        
        radios.forEach((radio, radioIndex) => {
            if (isElementVisible(radio)) {
                console.log(`    Option ${radioIndex + 1}:`);
                console.log(`      ID: ${radio.id || 'N/A'}`);
                console.log(`      Value: ${radio.value || 'N/A'}`);
                console.log(`      Checked: ${radio.checked}`);
                console.log(`      Required: ${radio.required || radio.getAttribute('aria-required') === 'true'}`);
                
                // Try to find label
                const labelMethods = [
                    () => document.querySelector(`label[for="${radio.id}"]`)?.textContent?.trim(),
                    () => radio.closest('label')?.textContent?.trim(),
                    () => radio.nextElementSibling?.textContent?.trim(),
                    () => radio.parentNode?.textContent?.trim(),
                    () => radio.getAttribute('aria-label')
                ];
                
                let label = 'N/A';
                for (const method of labelMethods) {
                    try {
                        const result = method();
                        if (result && result.length > 0) {
                            label = result.substring(0, 50);
                            break;
                        }
                    } catch (e) {}
                }
                console.log(`      Label: ${label}`);
                
                // Find question context
                const questionMethods = [
                    () => radio.closest('[data-automation-id="questionTitle"]')?.textContent?.trim(),
                    () => radio.closest('.office-form-question')?.querySelector('.question-title')?.textContent?.trim(),
                    () => radio.closest('.form-question')?.querySelector('h3, h4, .question-text')?.textContent?.trim(),
                    () => radio.closest('.question')?.querySelector('.question-text, h3, h4')?.textContent?.trim(),
                    () => radio.closest('[role="group"]')?.getAttribute('aria-labelledby') ? 
                          document.getElementById(radio.closest('[role="group"]').getAttribute('aria-labelledby'))?.textContent?.trim() : null
                ];
                
                let question = 'N/A';
                for (const method of questionMethods) {
                    try {
                        const result = method();
                        if (result && result.length > 3) {
                            question = result.substring(0, 100);
                            break;
                        }
                    } catch (e) {}
                }
                console.log(`      Question: ${question}`);
                console.log(`      HTML: ${radio.outerHTML.substring(0, 150)}...`);
            }
        });
    });
    
    // 3. Analyze validation errors
    console.log('\n\n⚠️ 3. VALIDATION ERRORS ANALYSIS');
    console.log('-'.repeat(40));
    
    const errorSelectors = [
        '.validation-error',
        '.error-message', 
        '.field-error',
        '[role="alert"]',
        '.ms-TextField-errorMessage',
        '.office-form-question-error',
        '[data-automation-id="errorMessage"]',
        '[data-automation-id="validationError"]',
        // Additional common error selectors
        '.error',
        '.invalid',
        '.has-error',
        '[aria-invalid="true"]',
        '.form-error',
        '.validation-message'
    ];
    
    const allErrors = [];
    errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (isElementVisible(el) && el.textContent.trim()) {
                allErrors.push({
                    selector: selector,
                    text: el.textContent.trim(),
                    element: el.tagName,
                    className: el.className,
                    html: el.outerHTML.substring(0, 200) + '...'
                });
            }
        });
    });
    
    console.log(`Total validation errors found: ${allErrors.length}`);
    allErrors.forEach((error, index) => {
        console.log(`\n🔸 Error ${index + 1}:`);
        console.log(`  Selector: ${error.selector}`);
        console.log(`  Text: ${error.text}`);
        console.log(`  Element: ${error.element}`);
        console.log(`  Class: ${error.className}`);
        console.log(`  HTML: ${error.html}`);
    });
    
    // 4. Analyze page structure
    console.log('\n\n📄 4. PAGE STRUCTURE ANALYSIS');
    console.log('-'.repeat(40));
    
    // Look for question containers
    const questionSelectors = [
        '[data-automation-id="questionTitle"]',
        '.office-form-question',
        '.form-question',
        '.question',
        '[role="group"]',
        '.ms-ChoiceField',
        '.ms-TextField',
        '[data-automation-id="question"]'
    ];
    
    questionSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`\n🔸 Selector "${selector}": ${elements.length} elements found`);
        
        elements.forEach((element, index) => {
            if (isElementVisible(element) && index < 5) { // Limit to first 5 for readability
                console.log(`  Element ${index + 1}:`);
                console.log(`    Text: ${element.textContent?.trim().substring(0, 100) || 'N/A'}`);
                console.log(`    Class: ${element.className || 'N/A'}`);
                console.log(`    Children: ${element.children.length}`);
                
                // Check for form inputs inside
                const inputs = element.querySelectorAll('input, textarea, select');
                console.log(`    Form inputs inside: ${inputs.length}`);
                inputs.forEach((input, inputIndex) => {
                    console.log(`      Input ${inputIndex + 1}: ${input.tagName} type="${input.type || 'N/A'}" name="${input.name || 'N/A'}"`);
                });
            }
        });
    });
    
    // 5. Check for Microsoft Forms specific patterns
    console.log('\n\n🎯 5. MICROSOFT FORMS SPECIFIC PATTERNS');
    console.log('-'.repeat(40));
    
    // Check for Office UI Fabric patterns
    const fabricSelectors = [
        '.ms-ChoiceField',
        '.ms-ChoiceField-field',
        '.ms-ChoiceField-wrapper',
        '.ms-TextField',
        '.ms-TextField-field',
        '[data-automation-id*="choice"]',
        '[data-automation-id*="text"]',
        '[data-automation-id*="question"]'
    ];
    
    fabricSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`\n🔸 ${selector}: ${elements.length} elements`);
            Array.from(elements).slice(0, 3).forEach((el, index) => {
                console.log(`  ${index + 1}. ${el.tagName} - ${el.textContent?.trim().substring(0, 80) || 'No text'}`);
                console.log(`     Classes: ${el.className}`);
                console.log(`     Data attrs: ${Array.from(el.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
            });
        }
    });
    
    // 6. Final summary
    console.log('\n\n📊 6. SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total visible form elements: ${Array.from(allInputs).filter(el => isElementVisible(el)).length}`);
    console.log(`Radio button groups: ${Object.keys(radioGroups).length}`);
    console.log(`Validation errors: ${allErrors.length}`);
    console.log(`Questions found: ${document.querySelectorAll('[data-automation-id="questionTitle"], .office-form-question, .form-question, .question').length}`);
    
    console.log('\n✅ Debug analysis complete! Check the logs above for detailed form structure.');
    console.log('💡 Use this information to improve the QuickFill script selectors.');
    
})();

console.log('🔍 Debug script loaded! Analysis starting...');