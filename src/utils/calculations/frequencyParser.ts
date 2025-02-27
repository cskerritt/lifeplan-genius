import { ParsedFrequency, ParsedDuration } from './types';
import calculationLogger from './logger';
import { validateFrequency, validateParsedFrequency, validateParsedDuration } from './validation';

/**
 * Default values for frequency parsing
 */
const DEFAULT_VALUES = {
  // Default values for frequency when parsing fails
  frequency: {
    low: 1,
    high: 1,
  },
  // Default values for duration when parsing fails or not specified
  duration: {
    low: 1,
    high: 30,
  },
  // Default values for duration when age range is available
  ageRangeDuration: {
    // If no start age, default to current age
    defaultStartAge: 0,
    // If no end age, default to life expectancy or this value
    defaultEndAge: 80,
  },
};

/**
 * Parses a frequency string to determine the number of occurrences per year
 * @param frequency - The frequency string to parse
 * @returns A parsed frequency object
 */
export const parseFrequency = (frequency: string): ParsedFrequency => {
  const logger = calculationLogger.createContext('parseFrequency');
  logger.info(`Parsing frequency: "${frequency}"`);
  
  // Validate input
  const validationResult = validateFrequency(frequency);
  if (!validationResult.valid) {
    logger.error(`Invalid frequency: ${validationResult.errors.join(', ')}`);
    return {
      lowFrequency: DEFAULT_VALUES.frequency.low,
      highFrequency: DEFAULT_VALUES.frequency.high,
      isOneTime: false,
      original: frequency,
      valid: false,
      error: validationResult.errors.join(', '),
    };
  }
  
  // Handle warnings
  if (validationResult.warnings.length > 0) {
    logger.warn(`Frequency warnings: ${validationResult.warnings.join(', ')}`);
  }
  
  // Default values
  let lowFrequency = DEFAULT_VALUES.frequency.low;
  let highFrequency = DEFAULT_VALUES.frequency.high;
  let isOneTime = false;
  
  // Convert to lowercase for case-insensitive matching
  const frequencyLower = frequency.toLowerCase();
  
  // Check for one-time occurrences first
  if (
    frequencyLower.includes('one time') ||
    frequencyLower.includes('one-time') ||
    frequencyLower.includes('onetime') ||
    frequencyLower.includes('once') && !frequencyLower.includes('once a') && !frequencyLower.includes('once per')
  ) {
    logger.info('Detected one-time occurrence');
    isOneTime = true;
    lowFrequency = 0;
    highFrequency = 0;
    
    return {
      lowFrequency,
      highFrequency,
      isOneTime,
      original: frequency,
      valid: true,
    };
  }
  
  // Check for range pattern (e.g., "3-5 times per year")
  const rangePattern = /(\d+)-(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)year/i;
  if (rangePattern.test(frequencyLower)) {
    const match = frequencyLower.match(rangePattern);
    if (match) {
      lowFrequency = parseInt(match[1]);
      highFrequency = parseInt(match[2]);
      logger.info(`Parsed range pattern: ${lowFrequency}-${highFrequency} times per year`);
    }
  }
  // Check for weekly pattern (e.g., "3 times per week")
  else if (/(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)week/i.test(frequencyLower)) {
    const match = frequencyLower.match(/(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)week/i);
    if (match) {
      const times = parseInt(match[1]);
      // More precise calculation: 52.1429 weeks per year
      lowFrequency = Math.round(times * 52.1429 * 100) / 100;
      highFrequency = lowFrequency;
      logger.info(`Parsed weekly pattern: ${times} times per week = ${lowFrequency} times per year`);
    }
  }
  // Check for monthly pattern (e.g., "2 times per month")
  else if (/(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)month/i.test(frequencyLower)) {
    const match = frequencyLower.match(/(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)month/i);
    if (match) {
      const times = parseInt(match[1]);
      lowFrequency = times * 12;
      highFrequency = lowFrequency;
      logger.info(`Parsed monthly pattern: ${times} times per month = ${lowFrequency} times per year`);
    }
  }
  // Check for quarterly pattern (e.g., "quarterly" or "every 3 months")
  else if (/quarterly|every\s+3\s+months/i.test(frequencyLower)) {
    lowFrequency = 4;
    highFrequency = 4;
    logger.info('Parsed quarterly pattern: 4 times per year');
  }
  // Check for biweekly pattern (e.g., "biweekly" or "every other week")
  else if (/bi-?weekly|every\s+other\s+week|every\s+2\s+weeks/i.test(frequencyLower)) {
    lowFrequency = 26; // 52 weeks / 2
    highFrequency = 26;
    logger.info('Parsed biweekly pattern: 26 times per year');
  }
  // Check for twice weekly pattern (e.g., "twice a week")
  else if (/twice\s+(?:a\s+)?week/i.test(frequencyLower)) {
    lowFrequency = 104; // 2 * 52 weeks
    highFrequency = 104;
    logger.info('Parsed twice weekly pattern: 104 times per year');
  }
  // Check for twice monthly pattern (e.g., "twice a month")
  else if (/twice\s+(?:a\s+)?month/i.test(frequencyLower)) {
    lowFrequency = 24; // 2 * 12 months
    highFrequency = 24;
    logger.info('Parsed twice monthly pattern: 24 times per year');
  }
  // Check for daily pattern (e.g., "daily" or "every day")
  else if (/daily|every\s+day|each\s+day/i.test(frequencyLower)) {
    lowFrequency = 365;
    highFrequency = 365;
    logger.info('Parsed daily pattern: 365 times per year');
  }
  // Check for annual pattern (e.g., "annual", "yearly", "once a year")
  else if (/annual|yearly|once\s+(?:a|per)\s+year/i.test(frequencyLower)) {
    lowFrequency = 1;
    highFrequency = 1;
    logger.info('Parsed annual pattern: 1 time per year');
  }
  // Check for semi-annual pattern (e.g., "semi-annual", "twice a year")
  else if (/semi-?annual|twice\s+(?:a|per)\s+year/i.test(frequencyLower)) {
    lowFrequency = 2;
    highFrequency = 2;
    logger.info('Parsed semi-annual pattern: 2 times per year');
  }
  // Check for every X days pattern (e.g., "every 3 days")
  else if (/every\s+(\d+)\s+days/i.test(frequencyLower)) {
    const match = frequencyLower.match(/every\s+(\d+)\s+days/i);
    if (match) {
      const days = parseInt(match[1]);
      lowFrequency = Math.round(365 / days * 100) / 100;
      highFrequency = lowFrequency;
      logger.info(`Parsed every ${days} days pattern: ${lowFrequency} times per year`);
    }
  }
  // Check for X times per day pattern (e.g., "3 times per day")
  else if (/(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)day/i.test(frequencyLower)) {
    const match = frequencyLower.match(/(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)day/i);
    if (match) {
      const times = parseInt(match[1]);
      lowFrequency = times * 365;
      highFrequency = lowFrequency;
      logger.info(`Parsed ${times} times per day pattern: ${lowFrequency} times per year`);
    }
  }
  // Check for simple numeric pattern (e.g., "4x" or "4 times")
  else if (/^(\d+)(?:x|times?)?$/i.test(frequencyLower)) {
    const match = frequencyLower.match(/^(\d+)(?:x|times?)?$/i);
    if (match) {
      const times = parseInt(match[1]);
      // Assume per year if no unit specified
      lowFrequency = times;
      highFrequency = times;
      logger.info(`Parsed simple numeric pattern: ${times} times per year`);
    }
  }
  // If no pattern matched, use default values
  else {
    logger.warn(`No pattern matched for frequency: "${frequency}". Using default values.`);
  }
  
  // Create the result object
  const result: ParsedFrequency = {
    lowFrequency,
    highFrequency,
    isOneTime,
    original: frequency,
    valid: true,
  };
  
  // Validate the result
  const resultValidation = validateParsedFrequency(result);
  if (!resultValidation.valid) {
    logger.error(`Invalid parsed frequency: ${resultValidation.errors.join(', ')}`);
    return {
      ...result,
      valid: false,
      error: resultValidation.errors.join(', '),
    };
  }
  
  logger.info('Successfully parsed frequency', { result });
  return result;
};

