import { CalculationLogEntry } from './types';

/**
 * Configuration options for the calculation logger
 */
interface LoggerConfig {
  /** Whether logging is enabled */
  enabled: boolean;
  /** Minimum log level to record */
  minLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Maximum number of log entries to keep in memory */
  maxEntries: number;
  /** Whether to also log to console */
  consoleOutput: boolean;
}

/**
 * Default configuration for the calculation logger
 */
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  minLevel: 'info',
  maxEntries: 100,
  consoleOutput: process.env.NODE_ENV !== 'production',
};

/**
 * A utility for logging calculation steps and errors
 * This helps with debugging and tracing calculation issues
 */
class CalculationLogger {
  private logs: CalculationLogEntry[] = [];
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get all log entries
   */
  getAll(): CalculationLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get log entries filtered by level
   */
  getByLevel(level: CalculationLogEntry['level']): CalculationLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Add a debug log entry
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Add an info log entry
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Add a warning log entry
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Add an error log entry
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Add a log entry with the specified level
   */
  private log(level: CalculationLogEntry['level'], message: string, data?: any): void {
    if (!this.config.enabled) return;

    // Check if level meets minimum threshold
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) < levels.indexOf(this.config.minLevel)) return;

    const entry: CalculationLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    // Add to logs array
    this.logs.push(entry);

    // Trim logs if exceeding max entries
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Output to console if enabled
    if (this.config.consoleOutput) {
      const consoleMethod = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      }[level];

      if (data) {
        consoleMethod(`[Calculation] ${message}`, data);
      } else {
        consoleMethod(`[Calculation] ${message}`);
      }
    }
  }

  /**
   * Create a child logger that prefixes all messages with the given context
   */
  createContext(context: string): CalculationLogger {
    const childLogger = new CalculationLogger(this.config);
    
    // Override log methods to prefix messages
    const originalLog = childLogger['log'].bind(childLogger);
    childLogger['log'] = (level, message, data) => {
      originalLog(level, `[${context}] ${message}`, data);
    };
    
    return childLogger;
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create a singleton instance
export const calculationLogger = new CalculationLogger();

/**
 * Create a logger for a specific calculation context
 */
export const createCalculationLogger = (context: string): CalculationLogger => {
  return calculationLogger.createContext(context);
};

export default calculationLogger;
