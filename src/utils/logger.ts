// Robust logging utility for Chrome extension
// Handles different contexts: service worker, content scripts, and sidepanel

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  context: 'service-worker' | 'content-script' | 'sidepanel';
  message: string;
  data?: any;
}

class Logger {
  private context: LogEntry['context'];

  constructor(context: LogEntry['context']) {
    this.context = context;
  }

  private createLogEntry(level: LogEntry['level'], message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
    };
  }

  private async storeLog(entry: LogEntry): Promise<void> {
    try {
      // Content scripts can't access chrome.storage directly
      // They need to send messages to the background script
      if (this.context === 'content-script') {
        // Send log to background script for storage
        chrome.runtime
          .sendMessage({
            type: 'STORE_LOG',
            logEntry: entry,
          })
          .catch(() => {
            // If message sending fails, fall back to console only
            console.warn('Failed to send log to background script');
          });
        return;
      }

      // Store in chrome.storage.session for debugging (service worker and sidepanel)
      const stored = await chrome.storage.session.get(['debugLogs']);
      const logs = stored.debugLogs || [];

      // Keep only last 100 logs to prevent storage bloat
      logs.push(entry);
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      await chrome.storage.session.set({ debugLogs: logs });
    } catch (error) {
      // Fallback if storage fails
      console.warn('Failed to store log:', error);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.context}] ${entry.timestamp}`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data);
        break;
      case 'info':
        console.info(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'error':
        console.error(message, entry.data);
        break;
    }
  }

  async debug(message: string, data?: any): Promise<void> {
    const entry = this.createLogEntry('debug', message, data);
    this.logToConsole(entry);
    await this.storeLog(entry);
  }

  async info(message: string, data?: any): Promise<void> {
    const entry = this.createLogEntry('info', message, data);
    this.logToConsole(entry);
    await this.storeLog(entry);
  }

  async warn(message: string, data?: any): Promise<void> {
    const entry = this.createLogEntry('warn', message, data);
    this.logToConsole(entry);
    await this.storeLog(entry);
  }

  async error(message: string, data?: any): Promise<void> {
    const entry = this.createLogEntry('error', message, data);
    this.logToConsole(entry);
    await this.storeLog(entry);
  }
}

// Context detection helpers
function detectContext(): LogEntry['context'] {
  // Check if we're in a service worker
  if (typeof (globalThis as any).importScripts === 'function') {
    return 'service-worker';
  }

  // Check if we're in the sidepanel (has chrome.sidePanel API access)
  if (typeof chrome !== 'undefined' && (chrome as any).sidePanel) {
    return 'sidepanel';
  }

  // Default to content script
  return 'content-script';
}

// Singleton instances for different contexts
export const serviceWorkerLogger = new Logger('service-worker');
export const contentScriptLogger = new Logger('content-script');
export const sidepanelLogger = new Logger('sidepanel');

// Auto-detecting logger
export const logger = new Logger(detectContext());

// Utility function to retrieve stored logs for debugging
export async function getStoredLogs(): Promise<LogEntry[]> {
  try {
    // Content scripts need to request logs from background script
    if (detectContext() === 'content-script') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_LOGS' }, (response) => {
          resolve(response?.logs || []);
        });
      });
    }

    const stored = await chrome.storage.session.get(['debugLogs']);
    return stored.debugLogs || [];
  } catch (error) {
    console.error('Failed to retrieve stored logs:', error);
    return [];
  }
}

// Utility function to clear stored logs
export async function clearStoredLogs(): Promise<void> {
  try {
    // Content scripts need to request log clearing from background script
    if (detectContext() === 'content-script') {
      chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' });
      return;
    }

    await chrome.storage.session.remove(['debugLogs']);
  } catch (error) {
    console.error('Failed to clear stored logs:', error);
  }
}

// Utility function to store a log entry directly (for background script use)
export async function storeLogEntry(logEntry: LogEntry): Promise<void> {
  try {
    const stored = await chrome.storage.session.get(['debugLogs']);
    const logs = stored.debugLogs || [];

    // Keep only last 100 logs to prevent storage bloat
    logs.push(logEntry);
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    await chrome.storage.session.set({ debugLogs: logs });
  } catch (error) {
    console.error('Failed to store log entry:', error);
    throw error;
  }
}

// Message handlers for background script logging operations
export function handleStoreLogMessage(message: any): void {
  if (message.type === 'STORE_LOG') {
    storeLogEntry(message.logEntry).catch((error) =>
      serviceWorkerLogger.error('Failed to store content script log', error)
    );
  }
}

export function handleGetLogsMessage(message: any, sendResponse: (response: any) => void): boolean {
  if (message.type === 'GET_LOGS') {
    chrome.storage.session.get(['debugLogs']).then((stored) => {
      sendResponse({ logs: stored.debugLogs || [] });
    });
    return true; // Keep message channel open for async response
  }
  return false;
}

export function handleClearLogsMessage(message: any): void {
  if (message.type === 'CLEAR_LOGS') {
    chrome.storage.session.remove(['debugLogs']);
  }
}

// Development helper: logs viewer in console
export async function viewLogs(
  filterContext?: LogEntry['context'],
  filterLevel?: LogEntry['level']
): Promise<void> {
  const logs = await getStoredLogs();
  let filteredLogs = logs;

  if (filterContext) {
    filteredLogs = filteredLogs.filter((log) => log.context === filterContext);
  }

  if (filterLevel) {
    filteredLogs = filteredLogs.filter((log) => log.level === filterLevel);
  }

  console.group('📋 Stored Extension Logs');
  filteredLogs.forEach((log) => {
    const prefix = `[${log.context}] ${log.timestamp}`;
    console.log(`${prefix} ${log.message}`, log.data || '');
  });
  console.groupEnd();
}

// Expose logger functions globally for easy debugging access
if (typeof (globalThis as any) !== 'undefined') {
  (globalThis as any).debugExtension = {
    viewLogs,
    getStoredLogs,
    clearStoredLogs,

    // Quick access functions
    viewAll: () => viewLogs(),
    viewServiceWorker: () => viewLogs('service-worker'),
    viewContentScript: () => viewLogs('content-script'),
    viewSidepanel: () => viewLogs('sidepanel'),
    viewErrors: () => viewLogs(undefined, 'error'),
    viewWarnings: () => viewLogs(undefined, 'warn'),

    // Helper to show available commands
    help: () => {
      console.log(`
🔧 DocuMentor AI Debug Commands:

📋 View Logs:
  debugExtension.viewAll()           - All logs
  debugExtension.viewServiceWorker() - Service worker only
  debugExtension.viewContentScript() - Content scripts only
  debugExtension.viewSidepanel()     - Sidepanel only
  debugExtension.viewErrors()        - Errors only
  debugExtension.viewWarnings()      - Warnings only

🗑️ Manage Logs:
  debugExtension.clearStoredLogs()   - Clear all stored logs
  debugExtension.getStoredLogs()     - Get raw log data

📖 Custom Filters:
  debugExtension.viewLogs('content-script', 'error') - Custom context + level
      `);
    },
  };
}
