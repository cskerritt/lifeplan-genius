import { CalculationLogEntry, CalculationTraceEntry } from './types';

/**
 * Configuration options for the calculation logger
 */
interface LoggerConfig {
  /** Whether logging is enabled */
  enabled: boolean;
  /** Minimum log level to record */
  minLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** Maximum number of log entries to keep in memory */
  maxEntries: number;
  /** Whether to also log to console */
  consoleOutput: boolean;
  /** Whether to collect detailed calculation traces */
  traceEnabled: boolean;
  /** Whether to log zero values in calculations */
  logZeroValues: boolean;
  /** Whether to log detailed calculation steps */
  logCalculationSteps: boolean;
}

/**
 * Default configuration for the calculation logger
 */
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  minLevel: 'info',
  maxEntries: 500,
  consoleOutput: process.env.NODE_ENV !== 'production',
  traceEnabled: true,
  logZeroValues: true,
  logCalculationSteps: true,
};

/**
 * A utility for logging calculation steps and errors
 * This helps with debugging and tracing calculation issues
 */
class CalculationLogger {
  private logs: CalculationLogEntry[] = [];
  private traces: CalculationTraceEntry[] = [];
  private config: LoggerConfig;
  private calculationStack: string[] = [];
  private traceId: number = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Clear all log entries and traces
   */
  clear(): void {
    this.logs = [];
    this.traces = [];
    this.calculationStack = [];
    this.traceId = 0;
  }

  /**
   * Get all log entries
   */
  getAll(): CalculationLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get all trace entries
   */
  getAllTraces(): CalculationTraceEntry[] {
    return [...this.traces];
  }

  /**
   * Get log entries filtered by level
   */
  getByLevel(level: CalculationLogEntry['level']): CalculationLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get trace entries for a specific calculation
   */
  getTracesByCalculation(calculationId: string): CalculationTraceEntry[] {
    return this.traces.filter(trace => trace.calculationId === calculationId);
  }

  /**
   * Start a new calculation trace
   */
  startCalculation(name: string, params: any): string {
    const calculationId = `calc-${this.traceId++}-${name}-${Date.now()}`;
    
    if (this.config.traceEnabled) {
      this.traces.push({
        calculationId,
        timestamp: new Date(),
        type: 'start',
        name,
        params,
        stack: [...this.calculationStack]
      });
      
      this.calculationStack.push(calculationId);
    }
    
    return calculationId;
  }

  /**
   * End a calculation trace
   */
  endCalculation(calculationId: string, result: any): void {
    if (this.config.traceEnabled) {
      this.traces.push({
        calculationId,
        timestamp: new Date(),
        type: 'end',
        result,
        stack: [...this.calculationStack]
      });
      
      // Remove this calculation from the stack
      const index = this.calculationStack.indexOf(calculationId);
      if (index !== -1) {
        this.calculationStack.splice(index, 1);
      }
    }
  }

  /**
   * Log a calculation step
   */
  logStep(calculationId: string, step: string, data?: any): void {
    if (this.config.traceEnabled && this.config.logCalculationSteps) {
      this.traces.push({
        calculationId,
        timestamp: new Date(),
        type: 'step',
        step,
        data,
        stack: [...this.calculationStack]
      });
    }
  }

  /**
   * Log a zero value that was detected during calculation
   */
  logZeroValue(calculationId: string, field: string, context: any): void {
    if (this.config.traceEnabled && this.config.logZeroValues) {
      this.traces.push({
        calculationId,
        timestamp: new Date(),
        type: 'zero-value',
        field,
        context,
        stack: [...this.calculationStack]
      });
      
      // Also log as a warning
      this.warn(`Zero value detected for ${field}`, { calculationId, context });
    }
  }

  /**
   * Add a trace log entry
   */
  trace(message: string, data?: any): void {
    this.log('trace', message, data);
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
    const levels = ['trace', 'debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) < levels.indexOf(this.config.minLevel)) return;

    const entry: CalculationLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      calculationStack: [...this.calculationStack]
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
        trace: console.debug,
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      }[level];

      const stackInfo = this.calculationStack.length > 0 
        ? `[${this.calculationStack[this.calculationStack.length - 1]}] `
        : '';

      if (data) {
        consoleMethod(`[Calculation] ${stackInfo}${message}`, data);
      } else {
        consoleMethod(`[Calculation] ${stackInfo}${message}`);
      }
    }
  }

  /**
   * Create a child logger that prefixes all messages with the given context
   */
  createContext(context: string): CalculationLogger {
    const childLogger = new CalculationLogger(this.config);
    childLogger.calculationStack = [...this.calculationStack];
    
    // Override log methods to prefix messages
    const originalLog = childLogger['log'].bind(childLogger);
    childLogger['log'] = (level, message, data) => {
      originalLog(level, `[${context}] ${message}`, data);
    };
    
    return childLogger;
  }

  /**
   * Create a calculation context that automatically tracks start/end
   */
  createCalculationContext(name: string, params: any): { 
    logger: CalculationLogger, 
    calculationId: string,
    logStep: (step: string, data?: any) => void,
    logZeroValue: (field: string, context: any) => void,
    end: (result: any) => void 
  } {
    const calculationId = this.startCalculation(name, params);
    const contextLogger = this.createContext(`${name}:${calculationId}`);
    
    return {
      logger: contextLogger,
      calculationId,
      logStep: (step: string, data?: any) => this.logStep(calculationId, step, data),
      logZeroValue: (field: string, context: any) => this.logZeroValue(calculationId, field, context),
      end: (result: any) => this.endCalculation(calculationId, result)
    };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Export all logs and traces as JSON
   */
  exportData(): { logs: CalculationLogEntry[], traces: CalculationTraceEntry[] } {
    return {
      logs: [...this.logs],
      traces: [...this.traces]
    };
  }

  /**
   * Generate a report of all zero values detected
   */
  generateZeroValueReport(): { field: string, count: number, examples: any[] }[] {
    const zeroTraces = this.traces.filter(trace => trace.type === 'zero-value');
    const fieldMap = new Map<string, { count: number, examples: any[] }>();
    
    for (const trace of zeroTraces) {
      if (trace.type === 'zero-value') {
        const field = trace.field;
        const existing = fieldMap.get(field) || { count: 0, examples: [] };
        
        existing.count++;
        if (existing.examples.length < 5) {
          existing.examples.push(trace.context);
        }
        
        fieldMap.set(field, existing);
      }
    }
    
    return Array.from(fieldMap.entries()).map(([field, data]) => ({
      field,
      count: data.count,
      examples: data.examples
    }));
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
