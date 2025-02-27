import { ParsedDuration } from './types';
import calculationLogger from './logger';
import { validateParsedDuration } from './validation';
import frequencyParser from './frequencyParser';

/**
 * Default values for duration calculations
 */
const DEFAULT_VALUES = {
  // Default duration when no information is available
  defaultDuration: 30,
  // Minimum duration for any calculation
  minDuration: 1,
  // Maximum reasonable duration for any calculation
  maxDuration: 100,
  // Default age-based duration rules
  ageBasedDuration: {
    // If no start age, default to current age
    defaultStartAge: 0,
    // If no end age, default to life expectancy or this value
    defaultEndAge: 80,
  },
};

/**
 * Calculates the duration in years based on age range
 * @param startAge - The starting age
 * @param endAge - The ending age
 * @returns The duration in years
 */
export const calculateDurationFromAgeRange = (
  startAge: number,
  endAge: number
): number => {
  const logger = calculationLogger.createContext('calculateDurationFromAgeRange');
  logger.info(`Calculating duration from age range: ${startAge} to ${endAge}`);
  
  if (endAge < startAge) {
    logger.error(`Invalid age range: end age (${endAge}) is less than start age (${startAge})`);
    return DEFAULT_VALUES.minDuration;
  }
  
  const duration = endAge - startAge;
  
  // Ensure duration is within reasonable bounds
  if (duration < DEFAULT_VALUES.minDuration) {
    logger.warn(`Duration (${duration}) is less than minimum (${DEFAULT_VALUES.minDuration}), using minimum`);
    return DEFAULT_VALUES.minDuration;
  }
  
  if (duration > DEFAULT_VALUES.maxDuration) {
    logger.warn(`Duration (${duration}) is greater than maximum (${DEFAULT_VALUES.maxDuration}), using maximum`);
    return DEFAULT_VALUES.maxDuration;
  }
  
  logger.info(`Calculated duration: ${duration} years`);
  return duration;
};

/**
 * Calculates the duration in years based on current age and life expectancy
 * @param currentAge - The current age
 * @param lifeExpectancy - The life expectancy in years
 * @returns The duration in years
 */
export const calculateDurationFromLifeExpectancy = (
  currentAge: number,
  lifeExpectancy: number
): number => {
  const logger = calculationLogger.createContext('calculateDurationFromLifeExpectancy');
  logger.info(`Calculating duration from life expectancy: current age ${currentAge}, life expectancy ${lifeExpectancy}`);
  
  // Ensure inputs are valid
  if (currentAge < 0) {
    logger.error(`Invalid current age: ${currentAge}`);
    currentAge = 0;
  }
  
  if (lifeExpectancy <= 0) {
    logger.error(`Invalid life expectancy: ${lifeExpectancy}`);
    lifeExpectancy = DEFAULT_VALUES.defaultDuration;
  }
  
  // Calculate duration
  const duration = lifeExpectancy;
  
  // Ensure duration is within reasonable bounds
  if (duration < DEFAULT_VALUES.minDuration) {
    logger.warn(`Duration (${duration}) is less than minimum (${DEFAULT_VALUES.minDuration}), using minimum`);
    return DEFAULT_VALUES.minDuration;
  }
  
  if (duration > DEFAULT_VALUES.maxDuration) {
    logger.warn(`Duration (${duration}) is greater than maximum (${DEFAULT_VALUES.maxDuration}), using maximum`);
    return DEFAULT_VALUES.maxDuration;
  }
  
  logger.info(`Calculated duration: ${duration} years`);
  return duration;
};

/**
 * Calculates the age at which an item ends based on start age and duration
 * @param startAge - The starting age
 * @param duration - The duration in years
 * @returns The ending age
 */
