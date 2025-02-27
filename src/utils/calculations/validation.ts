import { ValidationResult, CostCalculationParams, ParsedFrequency, ParsedDuration, CostRange } from './types';
import calculationLogger from './logger';

/**
 * Validates a number to ensure it's a valid, non-NaN, finite number
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated (for error messages)
 * @param options - Additional validation options
 * @returns A validation result
 */
export const validateNumber = (
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    allowZero?: boolean;
    allowNegative?: boolean;
    integer?: boolean;
  } = {}
): ValidationResult => {
  const logger = calculationLogger.createContext('validateNumber');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Handle undefined/null
  if (value === undefined || value === null) {
    if (options.required) {
      result.valid = false;
      result.errors.push(`${fieldName} is required`);
      logger.error(`${fieldName} is required but was ${value}`);
    }
    return result;
  }
  
  // Convert to number if string
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if it's a valid number
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    result.valid = false;
    result.errors.push(`${fieldName} must be a valid number`);
    logger.error(`${fieldName} must be a valid number, got ${value}`);
    return result;
  }
  
  // Check if it's an integer when required
  if (options.integer && !Number.isInteger(num)) {
    result.valid = false;
    result.errors.push(`${fieldName} must be an integer`);
    logger.error(`${fieldName} must be an integer, got ${num}`);
  }
  
  // Check if it's negative when not allowed
  if (!options.allowNegative && num < 0) {
    result.valid = false;
    result.errors.push(`${fieldName} cannot be negative`);
    logger.error(`${fieldName} cannot be negative, got ${num}`);
  }
  
  // Check if it's zero when not allowed
  if (!options.allowZero && num === 0) {
    result.valid = false;
    result.errors.push(`${fieldName} cannot be zero`);
    logger.error(`${fieldName} cannot be zero`);
  }
  
  // Check minimum value
  if (options.min !== undefined && num < options.min) {
    result.valid = false;
    result.errors.push(`${fieldName} must be at least ${options.min}`);
    logger.error(`${fieldName} must be at least ${options.min}, got ${num}`);
  }
  
  // Check maximum value
  if (options.max !== undefined && num > options.max) {
    result.valid = false;
    result.errors.push(`${fieldName} must be at most ${options.max}`);
    logger.error(`${fieldName} must be at most ${options.max}, got ${num}`);
  }
  
  return result;
};

/**
 * Validates a string to ensure it meets requirements
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated (for error messages)
 * @param options - Additional validation options
 * @returns A validation result
 */
export const validateString = (
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternDescription?: string;
  } = {}
): ValidationResult => {
  const logger = calculationLogger.createContext('validateString');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Handle undefined/null
  if (value === undefined || value === null) {
    if (options.required) {
      result.valid = false;
      result.errors.push(`${fieldName} is required`);
      logger.error(`${fieldName} is required but was ${value}`);
    }
    return result;
  }
  
  // Convert to string if not already
  const str = String(value);
  
  // Check minimum length
  if (options.minLength !== undefined && str.length < options.minLength) {
    result.valid = false;
    result.errors.push(`${fieldName} must be at least ${options.minLength} characters`);
    logger.error(`${fieldName} must be at least ${options.minLength} characters, got ${str.length}`);
  }
  
  // Check maximum length
  if (options.maxLength !== undefined && str.length > options.maxLength) {
    result.valid = false;
    result.errors.push(`${fieldName} must be at most ${options.maxLength} characters`);
    logger.error(`${fieldName} must be at most ${options.maxLength} characters, got ${str.length}`);
  }
  
  // Check pattern
  if (options.pattern && !options.pattern.test(str)) {
    const description = options.patternDescription || 'the required format';
    result.valid = false;
    result.errors.push(`${fieldName} must match ${description}`);
    logger.error(`${fieldName} must match ${description}, got "${str}"`);
  }
  
  return result;
};

/**
 * Validates a frequency string to ensure it can be parsed
 * @param frequency - The frequency string to validate
 * @returns A validation result
 */
export const validateFrequency = (frequency: string): ValidationResult => {
  const logger = calculationLogger.createContext('validateFrequency');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Check if frequency is provided
  if (!frequency) {
    result.valid = false;
    result.errors.push('Frequency is required');
    logger.error('Frequency is required but was empty');
    return result;
  }
  
  // Check for common patterns
  const patterns = [
    { pattern: /(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)year/i, description: 'yearly frequency' },
    { pattern: /(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)month/i, description: 'monthly frequency' },
    { pattern: /(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)week/i, description: 'weekly frequency' },
    { pattern: /(\d+)-(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)year/i, description: 'yearly range' },
    { pattern: /bi-?weekly|every\s+other\s+week/i, description: 'biweekly frequency' },
    { pattern: /twice\s+(?:a\s+)?week/i, description: 'twice weekly frequency' },
    { pattern: /twice\s+(?:a\s+)?month/i, description: 'twice monthly frequency' },
    { pattern: /annual|yearly|once\s+(?:a|per)\s+year/i, description: 'annual frequency' },
    { pattern: /one-?time|once/i, description: 'one-time occurrence' },
  ];
  
  // Check if frequency matches any known pattern
  const matchesPattern = patterns.some(({ pattern }) => pattern.test(frequency));
  
  if (!matchesPattern) {
    result.warnings.push('Frequency format is not recognized and may not be parsed correctly');
    logger.warn(`Frequency format is not recognized: "${frequency}"`);
  }
  
  return result;
};

