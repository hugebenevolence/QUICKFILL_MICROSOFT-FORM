// QuickFill Debug Script
// Run this in console on Microsoft Forms page to check status

console.log('🔍 QuickFill Extension Debug Check');

// Check if extension content script is loaded
if (window.advancedQuickFillHandler) {
    console.log('✅ Advanced QuickFill handler found');
    console.log('📋 Handler config:', window.advancedQuickFillHandler.config);
} else {
    console.log('❌ Advanced QuickFill handler NOT found');
}

// Check Chrome runtime
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome runtime available');
    console.log('📍 Extension ID:', chrome.runtime.id);
} else {
    console.log('❌ Chrome runtime NOT available');
}

// Check page URL
console.log('📍 Current URL:', window.location.href);
console.log('🌐 Is Microsoft Forms?', 
    window.location.href.includes('forms.office.com') || 
    window.location.href.includes('forms.microsoft.com') ||
    window.location.href.includes('forms.cloud.microsoft')
);

// Check for form elements
const radioInputs = document.querySelectorAll('input[type="radio"]');
const textInputs = document.querySelectorAll('input[type="text"], textarea');
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const dropdowns = document.querySelectorAll('select');

console.log('📊 Form elements found:');
console.log('  🔘 Radio inputs:', radioInputs.length);
console.log('  📝 Text inputs:', textInputs.length);
console.log('  ☑️ Checkboxes:', checkboxes.length);
console.log('  📋 Dropdowns:', dropdowns.length);

// Test message sending capability
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('🧪 Testing message communication...');
    
    // Send a test message
    chrome.runtime.sendMessage({action: 'test'}, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Message test failed:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Message test successful:', response);
        }
    });
} else {
    console.log('⚠️ Cannot test message communication - Chrome runtime not available');
}

console.log('🏁 Debug check complete');