/**
 * Parses duration information from a frequency string or age range
 * @param frequency - The frequency string to parse
 * @param currentAge - The current age of the evaluee
 * @param lifeExpectancy - The life expectancy of the evaluee
 * @param startAge - The age at which the item starts
 * @param endAge - The age at which the item ends
 * @returns A parsed duration object
 */
export const parseDuration = (
  frequency: string,
  currentAge?: number,
  lifeExpectancy?: number,
  startAge?: number,
  endAge?: number
): ParsedDuration => {
  const logger = calculationLogger.createContext('parseDuration');
  logger.info(`Parsing duration from frequency: "${frequency}"`, {
    currentAge,
    lifeExpectancy,
    startAge,
    endAge,
  });
  
  // Default values
  let lowDuration = DEFAULT_VALUES.duration.low;
  let highDuration = DEFAULT_VALUES.duration.high;
  let source: ParsedDuration['source'] = 'default';
  
  // First, try to extract duration from frequency string
  const durationMatch = frequency.match(/(\d+)-(\d+)\s*(?:years?|yrs?)/i) ||
                       frequency.match(/for\s+(\d+)-(\d+)\s*(?:years?|yrs?)/i);
  
  if (durationMatch) {
    lowDuration = parseInt(durationMatch[1]);
    highDuration = parseInt(durationMatch[2]);
    source = 'frequency';
    logger.info(`Extracted duration from frequency: ${lowDuration}-${highDuration} years`);
  }
  // Check for single year duration (e.g., "for 5 years")
  else if (frequency.match(/for\s+(\d+)\s*(?:years?|yrs?)/i)) {
    const match = frequency.match(/for\s+(\d+)\s*(?:years?|yrs?)/i);
    if (match) {
      lowDuration = parseInt(match[1]);
      highDuration = lowDuration;
      source = 'frequency';
      logger.info(`Extracted single year duration from frequency: ${lowDuration} years`);
    }
  }
  // If no duration in frequency, try to use age range
  else if (startAge !== undefined && endAge !== undefined) {
    lowDuration = endAge - startAge;
    highDuration = lowDuration;
    source = 'age-range';
    logger.info(`Using age range for duration: ${startAge} to ${endAge} = ${lowDuration} years`);
  }
  // If no age range, try to use current age and life expectancy
  else if (currentAge !== undefined && lifeExpectancy !== undefined) {
    // Use half of life expectancy as low duration and full life expectancy as high duration
    lowDuration = Math.max(1, Math.floor(lifeExpectancy / 2));
    highDuration = lifeExpectancy;
    source = 'default';
    logger.info(`Using life expectancy for duration: ${lowDuration}-${highDuration} years`);
  }
  // Otherwise, use default values
  else {
    logger.warn('No duration information found. Using default values.');
  }
  
  // Create the result object
  const result: ParsedDuration = {
    lowDuration,
    highDuration,
    source,
    valid: true,
  };
  
  // Validate the result
  const resultValidation = validateParsedDuration(result);
  if (!resultValidation.valid) {
    logger.error(`Invalid parsed duration: ${resultValidation.errors.join(', ')}`);
    return {
      ...result,
      valid: false,
      error: resultValidation.errors.join(', '),
    };
  }
  
  // Add warnings from validation
  if (resultValidation.warnings.length > 0) {
    logger.warn(`Duration warnings: ${resultValidation.warnings.join(', ')}`);
  }
  
  logger.info('Successfully parsed duration', { result });
  return result;
};

/**
 * Determines if a frequency string represents a one-time occurrence
 * @param frequency - The frequency string to check
 * @returns True if the frequency represents a one-time occurrence
 */
export const isOneTimeFrequency = (frequency: string): boolean => {
  if (!frequency) return false;
  
  const frequencyLower = frequency.toLowerCase();
  return (
    frequencyLower.includes('one time') ||
    frequencyLower.includes('one-time') ||
    frequencyLower.includes('onetime') ||
    (frequencyLower.includes('once') && !frequencyLower.includes('once a') && !frequencyLower.includes('once per'))
  );
};

/**
 * Utility functions for frequency parsing
 */
export const frequencyParser = {
  parseFrequency,
  parseDuration,
  isOneTimeFrequency,
  DEFAULT_VALUES,
};

export default frequencyParser;
