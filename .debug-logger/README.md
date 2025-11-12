# Frontend Debug Logger

A comprehensive browser-based debugging tool that captures HTTP requests, WebSocket activity, JavaScript errors, console logs, and performance metrics. Perfect for debugging frontend applications with automatic persistence and backend logging support.

## 🚀 Quick Start

1. Open your browser DevTools (F12)
2. Go to the Console tab
3. Copy the entire contents of `debug-console-logger.js`
4. Paste into the console and press Enter

**Done!** The logger is now active and tracking all network activity, errors, and console logs.

### 🎨 Visual UI Panel

After pasting the script, you'll see a **🐛 button** in the bottom-right corner of your page. Click it to open the visual UI panel with quick access to all features!

**Quick Access:**
- Click the **🐛 button** (bottom-right corner) to open/close the UI panel
- Keyboard shortcut: `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
- Type `dl` instead of `debugLogger` for shorter commands

## 📋 Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)
- DevTools console access
- (Optional) Backend endpoint for automatic log persistence

## ✨ Features

### HTTP Request Monitoring
- Intercepts all `fetch()` and `XMLHttpRequest` calls
- Tracks method, URL, status codes, and timing
- Captures request/response headers and bodies (for errors and mutations)
- Highlights slow requests (>500ms by default)
- Detects duplicate API calls automatically

### WebSocket Tracking
- Monitors connection lifecycle (open/close/errors)
- Tracks all messages sent and received
- Records connection duration and state
- Identifies unexpected disconnects

### Error Capture
- JavaScript errors with full stack traces
- Unhandled promise rejections
- Network failures with detailed error information
- File locations and line numbers

### Console Log Management
- Filters framework noise (Angular, Zone.js, Webpack, etc.)
- Color-coded log levels
- Custom user notes/markers
- Timestamps and page context

### Performance Metrics
- Duplicate request detection
- Slow request identification
- Per-page performance summaries
- Average response times

### Persistence Options
- **localStorage**: Auto-saves logs (survives page refresh)
- **File Saving**: Automatically save logs to your desktop or selected directory (Chrome/Edge) or download automatically (other browsers)
- **Backend Logging**: Automatically POST logs to your server
- **Manual Export**: Download as JSON or readable text

## 🎨 UI Panel Guide

The visual UI panel provides easy access to all logger features. Here's what each button does:

### Quick Stats (Top of Panel)
- **Requests**: Total number of HTTP requests tracked
- **Errors**: Total errors (highlighted in red if any exist)
- **WebSockets**: Total WebSocket connections

### View Section
- **📊 Summary** → `debugLogger.showSummary()` - Quick stats for current page
- **🌐 All Requests** → `debugLogger.showAllRequests()` - View all HTTP requests in a table
- **💥 Errors** → `debugLogger.showErrors()` - View all JavaScript/Network errors (button turns red if errors exist)
- **📈 By Endpoint** → `debugLogger.showByEndpoint()` - Request stats grouped by endpoint
- **🔌 WebSockets** → `debugLogger.showWebSockets()` - View all WebSocket connections

### Save/Export Section
- **💾 Download Text** → `debugLogger.downloadText()` - Download all logs as a readable text file
- **💾 Download JSON** → `debugLogger.download()` - Download all logs as JSON file
- **📁 Select Folder** → `debugLogger.selectDirectory()` - Choose where to save log files (Chrome/Edge only)
- **🎫 Copy Jira Ticket** → `debugLogger.jira()` or `dl.jira()` - **⭐ MOST COMPREHENSIVE INFO** - Generates and copies a complete Jira ticket with all debugging details (full URLs, component names, request/response bodies, errors, etc.)

### Actions Section
- **📝 Add Note** → `debugLogger.addNote()` - Add a custom note/marker to your logs (great for creating "Steps to Reproduce")
- **🧹 Clear** → `debugLogger.clear()` - Clear all tracking data
- **ℹ️ Status** → `debugLogger.status()` - Show current configuration and statistics
- **❓ Help** → `debugLogger.help()` - Display all available commands

### Keyboard Shortcuts
- `Ctrl+Shift+D` (or `Cmd+Shift+D`) - Toggle UI panel
- `Ctrl+Shift+E` (or `Cmd+Shift+E`) - Show errors
- `Ctrl+Shift+S` (or `Cmd+Shift+S`) - Show summary

### Which Button Gives the Most Info?

**🎫 Copy Jira Ticket** (`dl.jira()`) provides the most comprehensive, formatted information:
- Full URLs with query params
- Component/framework detection
- Complete error details with stack traces
- Failed request details (headers, request/response bodies)
- Environment information (browser, timezone, etc.)
- Request timeline
- Page navigation history
- All formatted and ready to paste into Jira

For raw data analysis, use **💾 Download Text** or **💾 Download JSON**.

## 🎯 Common Commands

```javascript
// === Status & Information ===
debugLogger.status()              // Show current status and stats
debugLogger.help()                // Display all available commands