/**
 * Validates a parsed frequency object
 * @param parsedFrequency - The parsed frequency to validate
 * @returns A validation result
 */
export const validateParsedFrequency = (parsedFrequency: ParsedFrequency): ValidationResult => {
  const logger = calculationLogger.createContext('validateParsedFrequency');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Check if parsing was successful
  if (!parsedFrequency.valid) {
    result.valid = false;
    result.errors.push(`Failed to parse frequency: ${parsedFrequency.error || 'Unknown error'}`);
    logger.error(`Failed to parse frequency: ${parsedFrequency.error || 'Unknown error'}`);
    return result;
  }
  
  // Validate low frequency
  const lowFrequencyResult = validateNumber(parsedFrequency.lowFrequency, 'Low frequency', {
    min: 0,
    allowZero: parsedFrequency.isOneTime,
  });
  
  if (!lowFrequencyResult.valid) {
    result.valid = false;
    result.errors.push(...lowFrequencyResult.errors);
  }
  
  // Validate high frequency
  const highFrequencyResult = validateNumber(parsedFrequency.highFrequency, 'High frequency', {
    min: 0,
    allowZero: parsedFrequency.isOneTime,
  });
  
  if (!highFrequencyResult.valid) {
    result.valid = false;
    result.errors.push(...highFrequencyResult.errors);
  }
  
  // Check if high frequency is less than low frequency
  if (parsedFrequency.highFrequency < parsedFrequency.lowFrequency) {
    result.valid = false;
    result.errors.push('High frequency cannot be less than low frequency');
    logger.error(`High frequency (${parsedFrequency.highFrequency}) is less than low frequency (${parsedFrequency.lowFrequency})`);
  }
  
  return result;
};

/**
 * Validates a parsed duration object
 * @param parsedDuration - The parsed duration to validate
 * @returns A validation result
 */
export const validateParsedDuration = (parsedDuration: ParsedDuration): ValidationResult => {
  const logger = calculationLogger.createContext('validateParsedDuration');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Check if parsing was successful
  if (!parsedDuration.valid) {
    result.valid = false;
    result.errors.push(`Failed to parse duration: ${parsedDuration.error || 'Unknown error'}`);
    logger.error(`Failed to parse duration: ${parsedDuration.error || 'Unknown error'}`);
    return result;
  }
  
  // Validate low duration
  const lowDurationResult = validateNumber(parsedDuration.lowDuration, 'Low duration', {
    min: 0,
    allowZero: false,
  });
  
  if (!lowDurationResult.valid) {
    result.valid = false;
    result.errors.push(...lowDurationResult.errors);
  }
  
  // Validate high duration
  const highDurationResult = validateNumber(parsedDuration.highDuration, 'High duration', {
    min: 0,
    allowZero: false,
  });
  
  if (!highDurationResult.valid) {
    result.valid = false;
    result.errors.push(...highDurationResult.errors);
  }
  
  // Check if high duration is less than low duration
  if (parsedDuration.highDuration < parsedDuration.lowDuration) {
    result.valid = false;
    result.errors.push('High duration cannot be less than low duration');
    logger.error(`High duration (${parsedDuration.highDuration}) is less than low duration (${parsedDuration.lowDuration})`);
  }
  
  // Add warning if using default values
  if (parsedDuration.source === 'default') {
    result.warnings.push('Using default duration values');
    logger.warn('Using default duration values');
  }
  
  return result;
};

/**
 * Validates cost calculation parameters
 * @param params - The parameters to validate
 * @returns A validation result
 */
