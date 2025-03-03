import { AgeIncrement } from '@/types/lifecare';
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
 * @param lifeExpectancy - Optional life expectancy to cap the end age
 * @param currentAge - Optional current age for life expectancy calculation
 * @returns The ending age
 */
export const calculateEndAge = (
  startAge: number,
  duration: number,
  lifeExpectancy?: number,
  currentAge?: number
): number => {
  const logger = calculationLogger.createContext('calculateEndAge');
  logger.info(`Calculating end age: start age ${startAge}, duration ${duration}, life expectancy ${lifeExpectancy}, current age ${currentAge}`);
  
  // Ensure inputs are valid
  if (startAge < 0) {
    logger.error(`Invalid start age: ${startAge}`);
    startAge = 0;
  }
  
  if (duration < DEFAULT_VALUES.minDuration) {
    logger.error(`Invalid duration: ${duration}`);
    duration = DEFAULT_VALUES.minDuration;
  }
  
  let endAge = startAge + duration;
  
  // Cap end age at maximum allowed by life expectancy if provided
  if (lifeExpectancy !== undefined && currentAge !== undefined) {
    const maxAge = currentAge + lifeExpectancy;
    if (endAge > maxAge) {
      logger.warn(`End age (${endAge}) exceeds maximum allowed age (${maxAge}), capping at maximum`);
      endAge = maxAge;
    }
  }
  
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
 * Uses memoization to prevent repeated calculations for the same date of birth
 * @param dateOfBirth - The date of birth string
 * @returns The current age in years
 */
// Create a cache to store previously calculated ages
const ageCache = new Map<string, number>();

export const calculateAgeFromDOB = (dateOfBirth: string): number => {
  const logger = calculationLogger.createContext('calculateAgeFromDOB');
  
  // Return cached value if available to prevent repeated calculations and logging
  if (ageCache.has(dateOfBirth)) {
    return ageCache.get(dateOfBirth)!;
  }
  
  // Only log when actually calculating (not retrieving from cache)
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
    
    // Cache the result
    ageCache.set(dateOfBirth, age);
    
    return age;
  } catch (error) {
    logger.error(`Error calculating age from DOB: ${error}`);
    return 0;
  }
};

/**
 * Utility functions for duration calculations
 */

/**
 * Calculates the total duration from a set of age increments
 * @param ageIncrements - Array of age increments
 * @returns The total duration in years
 */
export const calculateDurationFromAgeIncrements = (
  ageIncrements: AgeIncrement[]
): number => {
  const logger = calculationLogger.createContext('calculateDurationFromAgeIncrements');
  logger.info(`Calculating duration from ${ageIncrements.length} age increments`);
  
  if (!ageIncrements || ageIncrements.length === 0) {
    logger.warn('No age increments provided, using minimum duration');
    return DEFAULT_VALUES.minDuration;
  }
  
  // Sort increments by startAge to ensure proper calculation
  const sortedIncrements = [...ageIncrements].sort((a, b) => a.startAge - b.startAge);
  
  // Calculate total duration
  let totalDuration = 0;
  
  for (const increment of sortedIncrements) {
    if (increment.endAge < increment.startAge) {
      logger.warn(`Invalid age range: end age (${increment.endAge}) is less than start age (${increment.startAge})`);
      continue;
    }
    
    const incrementDuration = increment.endAge - increment.startAge;
    totalDuration += incrementDuration;
  }
  
  // Ensure duration is within reasonable bounds
  if (totalDuration < DEFAULT_VALUES.minDuration) {
    logger.warn(`Total duration (${totalDuration}) is less than minimum (${DEFAULT_VALUES.minDuration}), using minimum`);
    return DEFAULT_VALUES.minDuration;
  }
  
  if (totalDuration > DEFAULT_VALUES.maxDuration) {
    logger.warn(`Total duration (${totalDuration}) is greater than maximum (${DEFAULT_VALUES.maxDuration}), using maximum`);
    return DEFAULT_VALUES.maxDuration;
  }
  
  logger.info(`Calculated total duration: ${totalDuration} years`);
  return totalDuration;
};

