# How to Use Debug Logs with Claude AI

When you have debug logs from the debug logger and want Claude to analyze them, here's what to do:

## 📋 Quick Version (Copy & Paste This)

```
I'm debugging an Angular application and I have debug logs from a browser console logger.

I have these files:
- debug-full.json - Complete debug data (all HTTP requests, errors, console logs, WebSocket activity)
- debug-full.txt - Same data in human-readable text format
- copilot-analysis.md - Pre-formatted analysis with errors, performance issues, and context
- dom-snapshot.json - DOM state when logs were captured

The debug logger tracked:
1. All HTTP requests (fetch & XHR) with timing, status, request/response bodies
2. All JavaScript errors with stack traces and component/service names
3. All console logs
4. All WebSocket connections and messages
5. Angular component detection from stack traces

Please analyze these logs and help me:
1. Identify the root cause of errors
2. Find which Angular components/services are involved
3. Spot performance issues (slow requests, duplicates)
4. Suggest specific fixes with file names and line numbers

[Then paste or attach the files]
```

---

## 📄 Detailed Explanation of Each File

### 1. `YYYY-MM-DD-debug-full.json`

**What it is**: Complete raw debug data in JSON format

**Contains**:
- `requests[]` - Every HTTP request made
  - URL, method, status code, duration
  - Request/response headers
  - Request/response bodies (for errors and mutations)
  - **Initiator info**: Which component/service made the request
  - **Call stack**: Full stack trace showing the call chain
  - Timestamp, page/route

- `errors[]` - All JavaScript errors
  - Error message and type
  - File location (filename:line:column)
  - Stack trace with component/service names
  - Page where error occurred

- `consoleLogs[]` - All console.log/warn/error calls
  - Level (log/warn/error)
  - Message
  - Timestamp

- `websockets[]` - WebSocket connections
  - URL, connection time, status
  - Message counts

- `websocketMessages[]` - All WS messages sent/received

- `browserInfo` - User agent, platform, screen size, etc.

**Tell Claude**: "This is the complete raw data. It has every HTTP request, error, and console log from my Angular app session."

---

### 2. `YYYY-MM-DD-debug-full.txt`

**What it is**: Same data as JSON but formatted for easy reading

**Contains**:
- Summary section (total requests, errors, slow requests)
- All errors with stack traces
- All HTTP requests with:
  - Status, method, URL, duration
  - **Initiator**: Which component/service made the request
  - Request/response bodies (if available)
- All console logs
- User notes (if you added any with `dl.addNote()`)

**Tell Claude**: "This is human-readable version of the debug data. Easier to scan through quickly."

---

### 3. `YYYY-MM-DD-copilot-analysis.md`

**What it is**: Pre-formatted Markdown optimized for AI analysis

**Contains**:
- Session information (URL, Angular version, browser)
- Quick summary table (errors, requests, performance issues)
- **Priority Issues** section:
  - JavaScript errors with component names and line numbers
  - Failed HTTP requests with request/response details
- **Performance Issues**:
  - Slow requests (>500ms)
  - Duplicate API calls
- **Recent Activity** table (last 10 requests with initiators)
- **Copilot Action Items** - Pre-written questions for analysis

**Tell Claude**: "This file is pre-formatted for analysis. It highlights the important issues and asks specific questions."

---

### 4. `YYYY-MM-DD-dom-snapshot.json`

**What it is**: Snapshot of the page's DOM state when logs were captured

