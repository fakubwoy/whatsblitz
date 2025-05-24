// Popup script
document.addEventListener('DOMContentLoaded', function() {
    const statusIcon = document.querySelector('.status-icon');
    const statusText = document.getElementById('status-text');
    
    // Connect to background script
    const port = chrome.runtime.connect({name: 'popup'});
    
    // Check WhatsApp status
    port.postMessage({action: 'getWhatsAppStatus'});
    
    port.onMessage.addListener((msg) => {
        if (msg.action === 'whatsappStatus') {
            if (msg.isOpen) {
                statusIcon.textContent = '✅';
                statusText.textContent = 'WhatsApp Web is open';
                statusText.style.color = '#25D366';
            } else {
                statusIcon.textContent = '❌';
                statusText.textContent = 'WhatsApp Web is not open';
                statusText.style.color = '#e74c3c';
            }
        }
    });
});