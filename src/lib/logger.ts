/**
 * Safe logging utility for production environments
 * Replaces console statements with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private logToConsole(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);
    
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formattedMessage);
        break;
      case 'info':
        if (this.isDevelopment) console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.logToConsole('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.logToConsole('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.logToConsole('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.logToConsole('error', message, data);
    
    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment && this.isClient) {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // this.sendToErrorService({ level: 'error', message, data, timestamp: new Date().toISOString() });
    }
  }

  // Method to safely log sensitive operations
  secureLog(message: string, sanitizedData?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      this.info(message, sanitizedData);
    } else {
      // In production, log without sensitive data
      this.info(message);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for external use
export type { LogLevel, LogEntry };