export const validateCostCalculationParams = (params: CostCalculationParams): ValidationResult => {
  const logger = calculationLogger.createContext('validateCostCalculationParams');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Validate base rate
  const baseRateResult = validateNumber(params.baseRate, 'Base rate', {
    required: true,
    min: 0,
    allowZero: false,
  });
  
  if (!baseRateResult.valid) {
    result.valid = false;
    result.errors.push(...baseRateResult.errors);
  }
  
  // Validate frequency
  const frequencyResult = validateString(params.frequency, 'Frequency', {
    required: true,
    minLength: 1,
  });
  
  if (!frequencyResult.valid) {
    result.valid = false;
    result.errors.push(...frequencyResult.errors);
  } else {
    // Further validate frequency format
    const frequencyFormatResult = validateFrequency(params.frequency);
    result.warnings.push(...frequencyFormatResult.warnings);
    
    if (!frequencyFormatResult.valid) {
      result.valid = false;
      result.errors.push(...frequencyFormatResult.errors);
    }
  }
  
  // Validate current age if provided
  if (params.currentAge !== undefined) {
    const currentAgeResult = validateNumber(params.currentAge, 'Current age', {
      min: 0,
      allowZero: true,
      integer: true,
    });
    
    if (!currentAgeResult.valid) {
      result.valid = false;
      result.errors.push(...currentAgeResult.errors);
    }
  }
  
  // Validate life expectancy if provided
  if (params.lifeExpectancy !== undefined) {
    const lifeExpectancyResult = validateNumber(params.lifeExpectancy, 'Life expectancy', {
      min: 0,
      allowZero: false,
    });
    
    if (!lifeExpectancyResult.valid) {
      result.valid = false;
      result.errors.push(...lifeExpectancyResult.errors);
    }
  }
  
  // Validate start age if provided
  if (params.startAge !== undefined) {
    const startAgeResult = validateNumber(params.startAge, 'Start age', {
      min: 0,
      allowZero: true,
      integer: true,
    });
    
    if (!startAgeResult.valid) {
      result.valid = false;
      result.errors.push(...startAgeResult.errors);
    }
  }
  
  // Validate end age if provided
  if (params.endAge !== undefined) {
    const endAgeResult = validateNumber(params.endAge, 'End age', {
      min: 0,
      allowZero: false,
      integer: true,
    });
    
    if (!endAgeResult.valid) {
      result.valid = false;
      result.errors.push(...endAgeResult.errors);
    }
    
    // Check if end age is less than start age
    if (params.startAge !== undefined && params.endAge < params.startAge) {
      result.valid = false;
      result.errors.push('End age cannot be less than start age');
      logger.error(`End age (${params.endAge}) is less than start age (${params.startAge})`);
    }
  }
  
  // Validate CPT code if provided
  if (params.cptCode) {
    const cptCodeResult = validateString(params.cptCode, 'CPT code', {
      pattern: /^\d{5}$/,
      patternDescription: 'a 5-digit code',
    });
    
    if (!cptCodeResult.valid) {
      result.warnings.push(...cptCodeResult.errors);
    }
  }
  
  // Validate ZIP code if provided
  if (params.zipCode) {
    const zipCodeResult = validateString(params.zipCode, 'ZIP code', {
      pattern: /^\d{5}(-\d{4})?$/,
      patternDescription: 'a valid ZIP code format (e.g., 12345 or 12345-6789)',
    });
    
    if (!zipCodeResult.valid) {
      result.warnings.push(...zipCodeResult.errors);
    }
  }
  
  return result;
};

/**
 * Validates a cost range object
 * @param costRange - The cost range to validate
 * @returns A validation result
 */
export const validateCostRange = (costRange: CostRange): ValidationResult => {
  const logger = calculationLogger.createContext('validateCostRange');
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  // Validate low cost
  const lowCostResult = validateNumber(costRange.low, 'Low cost', {
    min: 0,
    allowZero: true,
  });
  
  if (!lowCostResult.valid) {
    result.valid = false;
    result.errors.push(...lowCostResult.errors);
  }
  
  // Validate average cost
  const avgCostResult = validateNumber(costRange.average, 'Average cost', {
    min: 0,
    allowZero: true,
  });
  
  if (!avgCostResult.valid) {
    result.valid = false;
    result.errors.push(...avgCostResult.errors);
  }
  
  // Validate high cost
  const highCostResult = validateNumber(costRange.high, 'High cost', {
    min: 0,
    allowZero: true,
  });
  
  if (!highCostResult.valid) {
    result.valid = false;
    result.errors.push(...highCostResult.errors);
  }
  
  // Check if costs are in the correct order
  if (costRange.low > costRange.average) {
    result.valid = false;
    result.errors.push('Low cost cannot be greater than average cost');
    logger.error(`Low cost (${costRange.low}) is greater than average cost (${costRange.average})`);
  }
  
  if (costRange.average > costRange.high) {
    result.valid = false;
    result.errors.push('Average cost cannot be greater than high cost');
    logger.error(`Average cost (${costRange.average}) is greater than high cost (${costRange.high})`);
  }
  
  // Check for unreasonable variations
  if (costRange.high > costRange.low * 3) {
    result.warnings.push('High cost is more than 3x the low cost');
    logger.warn(`High cost (${costRange.high}) is more than 3x the low cost (${costRange.low})`);
  }
  
  return result;
};
