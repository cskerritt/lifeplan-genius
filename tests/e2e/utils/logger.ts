/**
 * Logger utility for Playwright tests
 * This file provides logging functionality for tests
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private showTimestamp: boolean = true;

  private constructor() {}

  /**
   * Get the singleton instance of the logger
   * @returns Logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the log level
   * @param level Log level to set
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Set whether to show timestamps in logs
   * @param show Whether to show timestamps
   */
  public setShowTimestamp(show: boolean): void {
    this.showTimestamp = show;
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param data Additional data to log
   */
  public debug(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param data Additional data to log
   */
  public info(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log('INFO', message, data);
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param data Additional data to log
   */
  public warn(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log('WARN', message, data);
    }
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param data Additional data to log
   */
  public error(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.log('ERROR', message, data);
    }
  }

  /**
   * Log a message with a specific level
   * @param level Log level
   * @param message Message to log
   * @param data Additional data to log
   */
  private log(level: string, message: string, data?: any): void {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
    const coloredLevel = this.colorizeLevel(level);
    
    console.log(`${timestamp}${coloredLevel}: ${message}`);
    
    if (data !== undefined) {
      console.log(data);
    }
  }

  /**
   * Add color to log level for better readability
   * @param level Log level
   * @returns Colorized log level
   */
  private colorizeLevel(level: string): string {
    switch (level) {
      case 'DEBUG':
        return '\x1b[36m[DEBUG]\x1b[0m'; // Cyan
      case 'INFO':
        return '\x1b[32m[INFO]\x1b[0m';  // Green
      case 'WARN':
        return '\x1b[33m[WARN]\x1b[0m';  // Yellow
      case 'ERROR':
        return '\x1b[31m[ERROR]\x1b[0m'; // Red
      default:
        return `[${level}]`;
    }
  }
}

// Export the logger instance and LogLevel enum
export const logger = Logger.getInstance();
export { LogLevel };