export const calculateEndAge = (
  startAge: number,
  duration: number
): number => {
  const logger = calculationLogger.createContext('calculateEndAge');
  logger.info(`Calculating end age: start age ${startAge}, duration ${duration}`);
  
  // Ensure inputs are valid
  if (startAge < 0) {
    logger.error(`Invalid start age: ${startAge}`);
    startAge = 0;
  }
  
  if (duration < DEFAULT_VALUES.minDuration) {
    logger.error(`Invalid duration: ${duration}`);
    duration = DEFAULT_VALUES.minDuration;
  }
  
  const endAge = startAge + duration;
  
  logger.info(`Calculated end age: ${endAge}`);
  return endAge;
};

/**
 * Calculates the age at which an item starts based on end age and duration
 * @param endAge - The ending age
 * @param duration - The duration in years
 * @returns The starting age
 */
export const calculateStartAge = (
  endAge: number,
  duration: number
): number => {
  const logger = calculationLogger.createContext('calculateStartAge');
  logger.info(`Calculating start age: end age ${endAge}, duration ${duration}`);
  
  // Ensure inputs are valid
  if (endAge <= 0) {
    logger.error(`Invalid end age: ${endAge}`);
    endAge = DEFAULT_VALUES.ageBasedDuration.defaultEndAge;
  }
  
  if (duration < DEFAULT_VALUES.minDuration) {
    logger.error(`Invalid duration: ${duration}`);
    duration = DEFAULT_VALUES.minDuration;
  }
  
  let startAge = endAge - duration;
  
  // Ensure start age is not negative
  if (startAge < 0) {
    logger.warn(`Calculated start age (${startAge}) is negative, using 0`);
    startAge = 0;
  }
  
  logger.info(`Calculated start age: ${startAge}`);
  return startAge;
};

/**
 * Determines the most appropriate duration based on available information
 * @param frequency - The frequency string
 * @param currentAge - The current age
 * @param lifeExpectancy - The life expectancy in years
 * @param startAge - The starting age
 * @param endAge - The ending age
 * @returns A parsed duration object
 */
export const determineDuration = (
  frequency: string,
  currentAge?: number,
  lifeExpectancy?: number,
  startAge?: number,
  endAge?: number
): ParsedDuration => {
  const logger = calculationLogger.createContext('determineDuration');
  logger.info('Determining duration', {
    frequency,
    currentAge,
    lifeExpectancy,
    startAge,
    endAge,
  });
  
  // First, try to parse duration from frequency string
  const parsedDuration = frequencyParser.parseDuration(
    frequency,
    currentAge,
    lifeExpectancy,
    startAge,
    endAge
  );
  
  // Validate the parsed duration
  const validationResult = validateParsedDuration(parsedDuration);
  if (!validationResult.valid) {
    logger.error(`Invalid parsed duration: ${validationResult.errors.join(', ')}`);
    
    // Return a default duration as fallback
    return {
      lowDuration: DEFAULT_VALUES.defaultDuration,
      highDuration: DEFAULT_VALUES.defaultDuration,
      source: 'default',
      valid: false,
      error: validationResult.errors.join(', '),
    };
  }
  
  // Handle warnings
  if (validationResult.warnings.length > 0) {
    logger.warn(`Duration warnings: ${validationResult.warnings.join(', ')}`);
  }
  
  logger.info('Determined duration', parsedDuration);
  return parsedDuration;
};

/**
 * Calculates the current age based on date of birth
 * @param dateOfBirth - The date of birth string
 * @returns The current age in years
 */
export const calculateAgeFromDOB = (dateOfBirth: string): number => {
  const logger = calculationLogger.createContext('calculateAgeFromDOB');
  logger.info(`Calculating age from date of birth: ${dateOfBirth}`);
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      logger.error(`Invalid date of birth: ${dateOfBirth}`);
      return 0;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    logger.info(`Calculated age: ${age}`);
    return age;
  } catch (error) {
    logger.error(`Error calculating age from DOB: ${error}`);
    return 0;
  }
};

/**
 * Utility functions for duration calculations
 */
export const durationCalculator = {
  calculateDurationFromAgeRange,
  calculateDurationFromLifeExpectancy,
  calculateEndAge,
  calculateStartAge,
  determineDuration,
  calculateAgeFromDOB,
  DEFAULT_VALUES,
};

export default durationCalculator;