// === Viewing Data ===
debugLogger.showSummary()         // Summary for current page
debugLogger.showAllRequests()     // All HTTP requests in a table
debugLogger.showErrors()          // All JavaScript/Network errors
debugLogger.showByEndpoint()      // Request stats grouped by endpoint
debugLogger.showWebSockets()      // All WebSocket connections
debugLogger.showWebSocketMessages() // All WS messages

// === Backend Logging ===
debugLogger.enableBackend()       // Turn ON backend logging
debugLogger.disableBackend()      // Turn OFF backend logging
debugLogger.toggleBackend()       // Toggle on/off
debugLogger.sendToBackend()       // Send logs immediately

// === Persistence ===
debugLogger.save()                // Save to localStorage now
debugLogger.load()                // Load from localStorage
debugLogger.download()            // Download as JSON file
debugLogger.downloadText()        // Download as readable text file
debugLogger.jira()                // Generate and copy Jira ticket content

// === File Saving ===
debugLogger.selectDirectory()     // Select directory for file saving (Chrome/Edge)
debugLogger.enableFileSaving()    // Enable auto-save to files
debugLogger.disableFileSaving()   // Disable auto-save to files
debugLogger.saveFiles()           // Save files now

// === Management ===
debugLogger.clear()               // Clear all tracking data
debugLogger.addNote("message")    // Add a custom note/marker
debugLogger.config({...})         // Update configuration
```

## ⚙️ Configuration

### Basic Configuration

```javascript
debugLogger.config({
  showAngularLogs: false,         // Show Angular framework logs
  showZoneLogs: false,            // Show Zone.js logs
  highlightSlowRequests: 500,     // Highlight requests slower than this (ms)
  highlightDuplicates: true,      // Highlight duplicate API calls
  groupByPage: true,              // Group requests by route/page
  persistToLocalStorage: true,    // Save logs to localStorage
  autoSaveInterval: 10000,        // Auto-save every 10 seconds (0 to disable)
  maxStoredLogs: 1000,            // Maximum number of logs to store
  sendToBackend: false,           // POST logs to backend endpoint
  backendLogUrl: '/api/debug/frontend-logs', // Backend endpoint URL
  saveToFiles: false,             // Auto-save logs to files
  fileSaveInterval: 30000,        // Auto-save files every 30 seconds (0 to disable)
  fileFormat: 'both',             // 'json', 'text', or 'both'
})
```

### Example Configurations

**Show Everything (Including Framework Logs)**
```javascript
debugLogger.config({
  showAngularLogs: true,
  showZoneLogs: true
})
```

**Only Highlight Very Slow Requests**
```javascript
debugLogger.config({
  highlightSlowRequests: 1000  // 1 second
})
```

**Disable Duplicate Detection**
```javascript
debugLogger.config({
  highlightDuplicates: false
})
```

## 💾 File Saving Setup

The logger can automatically save logs to files on your computer. This works in two ways:

### Option 1: File System Access API (Chrome/Edge - Recommended)

**Best for:** Saving directly to a specific folder (like Desktop) without downloads

1. **Select a directory:**
   ```javascript
   debugLogger.selectDirectory()
   ```
   - A file picker will open
   - Choose your Desktop or any folder
   - Files will be saved there automatically

2. **Enable auto-saving:**
   ```javascript
   debugLogger.enableFileSaving()
   ```
   - Logs will auto-save every 30 seconds (configurable)
   - Files are saved as: `debug-logs-YYYY-MM-DD-sessionId.json` and `.txt`

### Option 2: Automatic Downloads (All Browsers)

**Best for:** Browsers that don't support File System Access API

1. **Enable file saving:**
   ```javascript
   debugLogger.enableFileSaving()
   ```
   - Files will automatically download every 30 seconds
   - Check your browser's download folder

### Configuration

```javascript
// Configure file saving
debugLogger.config({
  saveToFiles: true,           // Enable file saving
  fileSaveInterval: 30000,     // Save every 30 seconds (0 to disable)
  fileFormat: 'both',          // 'json', 'text', or 'both'
})

