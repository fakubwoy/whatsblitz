# ⚡WhatsBlitz⚡
A powerful Chrome extension that automates bulk messaging on WhatsApp Web. Send personalized messages to multiple contacts using CSV or Excel files with smart templating and message history tracking.

## ✨ Features

- **Bulk Messaging**: Send messages to hundreds of contacts automatically
- **File Support**: Upload CSV or Excel files with contact data
- **Smart Templates**: Use `{{name}}` and `{{phone}}` placeholders for personalization
- **Message History**: Track all sent messages with success/failure status
- **Intelligent Delays**: Random delays between messages (5-15 seconds) to avoid detection
- **Debug Tools**: Built-in WhatsApp Web compatibility checker
- **Modern UI**: Clean, floating sidebar that doesn't interfere with WhatsApp
- **Safety Features**: Stops automation if WhatsApp Web becomes unavailable

## 🚀 Installation

1. Clone this repository:
```bash
git clone https://github.com/fakubwoy/whatsblitz.git
cd whatsapp-bulk-messenger
```
2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the extension folder

5. The extension icon should appear in your Chrome toolbar

## 📋 File Format Requirements

### CSV Format
Your CSV file should have exactly 3 columns in this order:

```csv
Phone Number,Name,Message
1234567890,John Doe,Hi {{name}}! Your order #12345 is ready for pickup.
9876543210,Jane Smith,Hello {{name}}, thank you for your purchase!
5555551234,Bob Johnson,Hi {{name}}, your appointment is confirmed for tomorrow.
```
### Excel Format
- Use the same 3-column structure as CSV
- Supports both .xlsx and .xls formats
- First row should contain headers
- Empty rows will be automatically skipped
| Phone Number | Name        | Message                                                      |
|--------------|-------------|--------------------------------------------------------------|
| 1234567890   | John Doe    | Hi {{name}}! Your order #12345 is ready for pickup.          |
| 9876543210   | Jane Smith  | Hello {{name}}, thank you for your purchase!                |
| 5555551234   | Bob Johnson | Hi {{name}}, your appointment is confirmed for tomorrow.     |

### Template Variables
Use these placeholders in your messages:
- `{{name}}` - Replaced with the contact's name
- `{{phone}}` - Replaced with the contact's phone number

## 🎯 Usage Instructions

### Step 1: Setup
1. Open [WhatsApp Web](https://web.whatsapp.com) in Chrome
2. Scan QR code to log in to your WhatsApp account
3. The Bulk Messenger sidebar will appear automatically

### Step 2: Upload Contacts
1. Click "Browse Files" or drag & drop your CSV/Excel file
2. Preview your contacts to ensure data is correct
3. Verify message templates look good with actual names

### Step 3: Send Messages
1. Click "Start Sending" to begin automation
2. Monitor progress in real-time
3. Check message history for delivery status
4. Use "Stop" button if you need to pause

## ⚡ Advanced Features

### Message History
- Tracks all sent messages with timestamps
- Shows success/failure status for each contact
- Displays error messages for failed sends
- Stores up to 100 recent message logs
- Exportable for record keeping

### Smart Automation
- **Adaptive Delays**: Random 5-15 second delays between messages
- **Contact Detection**: Automatically finds contacts or creates new chats
- **Retry Logic**: Attempts multiple methods to send each message
- **Error Recovery**: Continues with remaining contacts if one fails

### Safety Measures
- **Rate Limiting**: Prevents sending messages too quickly
- **WhatsApp Health Check**: Monitors if WhatsApp Web is responsive
- **Manual Override**: Stop button works immediately
- **Progress Tracking**: Shows exactly which messages were sent

## 🚨 Important Notes

### Rate Limiting
- WhatsApp may temporarily restrict accounts that send too many messages
- The extension includes delays to minimize detection
- Monitor your account for any restrictions
- Consider breaking large lists into smaller batches

### Phone Number Format
- Ensure phone numbers are formatted in the way they are saved in your contacts, if they have country codes include them, if they don't, dont't.
- You will not be able to send messages to yourself
