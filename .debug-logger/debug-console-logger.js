/**
 * Frontend Debug Logger - Enhanced for Angular
 *
 * Paste this into your browser console to get clean logs and network monitoring
 *
 * Features:
 * - Clean console logs without framework noise
 * - Network request monitoring (fetch + XHR) with timing
 * - WebSocket connection and message tracking
 * - Duplicate request detection
 * - Performance metrics per page
 * - Color-coded output
 * - localStorage persistence (survives refresh)
 * - Backend logging support
 *
 * NEW - Angular Debugging Features:
 * - Enhanced stack trace parsing for Angular components, services, directives, pipes
 * - Component and file location extraction with line numbers
 * - AI-ready prompt generation for GitHub Copilot, ChatGPT, Claude
 * - Detailed JIRA ticket generation with Angular-specific context
 * - DOM snapshot capture for visual debugging
 * - AI analysis package export with all context
 */

(function() {
  console.clear();
  console.log('%c🚀 Debug Logger Started', 'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;');

  // Configuration
  const config = {
    showAngularLogs: false,      // Set to true to see Angular framework logs
    showZoneLogs: false,          // Set to true to see Zone.js logs
    highlightSlowRequests: 500,   // Highlight requests slower than this (ms)
    highlightDuplicates: true,    // Highlight duplicate API calls
    groupByPage: true,            // Group requests by route/page
    persistToLocalStorage: true, // Save logs to localStorage
    autoSaveInterval: 10000,     // Auto-save every 10 seconds (0 to disable)
    maxStoredLogs: 1000,         // Maximum number of logs to store
    sendToBackend: false,        // Set to true to POST logs to backend endpoint
    backendLogUrl: '/api/debug/frontend-logs', // Backend endpoint for logs (configure as needed)
    saveToFiles: false,          // Set to true to auto-save logs to files
    fileSaveInterval: 30000,     // Auto-save files every 30 seconds (0 to disable)
    fileFormat: 'both',          // 'json', 'text', or 'both'
  };

  // State tracking
  const state = {
    requests: [],
    websockets: [],
    websocketMessages: [],
    errors: [],
    currentPage: window.location.pathname,
    pageStartTime: Date.now(),
    sessionStartTime: Date.now(),
    requestCounts: {},
    duplicateWarnings: new Set(),
    consoleLogs: [],
    sessionId: Date.now() + '-' + Math.random().toString(36).substring(2, 11),
    browserInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData?.platform || (() => {
        // Fallback: extract platform from userAgent if modern API not available
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win')) return 'Windows';
        if (ua.includes('mac')) return 'MacOS';
        if (ua.includes('linux')) return 'Linux';
        if (ua.includes('android')) return 'Android';
        if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
        return 'Unknown';
      })(),
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
    },
    fileHandle: null,            // File System Access API directory handle
    lastFileSave: null,          // Timestamp of last file save
  };

  // Load persisted logs from localStorage
  if (config.persistToLocalStorage) {
    try {
      const saved = localStorage.getItem('debugLogger_requests');
      const savedWS = localStorage.getItem('debugLogger_websockets');
      const savedWSMsg = localStorage.getItem('debugLogger_websocketMessages');

      if (saved) {
        state.requests = JSON.parse(saved);
        originalConsole.log('%c💾 Loaded', styles.info, state.requests.length, 'persisted requests');
      }
      if (savedWS) {
        state.websockets = JSON.parse(savedWS);
        originalConsole.log('%c💾 Loaded', styles.info, state.websockets.length, 'persisted websockets');
      }
      if (savedWSMsg) {
        state.websocketMessages = JSON.parse(savedWSMsg);
        originalConsole.log('%c💾 Loaded', styles.info, state.websocketMessages.length, 'persisted websocket messages');
      }
    } catch (e) {
      originalConsole.warn('Failed to load persisted logs:', e);
    }
  }

  // Styles
  const styles = {
    success: 'color: #4CAF50; font-weight: bold;',
    error: 'color: #f44336; font-weight: bold;',
    warning: 'color: #ff9800; font-weight: bold;',
    info: 'color: #2196F3; font-weight: bold;',
    network: 'color: #9C27B0; font-weight: bold;',
    slow: 'color: #ff5722; font-weight: bold; background: #fff3e0; padding: 2px 4px;',
    duplicate: 'color: #ff9800; font-weight: bold; background: #fff8e1; padding: 2px 4px;',
    header: 'background: #2196F3; color: white; padding: 3px 8px; border-radius: 3px;',
  };

  // Filter out Angular/Zone noise (WebSocket removed - we want to track those!)
  const noisePatterns = [
    /zone\.js/i,
    /angular/i,
    /__zone_symbol__/i,
    /webpack/i,
    /HMR/i,
    /\[WDS\]/i,
    /sockjs-node/i,
  ];

  function isNoise(args) {
    if (config.showAngularLogs) return false;

    const str = args.map(arg =>
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');

    return noisePatterns.some(pattern => pattern.test(str));
  }

  // Override console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    group: console.group,
    groupEnd: console.groupEnd,
    table: console.table,
  };

  // Helper to store console logs
  function storeLog(level, args) {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      page: state.currentPage,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
    };

    state.consoleLogs.push(logEntry);

    // Trim if too many logs
    if (state.consoleLogs.length > config.maxStoredLogs) {
      state.consoleLogs = state.consoleLogs.slice(-config.maxStoredLogs);
    }
  }

  console.log = function(...args) {
    if (!isNoise(args)) {
      storeLog('LOG', args);
      originalConsole.log('%c[LOG]', styles.info, ...args);
    }
  };

  console.warn = function(...args) {
    if (!isNoise(args)) {
      storeLog('WARN', args);
      originalConsole.warn('%c[WARN]', styles.warning, ...args);
    }
  };

  console.error = function(...args) {
    if (!isNoise(args)) {
      storeLog('ERROR', args);
      originalConsole.error('%c[ERROR]', styles.error, ...args);
    }
  };

  console.info = function(...args) {
    if (!isNoise(args)) {
      storeLog('INFO', args);
      originalConsole.info('%c[INFO]', styles.info, ...args);
    }
  };

  // Track JavaScript errors
  window.addEventListener('error', (event) => {
    const error = {
      type: 'JavaScript Error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || 'No stack trace available',
      timestamp: new Date().toISOString(),
      page: state.currentPage,
    };

    state.errors.push(error);

    originalConsole.error(
      '%c💥 JAVASCRIPT ERROR',
      'color: #f44336; font-weight: bold; background: #ffebee; padding: 2px 6px;',
      event.message,
      '\n',
      event.filename + ':' + event.lineno
    );
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = {
      type: 'Unhandled Promise Rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || 'No stack trace available',
      timestamp: new Date().toISOString(),
      page: state.currentPage,
    };

    state.errors.push(error);

    originalConsole.error(
      '%c⚠️ UNHANDLED PROMISE REJECTION',
      'color: #ff9800; font-weight: bold; background: #fff3e0; padding: 2px 6px;',
      event.reason
    );
  });

  // Track page navigation
  let lastPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      state.currentPage = lastPath;
      state.pageStartTime = Date.now();
      originalConsole.log(
        '%c📍 PAGE CHANGED',
        styles.header,
        lastPath
      );
      showPageSummary();
    }
  }, 100);

  // Helper to safely get request body
  async function getRequestBody(args) {
    try {
      const body = args[1]?.body;
      if (!body) return null;

      // If it's FormData, don't try to read it
      if (body instanceof FormData) return '[FormData]';

      // If it's a string, truncate if too long
      if (typeof body === 'string') {
        return body.length > 1000 ? body.substring(0, 1000) + '... [truncated]' : body;
      }

      return '[Binary Data]';
    } catch (e) {
      return '[Could not read body]';
    }
  }

  // Helper to safely clone and read response
  async function captureResponseData(response) {
    try {
      const cloned = response.clone();
      const contentType = cloned.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const text = await cloned.text();
        if (text.length > 2000) {
          return text.substring(0, 2000) + '... [truncated]';
        }
        return text;
      }

      if (contentType.includes('text/')) {
        const text = await cloned.text();
        if (text.length > 1000) {
          return text.substring(0, 1000) + '... [truncated]';
        }
        return text;
      }

      return `[${contentType || 'Binary'}]`;
    } catch (e) {
      return '[Could not read response]';
    }
  }

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const method = args[1]?.method || 'GET';
    const startTime = Date.now();

    const requestKey = `${method} ${url}`;
    state.requestCounts[requestKey] = (state.requestCounts[requestKey] || 0) + 1;

    // Capture request headers
    const requestHeaders = {};
    if (args[1]?.headers) {
      const headers = args[1].headers;
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          // Only capture important headers, redact auth tokens
          if (['content-type', 'accept'].includes(key.toLowerCase())) {
            requestHeaders[key] = value;
          } else if (key.toLowerCase().includes('auth')) {
            requestHeaders[key] = '[REDACTED]';
          }
        });
      } else {
        Object.keys(headers).forEach(key => {
          if (['content-type', 'accept'].includes(key.toLowerCase())) {
            requestHeaders[key] = headers[key];
          } else if (key.toLowerCase().includes('auth')) {
            requestHeaders[key] = '[REDACTED]';
          }
        });
      }
    }

    originalConsole.log(
      '%c🌐 REQUEST',
      styles.network,
      method,
      url
    );

    return originalFetch.apply(this, args).then(async response => {
      const duration = Date.now() - startTime;
      const status = response.status;
      const isSuccess = status >= 200 && status < 300;
      const isSlow = duration > config.highlightSlowRequests;
      const isDuplicate = state.requestCounts[requestKey] > 1;

      // Capture response headers (selective)
      const responseHeaders = {};
      ['content-type', 'cache-control', 'x-request-id'].forEach(header => {
        const value = response.headers.get(header);
        if (value) responseHeaders[header] = value;
      });

      // Capture request/response bodies for errors or if it's a mutation
      let requestBody = null;
      let responseBody = null;

      if (!isSuccess || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        requestBody = await getRequestBody(args);
        responseBody = await captureResponseData(response);
      }

      state.requests.push({
        url,
        method,
        status,
        duration,
        timestamp: new Date().toISOString(),
        page: state.currentPage,
        requestHeaders,
        responseHeaders,
        requestBody,
        responseBody,
      });

      let style = isSuccess ? styles.success : styles.error;
      if (isSlow) style = styles.slow;
      if (isDuplicate && config.highlightDuplicates) style = styles.duplicate;

      let logMessage = `%c✓ RESPONSE ${status}`;
      let logDetails = `${method} ${url} - ${duration}ms`;

      if (isSlow) {
        logMessage += ' [SLOW]';
      }

      if (isDuplicate && config.highlightDuplicates) {
        const count = state.requestCounts[requestKey];
        if (!state.duplicateWarnings.has(requestKey)) {
          state.duplicateWarnings.add(requestKey);
          originalConsole.warn(
            '%c⚠️ DUPLICATE REQUEST DETECTED',
            styles.duplicate,
            `${count}x calls to:`,
            requestKey
          );
        }
        logMessage += ` [DUPLICATE #${count}]`;
      }

      originalConsole.log(logMessage, style, logDetails);

      return response;
    }).catch(async error => {
      const duration = Date.now() - startTime;

      // Capture detailed error information
      const errorDetails = {
        url,
        method,
        duration,
        timestamp: new Date().toISOString(),
        page: state.currentPage,
        errorType: error.name,
        errorMessage: error.message,
        stack: error.stack,
        networkError: true,
      };

      state.requests.push(errorDetails);
      state.errors.push({
        type: 'Network Error',
        message: `${method} ${url} failed: ${error.message}`,
        stack: error.stack,
        timestamp: errorDetails.timestamp,
        page: state.currentPage,
      });

      originalConsole.error(
        '%c✗ REQUEST FAILED',
        styles.error,
        method,
        url,
        `-`,
        duration + 'ms',
        error
      );
      throw error;
    });
  };

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._debugMethod = method;
    this._debugUrl = url;
    this._debugStartTime = Date.now();
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const xhr = this;
    const requestKey = `${xhr._debugMethod} ${xhr._debugUrl}`;

    state.requestCounts[requestKey] = (state.requestCounts[requestKey] || 0) + 1;

    originalConsole.log(
      '%c🌐 XHR REQUEST',
      styles.network,
      xhr._debugMethod,
      xhr._debugUrl
    );

    xhr.addEventListener('load', function() {
      const duration = Date.now() - xhr._debugStartTime;
      const status = xhr.status;
      const isSuccess = status >= 200 && status < 300;
      const isSlow = duration > config.highlightSlowRequests;
      const isDuplicate = state.requestCounts[requestKey] > 1;

      state.requests.push({
        url: xhr._debugUrl,
        method: xhr._debugMethod,
        status,
        duration,
        timestamp: new Date().toISOString(),
        page: state.currentPage,
      });

      let style = isSuccess ? styles.success : styles.error;
      if (isSlow) style = styles.slow;
      if (isDuplicate && config.highlightDuplicates) style = styles.duplicate;

      let logMessage = `%c✓ XHR RESPONSE ${status}`;
      let logDetails = `${xhr._debugMethod} ${xhr._debugUrl} - ${duration}ms`;

      if (isSlow) {
        logMessage += ' [SLOW]';
      }

      if (isDuplicate && config.highlightDuplicates) {
        const count = state.requestCounts[requestKey];
        if (!state.duplicateWarnings.has(requestKey)) {
          state.duplicateWarnings.add(requestKey);
          originalConsole.warn(
            '%c⚠️ DUPLICATE XHR REQUEST DETECTED',
            styles.duplicate,
            `${count}x calls to:`,
            requestKey
          );
        }
        logMessage += ` [DUPLICATE #${count}]`;
      }

      originalConsole.log(logMessage, style, logDetails);
    });

    xhr.addEventListener('error', function() {
      const duration = Date.now() - xhr._debugStartTime;
      originalConsole.error(
        '%c✗ XHR FAILED',
        styles.error,
        xhr._debugMethod,
        xhr._debugUrl,
        `-`,
        duration + 'ms'
      );
    });

    return originalXHRSend.apply(this, args);
  };

  // Intercept WebSocket
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    const wsId = Math.random().toString(36).substring(2, 11);
    const startTime = Date.now();

    const wsData = {
      id: wsId,
      url,
      protocols,
      startTime,
      openTime: null,
      closeTime: null,
      readyState: 'CONNECTING',
      messagesSent: 0,
      messagesReceived: 0,
      errors: [],
      reconnects: 0,
      page: state.currentPage,
    };

    state.websockets.push(wsData);

    originalConsole.log(
      '%c🔌 WEBSOCKET CONNECTING',
      'color: #9C27B0; font-weight: bold;',
      url
    );

    // Track open
    const originalOnOpen = ws.onopen;
    ws.addEventListener('open', function(event) {
      const connectTime = Date.now() - startTime;
      wsData.openTime = Date.now();
      wsData.readyState = 'OPEN';

      originalConsole.log(
        '%c✓ WEBSOCKET CONNECTED',
        styles.success,
        `${url} (${connectTime}ms)`,
        `[${wsId}]`
      );

      if (originalOnOpen) originalOnOpen.apply(this, arguments);
    });

    // Track messages sent
    const originalSend = ws.send;
    ws.send = function(data) {
      wsData.messagesSent++;

      const message = {
        wsId,
        direction: 'SENT',
        timestamp: new Date().toISOString(),
        data: typeof data === 'string' ? data : `[${data.constructor.name}]`,
        size: data.length || data.byteLength || 0,
        page: state.currentPage,
      };

      state.websocketMessages.push(message);

      originalConsole.log(
        '%c📤 WS SEND',
        'color: #2196F3; font-weight: bold;',
        `[${wsId}]`,
        typeof data === 'string' ? (data.length > 100 ? data.substring(0, 100) + '...' : data) : `[${data.constructor.name}]`
      );

      return originalSend.apply(this, arguments);
    };

    // Track messages received
    const originalOnMessage = ws.onmessage;
    ws.addEventListener('message', function(event) {
      wsData.messagesReceived++;

      const message = {
        wsId,
        direction: 'RECEIVED',
        timestamp: new Date().toISOString(),
        data: typeof event.data === 'string' ? event.data : `[${event.data.constructor.name}]`,
        size: event.data.length || event.data.byteLength || 0,
        page: state.currentPage,
      };

      state.websocketMessages.push(message);

      originalConsole.log(
        '%c📥 WS RECEIVE',
        'color: #4CAF50; font-weight: bold;',
        `[${wsId}]`,
        typeof event.data === 'string' ? (event.data.length > 100 ? event.data.substring(0, 100) + '...' : event.data) : `[${event.data.constructor.name}]`
      );

      if (originalOnMessage) originalOnMessage.apply(this, arguments);
    });

    // Track errors
    const originalOnError = ws.onerror;
    ws.addEventListener('error', function(event) {
      const error = {
        timestamp: new Date().toISOString(),
        message: 'WebSocket error',
      };

      wsData.errors.push(error);

      originalConsole.error(
        '%c✗ WEBSOCKET ERROR',
        styles.error,
        `[${wsId}]`,
        url
      );

      if (originalOnError) originalOnError.apply(this, arguments);
    });

    // Track close
    const originalOnClose = ws.onclose;
    ws.addEventListener('close', function(event) {
      wsData.closeTime = Date.now();
      wsData.readyState = 'CLOSED';

      const duration = wsData.closeTime - wsData.openTime;
      const wasClean = event.wasClean;
      const code = event.code;
      const reason = event.reason;

      originalConsole.log(
        wasClean ? '%c🔌 WEBSOCKET CLOSED' : '%c⚠️ WEBSOCKET CLOSED UNEXPECTEDLY',
        wasClean ? 'color: #666; font-weight: bold;' : styles.warning,
        `[${wsId}]`,
        `Code: ${code}`,
        reason ? `Reason: ${reason}` : '',
        `Duration: ${duration}ms`,
        `Sent: ${wsData.messagesSent}`,
        `Received: ${wsData.messagesReceived}`
      );

      if (originalOnClose) originalOnClose.apply(this, arguments);
    });

    return ws;
  };
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // Show page summary
  function showPageSummary() {
    const pageRequests = state.requests.filter(r => r.page === state.currentPage);

    if (pageRequests.length === 0) return;

    originalConsole.group('%c📊 PAGE SUMMARY: ' + state.currentPage, styles.header);

    // Total requests
    originalConsole.log(`Total Requests: ${pageRequests.length}`);

    // Slow requests
    const slowRequests = pageRequests.filter(r => r.duration > config.highlightSlowRequests);
    if (slowRequests.length > 0) {
      originalConsole.warn(`Slow Requests (>${config.highlightSlowRequests}ms):`, slowRequests.length);
      slowRequests.forEach(r => {
        originalConsole.warn(`  - ${r.method} ${r.url} (${r.duration}ms)`);
      });
    }

    // Duplicate requests
    const duplicates = {};
    pageRequests.forEach(r => {
      const key = `${r.method} ${r.url}`;
      duplicates[key] = (duplicates[key] || 0) + 1;
    });

    const duplicateKeys = Object.keys(duplicates).filter(k => duplicates[k] > 1);
    if (duplicateKeys.length > 0) {
      originalConsole.warn('Duplicate Requests:');
      duplicateKeys.forEach(key => {
        originalConsole.warn(`  - ${duplicates[key]}x ${key}`);
      });
    }

    // Average response time
    const avgDuration = pageRequests.reduce((sum, r) => sum + r.duration, 0) / pageRequests.length;
    originalConsole.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);

    // Failed requests
    const failed = pageRequests.filter(r => r.status >= 400);
    if (failed.length > 0) {
      originalConsole.error(`Failed Requests:`, failed.length);
      failed.forEach(r => {
        originalConsole.error(`  - ${r.status} ${r.method} ${r.url}`);
      });
    }

    originalConsole.groupEnd();
  }

  // Persist to localStorage
  function persistToLocalStorage() {
    if (!config.persistToLocalStorage) return;

    try {
      localStorage.setItem('debugLogger_requests', JSON.stringify(state.requests));
      localStorage.setItem('debugLogger_consoleLogs', JSON.stringify(state.consoleLogs));
      localStorage.setItem('debugLogger_websockets', JSON.stringify(state.websockets));
      localStorage.setItem('debugLogger_websocketMessages', JSON.stringify(state.websocketMessages));
      localStorage.setItem('debugLogger_lastSaved', new Date().toISOString());
    } catch (e) {
      originalConsole.warn('Failed to persist logs:', e);
    }
  }

  // Check if File System Access API is available
  const supportsFileSystemAccess = 'showDirectoryPicker' in window;

  // Helper to detect Angular component name
  function detectAngularComponent() {
    try {
      // Try to get Angular component from DOM
      const ngComponent = document.querySelector('[ng-version]') ||
                         document.querySelector('[data-ng-app]') ||
                         document.querySelector('[ng-app]');

      if (ngComponent) {
        // Try to get component name from Angular DevTools or DOM attributes
        const componentName = ngComponent.getAttribute('ng-component') ||
                             ngComponent.getAttribute('data-ng-component') ||
                             ngComponent.className.split(' ').find(c => c.includes('Component') || c.includes('component'));

        if (componentName) return componentName;

        // Try to extract from Angular's internal state (if available)
        if (window.ng && window.ng.probe) {
          const rootElement = document.body;
          const componentInstance = window.ng.probe(rootElement);
          if (componentInstance && componentInstance.componentInstance) {
            const constructor = componentInstance.componentInstance.constructor;
            if (constructor && constructor.name) {
              return constructor.name;
            }
          }
        }

        return 'Angular App (component name not detected)';
      }

      // Check for React
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React App';
      }

      // Check for Vue
      if (window.__VUE__) {
        return 'Vue App';
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  // Enhanced Angular component extraction from stack traces
  function extractAngularDetailsFromStack(stack) {
    if (!stack) return null;

    const details = {
      components: [],
      services: [],
      directives: [],
      pipes: [],
      modules: [],
      files: []
    };

    // Patterns for Angular artifacts
    const patterns = {
      component: /([A-Z][a-zA-Z0-9_]*Component)\.?(?:\.([a-zA-Z0-9_]+))?\s*(?:\[as\s+[^\]]+\])?\s*\((?:.*?\/)?([^/:)]+\.(?:component|ts|js))(?::(\d+))?(?::(\d+))?\)/g,
      service: /([A-Z][a-zA-Z0-9_]*Service)\.?(?:\.([a-zA-Z0-9_]+))?\s*(?:\[as\s+[^\]]+\])?\s*\((?:.*?\/)?([^/:)]+\.(?:service|ts|js))(?::(\d+))?(?::(\d+))?\)/g,
      directive: /([A-Z][a-zA-Z0-9_]*Directive)\.?(?:\.([a-zA-Z0-9_]+))?\s*(?:\[as\s+[^\]]+\])?\s*\((?:.*?\/)?([^/:)]+\.(?:directive|ts|js))(?::(\d+))?(?::(\d+))?\)/g,
      pipe: /([A-Z][a-zA-Z0-9_]*Pipe)\.?(?:\.([a-zA-Z0-9_]+))?\s*(?:\[as\s+[^\]]+\])?\s*\((?:.*?\/)?([^/:)]+\.(?:pipe|ts|js))(?::(\d+))?(?::(\d+))?\)/g,
      module: /([A-Z][a-zA-Z0-9_]*Module)\.?(?:\.([a-zA-Z0-9_]+))?\s*(?:\[as\s+[^\]]+\])?\s*\((?:.*?\/)?([^/:)]+\.(?:module|ts|js))(?::(\d+))?(?::(\d+))?\)/g,
      anyFile: /at\s+(?:.*?\s+)?\((?:.*?\/)?([^/:)]+\.(?:ts|js))(?::(\d+))?(?::(\d+))?\)/g
    };

    // Extract components
    let match;
    while ((match = patterns.component.exec(stack)) !== null) {
      details.components.push({
        name: match[1],
        method: match[2] || 'constructor',
        file: match[3],
        line: match[4] ? parseInt(match[4]) : null,
        column: match[5] ? parseInt(match[5]) : null
      });
    }

    // Extract services
    patterns.service.lastIndex = 0;
    while ((match = patterns.service.exec(stack)) !== null) {
      details.services.push({
        name: match[1],
        method: match[2] || 'unknown',
        file: match[3],
        line: match[4] ? parseInt(match[4]) : null,
        column: match[5] ? parseInt(match[5]) : null
      });
    }

    // Extract directives
    patterns.directive.lastIndex = 0;
    while ((match = patterns.directive.exec(stack)) !== null) {
      details.directives.push({
        name: match[1],
        method: match[2] || 'unknown',
        file: match[3],
        line: match[4] ? parseInt(match[4]) : null,
        column: match[5] ? parseInt(match[5]) : null
      });
    }

    // Extract pipes
    patterns.pipe.lastIndex = 0;
    while ((match = patterns.pipe.exec(stack)) !== null) {
      details.pipes.push({
        name: match[1],
        method: match[2] || 'unknown',
        file: match[3],
        line: match[4] ? parseInt(match[4]) : null,
        column: match[5] ? parseInt(match[5]) : null
      });
    }

    // Extract modules
    patterns.module.lastIndex = 0;
    while ((match = patterns.module.exec(stack)) !== null) {
      details.modules.push({
        name: match[1],
        method: match[2] || 'unknown',
        file: match[3],
        line: match[4] ? parseInt(match[4]) : null,
        column: match[5] ? parseInt(match[5]) : null
      });
    }

    // Extract all files mentioned
    patterns.anyFile.lastIndex = 0;
    while ((match = patterns.anyFile.exec(stack)) !== null) {
      details.files.push({
        file: match[1],
        line: match[2] ? parseInt(match[2]) : null,
        column: match[3] ? parseInt(match[3]) : null
      });
    }

    return details;
  }

  // Capture DOM snapshot for context
  function captureDOMSnapshot() {
    try {
      const snapshot = {
        url: window.location.href,
        title: document.title,
        activeElement: document.activeElement ? {
          tagName: document.activeElement.tagName,
          id: document.activeElement.id,
          className: document.activeElement.className,
          value: document.activeElement.value ? '[REDACTED]' : null
        } : null,
        bodyClasses: Array.from(document.body.classList),
        ngVersion: document.querySelector('[ng-version]')?.getAttribute('ng-version'),
        // Angular router state
        routerOutlets: Array.from(document.querySelectorAll('router-outlet')).length,
        // Forms state
        forms: Array.from(document.querySelectorAll('form')).map(form => ({
          id: form.id,
          name: form.name,
          action: form.action,
          method: form.method,
          fields: form.elements.length
        })),
        // Angular-specific elements
        angularComponents: Array.from(document.querySelectorAll('[ng-reflect-ng-if], [ng-reflect-ng-for-of]')).length,
        // Console errors visible
        consoleErrorCount: state.errors.length,
        // Viewport
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        }
      };

      return snapshot;
    } catch (e) {
      return { error: 'Failed to capture DOM snapshot: ' + e.message };
    }
  }

  // Generate AI-friendly analysis prompt
  function generateAIPrompt() {
    const errors = state.errors;
    const slowRequests = state.requests.filter(r => r.duration > config.highlightSlowRequests);
    const failedRequests = state.requests.filter(r => r.status >= 400);
    const duplicateRequests = Object.keys(state.requestCounts).filter(k => state.requestCounts[k] > 1);

    let prompt = `# Angular Application Debug Analysis Request

## Context
I'm debugging an Angular application and need help analyzing the following issues. Please provide:
1. Root cause analysis for each error
2. Specific code fixes with file names and line numbers
3. Best practices recommendations
4. Potential related issues to investigate

## Application Info
- **URL**: ${window.location.href}
- **Page**: ${state.currentPage}
- **Session Duration**: ${Math.round((Date.now() - state.sessionStartTime) / 1000)}s
- **Angular Version**: ${document.querySelector('[ng-version]')?.getAttribute('ng-version') || 'Unknown'}
- **Browser**: ${state.browserInfo.userAgent}

`;

    // Add error details
    if (errors.length > 0) {
      prompt += `## Critical Errors (${errors.length})\n\n`;

      errors.forEach((err, idx) => {
        prompt += `### Error ${idx + 1}: ${err.type}\n\n`;
        prompt += `**Message**: ${err.message}\n\n`;

        if (err.filename) {
          prompt += `**Location**: \`${err.filename}:${err.lineno}:${err.colno || '?'}\`\n\n`;
        }

        // Extract Angular details from stack
        if (err.stack) {
          const angularDetails = extractAngularDetailsFromStack(err.stack);

          if (angularDetails.components.length > 0) {
            prompt += `**Components Involved**:\n`;
            angularDetails.components.forEach(comp => {
              prompt += `- \`${comp.name}\` in \`${comp.file}:${comp.line || '?'}\` (method: \`${comp.method}\`)\n`;
            });
            prompt += '\n';
          }

          if (angularDetails.services.length > 0) {
            prompt += `**Services Involved**:\n`;
            angularDetails.services.forEach(svc => {
              prompt += `- \`${svc.name}\` in \`${svc.file}:${svc.line || '?'}\` (method: \`${svc.method}\`)\n`;
            });
            prompt += '\n';
          }

          prompt += `**Stack Trace**:\n\`\`\`\n${err.stack}\n\`\`\`\n\n`;
        }

        prompt += `---\n\n`;
      });
    }

    // Add performance issues
    if (slowRequests.length > 0) {
      prompt += `## Performance Issues\n\n`;
      prompt += `### Slow Requests (${slowRequests.length} requests > ${config.highlightSlowRequests}ms)\n\n`;

      slowRequests.slice(0, 10).forEach(req => {
        prompt += `- **${req.method} ${req.url}**: ${req.duration}ms (Status: ${req.status})\n`;
      });

      if (slowRequests.length > 10) {
        prompt += `\n...and ${slowRequests.length - 10} more slow requests\n`;
      }
      prompt += '\n';
    }

    // Add failed requests
    if (failedRequests.length > 0) {
      prompt += `### Failed HTTP Requests (${failedRequests.length})\n\n`;

      failedRequests.slice(0, 10).forEach(req => {
        prompt += `- **${req.status} ${req.method} ${req.url}**: ${req.duration}ms\n`;
        if (req.responseBody) {
          const preview = typeof req.responseBody === 'string'
            ? req.responseBody.substring(0, 200)
            : JSON.stringify(req.responseBody).substring(0, 200);
          prompt += `  Response: ${preview}${preview.length >= 200 ? '...' : ''}\n`;
        }
      });

      if (failedRequests.length > 10) {
        prompt += `\n...and ${failedRequests.length - 10} more failed requests\n`;
      }
      prompt += '\n';
    }

    // Add duplicate requests
    if (duplicateRequests.length > 0) {
      prompt += `### Duplicate API Calls (Optimization Opportunity)\n\n`;

      duplicateRequests.slice(0, 10).forEach(key => {
        prompt += `- **${key}**: Called ${state.requestCounts[key]} times\n`;
      });

      if (duplicateRequests.length > 10) {
        prompt += `\n...and ${duplicateRequests.length - 10} more duplicate endpoints\n`;
      }
      prompt += '\n';
    }

    prompt += `## Questions for Analysis\n\n`;
    prompt += `1. What is the root cause of each error?\n`;
    prompt += `2. Which file and line number should I look at first?\n`;
    prompt += `3. What is the recommended fix for each issue?\n`;
    prompt += `4. Are there any patterns suggesting a deeper architectural problem?\n`;
    prompt += `5. What preventive measures should I implement?\n\n`;

    prompt += `## Additional Context\n\n`;
    prompt += `- Total HTTP Requests: ${state.requests.length}\n`;
    prompt += `- Total Console Logs: ${state.consoleLogs.length}\n`;
    prompt += `- WebSocket Connections: ${state.websockets.length}\n\n`;

    prompt += `Please analyze this data and provide actionable recommendations with specific file names and line numbers where possible.\n`;

    return prompt;
  }

  // Generate Jira ticket content
  function generateJiraTicket() {
    const duplicateRequests = Object.keys(state.requestCounts).filter(k => state.requestCounts[k] > 1);
    const slowRequests = state.requests.filter(r => r.duration > config.highlightSlowRequests);
    const failedRequests = state.requests.filter(r => r.status >= 400);
    const jsErrors = state.errors.filter(e => e.type === 'JavaScript Error');
    const networkErrors = state.errors.filter(e => e.type === 'Network Error');
    const promiseRejections = state.errors.filter(e => e.type === 'Unhandled Promise Rejection');
    const userNotes = state.consoleLogs.filter(log => log.level === 'NOTE');
    
    const fullUrl = window.location.href;
    const componentName = detectAngularComponent();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTime = new Date().toLocaleString('en-US', { timeZone: timezone });

    let jira = 'h2. Summary\n\n';
    jira += `*Session ID:* ${state.sessionId}\n`;
    jira += `*Timestamp:* ${new Date().toISOString()} (${currentTime} ${timezone})\n`;
    jira += `*Full URL:* ${fullUrl}\n`;
    jira += `*Page Path:* ${state.currentPage}\n`;
    if (componentName) {
      jira += `*Component/Framework:* ${componentName}\n`;
    }
    jira += `*Session Duration:* ${Math.round((Date.now() - state.sessionStartTime) / 1000)}s\n`;
    jira += `*Time on Current Page:* ${Math.round((Date.now() - state.pageStartTime) / 1000)}s\n\n`;

    jira += 'h2. Environment\n\n';
    jira += `*Browser:* ${state.browserInfo.userAgent}\n`;
    jira += `*Platform:* ${state.browserInfo.platform}\n`;
    jira += `*Language:* ${state.browserInfo.language}\n`;
    jira += `*Timezone:* ${timezone}\n`;
    jira += `*Screen Size:* ${state.browserInfo.screenSize}\n`;
    jira += `*Viewport Size:* ${state.browserInfo.viewportSize}\n`;
    jira += `*Online Status:* ${state.browserInfo.online ? 'Online' : 'Offline'}\n`;
    jira += `*Page Title:* ${document.title}\n`;
    if (document.referrer) {
      jira += `*Referrer:* ${document.referrer}\n`;
    }
    jira += '\n';

    jira += 'h2. Statistics\n\n';
    jira += `* Total HTTP Requests: ${state.requests.length}\n`;
    jira += `* Total Errors: ${state.errors.length}\n`;
    jira += `* JavaScript Errors: ${jsErrors.length}\n`;
    jira += `* Network Errors: ${networkErrors.length}\n`;
    jira += `* Promise Rejections: ${promiseRejections.length}\n`;
    jira += `* Failed Requests (4xx/5xx): ${failedRequests.length}\n`;
    jira += `* Slow Requests (>${config.highlightSlowRequests}ms): ${slowRequests.length}\n`;
    jira += `* Duplicate Requests: ${duplicateRequests.length}\n`;
    jira += `* WebSocket Connections: ${state.websockets.length}\n`;
    jira += `* WebSocket Errors: ${state.websockets.reduce((sum, ws) => sum + ws.errors.length, 0)}\n\n`;

    // Critical Issues Section
    if (state.errors.length > 0 || failedRequests.length > 0) {
      jira += 'h2. Critical Issues\n\n';
      
      if (jsErrors.length > 0) {
        jira += 'h3. JavaScript Errors\n\n';
        jsErrors.forEach((err, idx) => {
          jira += `h4. Error ${idx + 1}\n\n`;
          jira += `*Timestamp:* ${err.timestamp}\n`;
          jira += `*Page/URL:* ${err.page}\n`;
          jira += `*Error Message:* ${err.message}\n`;
          if (err.filename) {
            jira += `*File Location:* ${err.filename}:${err.lineno}:${err.colno || '?'}\n`;
            // Try to extract component info from filename
            const filenameMatch = err.filename.match(/([^/\\]+)\.(component|service|directive|pipe)\.(ts|js)/i);
            if (filenameMatch) {
              jira += `*Detected Component/Service:* ${filenameMatch[1]}\n`;
            }
          }

          // Extract Angular details from stack trace
          if (err.stack) {
            const angularDetails = extractAngularDetailsFromStack(err.stack);

            if (angularDetails.components.length > 0) {
              jira += '\n*Angular Components Involved:*\n';
              angularDetails.components.forEach(comp => {
                jira += `* {{${comp.name}}} - File: {{${comp.file}:${comp.line || '?'}}} (Method: {{${comp.method}}})\n`;
              });
            }

            if (angularDetails.services.length > 0) {
              jira += '\n*Angular Services Involved:*\n';
              angularDetails.services.forEach(svc => {
                jira += `* {{${svc.name}}} - File: {{${svc.file}:${svc.line || '?'}}} (Method: {{${svc.method}}})\n`;
              });
            }

            if (angularDetails.directives.length > 0) {
              jira += '\n*Angular Directives Involved:*\n';
              angularDetails.directives.forEach(dir => {
                jira += `* {{${dir.name}}} - File: {{${dir.file}:${dir.line || '?'}}} (Method: {{${dir.method}}})\n`;
              });
            }

            if (angularDetails.pipes.length > 0) {
              jira += '\n*Angular Pipes Involved:*\n';
              angularDetails.pipes.forEach(pipe => {
                jira += `* {{${pipe.name}}} - File: {{${pipe.file}:${pipe.line || '?'}}} (Method: {{${pipe.method}}})\n`;
              });
            }

            if (angularDetails.modules.length > 0) {
              jira += '\n*Angular Modules Involved:*\n';
              angularDetails.modules.forEach(mod => {
                jira += `* {{${mod.name}}} - File: {{${mod.file}:${mod.line || '?'}}}\n`;
              });
            }

            jira += '\n*Full Stack Trace:*\n';
            jira += '{code:javascript}\n';
            jira += err.stack + '\n';
            jira += '{code}\n';
          }
          jira += '\n';
        });
      }

      if (networkErrors.length > 0) {
        jira += 'h3. Network Errors\n\n';
        networkErrors.forEach((err, idx) => {
          jira += `h4. Network Error ${idx + 1}\n\n`;
          jira += `*Timestamp:* ${err.timestamp}\n`;
          jira += `*Page/URL:* ${err.page}\n`;
          jira += `*Error Message:* ${err.message}\n`;
          if (err.stack) {
            jira += '\n*Stack Trace:*\n';
            jira += '{code}\n';
            jira += err.stack + '\n';
            jira += '{code}\n';
          }
          jira += '\n';
        });
      }

      if (promiseRejections.length > 0) {
        jira += 'h3. Unhandled Promise Rejections\n\n';
        promiseRejections.forEach((err, idx) => {
          jira += `*Rejection ${idx + 1}:* ${err.message}\n`;
          jira += `*Page:* ${err.page}\n`;
          jira += `*Timestamp:* ${err.timestamp}\n`;
          if (err.stack) {
            jira += '\n{code:javascript}\n' + err.stack + '\n{code}\n';
          }
          jira += '\n';
        });
      }

      if (failedRequests.length > 0) {
        jira += 'h3. Failed HTTP Requests (4xx/5xx)\n\n';
        failedRequests.forEach((r, idx) => {
          jira += `h4. Failed Request ${idx + 1}\n\n`;
          jira += `*Method:* ${r.method}\n`;
          jira += `*URL:* ${r.url}\n`;
          jira += `*Status Code:* ${r.status}\n`;
          jira += `*Duration:* ${r.duration}ms\n`;
          jira += `*Timestamp:* ${r.timestamp}\n`;
          jira += `*Page/URL:* ${r.page}\n`;
          
          if (r.requestHeaders && Object.keys(r.requestHeaders).length > 0) {
            jira += '\n*Request Headers:*\n';
            jira += '{code}\n';
            Object.entries(r.requestHeaders).forEach(([key, value]) => {
              jira += `${key}: ${value}\n`;
            });
            jira += '{code}\n';
          }
          
          if (r.requestBody) {
            jira += '\n*Request Body:*\n';
            jira += '{code:json}\n';
            const bodyStr = typeof r.requestBody === 'string' ? r.requestBody : JSON.stringify(r.requestBody, null, 2);
            jira += bodyStr.substring(0, 2000) + (bodyStr.length > 2000 ? '\n... [truncated]' : '') + '\n';
            jira += '{code}\n';
          }
          
          if (r.responseHeaders && Object.keys(r.responseHeaders).length > 0) {
            jira += '\n*Response Headers:*\n';
            jira += '{code}\n';
            Object.entries(r.responseHeaders).forEach(([key, value]) => {
              jira += `${key}: ${value}\n`;
            });
            jira += '{code}\n';
          }
          
          if (r.responseBody) {
            jira += '\n*Response Body:*\n';
            jira += '{code:json}\n';
            const respStr = typeof r.responseBody === 'string' ? r.responseBody : JSON.stringify(r.responseBody, null, 2);
            jira += respStr.substring(0, 2000) + (respStr.length > 2000 ? '\n... [truncated]' : '') + '\n';
            jira += '{code}\n';
          }
          
          jira += '\n';
        });
      }
    }

    // Performance Issues
    if (slowRequests.length > 0 || duplicateRequests.length > 0) {
      jira += 'h2. Performance Issues\n\n';
      
      if (slowRequests.length > 0) {
        jira += 'h3. Slow Requests (>' + config.highlightSlowRequests + 'ms)\n\n';
        jira += '||Method||URL||Duration||Status||Page||\n';
        slowRequests.slice(0, 15).forEach(r => {
          jira += `|${r.method}|${r.url}|${r.duration}ms|${r.status || 'N/A'}|${r.page}|\n`;
        });
        if (slowRequests.length > 15) {
          jira += `\n_... and ${slowRequests.length - 15} more slow requests_\n`;
        }
        jira += '\n';
      }

      if (duplicateRequests.length > 0) {
        jira += 'h3. Duplicate API Calls\n\n';
        duplicateRequests.slice(0, 10).forEach(key => {
          const count = state.requestCounts[key];
          jira += `* ${key} - Called ${count} times\n`;
        });
        if (duplicateRequests.length > 10) {
          jira += `\n_... and ${duplicateRequests.length - 10} more duplicate endpoints_\n`;
        }
        jira += '\n';
      }
    }

    // WebSocket Issues
    const wsErrors = state.websockets.filter(ws => ws.errors.length > 0 || ws.readyState === 'CLOSED');
    if (wsErrors.length > 0) {
      jira += 'h2. WebSocket Issues\n\n';
      wsErrors.forEach(ws => {
        jira += `*Connection:* ${ws.url}\n`;
        jira += `*State:* ${ws.readyState}\n`;
        jira += `*Errors:* ${ws.errors.length}\n`;
        if (ws.errors.length > 0) {
          ws.errors.forEach(err => {
            jira += `** ${err.message} (${err.timestamp})\n`;
          });
        }
        jira += '\n';
      });
    }

    // Steps to Reproduce (from user notes)
    if (userNotes.length > 0) {
      jira += 'h2. Steps to Reproduce\n\n';
      userNotes.forEach((note, idx) => {
        jira += `${idx + 1}. ${note.message.replace('📝 USER NOTE: ', '')} (${note.timestamp})\n`;
      });
      jira += '\n';
    }

    // Request Timeline (recent requests)
    if (state.requests.length > 0) {
      jira += 'h2. Recent Request Timeline\n\n';
      jira += 'Shows the last 20 requests made during this session:\n\n';
      jira += '||Time||Method||URL||Status||Duration||\n';
      state.requests.slice(-20).forEach(r => {
        const time = new Date(r.timestamp).toLocaleTimeString();
        jira += `|${time}|${r.method}|${r.url}|${r.status || 'N/A'}|${r.duration}ms|\n`;
      });
      jira += '\n';
    }

    // Additional Context
    jira += 'h2. Additional Context\n\n';
    jira += `*Total HTTP Requests:* ${state.requests.length}\n`;
    jira += `*Total Console Logs:* ${state.consoleLogs.length}\n`;
    jira += `*Total WebSocket Messages:* ${state.websocketMessages.length}\n`;
    jira += `*Active WebSocket Connections:* ${state.websockets.filter(ws => ws.readyState === 'OPEN').length}\n`;
    
    // Page navigation history
    const uniquePages = [...new Set(state.requests.map(r => r.page))];
    if (uniquePages.length > 1) {
      jira += `\n*Pages Visited During Session:* ${uniquePages.length}\n`;
      uniquePages.forEach(page => {
        const pageRequests = state.requests.filter(r => r.page === page).length;
        jira += `** ${page} (${pageRequests} requests)\n`;
      });
    }
    
    jira += '\n';
    jira += '*Note: Full debug logs with complete request/response data available via `debugLogger.export()` or `debugLogger.downloadText()`.*\n';

    return jira;
  }

  // Generate Copilot-optimized Markdown log
  function generateCopilotMarkdown() {
    const errors = state.errors;
    const slowRequests = state.requests.filter(r => r.duration > config.highlightSlowRequests);
    const failedRequests = state.requests.filter(r => r.status >= 400);
    const duplicateRequests = Object.keys(state.requestCounts).filter(k => state.requestCounts[k] > 1);
    const jsErrors = state.errors.filter(e => e.type === 'JavaScript Error');
    const networkErrors = state.errors.filter(e => e.type === 'Network Error');
    const componentName = detectAngularComponent();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let md = `# Debug Log Analysis\n\n`;
    md += `> **For VS Code Copilot**: This file contains comprehensive debugging information from an Angular application. Read this file to understand errors, performance issues, and help create JIRA tickets or suggest fixes.\n\n`;

    md += `## Session Information\n\n`;
    md += `- **Session ID**: \`${state.sessionId}\`\n`;
    md += `- **Timestamp**: ${new Date().toISOString()}\n`;
    md += `- **URL**: ${window.location.href}\n`;
    md += `- **Current Page**: ${state.currentPage}\n`;
    md += `- **Angular Version**: ${document.querySelector('[ng-version]')?.getAttribute('ng-version') || 'Not detected'}\n`;
    if (componentName) {
      md += `- **Current Component**: ${componentName}\n`;
    }
    md += `- **Browser**: ${state.browserInfo.userAgent}\n`;
    md += `- **Platform**: ${state.browserInfo.platform}\n`;
    md += `- **Session Duration**: ${Math.round((Date.now() - state.sessionStartTime) / 1000)}s\n\n`;

    md += `## Quick Summary\n\n`;
    md += `| Metric | Count | Status |\n`;
    md += `|--------|-------|--------|\n`;
    md += `| Total Errors | ${errors.length} | ${errors.length > 0 ? '❌ CRITICAL' : '✅ OK'} |\n`;
    md += `| HTTP Requests | ${state.requests.length} | ℹ️ Info |\n`;
    md += `| Failed Requests (4xx/5xx) | ${failedRequests.length} | ${failedRequests.length > 0 ? '⚠️ Warning' : '✅ OK'} |\n`;
    md += `| Slow Requests (>${config.highlightSlowRequests}ms) | ${slowRequests.length} | ${slowRequests.length > 0 ? '⚠️ Warning' : '✅ OK'} |\n`;
    md += `| Duplicate API Calls | ${duplicateRequests.length} | ${duplicateRequests.length > 0 ? '⚠️ Warning' : '✅ OK'} |\n`;
    md += `| WebSocket Connections | ${state.websockets.length} | ℹ️ Info |\n\n`;

    // Priority Issues Section
    md += `## 🚨 Priority Issues\n\n`;
    if (errors.length === 0 && failedRequests.length === 0) {
      md += `✅ **No critical issues detected!**\n\n`;
    } else {
      if (jsErrors.length > 0) {
        md += `### ❌ JavaScript Errors (${jsErrors.length})\n\n`;
        md += `**Copilot**: Please analyze these errors and suggest fixes.\n\n`;

        jsErrors.forEach((err, idx) => {
          md += `#### Error ${idx + 1}: ${err.message}\n\n`;
          md += `- **Type**: ${err.type}\n`;
          md += `- **Page**: \`${err.page}\`\n`;
          md += `- **Timestamp**: ${err.timestamp}\n`;

          if (err.filename) {
            md += `- **Location**: \`${err.filename}:${err.lineno}:${err.colno || '?'}\`\n`;
          }

          if (err.stack) {
            const angularDetails = extractAngularDetailsFromStack(err.stack);

            if (angularDetails.components.length > 0) {
              md += `\n**Angular Components**:\n`;
              angularDetails.components.forEach(comp => {
                md += `- \`${comp.name}\` in \`${comp.file}:${comp.line || '?'}\` (method: \`${comp.method}\`)\n`;
              });
            }

            if (angularDetails.services.length > 0) {
              md += `\n**Angular Services**:\n`;
              angularDetails.services.forEach(svc => {
                md += `- \`${svc.name}\` in \`${svc.file}:${svc.line || '?'}\` (method: \`${svc.method}\`)\n`;
              });
            }

            md += `\n**Stack Trace**:\n\`\`\`\n${err.stack}\n\`\`\`\n\n`;
          }

          md += `---\n\n`;
        });
      }

      if (failedRequests.length > 0) {
        md += `### ⚠️ Failed HTTP Requests (${failedRequests.length})\n\n`;
        md += `**Copilot**: Please analyze these failed requests and suggest fixes.\n\n`;

        failedRequests.forEach((req, idx) => {
          md += `#### Failed Request ${idx + 1}\n\n`;
          md += `- **Method**: \`${req.method}\`\n`;
          md += `- **URL**: \`${req.url}\`\n`;
          md += `- **Status**: ${req.status}\n`;
          md += `- **Duration**: ${req.duration}ms\n`;
          md += `- **Page**: \`${req.page}\`\n`;

          if (req.requestBody) {
            md += `\n**Request Body**:\n\`\`\`json\n${typeof req.requestBody === 'string' ? req.requestBody.substring(0, 500) : JSON.stringify(req.requestBody, null, 2).substring(0, 500)}\n\`\`\`\n`;
          }

          if (req.responseBody) {
            md += `\n**Response Body**:\n\`\`\`json\n${typeof req.responseBody === 'string' ? req.responseBody.substring(0, 500) : JSON.stringify(req.responseBody, null, 2).substring(0, 500)}\n\`\`\`\n`;
          }

          md += `\n---\n\n`;
        });
      }
    }

    // Performance Issues
    if (slowRequests.length > 0 || duplicateRequests.length > 0) {
      md += `## ⚡ Performance Issues\n\n`;

      if (slowRequests.length > 0) {
        md += `### Slow Requests (${slowRequests.length})\n\n`;
        md += `**Copilot**: These requests are slower than ${config.highlightSlowRequests}ms. Please suggest optimizations.\n\n`;
        md += `| Method | URL | Duration | Status |\n`;
        md += `|--------|-----|----------|--------|\n`;
        slowRequests.slice(0, 20).forEach(req => {
          md += `| ${req.method} | \`${req.url}\` | ${req.duration}ms | ${req.status || 'N/A'} |\n`;
        });
        md += `\n`;
      }

      if (duplicateRequests.length > 0) {
        md += `### Duplicate API Calls (${duplicateRequests.length})\n\n`;
        md += `**Copilot**: These endpoints are being called multiple times. Please suggest deduplication strategies.\n\n`;
        md += `| Endpoint | Times Called |\n`;
        md += `|----------|-------------|\n`;
        duplicateRequests.forEach(key => {
          md += `| \`${key}\` | ${state.requestCounts[key]}x |\n`;
        });
        md += `\n`;
      }
    }

    // Recent Activity
    md += `## 📊 Recent Activity\n\n`;
    md += `Last 10 requests:\n\n`;
    md += `| Time | Method | URL | Status | Duration |\n`;
    md += `|------|--------|-----|--------|----------|\n`;
    state.requests.slice(-10).forEach(req => {
      const time = new Date(req.timestamp).toLocaleTimeString();
      md += `| ${time} | ${req.method} | \`${req.url}\` | ${req.status || 'N/A'} | ${req.duration}ms |\n`;
    });
    md += `\n`;

    // Copilot Action Items
    md += `## 🤖 Copilot Action Items\n\n`;
    md += `Please help with the following:\n\n`;

    if (errors.length > 0) {
      md += `1. **Error Analysis**: Analyze the ${errors.length} error(s) above and provide:\n`;
      md += `   - Root cause for each error\n`;
      md += `   - Specific code fixes with file names and line numbers\n`;
      md += `   - Prevention strategies\n\n`;
    }

    if (failedRequests.length > 0) {
      md += `2. **Failed Request Analysis**: Review the ${failedRequests.length} failed request(s) and suggest:\n`;
      md += `   - Why the requests failed\n`;
      md += `   - How to fix the request payload or endpoint\n`;
      md += `   - Error handling improvements\n\n`;
    }

    if (slowRequests.length > 0) {
      md += `3. **Performance Optimization**: Optimize the ${slowRequests.length} slow request(s):\n`;
      md += `   - Identify bottlenecks\n`;
      md += `   - Suggest caching strategies\n`;
      md += `   - Recommend pagination or lazy loading\n\n`;
    }

    if (duplicateRequests.length > 0) {
      md += `4. **Deduplication**: Eliminate ${duplicateRequests.length} duplicate API call(s):\n`;
      md += `   - Identify why duplicates occur\n`;
      md += `   - Suggest state management improvements\n`;
      md += `   - Recommend request caching\n\n`;
    }

    md += `5. **JIRA Ticket**: Generate a comprehensive JIRA ticket for these issues including:\n`;
    md += `   - Summary and description\n`;
    md += `   - Steps to reproduce\n`;
    md += `   - Expected vs actual behavior\n`;
    md += `   - Technical details (component names, file paths, line numbers)\n`;
    md += `   - Acceptance criteria\n\n`;

    md += `---\n\n`;
    md += `*Generated by Debug Logger Enhanced for Angular*\n`;
    md += `*Session: ${state.sessionId}*\n`;

    return md;
  }

  // Generate text log content
  function generateTextLog() {
    let text = `Debug Logs\n`;
    text += `Session: ${state.sessionId}\n`;
    text += `Generated: ${new Date().toISOString()}\n`;
    text += `Current Page: ${state.currentPage}\n`;
    text += `\n${'='.repeat(80)}\n\n`;

    // Summary
    text += `SUMMARY\n`;
    text += `-------\n`;
    text += `Total Network Requests: ${state.requests.length}\n`;
    text += `Total Console Logs: ${state.consoleLogs.length}\n`;
    text += `Total Errors: ${state.errors.length}\n`;
    text += `Total WebSockets: ${state.websockets.length}\n`;
    text += `Active WebSockets: ${state.websockets.filter(ws => ws.readyState === 'OPEN').length}\n`;
    text += `Total WS Messages: ${state.websocketMessages.length}\n`;
    text += `WebSocket Errors: ${state.websockets.reduce((sum, ws) => sum + ws.errors.length, 0)}\n`;
    text += `Duplicate Requests: ${Object.keys(state.requestCounts).filter(k => state.requestCounts[k] > 1).length}\n`;
    text += `Slow Requests (>${config.highlightSlowRequests}ms): ${state.requests.filter(r => r.duration > config.highlightSlowRequests).length}\n`;
    text += `\n${'='.repeat(80)}\n\n`;

    // Errors
    if (state.errors.length > 0) {
      text += `ERRORS (CRITICAL - FIX THESE FIRST!)\n`;
      text += `${'='.repeat(80)}\n\n`;
      state.errors.forEach(err => {
        text += `[${err.timestamp}] ${err.type}\n`;
        text += `  Page: ${err.page}\n`;
        text += `  Message: ${err.message}\n`;
        if (err.filename) {
          text += `  File: ${err.filename}:${err.lineno}:${err.colno || '?'}\n`;
        }
        if (err.stack) {
          text += `  Stack Trace:\n${err.stack.split('\n').map(line => '    ' + line).join('\n')}\n`;
        }
        text += `\n`;
      });
      text += `${'='.repeat(80)}\n\n`;
    }

    // WebSocket connections
    if (state.websockets.length > 0) {
      text += `WEBSOCKET CONNECTIONS\n`;
      text += `---------------------\n`;
      state.websockets.forEach(ws => {
        const duration = ws.closeTime ? ws.closeTime - ws.openTime : Date.now() - ws.openTime;
        text += `[${ws.id}] ${ws.url}\n`;
        text += `  State: ${ws.readyState}\n`;
        text += `  Duration: ${duration}ms\n`;
        text += `  Messages Sent: ${ws.messagesSent}\n`;
        text += `  Messages Received: ${ws.messagesReceived}\n`;
        text += `  Errors: ${ws.errors.length}\n`;
        if (ws.errors.length > 0) {
          ws.errors.forEach(err => {
            text += `    - [${err.timestamp}] ${err.message}\n`;
          });
        }
        text += `\n`;
      });
      text += `${'='.repeat(80)}\n\n`;

      // WebSocket messages
      text += `WEBSOCKET MESSAGES\n`;
      text += `------------------\n`;
      state.websocketMessages.forEach(msg => {
        const preview = typeof msg.data === 'string' && msg.data.length > 100
          ? msg.data.substring(0, 100) + '...'
          : msg.data;
        text += `[${msg.timestamp}] [${msg.wsId}] ${msg.direction} (${msg.size} bytes) - ${msg.page}\n`;
        text += `  ${preview}\n`;
      });
      text += `\n${'='.repeat(80)}\n\n`;
    }

    // Network requests
    text += `NETWORK REQUESTS\n`;
    text += `----------------\n`;
    state.requests.forEach(r => {
      text += `[${r.timestamp}] ${r.status} ${r.method} ${r.url} (${r.duration}ms) - ${r.page}\n`;
      if (r.requestBody) {
        text += `  Request Body: ${typeof r.requestBody === 'string' ? r.requestBody.substring(0, 200) : r.requestBody}\n`;
      }
      if (r.responseBody && (r.status >= 400 || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method))) {
        text += `  Response: ${typeof r.responseBody === 'string' ? r.responseBody.substring(0, 200) : r.responseBody}\n`;
      }
    });
    text += `\n${'='.repeat(80)}\n\n`;

    // Console logs
    text += `CONSOLE LOGS\n`;
    text += `------------\n`;
    state.consoleLogs.forEach(log => {
      text += `[${log.timestamp}] [${log.level}] ${log.message} - ${log.page}\n`;
    });

    // Highlight user notes separately
    const userNotes = state.consoleLogs.filter(log => log.level === 'NOTE');
    if (userNotes.length > 0) {
      text += `\n${'='.repeat(80)}\n\n`;
      text += `USER NOTES (for easy reference)\n`;
      text += `--------------------------------\n`;
      userNotes.forEach(note => {
        text += `[${note.timestamp}] ${note.message} - ${note.page}\n`;
      });
    }

    return text;
  }

  // Save logs to files using File System Access API or downloads
  async function saveToFiles() {
    if (!config.saveToFiles) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dateStr = new Date().toISOString().split('T')[0];
    const sessionShort = state.sessionId.split('-')[1] || 'session';

    try {
      if (supportsFileSystemAccess && state.fileHandle) {
        // Use File System Access API
        const jsonData = window.debugLogger.export();
        const textData = generateTextLog();

        if (config.fileFormat === 'json' || config.fileFormat === 'both') {
          const jsonFile = await state.fileHandle.getFileHandle(
            `debug-logs-${dateStr}-${sessionShort}.json`,
            { create: true }
          );
          const writable = await jsonFile.createWritable();
          await writable.write(JSON.stringify(jsonData, null, 2));
          await writable.close();
        }

        if (config.fileFormat === 'text' || config.fileFormat === 'both') {
          const textFile = await state.fileHandle.getFileHandle(
            `debug-logs-${dateStr}-${sessionShort}.txt`,
            { create: true }
          );
          const writable = await textFile.createWritable();
          await writable.write(textData);
          await writable.close();
        }

        state.lastFileSave = Date.now();
        originalConsole.log('%c💾 Logs saved to files', styles.success);
      } else {
        // Fallback to automatic downloads
        if (config.fileFormat === 'json' || config.fileFormat === 'both') {
          const jsonData = window.debugLogger.export();
          const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `debug-logs-${dateStr}-${sessionShort}.json`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        if (config.fileFormat === 'text' || config.fileFormat === 'both') {
          const textData = generateTextLog();
          const blob = new Blob([textData], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `debug-logs-${dateStr}-${sessionShort}.txt`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        state.lastFileSave = Date.now();
        originalConsole.log('%c💾 Logs downloaded (File System API not available)', styles.info);
      }
    } catch (error) {
      originalConsole.warn('%c⚠️ Failed to save files:', styles.warning, error.message);
    }
  }

  // Send logs to backend
  function sendToBackend() {
    if (!config.sendToBackend) return;

    const data = {
      sessionId: state.sessionId,
      timestamp: new Date().toISOString(),
      currentPage: state.currentPage,
      sessionDuration: Date.now() - state.sessionStartTime,
      browserInfo: state.browserInfo,
      requests: state.requests,
      consoleLogs: state.consoleLogs,
      websockets: state.websockets,
      websocketMessages: state.websocketMessages,
      errors: state.errors,
      summary: {
        totalRequests: state.requests.length,
        totalLogs: state.consoleLogs.length,
        totalErrors: state.errors.length,
        totalWebsockets: state.websockets.length,
        totalWSMessages: state.websocketMessages.length,
        activeWebsockets: state.websockets.filter(ws => ws.readyState === 'OPEN').length,
        websocketErrors: state.websockets.reduce((sum, ws) => sum + ws.errors.length, 0),
        duplicates: Object.keys(state.requestCounts).filter(k => state.requestCounts[k] > 1).length,
        slowRequests: state.requests.filter(r => r.duration > config.highlightSlowRequests).length,
        networkErrors: state.errors.filter(e => e.type === 'Network Error').length,
        jsErrors: state.errors.filter(e => e.type === 'JavaScript Error').length,
        promiseRejections: state.errors.filter(e => e.type === 'Unhandled Promise Rejection').length,
      }
    };

    fetch(config.backendLogUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(res => {
      if (res.ok) {
        originalConsole.log('%c📤 Logs sent to backend', styles.success);
      } else {
        originalConsole.warn('%c📤 Failed to send logs:', styles.warning, res.status);
      }
    })
    .catch(err => {
      originalConsole.warn('%c📤 Failed to send logs:', styles.warning, err.message);
    });
  }

  // Auto-save interval
  if (config.autoSaveInterval > 0) {
    setInterval(() => {
      persistToLocalStorage();
      if (config.sendToBackend) {
        sendToBackend();
      }
    }, config.autoSaveInterval);
  }

  // Auto-save files interval
  if (config.fileSaveInterval > 0 && config.saveToFiles) {
    setInterval(() => {
      saveToFiles();
    }, config.fileSaveInterval);
  }

  // Save on page unload
  window.addEventListener('beforeunload', () => {
    persistToLocalStorage();
    if (config.saveToFiles) {
      // Use synchronous save attempt (may not complete if page closes too fast)
      saveToFiles().catch(() => {
        // Ignore errors on page unload
      });
    }
  });

  // Helper functions available globally
  window.debugLogger = {
    // Show summary for current page
    showSummary: () => showPageSummary(),

    // Show all requests
    showAllRequests: () => {
      originalConsole.table(state.requests);
    },

    // Show all errors
    showErrors: () => {
      originalConsole.group('%c💥 Errors', styles.header);

      if (state.errors.length === 0) {
        originalConsole.log('No errors tracked ✅');
      } else {
        originalConsole.log(`Total Errors: ${state.errors.length}`);
        originalConsole.log(`  - JavaScript Errors: ${state.errors.filter(e => e.type === 'JavaScript Error').length}`);
        originalConsole.log(`  - Network Errors: ${state.errors.filter(e => e.type === 'Network Error').length}`);
        originalConsole.log(`  - Promise Rejections: ${state.errors.filter(e => e.type === 'Unhandled Promise Rejection').length}`);
        originalConsole.log('');

        state.errors.forEach((err, index) => {
          originalConsole.group(`${index + 1}. [${err.timestamp}] ${err.type}`);
          originalConsole.log('Message:', err.message);
          originalConsole.log('Page:', err.page);
          if (err.filename) {
            originalConsole.log('File:', `${err.filename}:${err.lineno}`);
          }
          if (err.stack) {
            originalConsole.log('Stack:', err.stack);
          }
          originalConsole.groupEnd();
        });
      }

      originalConsole.groupEnd();
    },

    // Show all websockets
    showWebSockets: () => {
      originalConsole.group('%c🔌 WebSocket Connections', styles.header);

      if (state.websockets.length === 0) {
        originalConsole.log('No WebSocket connections tracked');
      } else {
        originalConsole.table(state.websockets);

        const active = state.websockets.filter(ws => ws.readyState === 'OPEN');
        const closed = state.websockets.filter(ws => ws.readyState === 'CLOSED');
        const errors = state.websockets.filter(ws => ws.errors.length > 0);

        originalConsole.log(`Total: ${state.websockets.length}`);
        originalConsole.log(`Active: ${active.length}`);
        originalConsole.log(`Closed: ${closed.length}`);
        if (errors.length > 0) {
          originalConsole.warn(`With Errors: ${errors.length}`);
        }
      }

      originalConsole.groupEnd();
    },

    // Show websocket messages
    showWebSocketMessages: (wsId = null) => {
      const messages = wsId
        ? state.websocketMessages.filter(m => m.wsId === wsId)
        : state.websocketMessages;

      originalConsole.group(wsId ? `%c📨 WebSocket Messages [${wsId}]` : '%c📨 All WebSocket Messages', styles.header);

      if (messages.length === 0) {
        originalConsole.log('No messages');
      } else {
        originalConsole.table(messages);

        const sent = messages.filter(m => m.direction === 'SENT');
        const received = messages.filter(m => m.direction === 'RECEIVED');

        originalConsole.log(`Total: ${messages.length} (Sent: ${sent.length}, Received: ${received.length})`);
      }

      originalConsole.groupEnd();
    },

    // Show requests by endpoint
    showByEndpoint: () => {
      const byEndpoint = {};
      state.requests.forEach(r => {
        const key = `${r.method} ${r.url}`;
        if (!byEndpoint[key]) {
          byEndpoint[key] = { count: 0, totalDuration: 0, avgDuration: 0 };
        }
        byEndpoint[key].count++;
        byEndpoint[key].totalDuration += r.duration;
      });

      Object.keys(byEndpoint).forEach(key => {
        byEndpoint[key].avgDuration = Math.round(byEndpoint[key].totalDuration / byEndpoint[key].count);
      });

      originalConsole.table(byEndpoint);
    },

    // Clear all tracking
    clear: () => {
      state.requests = [];
      state.requestCounts = {};
      state.duplicateWarnings.clear();
      console.clear();
      originalConsole.log('%c🧹 Debug logger cleared', styles.info);
    },

    // Export data as JSON
    export: () => {
      const data = {
        sessionId: state.sessionId,
        requests: state.requests,
        consoleLogs: state.consoleLogs,
        websockets: state.websockets,
        websocketMessages: state.websocketMessages,
        requestCounts: state.requestCounts,
        currentPage: state.currentPage,
        timestamp: new Date().toISOString(),
      };
      originalConsole.log('Export Data:', JSON.stringify(data, null, 2));
      return data;
    },

    // Download logs as JSON file
    download: (filename) => {
      const data = window.debugLogger.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      originalConsole.log('%c💾 Logs downloaded', styles.success);
    },

    // Download logs as readable text file
    downloadText: (filename) => {
      const text = generateTextLog();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      originalConsole.log('%c💾 Text logs downloaded', styles.success);
    },

    // Download Copilot-optimized Markdown file
    downloadCopilotLog: (filename) => {
      const markdown = generateCopilotMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `debug-copilot-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      originalConsole.log('%c🤖 Copilot-optimized log downloaded!', styles.success);
      originalConsole.log('%c📝 This file is optimized for VS Code Copilot to read and analyze', styles.info);
      originalConsole.log('%c   1. Save to your project folder (e.g., ./debugger/)', styles.info);
      originalConsole.log('%c   2. Open in VS Code', styles.info);
      originalConsole.log('%c   3. Ask Copilot: "Read this file and create a JIRA ticket"', styles.info);
      return 'Copilot log downloaded';
    },

    // Save Copilot log to console for copy/paste
    copilotLog: () => {
      const markdown = generateCopilotMarkdown();
      originalConsole.log('\n' + '='.repeat(80));
      originalConsole.log('🤖 COPILOT-OPTIMIZED DEBUG LOG');
      originalConsole.log('='.repeat(80));
      originalConsole.log('\n' + markdown + '\n');
      originalConsole.log('='.repeat(80));
      originalConsole.log('\n%c💡 TIP:', 'font-weight: bold; color: #2196F3;');
      originalConsole.log('   1. Copy this entire log');
      originalConsole.log('   2. Save as a .md file in your project (e.g., debugger/debug-log.md)');
      originalConsole.log('   3. Open in VS Code and ask Copilot to analyze it');
      originalConsole.log('   4. Or use: dl.downloadCopilotLog() to download directly\n');
      return markdown;
    },

    // Send logs to backend now
    sendToBackend: () => {
      sendToBackend();
    },

    // Select directory for file saving (File System Access API)
    selectDirectory: async () => {
      if (!supportsFileSystemAccess) {
        originalConsole.warn('%c⚠️ File System Access API not supported in this browser', styles.warning);
        originalConsole.log('File saving will use automatic downloads instead');
        config.saveToFiles = true;
        return 'File saving enabled (using downloads)';
      }

      try {
        state.fileHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'desktop'
        });
        config.saveToFiles = true;
        originalConsole.log('%c✅ Directory selected for file saving', styles.success);
        originalConsole.log('Files will be saved to the selected directory');
        
        // Save immediately
        await saveToFiles();
        
        return 'Directory selected and first save completed';
      } catch (error) {
        if (error.name === 'AbortError') {
          originalConsole.log('Directory selection cancelled');
          return 'Directory selection cancelled';
        }
        originalConsole.error('Failed to select directory:', error);
        return 'Failed to select directory: ' + error.message;
      }
    },

    // Enable file saving (will prompt for directory if not selected)
    enableFileSaving: async () => {
      if (!state.fileHandle && supportsFileSystemAccess) {
        originalConsole.log('Please select a directory for saving files...');
        return await window.debugLogger.selectDirectory();
      } else {
        config.saveToFiles = true;
        originalConsole.log('%c✅ File saving ENABLED', styles.success);
        if (state.fileHandle) {
          originalConsole.log('Files will be saved to the selected directory');
        } else {
          originalConsole.log('Files will be downloaded automatically');
        }
        return 'File saving enabled';
      }
    },

    // Disable file saving
    disableFileSaving: () => {
      config.saveToFiles = false;
      originalConsole.log('%c⏸️ File saving DISABLED', styles.warning);
      return 'File saving disabled';
    },

    // Save files now
    saveFiles: async () => {
      if (!config.saveToFiles) {
        originalConsole.warn('File saving is disabled. Enable it first: debugLogger.enableFileSaving()');
        return;
      }
      await saveToFiles();
    },

    // Save to localStorage now
    save: () => {
      persistToLocalStorage();
      originalConsole.log('%c💾 Saved to localStorage', styles.success);
    },

    // Load from localStorage
    load: () => {
      try {
        const saved = localStorage.getItem('debugLogger_requests');
        const savedLogs = localStorage.getItem('debugLogger_consoleLogs');
        const savedWS = localStorage.getItem('debugLogger_websockets');
        const savedWSMsg = localStorage.getItem('debugLogger_websocketMessages');

        if (saved) {
          state.requests = JSON.parse(saved);
          originalConsole.log('%c💾 Loaded', styles.success, state.requests.length, 'requests');
        }

        if (savedLogs) {
          state.consoleLogs = JSON.parse(savedLogs);
          originalConsole.log('%c💾 Loaded', styles.success, state.consoleLogs.length, 'console logs');
        }

        if (savedWS) {
          state.websockets = JSON.parse(savedWS);
          originalConsole.log('%c💾 Loaded', styles.success, state.websockets.length, 'websockets');
        }

        if (savedWSMsg) {
          state.websocketMessages = JSON.parse(savedWSMsg);
          originalConsole.log('%c💾 Loaded', styles.success, state.websocketMessages.length, 'websocket messages');
        }

        const lastSaved = localStorage.getItem('debugLogger_lastSaved');
        if (lastSaved) {
          originalConsole.log('%c💾 Last saved:', styles.info, lastSaved);
        }
      } catch (e) {
        originalConsole.error('Failed to load from localStorage:', e);
      }
    },

    // Add a custom note/marker
    addNote: (note) => {
      const noteEntry = {
        level: 'NOTE',
        timestamp: new Date().toISOString(),
        page: state.currentPage,
        message: `📝 USER NOTE: ${note}`,
      };

      state.consoleLogs.push(noteEntry);

      originalConsole.log(
        '%c📝 NOTE',
        'background: #FFD700; color: #000; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
        note
      );

      // Auto-save if enabled
      if (config.persistToLocalStorage) {
        persistToLocalStorage();
      }

      return 'Note added: ' + note;
    },

    // Configure settings
    config: (newConfig) => {
      Object.assign(config, newConfig);
      originalConsole.log('%c⚙️ Configuration updated:', styles.info, config);
    },

    // Quick toggle functions
    enableBackend: () => {
      config.sendToBackend = true;
      originalConsole.log('%c✅ Backend logging ENABLED', styles.success);
      originalConsole.log('Logs will auto-save to server every', config.autoSaveInterval / 1000, 'seconds');
      return 'Backend logging enabled';
    },

    disableBackend: () => {
      config.sendToBackend = false;
      originalConsole.log('%c⏸️ Backend logging DISABLED', styles.warning);
      originalConsole.log('Logs will only save to localStorage');
      return 'Backend logging disabled';
    },

    toggleBackend: () => {
      config.sendToBackend = !config.sendToBackend;
      if (config.sendToBackend) {
        originalConsole.log('%c✅ Backend logging ENABLED', styles.success);
        return 'Backend logging enabled';
      } else {
        originalConsole.log('%c⏸️ Backend logging DISABLED', styles.warning);
        return 'Backend logging disabled';
      }
    },

    status: () => {
      originalConsole.group('%c📊 Debug Logger Status', styles.header);
      originalConsole.log('Backend Logging:', config.sendToBackend ? '✅ ENABLED' : '⏸️ DISABLED');
      originalConsole.log('localStorage:', config.persistToLocalStorage ? '✅ ENABLED' : '❌ DISABLED');
      originalConsole.log('File Saving:', config.saveToFiles ? '✅ ENABLED' : '⏸️ DISABLED');
      if (config.saveToFiles) {
        if (state.fileHandle) {
          originalConsole.log('  Directory: Selected (File System API)');
        } else {
          originalConsole.log('  Method: Automatic downloads');
        }
        originalConsole.log('  Format:', config.fileFormat);
        originalConsole.log('  Interval:', config.fileSaveInterval / 1000, 'seconds');
        if (state.lastFileSave) {
          const timeSince = Math.round((Date.now() - state.lastFileSave) / 1000);
          originalConsole.log('  Last saved:', timeSince, 'seconds ago');
        }
      }
      originalConsole.log('Auto-save Interval:', config.autoSaveInterval / 1000, 'seconds');
      originalConsole.log('Session ID:', state.sessionId);
      originalConsole.log('Session Duration:', Math.round((Date.now() - state.sessionStartTime) / 1000) + 's');
      originalConsole.log('Current Page:', state.currentPage);
      originalConsole.log('');
      originalConsole.log('Tracked Data:');
      originalConsole.log('  - HTTP Requests:', state.requests.length);
      originalConsole.log('  - Console Logs:', state.consoleLogs.length);
      originalConsole.log('  - Errors:', state.errors.length, state.errors.length > 0 ? '⚠️' : '✅');
      originalConsole.log('  - WebSockets:', state.websockets.length);
      originalConsole.log('  - WS Messages:', state.websocketMessages.length);
      if (state.errors.length > 0) {
        originalConsole.log('');
        originalConsole.warn('⚠️ Errors detected! Run debugLogger.showErrors() to view');
      }
      originalConsole.groupEnd();
    },

    // Show help
    help: () => {
      originalConsole.log('%c📖 Debug Logger Commands', styles.header);
      originalConsole.log('');
      originalConsole.log('%cViewing:', 'font-weight: bold');
      originalConsole.log('  debugLogger.showSummary()           - Show summary for current page');
      originalConsole.log('  debugLogger.showAllRequests()       - Show all HTTP requests in a table');
      originalConsole.log('  debugLogger.showErrors()            - Show all JavaScript/Network errors');
      originalConsole.log('  debugLogger.showByEndpoint()        - Show request stats grouped by endpoint');
      originalConsole.log('  debugLogger.showWebSockets()        - Show all WebSocket connections');
      originalConsole.log('  debugLogger.showWebSocketMessages() - Show all WS messages (or pass wsId for specific)');
      originalConsole.log('');
      originalConsole.log('%cPersistence:', 'font-weight: bold');
      originalConsole.log('  debugLogger.save()                  - Save to localStorage now');
      originalConsole.log('  debugLogger.load()                  - Load from localStorage');
      originalConsole.log('  debugLogger.download()              - Download logs as JSON file');
      originalConsole.log('  debugLogger.downloadText()          - Download logs as readable text file');
      originalConsole.log('  debugLogger.sendToBackend()         - Send logs to backend endpoint');
      originalConsole.log('  debugLogger.jira()                  - Generate and copy Jira ticket content');
      originalConsole.log('');
      originalConsole.log('%cAI Analysis (NEW!):', 'font-weight: bold; color: #FF6B6B;');
      originalConsole.log('  debugLogger.aiPrompt()              - Generate AI analysis prompt (GitHub Copilot, ChatGPT, Claude)');
      originalConsole.log('  debugLogger.downloadAIPackage()     - Download complete package for AI analysis');
      originalConsole.log('  debugLogger.downloadCopilotLog()    - Download Copilot-optimized Markdown log for VS Code');
      originalConsole.log('  debugLogger.copilotLog()            - Show Copilot log in console (for copy/paste)');
      originalConsole.log('  debugLogger.showAngularInfo()       - Show Angular-specific debugging info');
      originalConsole.log('  debugLogger.snapshot()              - Capture current DOM snapshot');
      originalConsole.log('  debugLogger.exportWithAngular()     - Export with enhanced Angular details');
      originalConsole.log('');
      originalConsole.log('%cFile Saving:', 'font-weight: bold');
      originalConsole.log('  debugLogger.selectDirectory()       - Select directory for file saving (Chrome/Edge)');
      originalConsole.log('  debugLogger.enableFileSaving()      - Enable auto-save to files');
      originalConsole.log('  debugLogger.disableFileSaving()     - Disable auto-save to files');
      originalConsole.log('  debugLogger.saveFiles()             - Save files now');
      originalConsole.log('');
      originalConsole.log('%cManagement:', 'font-weight: bold');
      originalConsole.log('  debugLogger.status()                - Show current status and stats');
      originalConsole.log('  debugLogger.clear()                 - Clear all tracking data');
      originalConsole.log('  debugLogger.export()                - Export data as JSON (console output)');
      originalConsole.log('  debugLogger.addNote("message")      - Add a custom note/marker to logs');
      originalConsole.log('');
      originalConsole.log('%cBackend Logging:', 'font-weight: bold');
      originalConsole.log('  debugLogger.enableBackend()         - Turn ON backend logging');
      originalConsole.log('  debugLogger.disableBackend()        - Turn OFF backend logging');
      originalConsole.log('  debugLogger.toggleBackend()         - Toggle backend logging on/off');
      originalConsole.log('');
      originalConsole.log('%cAdvanced:', 'font-weight: bold');
      originalConsole.log('  debugLogger.config({...})           - Update configuration');
      originalConsole.log('  debugLogger.help()                  - Show this help');
      originalConsole.log('');
      originalConsole.log('%c⚙️ Current Configuration:', styles.header);
      originalConsole.log(config);
      originalConsole.log('');
      originalConsole.log('%c💡 Tips:', styles.info);
      originalConsole.log('  - Logs auto-save to localStorage every', config.autoSaveInterval / 1000, 'seconds');
      originalConsole.log('  - Use downloadText() for easy reading or copy/paste to Claude');
      originalConsole.log('  - WebSocket tracking includes connections, messages, and errors');
      originalConsole.log('  - Session ID:', state.sessionId);
    },

    // Open/close UI panel
    ui: () => {
      const panel = document.getElementById('debugLoggerUI');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        return 'UI toggled';
      }
      return 'UI not found';
    },

    // Generate Jira ticket content
    jira: () => {
      const jiraContent = generateJiraTicket();

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jiraContent).then(() => {
          originalConsole.log('%c✅ Jira ticket content copied to clipboard!', styles.success);
          originalConsole.log('%c📋 Paste it into your Jira ticket description', styles.info);
          originalConsole.log('\n' + '='.repeat(80));
          originalConsole.log(jiraContent);
          originalConsole.log('='.repeat(80));
        }).catch(err => {
          originalConsole.warn('Failed to copy to clipboard:', err);
          // Fallback: show in console
          originalConsole.log('\n' + '='.repeat(80));
          originalConsole.log('JIRA TICKET CONTENT (copy manually):');
          originalConsole.log('='.repeat(80));
          originalConsole.log(jiraContent);
          originalConsole.log('='.repeat(80));
        });
      } else {
        // Fallback: show in console and prompt
        originalConsole.log('\n' + '='.repeat(80));
        originalConsole.log('JIRA TICKET CONTENT:');
        originalConsole.log('='.repeat(80));
        originalConsole.log(jiraContent);
        originalConsole.log('='.repeat(80));
        alert('Jira content logged to console. Please copy it manually.');
      }

      return jiraContent;
    },

    // Generate AI-friendly prompt for GitHub Copilot, ChatGPT, Claude, etc.
    aiPrompt: () => {
      const promptContent = generateAIPrompt();

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptContent).then(() => {
          originalConsole.log('%c✅ AI analysis prompt copied to clipboard!', styles.success);
          originalConsole.log('%c🤖 Paste this into GitHub Copilot, ChatGPT, or Claude for analysis', styles.info);
          originalConsole.log('\n' + '='.repeat(80));
          originalConsole.log(promptContent);
          originalConsole.log('='.repeat(80));
        }).catch(err => {
          originalConsole.warn('Failed to copy to clipboard:', err);
          // Fallback: show in console
          originalConsole.log('\n' + '='.repeat(80));
          originalConsole.log('AI ANALYSIS PROMPT (copy manually):');
          originalConsole.log('='.repeat(80));
          originalConsole.log(promptContent);
          originalConsole.log('='.repeat(80));
        });
      } else {
        // Fallback: show in console and prompt
        originalConsole.log('\n' + '='.repeat(80));
        originalConsole.log('AI ANALYSIS PROMPT:');
        originalConsole.log('='.repeat(80));
        originalConsole.log(promptContent);
        originalConsole.log('='.repeat(80));
        alert('AI prompt logged to console. Please copy it manually.');
      }

      return promptContent;
    },

    // Download AI-friendly package (prompt + full logs)
    downloadAIPackage: () => {
      const promptContent = generateAIPrompt();
      const fullLogs = window.debugLogger.export();
      const textLogs = generateTextLog();
      const domSnapshot = captureDOMSnapshot();

      const aiPackage = {
        generatedAt: new Date().toISOString(),
        sessionId: state.sessionId,
        prompt: promptContent,
        domSnapshot: domSnapshot,
        fullData: fullLogs,
        textLogs: textLogs,
        instructions: {
          usage: 'Copy the "prompt" field and paste it into your AI assistant (GitHub Copilot, ChatGPT, Claude, etc.)',
          includeFiles: 'If the AI asks for specific files mentioned in errors, provide them from your codebase',
          context: 'The "fullData" and "domSnapshot" fields provide additional context if needed'
        }
      };

      const blob = new Blob([JSON.stringify(aiPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-debug-package-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      originalConsole.log('%c✅ AI debug package downloaded!', styles.success);
      originalConsole.log('%c📦 This package contains:', styles.info);
      originalConsole.log('   - AI-ready prompt with all errors and context');
      originalConsole.log('   - Complete debug logs in JSON format');
      originalConsole.log('   - Text logs for easy reading');
      originalConsole.log('   - DOM snapshot of current state');
      originalConsole.log('\n%c💡 Quick Start:', styles.info);
      originalConsole.log('   1. Open the downloaded JSON file');
      originalConsole.log('   2. Copy the "prompt" field');
      originalConsole.log('   3. Paste into GitHub Copilot, ChatGPT, or Claude');
      originalConsole.log('   4. Follow the AI recommendations!');

      return 'AI debug package downloaded successfully';
    },

    // Capture and show current DOM snapshot
    snapshot: () => {
      const snapshot = captureDOMSnapshot();
      originalConsole.group('%c📸 DOM Snapshot', styles.header);
      originalConsole.log(snapshot);
      originalConsole.groupEnd();
      return snapshot;
    },

    // Enhanced export with Angular details
    exportWithAngular: () => {
      const data = {
        sessionId: state.sessionId,
        requests: state.requests,
        consoleLogs: state.consoleLogs,
        websockets: state.websockets,
        websocketMessages: state.websocketMessages,
        requestCounts: state.requestCounts,
        errors: state.errors,
        currentPage: state.currentPage,
        timestamp: new Date().toISOString(),
        browserInfo: state.browserInfo,
        domSnapshot: captureDOMSnapshot(),
        angularVersion: document.querySelector('[ng-version]')?.getAttribute('ng-version'),
        // Enhance errors with Angular details
        enhancedErrors: state.errors.map(err => ({
          ...err,
          angularDetails: extractAngularDetailsFromStack(err.stack)
        }))
      };
      originalConsole.log('Enhanced Export Data with Angular Details:', JSON.stringify(data, null, 2));
      return data;
    },

    // Show Angular-specific info
    showAngularInfo: () => {
      originalConsole.group('%c⚛️ Angular Application Info', styles.header);

      const ngVersion = document.querySelector('[ng-version]')?.getAttribute('ng-version');
      const componentName = detectAngularComponent();

      originalConsole.log('Angular Version:', ngVersion || 'Not detected');
      originalConsole.log('Current Component:', componentName || 'Not detected');
      originalConsole.log('Router Outlets:', document.querySelectorAll('router-outlet').length);
      originalConsole.log('Angular Elements:', document.querySelectorAll('[ng-reflect-ng-if], [ng-reflect-ng-for-of]').length);

      // Show components/services from errors
      if (state.errors.length > 0) {
        originalConsole.log('\n%cComponents/Services with Errors:', 'font-weight: bold; color: #f44336');

        const allComponents = new Set();
        const allServices = new Set();

        state.errors.forEach(err => {
          const details = extractAngularDetailsFromStack(err.stack);
          details.components.forEach(comp => allComponents.add(`${comp.name} (${comp.file}:${comp.line})`));
          details.services.forEach(svc => allServices.add(`${svc.name} (${svc.file}:${svc.line})`));
        });

        if (allComponents.size > 0) {
          originalConsole.log('\nComponents:');
          allComponents.forEach(comp => originalConsole.log('  -', comp));
        }

        if (allServices.size > 0) {
          originalConsole.log('\nServices:');
          allServices.forEach(svc => originalConsole.log('  -', svc));
        }
      }

      originalConsole.groupEnd();
    }
  };

  // Short alias for easier typing (dl = debugLogger)
  window.dl = window.debugLogger;

  // Create visual UI panel
  function createUIPanel() {
    // Remove existing panel if any
    const existing = document.getElementById('debugLoggerUI');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'debugLoggerUI';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 80vh;
      background: white;
      border: 2px solid #2196F3;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: none;
      overflow-y: auto;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      background: #2196F3;
      color: white;
      padding: 12px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    `;
    header.innerHTML = '🐛 Debug Logger';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 1;
    `;
    closeBtn.onclick = () => panel.style.display = 'none';
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.style.cssText = 'padding: 12px;';

    // Quick stats
    const stats = document.createElement('div');
    stats.style.cssText = 'margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px;';
    stats.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 6px;">Quick Stats</div>
      <div>Requests: <span id="dlStatRequests">0</span></div>
      <div>Errors: <span id="dlStatErrors" style="color: ${state.errors.length > 0 ? '#f44336' : '#4CAF50'}">0</span></div>
      <div>WebSockets: <span id="dlStatWS">0</span></div>
    `;
    content.appendChild(stats);

    // Button creator helper
    const createBtn = (text, onClick, color = '#2196F3') => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        width: 100%;
        padding: 8px;
        margin: 4px 0;
        background: ${color};
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      `;
      btn.onclick = onClick;
      btn.onmouseover = () => btn.style.opacity = '0.8';
      btn.onmouseout = () => btn.style.opacity = '1';
      return btn;
    };

    // View section
    content.appendChild(document.createTextNode('View:'));
    content.appendChild(createBtn('📊 Summary', () => window.debugLogger.showSummary()));
    content.appendChild(createBtn('🌐 All Requests', () => window.debugLogger.showAllRequests()));
    content.appendChild(createBtn('💥 Errors', () => window.debugLogger.showErrors(), state.errors.length > 0 ? '#f44336' : '#2196F3'));
    content.appendChild(createBtn('📈 By Endpoint', () => window.debugLogger.showByEndpoint()));
    content.appendChild(createBtn('🔌 WebSockets', () => window.debugLogger.showWebSockets()));

    // AI Analysis section
    const aiSection = document.createElement('div');
    aiSection.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;';
    const aiTitle = document.createElement('div');
    aiTitle.style.cssText = 'font-weight: bold; margin-bottom: 4px; color: #FF6B6B;';
    aiTitle.textContent = '🤖 AI Analysis:';
    aiSection.appendChild(aiTitle);
    const aiPromptBtn = createBtn('🤖 Copy AI Prompt', function() {
      window.debugLogger.aiPrompt();
      const originalText = this.textContent;
      this.textContent = '✅ Copied!';
      setTimeout(() => this.textContent = originalText, 2000);
    }, '#FF6B6B');
    aiSection.appendChild(aiPromptBtn);
    aiSection.appendChild(createBtn('📝 Copilot Log (VS Code)', () => window.debugLogger.downloadCopilotLog(), '#0078D4'));
    aiSection.appendChild(createBtn('📦 Download AI Package', () => window.debugLogger.downloadAIPackage(), '#FF6B6B'));
    aiSection.appendChild(createBtn('⚛️ Angular Info', () => window.debugLogger.showAngularInfo(), '#DD0031'));
    content.appendChild(aiSection);

    // Save section
    const saveSection = document.createElement('div');
    saveSection.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;';
    saveSection.appendChild(document.createTextNode('Save/Export:'));
    saveSection.appendChild(createBtn('💾 Download Text', () => window.debugLogger.downloadText(), '#4CAF50'));
    saveSection.appendChild(createBtn('💾 Download JSON', () => window.debugLogger.download(), '#4CAF50'));
    saveSection.appendChild(createBtn('📁 Select Folder', () => window.debugLogger.selectDirectory(), '#FF9800'));
    const jiraBtn = createBtn('🎫 Copy Jira Ticket', function() {
      window.debugLogger.jira();
      // Show feedback
      const originalText = this.textContent;
      this.textContent = '✅ Copied!';
      setTimeout(() => this.textContent = originalText, 2000);
    }, '#0052CC');
    saveSection.appendChild(jiraBtn);
    content.appendChild(saveSection);

    // Actions section
    const actionSection = document.createElement('div');
    actionSection.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;';
    actionSection.appendChild(document.createTextNode('Actions:'));
    actionSection.appendChild(createBtn('📝 Add Note', () => {
      const note = prompt('Enter a note:');
      if (note) window.debugLogger.addNote(note);
    }));
    actionSection.appendChild(createBtn('🧹 Clear', () => {
      if (confirm('Clear all logs?')) window.debugLogger.clear();
    }, '#f44336'));
    actionSection.appendChild(createBtn('ℹ️ Status', () => window.debugLogger.status()));
    actionSection.appendChild(createBtn('❓ Help', () => window.debugLogger.help()));
    content.appendChild(actionSection);

    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);

    // Make draggable
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    header.onmousedown = (e) => {
      isDragging = true;
      initialX = e.clientX - panel.offsetLeft;
      initialY = e.clientY - panel.offsetTop;
    };
    document.onmousemove = (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        panel.style.left = currentX + 'px';
        panel.style.top = currentY + 'px';
        panel.style.right = 'auto';
      }
    };
    document.onmouseup = () => isDragging = false;

    // Update stats periodically
    const updateStats = () => {
      document.getElementById('dlStatRequests').textContent = state.requests.length;
      document.getElementById('dlStatErrors').textContent = state.errors.length;
      document.getElementById('dlStatErrors').style.color = state.errors.length > 0 ? '#f44336' : '#4CAF50';
      document.getElementById('dlStatWS').textContent = state.websockets.length;
    };
    setInterval(updateStats, 2000);
    updateStats();

    return panel;
  }

  // Create floating toggle button
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'debugLoggerToggle';
    btn.textContent = '🐛';
    btn.title = 'Debug Logger - Click to open panel';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #2196F3;
      color: white;
      border: 2px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      cursor: pointer;
      font-size: 24px;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    btn.onclick = () => {
      const panel = document.getElementById('debugLoggerUI') || createUIPanel();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
    document.body.appendChild(btn);
  }

  // Initialize UI
  const uiPanel = createUIPanel();
  createToggleButton();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D or Cmd+Shift+D to toggle UI
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      const panel = document.getElementById('debugLoggerUI');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    }
    // Ctrl+Shift+E or Cmd+Shift+E to show errors
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      window.debugLogger.showErrors();
    }
    // Ctrl+Shift+S or Cmd+Shift+S to show summary
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      window.debugLogger.showSummary();
    }
  });

  // Show help on start
  originalConsole.log('%c💡 Quick Access:', styles.info);
  originalConsole.log('%c   • Click the 🐛 button (bottom-right) to open UI', styles.info);
  originalConsole.log('%c   • Type "dl" instead of "debugLogger" (shorter!)', styles.info);
  originalConsole.log('%c   • Keyboard shortcuts: Ctrl+Shift+D (UI), Ctrl+Shift+E (Errors), Ctrl+Shift+S (Summary)', styles.info);
  originalConsole.log('%c   • Type dl.help() for all commands', styles.info);
  originalConsole.log('');
  originalConsole.log('%c🤖 NEW AI Analysis Features:', 'color: #FF6B6B; font-weight: bold; font-size: 14px;');
  originalConsole.log('%c   • dl.aiPrompt() - Generate AI-ready analysis prompt', 'color: #FF6B6B;');
  originalConsole.log('%c   • dl.downloadCopilotLog() - Download Markdown log for VS Code Copilot ⭐', 'color: #FF6B6B;');
  originalConsole.log('%c   • dl.downloadAIPackage() - Download complete debug package for AI', 'color: #FF6B6B;');
  originalConsole.log('%c   • dl.jira() - Create detailed JIRA tickets with component names & line numbers', 'color: #0052CC;');
  originalConsole.log('%c   • dl.showAngularInfo() - View Angular components and errors', 'color: #DD0031;');
  originalConsole.log('');
  originalConsole.log('%c💡 VS Code Copilot Workflow:', 'color: #0078D4; font-weight: bold;');
  originalConsole.log('%c   1. Browse your app (logger tracks everything)', 'color: #666;');
  originalConsole.log('%c   2. Run: dl.downloadCopilotLog()', 'color: #666;');
  originalConsole.log('%c   3. Save to: ./debugger/debug-log.md in your project', 'color: #666;');
  originalConsole.log('%c   4. In VS Code, ask Copilot: "Read debug-log.md and create a JIRA ticket"', 'color: #666;');

  // Show persistence status on start
  if (config.persistToLocalStorage) {
    originalConsole.log('%c💾 Logs saving to localStorage (auto-save every ' + (config.autoSaveInterval / 1000) + 's)', styles.info);
  }
  
  // Show file saving status on start
  if (config.saveToFiles) {
    if (state.fileHandle) {
      originalConsole.log('%c💾 File saving ENABLED - Logs saving to selected directory every ' + (config.fileSaveInterval / 1000) + 's', 'color: #4CAF50; font-weight: bold;');
    } else {
      originalConsole.log('%c💾 File saving ENABLED - Logs will download automatically every ' + (config.fileSaveInterval / 1000) + 's', 'color: #4CAF50; font-weight: bold;');
    }
    originalConsole.log('%c   To disable: debugLogger.disableFileSaving()', 'color: #666;');
  } else {
    if (supportsFileSystemAccess) {
      originalConsole.log('%c💡 To save logs to files: debugLogger.selectDirectory() or debugLogger.enableFileSaving()', 'color: #666; font-style: italic;');
    } else {
      originalConsole.log('%c💡 To enable file downloads: debugLogger.enableFileSaving()', 'color: #666; font-style: italic;');
    }
  }
  
  // Show backend status on start (only if enabled)
  if (config.sendToBackend) {
    originalConsole.log('%c✅ Backend logging ENABLED - Logs saving to server every ' + (config.autoSaveInterval / 1000) + 's', 'color: #4CAF50; font-weight: bold;');
    originalConsole.log('%c   To disable: debugLogger.disableBackend()', 'color: #666;');
  } else {
    originalConsole.log('%c💡 To enable backend logging: debugLogger.enableBackend()', 'color: #666; font-style: italic;');
  }

})();
