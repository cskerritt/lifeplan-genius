import calculationLogger from '../logger';

/**
 * Interface for user prompt options
 */
export interface UserPromptOptions {
  title: string;
  message: string;
  defaultValue?: string | number;
  required?: boolean;
  validator?: (value: string) => { valid: boolean; error?: string };
}

/**
 * Error thrown when required data is missing and needs user input
 */
export class MissingDataError extends Error {
  constructor(
    public readonly dataType: string,
    public readonly promptOptions: UserPromptOptions,
    message?: string
  ) {
    super(message || `Missing required data: ${dataType}`);
    this.name = 'MissingDataError';
  }
}

/**
 * Utility functions for handling user prompts
 */
const userPromptUtils = {
  /**
   * Creates a MissingDataError with appropriate prompt options
   * @param dataType - The type of data that is missing
   * @param message - The message to display to the user
   * @param defaultValue - Optional default value
   * @param validator - Optional validator function
   * @returns A MissingDataError that can be caught and handled to prompt the user
   */
  createMissingDataError: (
    dataType: string,
    message: string,
    defaultValue?: string | number,
    validator?: (value: string) => { valid: boolean; error?: string }
  ): MissingDataError => {
    const logger = calculationLogger.createContext('userPromptUtils.createMissingDataError');
    logger.warn(`Creating missing data error for ${dataType}`);
    
    return new MissingDataError(
      dataType,
      {
        title: `Missing ${dataType}`,
        message,
        defaultValue,
        required: true,
        validator
      }
    );
  },
  
  /**
   * Validates a numeric input
   * @param value - The value to validate
   * @param min - Optional minimum value
   * @param max - Optional maximum value
   * @returns A validation result
   */
  validateNumericInput: (
    value: string,
    min?: number,
    max?: number
  ): { valid: boolean; error?: string } => {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return { valid: false, error: 'Please enter a valid number' };
    }
    
    if (min !== undefined && num < min) {
      return { valid: false, error: `Value must be at least ${min}` };
    }
    
    if (max !== undefined && num > max) {
      return { valid: false, error: `Value must be at most ${max}` };
    }
    
    return { valid: true };
  }
};

export default userPromptUtils;