/**
 * Validates a set of age increments for gaps and overlaps
 * @param ageIncrements - Array of age increments to validate
 * @returns Validation result with valid flag and error messages
 */
export const validateAgeIncrements = (
  ageIncrements: AgeIncrement[]
): { valid: boolean; errors: string[] } => {
  const logger = calculationLogger.createContext('validateAgeIncrements');
  logger.info(`Validating ${ageIncrements.length} age increments`);
  
  const errors: string[] = [];
  
  if (!ageIncrements || ageIncrements.length === 0) {
    return { valid: true, errors: [] };
  }
  
  // Sort increments by start age
  const sortedIncrements = [...ageIncrements].sort((a, b) => a.startAge - b.startAge);
  
  // Check for basic validity of each increment
  for (const increment of sortedIncrements) {
    if (increment.startAge >= increment.endAge) {
      errors.push(`Invalid age range: ${increment.startAge}-${increment.endAge}`);
    }
  }
  
  // Check for gaps and overlaps
  for (let i = 1; i < sortedIncrements.length; i++) {
    const prevIncrement = sortedIncrements[i - 1];
    const currentIncrement = sortedIncrements[i];
    
    if (prevIncrement.endAge > currentIncrement.startAge) {
      errors.push(`Overlap between age ${prevIncrement.endAge} and ${currentIncrement.startAge}`);
    } else if (prevIncrement.endAge < currentIncrement.startAge) {
      errors.push(`Gap between age ${prevIncrement.endAge} and ${currentIncrement.startAge}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Normalizes a set of age increments to fix gaps and overlaps
 * @param ageIncrements - Array of age increments to normalize
 * @returns Normalized array of age increments
 */
export const normalizeAgeIncrements = (
  ageIncrements: AgeIncrement[]
): AgeIncrement[] => {
  const logger = calculationLogger.createContext('normalizeAgeIncrements');
  logger.info(`Normalizing ${ageIncrements.length} age increments`);
  
  if (!ageIncrements || ageIncrements.length === 0) {
    return [];
  }
  
  // Sort increments by start age
  const sortedIncrements = [...ageIncrements].sort((a, b) => a.startAge - b.startAge);
  const normalized: AgeIncrement[] = [sortedIncrements[0]];
  
  // Fix gaps and overlaps
  for (let i = 1; i < sortedIncrements.length; i++) {
    const prevNormalized = normalized[normalized.length - 1];
    const current = sortedIncrements[i];
    
    // Fix overlap by adjusting current start age
    if (prevNormalized.endAge > current.startAge) {
      normalized.push({
        ...current,
        startAge: prevNormalized.endAge
      });
    } 
    // Fix gap by extending previous end age
    else if (prevNormalized.endAge < current.startAge) {
      normalized.push(current);
    }
    // Perfect connection, no change needed
    else {
      normalized.push(current);
    }
  }
  
  return normalized;
};

/**
 * Converts a legacy item to use age increments
 * @param startAge - The start age
 * @param endAge - The end age
 * @param frequency - The frequency string
 * @param isOneTime - Whether this is a one-time occurrence
 * @returns An array with a single age increment
 */
export const convertToAgeIncrements = (
  startAge: number = 0,
  endAge: number = 100,
  frequency: string = "1x per year",
  isOneTime: boolean = false
): AgeIncrement[] => {
  return [{
    startAge,
    endAge,
    frequency,
    isOneTime
  }];
};

// Export the utility functions
export const durationCalculator = {
  calculateDurationFromAgeRange,
  calculateDurationFromLifeExpectancy,
  calculateEndAge,
  calculateStartAge,
  determineDuration,
  calculateAgeFromDOB,
  calculateDurationFromAgeIncrements,
  validateAgeIncrements,
  normalizeAgeIncrements,
  convertToAgeIncrements,
  DEFAULT_VALUES,
};

export default durationCalculator;