// Or use the convenience methods
debugLogger.selectDirectory()  // Select folder (Chrome/Edge)
debugLogger.enableFileSaving() // Enable auto-save
```

### File Formats

- **JSON**: Full structured data for programmatic analysis
- **Text**: Human-readable format optimized for reading and AI analysis
- **Both**: Saves both formats (default)

### Example Workflow

```javascript
// 1. Select your Desktop or a folder
await debugLogger.selectDirectory()

// 2. Use your app normally
// Logs will auto-save every 30 seconds

// 3. Check your selected folder
// Files: debug-logs-2025-01-15-abc123.json
//        debug-logs-2025-01-15-abc123.txt

// 4. Manually save now (don't wait 30 seconds)
await debugLogger.saveFiles()
```

### Browser Support

- **Chrome/Edge**: Full File System Access API support - can save to any folder
- **Firefox/Safari**: Automatic downloads to default download folder
- **All browsers**: Manual downloads via `debugLogger.download()` or `debugLogger.downloadText()`

## 🔧 Backend Logging Setup

The logger can automatically send logs to your backend server for persistent storage and analysis.

### Frontend Configuration

```javascript
// Enable backend logging
debugLogger.config({
  sendToBackend: true,
  backendLogUrl: '/api/debug/frontend-logs'  // Your backend endpoint
})
```

### Backend Endpoint Requirements

Your backend should accept `POST` requests with the following structure:

**Request Format:**
```json
{
  "sessionId": "1729891234567-abc123def",
  "timestamp": "2025-10-25T22:30:15.000Z",
  "currentPage": "/dashboard",
  "sessionDuration": 45000,
  "browserInfo": {
    "userAgent": "...",
    "platform": "Linux",
    "screenSize": "1920x1080",
    "viewportSize": "1440x900",
    "online": true
  },
  "requests": [...],
  "consoleLogs": [...],
  "websockets": [...],
  "websocketMessages": [...],
  "errors": [...],
  "summary": {
    "totalRequests": 12,
    "totalLogs": 45,
    "totalErrors": 3,
    "duplicates": 2,
    "slowRequests": 3
  }
}
```

**Example Backend Implementation (Django/DRF):**
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import json
from datetime import datetime
import os

@api_view(['POST'])
@permission_classes([AllowAny])  # Adjust permissions as needed
def debug_logs(request):
    """Receive frontend debug logs"""
    data = request.data
    session_id = data.get('sessionId', 'unknown')
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    
    # Create logs directory if it doesn't exist
    log_dir = '/path/to/logs/frontend-debug'
    os.makedirs(log_dir, exist_ok=True)
    
    # Save JSON file
    json_filename = f"{log_dir}/frontend-{timestamp}-{session_id}.json"
    with open(json_filename, 'w') as f:
        json.dump(data, f, indent=2)
    
    # Generate readable text file
    text_filename = f"{log_dir}/frontend-{timestamp}-{session_id}.txt"
    with open(text_filename, 'w') as f:
        f.write(f"Debug Logs\n")
        f.write(f"Session: {session_id}\n")
        f.write(f"Generated: {data.get('timestamp')}\n")
        f.write(f"Current Page: {data.get('currentPage')}\n")
        f.write(f"\n{'='*80}\n\n")
        f.write(f"SUMMARY\n{'-'*80}\n")
        summary = data.get('summary', {})
        f.write(f"Total Requests: {summary.get('totalRequests', 0)}\n")
        f.write(f"Total Errors: {summary.get('totalErrors', 0)}\n")
        # ... add more formatting as needed
    
    return Response({
        'status': 'success',
        'files': {
            'json': json_filename,
            'text': text_filename
        }
    })
```

