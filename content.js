// Content script for WhatsApp Web automation
class WhatsAppAutomation {
  constructor() {
    this.isRunning = false;
    this.currentIndex = 0;
    this.contacts = [];
    this.messageHistory = this.loadMessageHistory();
    this.initializeSidebar();
  }

  // Initialize floating sidebar
  initializeSidebar() {
    if (document.getElementById('wa-bulk-sidebar')) return;
    
    const sidebar = document.createElement('div');
    sidebar.id = 'wa-bulk-sidebar';
    sidebar.innerHTML = `
      <div class="wa-sidebar-header">
        <h3>⚡WhatsBlitz⚡</h3>
        <button id="wa-toggle-btn">−</button>
      </div>
      <div class="wa-sidebar-content">
        <div class="wa-upload-section">
          <div class="wa-file-drop" id="wa-file-drop">
            <p>📄 Drag & Drop CSV/Excel file here</p>
            <p>or</p>
            <input type="file" id="wa-file-input" accept=".csv,.xlsx,.xls" style="display: none;">
            <button id="wa-browse-btn">Browse Files</button>
          </div>
        </div>
        
        <div class="wa-contacts-preview" id="wa-contacts-preview" style="display: none;">
          <h4>Contacts Preview:</h4>
          <div id="wa-contacts-list"></div>
          <div class="wa-controls">
            <button id="wa-start-btn" class="wa-primary-btn">Start Sending</button>
            <button id="wa-stop-btn" class="wa-danger-btn" style="display: none;">Stop</button>
          </div>
        </div>
        
        <div class="wa-progress" id="wa-progress" style="display: none;">
          <div class="wa-progress-bar">
            <div class="wa-progress-fill" id="wa-progress-fill"></div>
          </div>
          <div class="wa-progress-text" id="wa-progress-text">0% completed</div>
        </div>
        
        <div class="wa-history-section">
          <h4>📋 Message History</h4>
          <div class="wa-history-list" id="wa-history-list"></div>
          <button id="wa-clear-history">Clear History</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(sidebar);
    this.attachEventListeners();
    this.updateHistoryDisplay();
  }

  // Attach event listeners
  attachEventListeners() {
    // Toggle sidebar
    document.getElementById('wa-toggle-btn').onclick = () => {
      const content = document.querySelector('.wa-sidebar-content');
      const btn = document.getElementById('wa-toggle-btn');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = '−';
      } else {
        content.style.display = 'none';
        btn.textContent = '+';
      }
    };

    // File input
    document.getElementById('wa-browse-btn').onclick = () => {
      document.getElementById('wa-file-input').click();
    };
    
    document.getElementById('wa-file-input').onchange = (e) => {
      this.handleFileUpload(e.target.files[0]);
    };

    // Drag and drop
    const dropZone = document.getElementById('wa-file-drop');
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add('wa-drag-over');
    };
    
    dropZone.ondragleave = () => {
      dropZone.classList.remove('wa-drag-over');
    };
    
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('wa-drag-over');
      this.handleFileUpload(e.dataTransfer.files[0]);
    };

    // Control buttons
    document.getElementById('wa-start-btn').onclick = () => this.startAutomation();
    document.getElementById('wa-stop-btn').onclick = () => this.stopAutomation();
    document.getElementById('wa-clear-history').onclick = () => this.clearHistory();
    document.getElementById('wa-debug-btn').onclick = () => this.debugWhatsApp();
  }

  // Debug WhatsApp elements
  debugWhatsApp() {
    console.log('=== WhatsApp Debug Info ===');
    console.log('URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Check all possible search box selectors
    const searchSelectors = [
      '[data-testid="chat-list-search"]',
      'div[title="Search or start new chat"]',
      '[data-testid="search-container"] div[role="textbox"]',
      'div[contenteditable="true"][data-tab="3"]',
      '#side div[contenteditable="true"]',
      'div[role="textbox"][title*="Search"]',
      'div[role="textbox"][placeholder*="Search"]',
      'input[placeholder*="Search"]',
      'div[data-testid="search-input"]',
      'div[role="textbox"][aria-label*="Search"]'
    ];
    
    console.log('Search box elements found:');
    searchSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      console.log(`${selector}: ${!!element}`, element);
    });
    
    // Check main panel selectors
    const mainSelectors = [
      '[data-testid="conversation-panel-wrapper"]',
      '#main',
      'div[data-testid="conversation-info-header"]',
      '[data-testid="main"]',
      'div[role="main"]',
      '.main-panel'
    ];
    
    console.log('Main panel elements found:');
    mainSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      console.log(`${selector}: ${!!element}`, element);
    });
    
    // Check chat list
    const chatListSelectors = [
      '[data-testid="chat-list"]',
      '#pane-side',
      'div[aria-label="Chat list"]',
      '[data-testid="side"]'
    ];
    
    console.log('Chat list elements found:');
    chatListSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      console.log(`${selector}: ${!!element}`, element);
    });
    
    // Show all data-testid attributes
    const elementsWithTestId = document.querySelectorAll('[data-testid]');
    console.log('All elements with data-testid:');
    const testIds = Array.from(elementsWithTestId).map(el => el.getAttribute('data-testid')).filter((value, index, self) => self.indexOf(value) === index);
    console.log(testIds.sort());
    
    this.showAlert(`Debug info logged to console. Found ${testIds.length} unique test IDs.`);
  }

  // Handle file upload and parsing
  async handleFileUpload(file) {
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    try {
      let data;
      if (fileExtension === 'csv') {
        data = await this.parseCSV(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        data = await this.parseExcel(file);
      } else {
        this.showAlert('❌ Please upload a CSV or Excel file');
        return;
      }
      
      this.contacts = data;
      this.displayContactsPreview();
      this.showAlert(`✅ Loaded ${data.length} contacts`);
    } catch (error) {
      this.showAlert('❌ Error parsing file: ' + error.message);
    }
  }

  // Parse CSV file
  // Parse CSV file - Updated to handle commas in messages
parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        const data = [];
        const errors = [];
        
        for (let i = 0; i < lines.length; i++) {
          const lineNumber = i + 1;
          const values = this.parseCSVLineForMessage(lines[i]);
          
          // Check if we have all required fields
          if (!values.phone || !values.name || !values.message) {
            errors.push(`Line ${lineNumber}: Missing required fields (phone, name, or message)`);
            continue;
          }
          
          // Validate phone number
          const phoneValidation = this.validatePhoneNumber(values.phone);
          if (!phoneValidation.isValid) {
            errors.push(`Line ${lineNumber}: ${phoneValidation.error} - "${values.phone}"`);
            continue;
          }
          
          data.push({
            phone: phoneValidation.cleanPhone,
            name: values.name.trim(),
            message: values.message.trim()
          });
        }
        
        // Show errors if any
        if (errors.length > 0) {
          const errorMessage = `Found ${errors.length} error(s) in CSV:\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`;
          this.showAlert(`⚠️ ${errorMessage}`);
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Parse CSV line specifically for phone, name, and message format
parseCSVLineForMessage(line) {
  const result = { phone: '', name: '', message: '' };
  let current = '';
  let inQuotes = false;
  let fieldIndex = 0;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes && fieldIndex < 2) {
      // Only treat comma as delimiter for first two fields (phone and name)
      if (fieldIndex === 0) {
        result.phone = current;
      } else if (fieldIndex === 1) {
        result.name = current;
      }
      current = '';
      fieldIndex++;
    } else {
      current += char;
    }
  }
  
  // Handle the last field (message) - everything after the second comma
  if (fieldIndex === 2) {
    result.message = current;
  } else if (fieldIndex === 1) {
    result.name = current;
  } else if (fieldIndex === 0) {
    result.phone = current;
  }
  
  return result;
}

  // Parse Excel file (simplified - would need SheetJS library in real implementation)
// Parse Excel file using SheetJS library
parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Load SheetJS library if not already loaded
        if (typeof XLSX === 'undefined') {
          // Dynamically load SheetJS
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = () => {
            this.processExcelData(e.target.result, resolve, reject);
          };
          script.onerror = () => {
            reject(new Error('Failed to load Excel processing library'));
          };
          document.head.appendChild(script);
        } else {
          this.processExcelData(e.target.result, resolve, reject);
        }
      } catch (error) {
        reject(new Error('Error reading Excel file: ' + error.message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

// Helper function to process Excel data
processExcelData(arrayBuffer, resolve, reject) {
  try {
    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,  // Use array of arrays format
      defval: ''  // Default value for empty cells
    });
    
    if (jsonData.length < 2) {
      reject(new Error('Excel file must have at least a header row and one data row'));
      return;
    }
    
    // Process the data (skip header row)
    const data = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row.some(cell => cell && cell.toString().trim())) {
        continue;
      }
      
      // Ensure we have at least 3 columns (phone, name, message)
      if (row.length >= 3) {
        data.push({
          phone: row[0] ? row[0].toString().trim() : '',
          name: row[1] ? row[1].toString().trim() : '',
          message: row[2] ? row[2].toString().trim() : ''
        });
      }
    }
    
    if (data.length === 0) {
      reject(new Error('No valid data found in Excel file'));
      return;
    }
    
    resolve(data);
  } catch (error) {
    reject(new Error('Error parsing Excel file: ' + error.message));
  }
}
validatePhoneNumber(phone) {
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Check if phone number is valid (should be 10-15 digits, optionally starting with +)
  const phoneRegex = /^(\+\d{1,3})?\d{10,15}$/;
  
  if (!cleanPhone || cleanPhone.length < 10) {
    return { isValid: false, error: 'Phone number too short (minimum 10 digits)' };
  }
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true, cleanPhone };
}
  // Display contacts preview
  displayContactsPreview() {
    const previewDiv = document.getElementById('wa-contacts-preview');
    const listDiv = document.getElementById('wa-contacts-list');
    
    if (this.contacts.length === 0) {
      previewDiv.style.display = 'none';
      return;
    }
    
    listDiv.innerHTML = this.contacts.slice(0, 5).map((contact, index) => `
      <div class="wa-contact-item">
        <strong>${contact.name}</strong> (${contact.phone})<br>
        <em>${this.processTemplate(contact.message, contact)}</em>
      </div>
    `).join('');
    
    if (this.contacts.length > 5) {
      listDiv.innerHTML += `<div class="wa-more-contacts">... and ${this.contacts.length - 5} more</div>`;
    }
    
    previewDiv.style.display = 'block';
  }

  // Process template placeholders
  processTemplate(template, contact) {
    return template
      .replace(/\{\{name\}\}/gi, contact.name)
      .replace(/\{\{phone\}\}/gi, contact.phone);
  }

  // Start automation process
  async startAutomation() {
  if (this.contacts.length === 0) {
    this.showAlert('❌ Please upload contacts first');
    return;
  }

  console.log('Checking if WhatsApp is ready...');
  
  const readyCheck = this.isWhatsAppReady();
  if (!readyCheck.isReady) {
    if (readyCheck.showAlert) {
      this.showAlert(`❌ ${readyCheck.reason}`);
    }
    
    // Show detailed status for debugging only if it's a technical issue
    if (!readyCheck.reason.includes('WhatsApp Web') && !readyCheck.reason.includes('QR code')) {
      setTimeout(() => {
        this.debugWhatsApp();
      }, 1000);
    }
    
    return;
  }

  console.log('WhatsApp is ready, starting automation...');
  
  this.isRunning = true;
  this.currentIndex = 0;
  
  document.getElementById('wa-start-btn').style.display = 'none';
  document.getElementById('wa-stop-btn').style.display = 'block';
  document.getElementById('wa-progress').style.display = 'block';
  
  await this.processContacts();
}

  // Stop automation
  stopAutomation() {
    this.isRunning = false;
    document.getElementById('wa-start-btn').style.display = 'block';
    document.getElementById('wa-stop-btn').style.display = 'none';
    this.showAlert('⏹️ Automation stopped');
  }

  // Process all contacts
  async processContacts() {
    for (let i = this.currentIndex; i < this.contacts.length && this.isRunning; i++) {
      const contact = this.contacts[i];
      this.currentIndex = i;
      
      try {
        const message = this.processTemplate(contact.message, contact);
        await this.sendMessage(contact.phone, message);
        
        // Log success
        this.logMessage(contact.phone, contact.name, message, 'success');
        
        this.updateProgress(i + 1, this.contacts.length);
        
        // Random delay between 5-15 seconds
        if (i < this.contacts.length - 1) {
          const delay = Math.random() * 10000 + 5000; // 5-15 seconds
          await this.sleep(delay);
        }
      } catch (error) {
        this.logMessage(contact.phone, contact.name, contact.message, 'failed', error.message);
        this.showAlert(`❌ Failed to send to ${contact.name}: ${error.message}`);
      }
    }
    
    if (this.isRunning) {
      this.showAlert('✅ All messages sent successfully!');
      this.stopAutomation();
    }
  }

  // Send message to specific contact
  async sendMessage(phone, message) {
    console.log(`Attempting to send message to ${phone}`);
    
    // Enhanced selectors for search box (including more recent WhatsApp versions)
    const searchSelectors = [
      '[data-testid="chat-list-search"]',
      'div[title="Search or start new chat"]',
      '[data-testid="search-container"] div[role="textbox"]',
      'div[contenteditable="true"][data-tab="3"]',
      '#side div[contenteditable="true"]',
      'div[role="textbox"][title*="Search"]',
      'div[role="textbox"][placeholder*="Search"]',
      'input[placeholder*="Search"]',
      'div[data-testid="search-input"]',
      'div[role="textbox"][aria-label*="Search"]',
      '[data-testid="search-container"] input',
      'div[role="textbox"][data-lexical-editor="true"]',
      'div[data-testid="search-input-container"] div[role="textbox"]'
    ];
    
    let searchBox = null;
    for (const selector of searchSelectors) {
      searchBox = document.querySelector(selector);
      if (searchBox) {
        console.log(`Found search box with selector: ${selector}`);
        break;
      }
    }
    
    if (!searchBox) {
      // Try to find and click the new chat button or search area
      const newChatSelectors = [
        '[data-testid="new-chat-btn"]',
        '[title="New chat"]',
        'div[role="button"][title*="New"]',
        '[aria-label*="New chat"]',
        'div[data-testid="compose-btn"]'
      ];
      
      let newChatBtn = null;
      for (const selector of newChatSelectors) {
        newChatBtn = document.querySelector(selector);
        if (newChatBtn) {
          console.log(`Found new chat button: ${selector}`);
          break;
        }
      }
      
      if (newChatBtn) {
        newChatBtn.click();
        await this.sleep(1500);
        
        // Try search selectors again
        for (const selector of searchSelectors) {
          searchBox = document.querySelector(selector);
          if (searchBox) {
            console.log(`Found search box after clicking new chat: ${selector}`);
            break;
          }
        }
      }
    }
    
    if (!searchBox) {
      throw new Error('Search box not found. Try clicking the "Debug WhatsApp" button to see available elements.');
    }
    
    // Clear search box and enter phone number
    searchBox.click();
    searchBox.focus();
    await this.sleep(300);
    
    // Clear existing content
if (searchBox.hasAttribute('data-lexical-editor')) {
  // Use execCommand for Lexical editor
  document.execCommand('selectAll');
  document.execCommand('delete');
} else {
  // Clear existing content for regular elements
  searchBox.innerHTML = '';
  searchBox.textContent = '';
  if (searchBox.value !== undefined) searchBox.value = '';
}

await this.sleep(100);
    
    // Type phone number
    await this.typeTextAdvanced(searchBox, phone);
    await this.sleep(2000); // Wait for search results
    
    // Look for contact in search results
    const contactSelectors = [
      '[data-testid="cell-frame-container"]',
      'div[role="listitem"]',
      'div[data-testid="chat-list-item"]',
      'div[title*="' + phone + '"]',
      'div[data-testid="contact"]',
      'div[data-testid="search-result"]'
    ];
    
    let contactElement = null;
    for (const selector of contactSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.textContent.includes(phone) || element.innerHTML.includes(phone)) {
          contactElement = element;
          break;
        }
      }
      if (contactElement) break;
    }
    
    // Replace the entire contact search and validation section with this:

if (!contactElement) {
  // Try pressing Enter to start new chat
  searchBox.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', keyCode: 13, bubbles: true}));
  await this.sleep(3000); // Longer wait to let WhatsApp process
  
  // Now check if we actually opened a valid chat
  // Look for the main chat container (indicates we're in a conversation)
  const chatContainerSelectors = [
    '[data-testid="conversation-panel-wrapper"]',
    '#main',
    '[data-testid="main"]',
    'div[data-testid="conversation-info-header"]'
  ];
  
  let chatContainer = null;
  for (const selector of chatContainerSelectors) {
    chatContainer = document.querySelector(selector);
    if (chatContainer && chatContainer.offsetParent !== null) { // Make sure it's visible
      break;
    }
  }
  
  // Also check if we're still in the search/contacts view
  const stillInSearch = document.querySelector('[data-testid="chat-list-search"]')?.matches(':focus') ||
                       document.querySelector('div[title="Search or start new chat"]')?.matches(':focus') ||
                       document.activeElement === searchBox;
  
  if (!chatContainer || stillInSearch) {
    // Contact not found - clear search and throw error
    console.log(`Contact not found for phone: ${phone}, clearing search`);
    
    // Clear the search box completely
    searchBox.click();
    searchBox.focus();
    await this.sleep(200);
    
    // Multiple clearing methods to ensure it works
    if (searchBox.hasAttribute('data-lexical-editor')) {
      document.execCommand('selectAll');
      document.execCommand('delete');
    } else {
      searchBox.innerHTML = '';
      searchBox.textContent = '';
      searchBox.innerText = '';
      if (searchBox.value !== undefined) searchBox.value = '';
    }
    
    // Send backspace events to really clear it
    for (let i = 0; i < 20; i++) {
      searchBox.dispatchEvent(new KeyboardEvent('keydown', {key: 'Backspace', keyCode: 8, bubbles: true}));
    }
    
    searchBox.dispatchEvent(new Event('input', {bubbles: true}));
    searchBox.dispatchEvent(new Event('change', {bubbles: true}));
    
    // Click away from search to clear focus
    const sidePanel = document.querySelector('#pane-side') || document.querySelector('[data-testid="side"]');
    if (sidePanel) {
      sidePanel.click();
      await this.sleep(300);
    }
    
    // Press Escape to close any dialogs
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', keyCode: 27, bubbles: true}));
    await this.sleep(500);
    
    throw new Error(`Contact not found or invalid phone number`);
  }
  
  console.log(`Successfully opened chat for ${phone}`);
} else {
  // Contact found in search results
  contactElement.click();
  await this.sleep(1500);
}

// Add this validation BEFORE looking for message box:
// Double-check we're actually in a chat before proceeding
const finalChatCheck = document.querySelector('[data-testid="conversation-panel-wrapper"]') || 
                      document.querySelector('#main');

if (!finalChatCheck) {
  // Still not in a chat - clear search and throw error
  console.log(`Failed to open chat for ${phone}, clearing search`);
  
  searchBox.click();
  searchBox.focus();
  await this.sleep(200);
  
  // Clear completely
  if (searchBox.hasAttribute('data-lexical-editor')) {
    document.execCommand('selectAll');
    document.execCommand('delete');
  } else {
    searchBox.innerHTML = '';
    searchBox.textContent = '';
    if (searchBox.value !== undefined) searchBox.value = '';
  }
  
  searchBox.dispatchEvent(new Event('input', {bubbles: true}));
  
  // Click away
  const sidePanel = document.querySelector('#pane-side') || document.querySelector('[data-testid="side"]');
  if (sidePanel) sidePanel.click();
  
  await this.sleep(500);
  throw new Error(`Unable to open chat for phone number`);
}
    
    // Find message input box with enhanced selectors
    const messageSelectors = [
      '[data-testid="conversation-compose-box-input"]',
      'div[contenteditable="true"][data-tab="10"]',
      'div[contenteditable="true"][role="textbox"]',
      '#main div[contenteditable="true"]',
      'div[data-testid="compose-box-input"]',
      'div[role="textbox"][data-lexical-editor="true"]',
      'div[data-testid="message-composer"] div[role="textbox"]',
      'div[data-testid="compose-box"] div[contenteditable="true"]'
    ];
    
    let messageBox = null;
    for (const selector of messageSelectors) {
      messageBox = document.querySelector(selector);
      if (messageBox) {
        console.log(`Found message box with selector: ${selector}`);
        break;
      }
    }
    
    if (!messageBox) {
      throw new Error('Message input box not found. Contact may not have opened properly.');
    }
    
    // Type message
    messageBox.click();
    messageBox.focus();
    await this.sleep(300);
    
    await this.typeTextAdvanced(messageBox, message);
    await this.sleep(500);
    
    // Send message with enhanced selectors
    const sendSelectors = [
      '[data-testid="send"]',
      'button[data-testid="send"]',
      'span[data-testid="send"]',
      'div[role="button"][aria-label*="Send"]',
      'button[aria-label*="Send"]',
      'div[data-testid="compose-btn-send"]'
    ];
    
    let sendButton = null;
    for (const selector of sendSelectors) {
      sendButton = document.querySelector(selector);
      if (sendButton) {
        console.log(`Found send button: ${selector}`);
        break;
      }
    }
    
    if (!sendButton) {
      // Try pressing Enter
      messageBox.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', keyCode: 13, bubbles: true}));
    } else {
      sendButton.click();
    }
    
    await this.sleep(1000);
    console.log(`Message sent successfully to ${phone}`);
  }

  // Utility functions
  async waitForElement(selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await this.sleep(100);
    }
    return null;
  }

  // Advanced text typing that works with WhatsApp's React components
  // Replace the existing typeTextAdvanced function with this fixed version
async typeTextAdvanced(element, text) {
  console.log(`Typing text: "${text}" into element:`, element);
  
  element.focus();
  await this.sleep(100);
  
  // Clear existing content first
  element.click();
  await this.sleep(50);
  
  // Method 1: For Lexical Editor (WhatsApp's new editor)
  if (element.hasAttribute('data-lexical-editor')) {
    console.log('Using Lexical editor method');
    
    // Clear content
    document.execCommand('selectAll');
    document.execCommand('delete');
    await this.sleep(50);
    
    // Insert text using execCommand (works better with Lexical)
    document.execCommand('insertText', false, text);
    
    // Trigger events
    element.dispatchEvent(new Event('input', {bubbles: true}));
    element.dispatchEvent(new Event('change', {bubbles: true}));
    
  } else if (element.contentEditable === 'true') {
    // Method 2: For regular contenteditable elements
    console.log('Using contenteditable method');
    
    // Clear and set content
    element.innerHTML = '';
    element.textContent = text;
    
    // Trigger events
    element.dispatchEvent(new Event('input', {bubbles: true}));
    element.dispatchEvent(new Event('change', {bubbles: true}));
    
  } else {
    // Method 3: For regular input fields
    console.log('Using input field method');
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(element, text);
    
    element.dispatchEvent(new Event('input', {bubbles: true}));
    element.dispatchEvent(new Event('change', {bubbles: true}));
  }
  
  // Final verification and fallback
  await this.sleep(200);
  
  // Check if text was actually entered
  const currentText = element.value || element.textContent || element.innerText || '';
  console.log(`Current text in element: "${currentText}"`);
  
  if (!currentText.includes(text)) {
    console.log('Fallback: Character by character typing');
    
    // Clear first
    if (element.contentEditable === 'true') {
      element.innerHTML = '';
    } else {
      element.value = '';
    }
    
    // Type character by character with proper events
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Simulate key events
      element.dispatchEvent(new KeyboardEvent('keydown', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        keyCode: char.charCodeAt(0),
        which: char.charCodeAt(0),
        bubbles: true
      }));
      
      // Add character using execCommand if possible, otherwise direct manipulation
      if (document.execCommand && element.contentEditable === 'true') {
        document.execCommand('insertText', false, char);
      } else if (element.contentEditable === 'true') {
        element.textContent += char;
      } else {
        element.value += char;
      }
      
      // Input event after each character
      element.dispatchEvent(new InputEvent('input', {
        data: char,
        inputType: 'insertText',
        bubbles: true
      }));
      
      await this.sleep(20); // Small delay between characters
    }
    
    // Final change event
    element.dispatchEvent(new Event('change', {bubbles: true}));
  }
  
  // Ensure focus is maintained
  element.blur();
  await this.sleep(50);
  element.focus();
  
  console.log(`Finished typing. Final content: "${element.value || element.textContent || element.innerText}"`);
}

  async typeText(element, text) {
    element.focus();
    for (const char of text) {
      element.dispatchEvent(new KeyboardEvent('keydown', {key: char, bubbles: true}));
      element.value += char;
      element.dispatchEvent(new InputEvent('input', {bubbles: true}));
      await this.sleep(10);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced WhatsApp ready check with detailed feedback
  isWhatsAppReady() {
  // Check if we're on WhatsApp Web
  if (!window.location.href.includes('web.whatsapp.com')) {
    return {
      isReady: false,
      reason: 'Please open WhatsApp Web (web.whatsapp.com) first',
      showAlert: true
    };
  }
  
  // Check if still loading
  const loadingSelectors = [
    '[data-testid="intro-md-beta-logo-dark"]',
    '[data-testid="intro-md-beta-logo-light"]',
    'div[data-testid="landing-wrapper"]',
    '[data-testid="startup-animation"]'
  ];
  
  let isLoading = false;
  for (const selector of loadingSelectors) {
    if (document.querySelector(selector)) {
      isLoading = true;
      break;
    }
  }
  
  if (isLoading) {
    return {
      isReady: false,
      reason: 'WhatsApp Web is still loading. Please wait and try again.',
      showAlert: true
    };
  }
  
  // Check for QR code (not logged in)
  const qrCodeSelectors = [
    '[data-testid="qr-code"]',
    'canvas[aria-label*="QR"]',
    'div[data-testid="intro-wrapper"]'
  ];
  
  let hasQRCode = false;
  for (const selector of qrCodeSelectors) {
    if (document.querySelector(selector)) {
      hasQRCode = true;
      break;
    }
  }
  
  if (hasQRCode) {
    return {
      isReady: false,
      reason: 'Please scan the QR code to log into WhatsApp Web first',
      showAlert: true
    };
  }
  
  // Rest of the existing checks...
  const chatListSelectors = [
    '[data-testid="chat-list"]',
    '#pane-side',
    'div[aria-label="Chat list"]',
    '[data-testid="side"]'
  ];
  
  let chatList = null;
  for (const selector of chatListSelectors) {
    chatList = document.querySelector(selector);
    if (chatList) break;
  }
  
  const searchSelectors = [
    '[data-testid="chat-list-search"]',
    'div[title="Search or start new chat"]',
    '[data-testid="search-container"]',
    'div[role="textbox"][title*="Search"]',
    'div[role="textbox"][placeholder*="Search"]',
    'input[placeholder*="Search"]',
    'div[data-testid="search-input"]',
    'div[role="textbox"][aria-label*="Search"]'
  ];
  
  let searchBox = null;
  for (const selector of searchSelectors) {
    searchBox = document.querySelector(selector);
    if (searchBox) break;
  }
  
  const newChatSelectors = [
    '[data-testid="new-chat-btn"]',
    '[title="New chat"]',
    'div[role="button"][title*="New"]',
    '[aria-label*="New chat"]'
  ];
  
  let newChatBtn = null;
  for (const selector of newChatSelectors) {
    newChatBtn = document.querySelector(selector);
    if (newChatBtn) break;
  }
  
  const hasSearchCapability = searchBox || newChatBtn;
  const isReady = chatList && hasSearchCapability;
  
  let reason = '';
  if (!chatList) reason = 'WhatsApp interface not fully loaded. Please refresh the page.';
  else if (!hasSearchCapability) reason = 'Search functionality not available. Please refresh WhatsApp Web.';
  
  return {
    isReady,
    reason,
    showAlert: isReady ? false : true,
    details: {
      chatList: !!chatList,
      searchBox: !!searchBox,
      newChatBtn: !!newChatBtn
    }
  };
}


  updateProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    document.getElementById('wa-progress-fill').style.width = percentage + '%';
    document.getElementById('wa-progress-text').textContent = `${percentage}% completed (${current}/${total})`;
  }

  // Message history functions
  loadMessageHistory() {
    try {
      return JSON.parse(localStorage.getItem('wa-message-history') || '[]');
    } catch {
      return [];
    }
  }

  saveMessageHistory() {
    localStorage.setItem('wa-message-history', JSON.stringify(this.messageHistory));
  }

  logMessage(phone, name, message, status, error = null) {
    const entry = {
      phone,
      name,
      message,
      status,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.messageHistory.unshift(entry);
    
    // Keep only last 100 entries
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(0, 100);
    }
    
    this.saveMessageHistory();
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    const historyDiv = document.getElementById('wa-history-list');
    if (!historyDiv) return;
    
    if (this.messageHistory.length === 0) {
      historyDiv.innerHTML = '<p>No messages sent yet</p>';
      return;
    }
    
    historyDiv.innerHTML = this.messageHistory.slice(0, 10).map(entry => `
      <div class="wa-history-item ${entry.status}">
        <div class="wa-history-header">
          <strong>${entry.name}</strong> (${entry.phone})
          <span class="wa-status ${entry.status}">${entry.status === 'success' ? '✅' : '❌'}</span>
        </div>
        <div class="wa-history-message">${entry.message}</div>
        <div class="wa-history-time">${new Date(entry.timestamp).toLocaleString()}</div>
        ${entry.error ? `<div class="wa-history-error">Error: ${entry.error}</div>` : ''}
      </div>
    `).join('');
    
    if (this.messageHistory.length > 10) {
      historyDiv.innerHTML += `<div class="wa-more-history">... and ${this.messageHistory.length - 10} more entries</div>`;
    }
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear the message history?')) {
      this.messageHistory = [];
      this.saveMessageHistory();
      this.updateHistoryDisplay();
      this.showAlert('🗑️ History cleared');
    }
  }

  showAlert(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'wa-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('wa-toast-show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('wa-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WhatsAppAutomation();
  });
} else {
  new WhatsAppAutomation();
}