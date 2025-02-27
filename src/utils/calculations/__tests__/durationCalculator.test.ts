import {
  calculateDurationFromAgeRange,
  calculateDurationFromLifeExpectancy,
  calculateEndAge,
  calculateStartAge,
  determineDuration,
  calculateAgeFromDOB,
} from '../durationCalculator';
import * as frequencyParser from '../frequencyParser';

// Mock the frequency parser to avoid dependencies
jest.mock('../frequencyParser', () => ({
  parseDuration: jest.fn(),
}));

describe('Duration Calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDurationFromAgeRange', () => {
    test('should calculate duration correctly from age range', () => {
      const result = calculateDurationFromAgeRange(45, 75);
      expect(result).toBe(30);
    });

    test('should return minimum duration if end age is less than start age', () => {
      const result = calculateDurationFromAgeRange(75, 45);
      expect(result).toBe(1); // Minimum duration
    });

    test('should enforce minimum duration', () => {
      const result = calculateDurationFromAgeRange(45, 45);
      expect(result).toBe(1); // Minimum duration
    });

    test('should enforce maximum duration', () => {
      const result = calculateDurationFromAgeRange(0, 150);
      expect(result).toBe(100); // Maximum duration
    });
  });

  describe('calculateDurationFromLifeExpectancy', () => {
    test('should use life expectancy as duration', () => {
      const result = calculateDurationFromLifeExpectancy(45, 35);
      expect(result).toBe(35);
    });

    test('should handle negative current age', () => {
      const result = calculateDurationFromLifeExpectancy(-5, 35);
      expect(result).toBe(35);
    });

    test('should handle invalid life expectancy', () => {
      const result = calculateDurationFromLifeExpectancy(45, -5);
      expect(result).toBe(30); // Default duration
    });

    test('should enforce minimum duration', () => {
      const result = calculateDurationFromLifeExpectancy(45, 0.5);
      expect(result).toBe(1); // Minimum duration
    });

    test('should enforce maximum duration', () => {
      const result = calculateDurationFromLifeExpectancy(45, 150);
      expect(result).toBe(100); // Maximum duration
    });
  });

  describe('calculateEndAge', () => {
    test('should calculate end age correctly', () => {
      const result = calculateEndAge(45, 30);
      expect(result).toBe(75);
    });

    test('should handle negative start age', () => {
      const result = calculateEndAge(-5, 30);
      expect(result).toBe(30); // Uses 0 as start age
    });

    test('should handle invalid duration', () => {
      const result = calculateEndAge(45, 0);
      expect(result).toBe(46); // Uses minimum duration (1)
    });
  });

  describe('calculateStartAge', () => {
    test('should calculate start age correctly', () => {
      const result = calculateStartAge(75, 30);
      expect(result).toBe(45);
    });

    test('should handle invalid end age', () => {
      const result = calculateStartAge(0, 30);
      expect(result).toBe(0); // Uses default end age
    });

    test('should handle invalid duration', () => {
      const result = calculateStartAge(75, 0);
      expect(result).toBe(74); // Uses minimum duration (1)
    });

    test('should ensure start age is not negative', () => {
      const result = calculateStartAge(10, 20);
      expect(result).toBe(0); // Minimum start age is 0
    });
  });

  describe('determineDuration', () => {
    test('should use parseDuration from frequencyParser', () => {
      const mockParsedDuration = {
        lowDuration: 10,
        highDuration: 20,
        source: 'frequency' as const,
        valid: true,
      };

      (frequencyParser.parseDuration as jest.Mock).mockReturnValue(mockParsedDuration);

      const result = determineDuration('3 times per week for 10-20 years', 45, 35);

      expect(frequencyParser.parseDuration).toHaveBeenCalledWith(
        '3 times per week for 10-20 years',
        45,
        35,
        undefined,
        undefined
      );
      expect(result).toEqual(mockParsedDuration);
    });

    test('should handle invalid parsed duration', () => {
      const mockParsedDuration = {
        lowDuration: 10,
        highDuration: 20,
        source: 'frequency' as const,
        valid: false,
        error: 'Invalid duration',
      };

      (frequencyParser.parseDuration as jest.Mock).mockReturnValue(mockParsedDuration);

      const result = determineDuration('invalid');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.lowDuration).toBe(30); // Default duration
      expect(result.highDuration).toBe(30); // Default duration
      expect(result.source).toBe('default');
    });
  });

  describe('calculateAgeFromDOB', () => {
    // Store the original Date implementation
    const RealDate = Date;
    
    beforeEach(() => {
      // Mock the Date constructor to return a fixed date
      global.Date = jest.fn(() => new RealDate('2025-02-26T12:00:00Z')) as any;
      // Keep the Date prototype methods
      Object.setPrototypeOf(global.Date, RealDate);
      // Make sure new Date(string) works correctly
      global.Date.parse = RealDate.parse;
    });
    
    afterEach(() => {
      // Restore the original Date
      global.Date = RealDate;
    });
    
    test('should calculate age correctly', () => {
      const result = calculateAgeFromDOB('1980-02-26');
      expect(result).toBe(45); // 2025 - 1980 = 45
    });

    test('should handle invalid date', () => {
      const result = calculateAgeFromDOB('invalid-date');
      expect(result).toBe(0);
    });

    test('should handle birthday that hasn\'t occurred yet this year', () => {
      const result = calculateAgeFromDOB('1980-03-15'); // Birthday in March, hasn't occurred yet
      expect(result).toBe(44); // 2025 - 1980 - 1 = 44
    });
  });
});