**Example Backend Implementation (Express.js):**
```javascript
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

app.post('/api/debug/frontend-logs', async (req, res) => {
  const data = req.body;
  const sessionId = data.sessionId || 'unknown';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  const logDir = path.join(__dirname, 'logs', 'frontend-debug');
  await fs.mkdir(logDir, { recursive: true });
  
  const jsonFile = path.join(logDir, `frontend-${timestamp}-${sessionId}.json`);
  await fs.writeFile(jsonFile, JSON.stringify(data, null, 2));
  
  // Generate text file similarly...
  
  res.json({ status: 'success', file: jsonFile });
});
```

## 📊 Log File Formats

### JSON Format
Full structured data with all captured information:
- Complete request/response data
- All console logs
- WebSocket connections and messages
- Error details with stack traces
- Browser metadata

### Text Format
Human-readable format optimized for analysis:
```
Debug Logs
Session: 1729891234567-abc123def
Generated: 2025-10-25T22:30:15.000Z
Current Page: /dashboard

================================================================================
SUMMARY
--------------------------------------------------------------------------------
Total Requests: 12
Total Console Logs: 45
Total Errors: 3
Duplicate Requests: 2
Slow Requests (>500ms): 3

================================================================================
ERRORS (CRITICAL - FIX THESE FIRST!)
================================================================================
[2025-10-25T22:15:32.456Z] JavaScript Error
  Page: /dashboard
  Message: Cannot read properties of undefined (reading 'id')
  File: dashboard.component.ts:42
  Stack Trace: ...

================================================================================
NETWORK REQUESTS
================================================================================
[2025-10-25T22:29:45.123Z] 200 GET /api/users/ (156ms) - /dashboard
[2025-10-25T22:29:45.234Z] 200 GET /api/data/ (823ms) - /dashboard
...
```

## 🔍 Usage Examples

### Finding Duplicate API Calls

```javascript
// 1. Clear tracking
debugLogger.clear()

// 2. Navigate to the page you want to test
// 3. Wait for page to fully load
// 4. Check for duplicates
debugLogger.showSummary()
// Look for "Duplicate Requests" section

// 5. Get detailed analysis
debugLogger.showByEndpoint()
```

### Debugging Slow Performance

```javascript
// 1. Navigate through your app
// 2. Check slow requests
debugLogger.showSummary()
// Shows slow requests (>500ms)

// 3. Get endpoint statistics
debugLogger.showByEndpoint()
// Sort by avgDuration to find bottlenecks
```

### Adding Debug Markers

```javascript
// Add notes at key moments during debugging
debugLogger.addNote("Starting payment flow test")
// ... perform actions ...
debugLogger.addNote("Payment form submitted")
// ... wait for response ...
debugLogger.addNote("Payment completed successfully")

// Notes appear in logs with timestamps
```

### Exporting Logs for Analysis

```javascript
// Download as readable text (best for sharing)
debugLogger.downloadText()

// Download as JSON (for programmatic analysis)
debugLogger.download()

// Or export to console
const data = debugLogger.export()
console.log(data)
```

## 🎫 Creating Jira Tickets

The logger can automatically format your debug data into a Jira ticket-ready format!

### ⭐ Easiest Method: UI Button
1. Click the **🐛 button** (bottom-right corner) to open the UI panel
2. Click the **🎫 Copy Jira Ticket** button in the "Save/Export" section
3. Content is automatically copied to your clipboard
4. Paste directly into your Jira ticket description

