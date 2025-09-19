// 🔍 Microsoft Forms Click Debug Script
// Test different click methods to find what works

(async function() {
    'use strict';
    
    console.log('🔍 Microsoft Forms Click Debug Script');
    console.log('=' .repeat(60));
    
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
    
    // Find first question with choice items
    const questions = document.querySelectorAll('[data-automation-id="questionItem"]');
    let testQuestion = null;
    let testChoices = [];
    
    for (const question of questions) {
        if (!isElementVisible(question)) continue;
        
        const choiceItems = question.querySelectorAll('[data-automation-id="choiceItem"]');
        if (choiceItems.length > 0) {
            testQuestion = question;
            testChoices = Array.from(choiceItems).filter(choice => isElementVisible(choice));
            break;
        }
    }
    
    if (!testQuestion || testChoices.length === 0) {
        console.log('❌ No suitable question found for testing');
        return;
    }
    
    const questionText = testQuestion.querySelector('[data-automation-id="questionTitle"]')?.textContent?.trim() || 'Unknown';
    console.log(`🎯 Testing with question: "${questionText}"`);
    console.log(`📋 Found ${testChoices.length} choice options:`);
    
    testChoices.forEach((choice, index) => {
        console.log(`  ${index + 1}. "${choice.textContent.trim()}"`);
        console.log(`     Classes: ${choice.className}`);
        console.log(`     Data attrs: ${Array.from(choice.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
        console.log(`     Parent: ${choice.parentElement?.tagName} (${choice.parentElement?.className})`);
    });
    
    // Test different click methods
    const testChoice = testChoices[0];
    console.log(`\n🧪 Testing clicks on: "${testChoice.textContent.trim()}"`);
    
    // Method 1: Direct click
    console.log('\n1️⃣ Testing direct click...');
    try {
        testChoice.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        const isSelected1 = testChoice.getAttribute('aria-checked') === 'true' || 
                           testChoice.classList.contains('selected') ||
                           testChoice.querySelector('input')?.checked;
        console.log(`   Result: ${isSelected1 ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 2: MouseEvent simulation
    console.log('\n2️⃣ Testing MouseEvent simulation...');
    try {
        testChoice.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        testChoice.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        testChoice.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 500));
        const isSelected2 = testChoice.getAttribute('aria-checked') === 'true' || 
                           testChoice.classList.contains('selected') ||
                           testChoice.querySelector('input')?.checked;
        console.log(`   Result: ${isSelected2 ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 3: Focus + Space/Enter key
    console.log('\n3️⃣ Testing focus + keyboard...');
    try {
        testChoice.focus();
        testChoice.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        testChoice.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 500));
        const isSelected3 = testChoice.getAttribute('aria-checked') === 'true' || 
                           testChoice.classList.contains('selected') ||
                           testChoice.querySelector('input')?.checked;
        console.log(`   Result: ${isSelected3 ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 4: Click on hidden input (if exists)
    console.log('\n4️⃣ Testing hidden input click...');
    try {
        const hiddenInput = testChoice.querySelector('input') || 
                           testChoice.parentElement?.querySelector('input') ||
                           document.querySelector(`input[value="${testChoice.textContent.trim()}"]`);
        
        if (hiddenInput) {
            console.log(`   Found hidden input: ${hiddenInput.tagName} type="${hiddenInput.type}" name="${hiddenInput.name}"`);
            hiddenInput.checked = true;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 500));
            const isSelected4 = hiddenInput.checked;
            console.log(`   Result: ${isSelected4 ? '✅ SUCCESS' : '❌ FAILED'}`);
        } else {
            console.log(`   No hidden input found`);
        }
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 5: Click parent element
    console.log('\n5️⃣ Testing parent element click...');
    try {
        const parent = testChoice.parentElement;
        if (parent) {
            parent.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            const isSelected5 = testChoice.getAttribute('aria-checked') === 'true' || 
                               testChoice.classList.contains('selected') ||
                               testChoice.querySelector('input')?.checked;
            console.log(`   Result: ${isSelected5 ? '✅ SUCCESS' : '❌ FAILED'}`);
        }
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 6: Click with coordinates
    console.log('\n6️⃣ Testing coordinate-based click...');
    try {
        const rect = testChoice.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        testChoice.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        }));
        await new Promise(resolve => setTimeout(resolve, 500));
        const isSelected6 = testChoice.getAttribute('aria-checked') === 'true' || 
                           testChoice.classList.contains('selected') ||
                           testChoice.querySelector('input')?.checked;
        console.log(`   Result: ${isSelected6 ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 7: Find and click label
    console.log('\n7️⃣ Testing label click...');
    try {
        const label = testChoice.querySelector('label') || 
                     testChoice.closest('label') ||
                     document.querySelector(`label[for="${testChoice.id}"]`);
        
        if (label) {
            console.log(`   Found label: ${label.textContent.trim()}`);
            label.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            const isSelected7 = testChoice.getAttribute('aria-checked') === 'true' || 
                               testChoice.classList.contains('selected') ||
                               testChoice.querySelector('input')?.checked;
            console.log(`   Result: ${isSelected7 ? '✅ SUCCESS' : '❌ FAILED'}`);
        } else {
            console.log(`   No label found`);
        }
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Method 8: Try to find the actual clickable element within
    console.log('\n8️⃣ Testing clickable child elements...');
    try {
        const clickableElements = testChoice.querySelectorAll('*');
        let success = false;
        
        for (const element of clickableElements) {
            const style = window.getComputedStyle(element);
            if (style.cursor === 'pointer' || element.onclick || element.getAttribute('role') === 'button') {
                console.log(`   Trying clickable child: ${element.tagName} (${element.className})`);
                element.click();
                await new Promise(resolve => setTimeout(resolve, 300));
                const isSelected8 = testChoice.getAttribute('aria-checked') === 'true' || 
                                   testChoice.classList.contains('selected') ||
                                   testChoice.querySelector('input')?.checked;
                if (isSelected8) {
                    console.log(`   Result: ✅ SUCCESS with ${element.tagName}`);
                    success = true;
                    break;
                }
            }
        }
        
        if (!success) {
            console.log(`   Result: ❌ No clickable child worked`);
        }
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }
    
    // Final state check
    console.log('\n🔍 Final State Analysis:');
    testChoices.forEach((choice, index) => {
        const isSelected = choice.getAttribute('aria-checked') === 'true' || 
                          choice.classList.contains('selected') ||
                          choice.querySelector('input')?.checked ||
                          choice.classList.contains('is-checked');
        
        console.log(`  ${index + 1}. "${choice.textContent.trim()}" - ${isSelected ? '✅ SELECTED' : '❌ Not selected'}`);
        
        if (isSelected) {
            console.log(`     Selected via: aria-checked=${choice.getAttribute('aria-checked')}, classes=${choice.className}`);
        }
    });
    
    console.log('\n✅ Click debug analysis complete!');
    console.log('💡 Use the successful method in your QuickFill script.');
    
})();

console.log('🔍 Click Debug Script loaded! Analysis starting...');