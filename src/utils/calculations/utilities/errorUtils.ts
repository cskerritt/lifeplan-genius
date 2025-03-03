import calculationLogger from '../logger';

/**
 * Standard error handler for calculation services
 * @param logger - The calculation logger instance
 * @param operation - The operation being performed
 * @param error - The error that occurred
 * @param fallback - The fallback value to return
 * @returns The fallback value
 */
export const handleCalculationError = <T>(
  logger: typeof calculationLogger,
  operation: string,
  error: unknown,
  fallback: T
): T => {
  logger.error(`Error ${operation}: ${error instanceof Error ? error.message : String(error)}`);
  return fallback;
};