**This button provides the MOST comprehensive information** - see the [UI Panel Guide](#-ui-panel-guide) section for details.

### Alternative: Command Method
```javascript
// Generate and copy Jira ticket content
debugLogger.jira()
// or shorter:
dl.jira()
```

### What Gets Included

The Jira ticket includes comprehensive debugging information:

- **Summary**:
  - Session ID and timestamps (ISO + local time with timezone)
  - **Full URL** (complete URL with query params, hash, etc.)
  - Page path
  - **Component/Framework name** (auto-detected: Angular, React, Vue, or component name)
  - Session duration and time on current page

- **Environment**:
  - Browser user agent
  - Platform (OS)
  - Language and timezone
  - Screen and viewport sizes
  - Online/offline status
  - Page title
  - Referrer URL (if available)

- **Statistics**: Request counts, error counts, performance metrics

- **Critical Issues**:
  - **JavaScript Errors**:
    - Full stack traces
    - File location (filename:line:column)
    - **Auto-detected component/service name** from filename (e.g., `UserService`, `LoginComponent`)
  - **Network Errors**: Detailed error messages with stack traces
  - **Unhandled Promise Rejections**: Full error details
  - **Failed HTTP Requests (4xx/5xx)**:
    - Complete request details (method, URL, status, duration)
    - **Request headers** (content-type, accept, etc.)
    - **Request body** (full payload for failed requests)
    - **Response headers**
    - **Response body** (error messages from server)

- **Performance Issues**:
  - Slow requests (>500ms) with full details
  - Duplicate API calls with call counts

- **WebSocket Issues**: Connection problems and errors

- **Recent Request Timeline**: Last 20 requests with timestamps

- **Steps to Reproduce**: Automatically generated from your notes (if you used `addNote()`)

- **Additional Context**:
  - Total request/log counts
  - Pages visited during session (with request counts per page)
  - Active WebSocket connections

### Example Workflow

```javascript
// 1. Add notes as you debug
debugLogger.addNote("User clicked submit button")
debugLogger.addNote("Form validation failed")
debugLogger.addNote("Error appeared on screen")

// 2. Generate Jira ticket
debugLogger.jira()

// 3. Paste into Jira - done!
```

The generated content uses Jira's wiki markup format and is ready to paste directly into your ticket description.

## 🎓 Best Practices

1. **Clear Between Tests**: Use `debugLogger.clear()` to start fresh sessions
2. **Add Context**: Use `debugLogger.addNote()` to mark important moments (great for Jira tickets!)
3. **Check Status Regularly**: Run `debugLogger.status()` to monitor error counts
4. **Export Before Refresh**: Page refresh clears data, so export first if needed
5. **Use Backend Logging**: Enable for long debugging sessions or production debugging
6. **Review Errors First**: Always check `debugLogger.showErrors()` for critical issues
7. **Create Jira Tickets**: Use `debugLogger.jira()` to quickly create detailed bug reports

## 🚨 Common Issues Detected

### Duplicate API Calls
**Symptom:** Same endpoint called multiple times on page load  
**Example:** `⚠️ DUPLICATE REQUEST DETECTED 3x calls to: GET /api/users/`  
**Fix:** Check component lifecycle hooks, remove duplicate subscriptions

### Slow Requests
**Symptom:** Requests taking >500ms  
**Example:** `✓ RESPONSE 200 [SLOW] GET /api/data/ - 823ms`  
**Fix:** Add pagination, optimize backend queries, implement caching

### Failed Requests
**Symptom:** 4xx or 5xx status codes  
**Example:** `✓ RESPONSE 400 POST /api/submit/`  
**Fix:** Check request body, validate data, verify endpoint exists

### WebSocket Issues
**Symptom:** Unexpected disconnects or errors  
**Example:** `⚠️ WEBSOCKET CLOSED UNEXPECTEDLY [abc123] Code: 1006`  
**Fix:** Check network stability, add reconnection logic, review timeout configs

## 🔒 Security Considerations

- **Backend Endpoint**: Protect your debug logging endpoint in production
- **Sensitive Data**: The logger redacts auth tokens but may capture other sensitive data
- **Log Storage**: Ensure log files are stored securely and not publicly accessible
- **Production Use**: Consider disabling or restricting backend logging in production

## 📝 Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Edge
- ✅ Safari

## 🐛 Troubleshooting

### Logger Not Working
- Ensure you pasted the entire script
- Check for console errors
- Try refreshing and re-pasting

### Not Seeing Network Requests
- Logger only captures requests made AFTER it's loaded
- Refresh the page after loading the logger
- Verify requests use `fetch()` or `XMLHttpRequest`

### Backend Logs Not Appearing
- Check if backend logging is enabled: `debugLogger.status()`
- Verify backend endpoint URL is correct
- Check browser console for CORS or network errors
- Manually trigger: `debugLogger.sendToBackend()`

### Too Much Noise
```javascript
debugLogger.config({
  showAngularLogs: false,
  showZoneLogs: false
})
```

## 📚 Additional Resources

- Check `debugLogger.help()` for complete command reference
- Use `debugLogger.status()` to see current configuration and stats
- Export logs and analyze with your preferred tools or AI assistants

---

**Happy Debugging!** 🚀