**Contains**:
- Current URL and pathname
- Page title
- **Angular components in DOM**: All custom element selectors found (like `app-user-list`, `app-dashboard`)
- Current route component (what's loaded in router-outlet)
- Angular version
- Active forms and their field counts
- Active element (what user was focused on)
- Viewport size and scroll position
- Angular debug info (if available)

**Tell Claude**: "This shows what components were on the page and what the user was doing when the logs were captured."

---

### 5. `YYYY-MM-DD-jira-ticket.txt` (if generated)

**What it is**: Complete JIRA ticket in JIRA markup format

**Contains**:
- Summary with session ID, URL, Angular version
- All critical issues formatted for JIRA
- JavaScript errors with component names
- Failed requests with details
- Performance issues
- Ready to copy/paste into JIRA

**Tell Claude**: "This is a pre-formatted JIRA ticket. You can use it as a base or improve it."

---

## 🎯 Example Prompts for Claude

### For General Debugging

```
I'm debugging an Angular application. I've attached debug logs that contain:
- All HTTP requests with component/service initiators
- All JavaScript errors with stack traces
- Performance metrics

The most important file is "copilot-analysis.md" which has pre-formatted issues.

Please analyze and tell me:
1. What's the root cause of the errors?
2. Which components/services need to be fixed?
3. What files and line numbers should I look at?
4. Are there any patterns suggesting a bigger problem?
```

### For Performance Issues

```
I'm debugging performance issues in my Angular app. Attached are debug logs showing:
- All HTTP requests with timing and initiators
- Duplicate API calls
- Slow requests (>500ms)

Please help me:
1. Identify which components are making slow requests
2. Find duplicate/unnecessary API calls
3. Suggest caching or optimization strategies
4. Recommend which components to refactor first
```

### For Creating JIRA Tickets

```
I have debug logs from an Angular app with errors and issues. I've attached:
- copilot-analysis.md (pre-formatted issues)
- debug-full.json (complete data)

Please create a detailed JIRA ticket that includes:
- Clear summary
- Steps to reproduce (infer from the logs)
- Expected vs actual behavior
- Technical details (component names, file:line, stack traces)
- Suggested fixes
- Acceptance criteria
```

### For Error Analysis

```
My Angular app is throwing errors. I've captured debug logs that show:
- JavaScript errors with stack traces
- Failed HTTP requests
- Which Angular components/services are involved

The errors are in "copilot-analysis.md" under "Priority Issues".

Please:
1. Analyze each error
2. Tell me the root cause
3. Suggest specific code fixes
4. Identify which component/service to fix first (with file:line)
```

---

## 💡 Pro Tips

### Tip 1: Start with the Markdown file

If you have multiple files, **always give Claude the `copilot-analysis.md` first**. It's pre-formatted and asks specific questions.

```
Here's a pre-formatted analysis of my Angular app issues.
Please review and provide specific fixes.

[paste/attach copilot-analysis.md]
```

### Tip 2: Add context

Tell Claude what you were doing:

```
I was testing the user registration flow when these errors occurred.
User filled out the form and clicked "Submit".
That's when the error happened.

[attach logs]
```

### Tip 3: Ask for specific file references

```
When suggesting fixes, please always include:
- Exact file name
- Line number
- The component/service name
- What code to change

The debug logs already have this info extracted.
```

### Tip 4: Use the JSON for deep analysis

```
I've attached the complete JSON debug data.

Please analyze the "requests" array and find:
1. Which component made the most API calls
2. Are there duplicate requests to the same endpoint?
3. Which requests are slowest?
4. Which component/service initiators are involved?

Each request has an "initiator" field showing the component/service.
```

---

## 🎬 Complete Example Workflow

### Step 1: Capture the logs
```javascript
// In browser console after reproducing the bug
dl.selectFolder()           // Select your project folder
dl.saveAIPackage()         // Saves all files
```

### Step 2: Open Claude

Copy/paste this prompt:

```
I'm debugging an Angular application and I have comprehensive debug logs.

**What happened**:
User tried to save their profile, but got an error and the save failed.

**Files I'm attaching**:
- copilot-analysis.md (pre-formatted with errors and context)
- debug-full.json (complete data)
- dom-snapshot.json (page state)

**What I need**:
1. Root cause of the error
2. Which component/service to fix (with file:line)
3. Specific code fix
4. How to prevent this in the future

The logs include:
- All HTTP requests with component initiators
- JavaScript errors with stack traces showing component names
- Request/response bodies for failed requests
- Which Angular components were on the page

Please analyze and provide specific actionable fixes.
```

### Step 3: Attach files

Drag and drop or paste:
- `copilot-analysis.md` (most important)
- `debug-full.json` (for deep dive)
- `dom-snapshot.json` (for page context)

### Step 4: Claude responds

Claude will read the files and give you:
- Root cause analysis
- Specific file:line to fix
- Code suggestions
- Prevention strategies

---

## 📚 What Makes These Logs Special

The debug logger is **way better than standard console logs** because:

1. **Component/Service Tracking**: Every request shows which Angular component or service made it
   ```json
   "initiator": {
     "components": [{
       "name": "UserProfileComponent",
       "method": "saveProfile",
       "file": "user-profile.component.ts",
       "line": 127
     }]
   }
   ```

2. **Complete Context**: Not just errors, but what led to them:
   - What HTTP requests were made before the error
   - What component was active
   - What the user was doing (from DOM snapshot)

3. **Performance Data**: Timing for every request, duplicates detected

4. **Pre-Formatted**: The `copilot-analysis.md` is already structured to ask the right questions

5. **AI-Optimized**: Files are formatted specifically for AI analysis with clear sections and action items

---

## ✅ Quick Reference

**Best file to start with**: `copilot-analysis.md`
**Most complete data**: `debug-full.json`
**Easiest to read**: `debug-full.txt`
**Page context**: `dom-snapshot.json`

**Simplest prompt**:
```
Analyze these Angular debug logs and tell me:
1. What's broken
2. Which file:line to fix
3. How to fix it

[attach copilot-analysis.md]
```

---

Save this file as a reference for when you need to share logs with AI assistants!
