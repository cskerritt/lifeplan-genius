import {
  validateNumber,
  validateString,
  validateFrequency,
  validateParsedFrequency,
  validateParsedDuration,
  validateCostCalculationParams,
  validateCostRange,
} from '../validation';
import { ParsedFrequency, ParsedDuration, CostCalculationParams, CostRange } from '../types';

// Mock the logger to avoid console output during tests
jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    createContext: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

describe('Validation Utilities', () => {
  describe('validateNumber', () => {
    test('should validate valid numbers', () => {
      const result = validateNumber(42, 'test');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should validate string numbers', () => {
      const result = validateNumber('42', 'test');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate NaN', () => {
      const result = validateNumber(NaN, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('valid number');
    });

    test('should invalidate non-numeric strings', () => {
      const result = validateNumber('not a number', 'test');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('valid number');
    });

    test('should validate required numbers', () => {
      const result = validateNumber(undefined, 'test', { required: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('required');
    });

    test('should validate minimum values', () => {
      const result = validateNumber(5, 'test', { min: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at least');
    });

    test('should validate maximum values', () => {
      const result = validateNumber(15, 'test', { max: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at most');
    });

    test('should validate zero values', () => {
      const result = validateNumber(0, 'test', { allowZero: false });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('cannot be zero');
    });

    test('should validate negative values', () => {
      const result = validateNumber(-5, 'test', { allowNegative: false });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('cannot be negative');
    });

    test('should validate integer requirement', () => {
      const result = validateNumber(5.5, 'test', { integer: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('integer');
    });
  });

  describe('validateString', () => {
    test('should validate valid strings', () => {
      const result = validateString('test', 'test');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should validate required strings', () => {
      const result = validateString(undefined, 'test', { required: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('required');
    });

    test('should validate minimum length', () => {
      const result = validateString('abc', 'test', { minLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at least');
    });

    test('should validate maximum length', () => {
      const result = validateString('abcdefg', 'test', { maxLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at most');
    });

    test('should validate pattern', () => {
      const result = validateString('abc123', 'test', {
        pattern: /^[a-z]+$/,
        patternDescription: 'lowercase letters only',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('lowercase letters only');
    });

    test('should convert non-string values to strings', () => {
      const result = validateString(42, 'test');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateFrequency', () => {
    test('should validate valid frequency formats', () => {
      const result = validateFrequency('3 times per week');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should invalidate empty frequency', () => {
      const result = validateFrequency('');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('required');
    });

    test('should warn about unrecognized frequency formats', () => {
      const result = validateFrequency('some random text');
      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('not recognized');
    });
  });

  describe('validateParsedFrequency', () => {
    test('should validate valid parsed frequency', () => {
      const parsedFrequency: ParsedFrequency = {
        lowFrequency: 12,
        highFrequency: 24,
        isOneTime: false,
        original: '1-2 times per month',
        valid: true,
      };

      const result = validateParsedFrequency(parsedFrequency);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should invalidate when parsing failed', () => {
      const parsedFrequency: ParsedFrequency = {
        lowFrequency: 1,
        highFrequency: 1,
        isOneTime: false,
        original: '',
        valid: false,
        error: 'Failed to parse frequency',
      };

      const result = validateParsedFrequency(parsedFrequency);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to parse frequency');
    });

    test('should invalidate negative frequencies', () => {
      const parsedFrequency: ParsedFrequency = {
        lowFrequency: -1,
        highFrequency: 12,
        isOneTime: false,
        original: 'invalid',
        valid: true,
      };

      const result = validateParsedFrequency(parsedFrequency);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
    });

    test('should invalidate when high frequency is less than low frequency', () => {
      const parsedFrequency: ParsedFrequency = {
        lowFrequency: 12,
        highFrequency: 6,
        isOneTime: false,
        original: 'invalid',
        valid: true,
      };

      const result = validateParsedFrequency(parsedFrequency);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('High frequency cannot be less than low frequency'))).toBe(true);
    });
  });

  describe('validateParsedDuration', () => {
    test('should validate valid parsed duration', () => {
      const parsedDuration: ParsedDuration = {
        lowDuration: 5,
        highDuration: 10,
        source: 'frequency',
        valid: true,
      };

      const result = validateParsedDuration(parsedDuration);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate when parsing failed', () => {
      const parsedDuration: ParsedDuration = {
        lowDuration: 1,
        highDuration: 30,
        source: 'default',
        valid: false,
        error: 'Failed to parse duration',
      };

      const result = validateParsedDuration(parsedDuration);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to parse duration');
    });

    test('should invalidate negative durations', () => {
      const parsedDuration: ParsedDuration = {
        lowDuration: -1,
        highDuration: 10,
        source: 'frequency',
        valid: true,
      };

      const result = validateParsedDuration(parsedDuration);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
    });

    test('should invalidate when high duration is less than low duration', () => {
      const parsedDuration: ParsedDuration = {
        lowDuration: 10,
        highDuration: 5,
        source: 'frequency',
        valid: true,
      };

      const result = validateParsedDuration(parsedDuration);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('High duration cannot be less than low duration'))).toBe(true);
    });

    test('should warn when using default values', () => {
      const parsedDuration: ParsedDuration = {
        lowDuration: 1,
        highDuration: 30,
        source: 'default',
        valid: true,
      };

      const result = validateParsedDuration(parsedDuration);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Using default duration values');
    });
  });

  describe('validateCostCalculationParams', () => {
    test('should validate valid parameters', () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '3 times per week',
        currentAge: 45,
        lifeExpectancy: 35,
      };

      const result = validateCostCalculationParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate negative base rate', () => {
      const params: CostCalculationParams = {
        baseRate: -100,
        frequency: '3 times per week',
      };

      const result = validateCostCalculationParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Base rate'))).toBe(true);
    });

    test('should invalidate missing frequency', () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '',
      };

      const result = validateCostCalculationParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Frequency'))).toBe(true);
    });

    test('should invalidate when end age is less than start age', () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '3 times per week',
        startAge: 50,
        endAge: 40,
      };

      const result = validateCostCalculationParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('End age cannot be less than start age'))).toBe(true);
    });

    test('should warn about invalid CPT code format', () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '3 times per week',
        cptCode: '123', // Not 5 digits
      };

      const result = validateCostCalculationParams(params);
      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should warn about invalid ZIP code format', () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '3 times per week',
        zipCode: '123', // Not 5 digits
      };

      const result = validateCostCalculationParams(params);
      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateCostRange', () => {
    test('should validate valid cost range', () => {
      const costRange: CostRange = {
        low: 80,
        average: 100,
        high: 120,
      };

      const result = validateCostRange(costRange);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate negative costs', () => {
      const costRange: CostRange = {
        low: -80,
        average: 100,
        high: 120,
      };

      const result = validateCostRange(costRange);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
    });

    test('should invalidate when low cost is greater than average cost', () => {
      const costRange: CostRange = {
        low: 120,
        average: 100,
        high: 150,
      };

      const result = validateCostRange(costRange);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Low cost cannot be greater than average cost'))).toBe(true);
    });

    test('should invalidate when average cost is greater than high cost', () => {
      const costRange: CostRange = {
        low: 80,
        average: 150,
        high: 120,
      };

      const result = validateCostRange(costRange);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Average cost cannot be greater than high cost'))).toBe(true);
    });

    test('should warn when high cost is more than 3x the low cost', () => {
      const costRange: CostRange = {
        low: 100,
        average: 200,
        high: 350, // > 3 * 100
      };

      const result = validateCostRange(costRange);
      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('High cost is more than 3x the low cost');
    });
  });
});
