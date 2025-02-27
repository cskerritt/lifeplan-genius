import { CareCategory } from "@/types/lifecare";

/**
 * Represents a range of costs
 * @property low - The low estimate
 * @property average - The average estimate
 * @property high - The high estimate
 */
export interface CostRange {
  low: number;
  average: number;
  high: number;
}

/**
 * Represents the parsed frequency information from a frequency string
 * @property lowFrequency - The lower bound of frequency per year
 * @property highFrequency - The upper bound of frequency per year
 * @property isOneTime - Whether this is a one-time occurrence
 * @property original - The original frequency string that was parsed
 * @property valid - Whether the frequency string was successfully parsed
 * @property error - Error message if parsing failed
 */
export interface ParsedFrequency {
  lowFrequency: number;
  highFrequency: number;
  isOneTime: boolean;
  original: string;
  valid: boolean;
  error?: string;
}

/**
 * Represents the parsed duration information from a frequency string or age range
 * @property lowDuration - The lower bound of duration in years
 * @property highDuration - The upper bound of duration in years
 * @property source - The source of the duration information (frequency, age-range, default)
 * @property valid - Whether the duration was successfully determined
 * @property error - Error message if determination failed
 */
export interface ParsedDuration {
  lowDuration: number;
  highDuration: number;
  source: 'frequency' | 'age-range' | 'default';
  valid: boolean;
  error?: string;
}

/**
 * Represents the calculated costs for an item
 * @property annual - The annual cost
 * @property lifetime - The lifetime cost
 * @property low - The low estimate of lifetime cost
 * @property high - The high estimate of lifetime cost
 * @property average - The average estimate of lifetime cost
 * @property isOneTime - Whether this is a one-time cost
 */
export interface CalculatedCosts {
  annual: number;
  lifetime: number;
  low: number;
  high: number;
  average: number;
  isOneTime: boolean;
}

/**
 * Represents the input parameters for cost calculations
 * @property baseRate - The base rate per unit
 * @property frequency - The frequency string
 * @property currentAge - The current age of the evaluee
 * @property lifeExpectancy - The life expectancy of the evaluee
 * @property startAge - The age at which the item starts
 * @property endAge - The age at which the item ends
 * @property cptCode - The CPT code for the item
 * @property category - The category of the item
 * @property zipCode - The ZIP code for geographic adjustment
 */
export interface CostCalculationParams {
  baseRate: number;
  frequency: string;
  currentAge?: number;
  lifeExpectancy?: number;
  startAge?: number;
  endAge?: number;
  cptCode?: string | null;
  category?: CareCategory;
  zipCode?: string;
}

/**
 * Represents the geographic adjustment factors
 * @property mfr_factor - The Medicare Facility Rate factor
 * @property pfr_factor - The Private Facility Rate factor
 */
export interface GeoFactors {
  mfr_factor: number;
  pfr_factor: number;
}

/**
 * Represents a validation result
 * @property valid - Whether the validation passed
 * @property errors - Array of error messages if validation failed
 * @property warnings - Array of warning messages
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Represents a log entry for calculation steps
 * @property timestamp - When the log entry was created
 * @property level - The log level
 * @property message - The log message
 * @property data - Additional data for the log entry
 */
export interface CalculationLogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}
