// Background script for WhatsApp Web Bulk Messenger
chrome.runtime.onInstalled.addListener(() => {
  console.log('WhatsBlitz installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkWhatsAppTab') {
    chrome.tabs.query({url: 'https://web.whatsapp.com/*'}, (tabs) => {
      sendResponse({
        isOpen: tabs.length > 0,
        tabId: tabs.length > 0 ? tabs[0].id : null
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'focusWhatsAppTab') {
    chrome.tabs.query({url: 'https://web.whatsapp.com/*'}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, {active: true});
        chrome.windows.update(tabs[0].windowId, {focused: true});
      }
    });
  }
  
  if (request.action === 'executeScript') {
    chrome.scripting.executeScript({
      target: {tabId: request.tabId},
      func: request.func,
      args: request.args || []
    }, (results) => {
      sendResponse(results?.[0]?.result);
    });
    return true;
  }
});

// Handle popup messages
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onMessage.addListener((msg) => {
      if (msg.action === 'getWhatsAppStatus') {
        chrome.tabs.query({url: 'https://web.whatsapp.com/*'}, (tabs) => {
          port.postMessage({
            action: 'whatsappStatus',
            isOpen: tabs.length > 0,
            tabId: tabs.length > 0 ? tabs[0].id : null
          });
        });
      }
    });
  }
});