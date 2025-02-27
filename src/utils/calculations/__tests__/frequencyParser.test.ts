import frequencyParser, { parseFrequency, parseDuration, isOneTimeFrequency } from '../frequencyParser';

describe('Frequency Parser', () => {
  describe('parseFrequency', () => {
    test('should parse yearly range correctly', () => {
      const result = parseFrequency('3-5 times per year');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(3);
      expect(result.highFrequency).toBe(5);
      expect(result.isOneTime).toBe(false);
    });

// Test the fix for parsing duration from frequency strings like "4-4x per year 30 years"
describe('parseDuration with duration at end of string', () => {
  it('should correctly parse duration from "4-4x per year 30 years"', () => {
    const frequency = '4-4x per year 30 years';
    const result = frequencyParser.parseDuration(frequency);
    
    expect(result.valid).toBe(true);
    expect(result.lowDuration).toBe(30);
    expect(result.highDuration).toBe(30);
    expect(result.source).toBe('frequency');
  });
  
  it('should correctly parse duration from "2-2x per year 20 years"', () => {
    const frequency = '2-2x per year 20 years';
    const result = frequencyParser.parseDuration(frequency);
    
    expect(result.valid).toBe(true);
    expect(result.lowDuration).toBe(20);
    expect(result.highDuration).toBe(20);
    expect(result.source).toBe('frequency');
  });
});

    test('should parse weekly frequency correctly', () => {
      const result = parseFrequency('3 times per week');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBeCloseTo(156.43, 1); // 3 * 52.1429
      expect(result.highFrequency).toBeCloseTo(156.43, 1);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse monthly frequency correctly', () => {
      const result = parseFrequency('2 times per month');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(24); // 2 * 12
      expect(result.highFrequency).toBe(24);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse biweekly frequency correctly', () => {
      const result = parseFrequency('biweekly');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(26); // 52 / 2
      expect(result.highFrequency).toBe(26);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse "every other week" correctly', () => {
      const result = parseFrequency('every other week');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(26); // 52 / 2
      expect(result.highFrequency).toBe(26);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse twice weekly correctly', () => {
      const result = parseFrequency('twice a week');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(104); // 2 * 52
      expect(result.highFrequency).toBe(104);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse twice monthly correctly', () => {
      const result = parseFrequency('twice a month');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(24); // 2 * 12
      expect(result.highFrequency).toBe(24);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse annual frequency correctly', () => {
      const result = parseFrequency('annual');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(1);
      expect(result.highFrequency).toBe(1);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse "once a year" correctly', () => {
      const result = parseFrequency('once a year');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(1);
      expect(result.highFrequency).toBe(1);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse daily frequency correctly', () => {
      const result = parseFrequency('daily');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(365);
      expect(result.highFrequency).toBe(365);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse "every day" correctly', () => {
      const result = parseFrequency('every day');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(365);
      expect(result.highFrequency).toBe(365);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse "every 3 days" correctly', () => {
      const result = parseFrequency('every 3 days');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBeCloseTo(365 / 3, 1);
      expect(result.highFrequency).toBeCloseTo(365 / 3, 1);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse "3 times per day" correctly', () => {
      const result = parseFrequency('3 times per day');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(3 * 365);
      expect(result.highFrequency).toBe(3 * 365);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse simple numeric pattern correctly', () => {
      const result = parseFrequency('4x');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(4);
      expect(result.highFrequency).toBe(4);
      expect(result.isOneTime).toBe(false);
    });

    test('should parse one-time frequency correctly', () => {
      const result = parseFrequency('one-time');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(0);
      expect(result.highFrequency).toBe(0);
      expect(result.isOneTime).toBe(true);
    });

    test('should parse "once" as one-time correctly', () => {
      const result = parseFrequency('once');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(0);
      expect(result.highFrequency).toBe(0);
      expect(result.isOneTime).toBe(true);
    });

    test('should handle empty frequency with default values', () => {
      const result = parseFrequency('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle unrecognized frequency with default values', () => {
      const result = parseFrequency('some random text');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(1);
      expect(result.highFrequency).toBe(1);
      expect(result.isOneTime).toBe(false);
    });

    test('should handle case insensitivity', () => {
      const result = parseFrequency('TWICE A MONTH');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBe(24);
      expect(result.highFrequency).toBe(24);
      expect(result.isOneTime).toBe(false);
    });

    test('should handle variations in spacing', () => {
      const result = parseFrequency('3  times   per    week');
      expect(result.valid).toBe(true);
      expect(result.lowFrequency).toBeCloseTo(156.43, 1);
      expect(result.highFrequency).toBeCloseTo(156.43, 1);
      expect(result.isOneTime).toBe(false);
    });
  });

  describe('parseDuration', () => {
    test('should extract duration range from frequency string', () => {
      const result = parseDuration('3 times per week for 5-10 years');
      expect(result.valid).toBe(true);
      expect(result.lowDuration).toBe(5);
      expect(result.highDuration).toBe(10);
      expect(result.source).toBe('frequency');
    });

    test('should extract single year duration from frequency string', () => {
      const result = parseDuration('3 times per week for 5 years');
      expect(result.valid).toBe(true);
      expect(result.lowDuration).toBe(5);
      expect(result.highDuration).toBe(5);
      expect(result.source).toBe('frequency');
    });

    test('should use age range when available', () => {
      const result = parseDuration('3 times per week', undefined, undefined, 45, 75);
      expect(result.valid).toBe(true);
      expect(result.lowDuration).toBe(30); // 75 - 45
      expect(result.highDuration).toBe(30);
      expect(result.source).toBe('age-range');
    });

    test('should use current age and life expectancy when available', () => {
      const result = parseDuration('3 times per week', 45, 35);
      expect(result.valid).toBe(true);
      expect(result.lowDuration).toBe(17); // Math.floor(35 / 2)
      expect(result.highDuration).toBe(35);
      expect(result.source).toBe('default');
    });

    test('should use default values when no duration information is available', () => {
      const result = parseDuration('3 times per week');
      expect(result.valid).toBe(true);
      expect(result.lowDuration).toBe(1);
      expect(result.highDuration).toBe(30);
      expect(result.source).toBe('default');
    });

    test('should prioritize frequency duration over age range', () => {
      const result = parseDuration('3 times per week for 5-10 years', undefined, undefined, 45, 75);
      expect(result.valid).toBe(true);
      expect(result.lowDuration).toBe(5);
      expect(result.highDuration).toBe(10);
      expect(result.source).toBe('frequency');
    });
  });

  describe('isOneTimeFrequency', () => {
    test('should identify "one-time" as one-time frequency', () => {
      expect(isOneTimeFrequency('one-time')).toBe(true);
    });

    test('should identify "one time" as one-time frequency', () => {
      expect(isOneTimeFrequency('one time')).toBe(true);
    });

    test('should identify "onetime" as one-time frequency', () => {
      expect(isOneTimeFrequency('onetime')).toBe(true);
    });

    test('should identify "once" as one-time frequency', () => {
      expect(isOneTimeFrequency('once')).toBe(true);
    });

    test('should not identify "once a year" as one-time frequency', () => {
      expect(isOneTimeFrequency('once a year')).toBe(false);
    });

    test('should not identify "once per month" as one-time frequency', () => {
      expect(isOneTimeFrequency('once per month')).toBe(false);
    });

    test('should not identify other frequencies as one-time', () => {
      expect(isOneTimeFrequency('3 times per week')).toBe(false);
      expect(isOneTimeFrequency('monthly')).toBe(false);
      expect(isOneTimeFrequency('annual')).toBe(false);
      expect(isOneTimeFrequency('daily')).toBe(false);
    });

    test('should handle empty string', () => {
      expect(isOneTimeFrequency('')).toBe(false);
    });

    test('should handle undefined', () => {
      expect(isOneTimeFrequency(undefined as any)).toBe(false);
    });
  });
});
