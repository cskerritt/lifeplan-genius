import { calculateItemCosts, calculateAdjustedCosts } from '../costCalculator';
import * as frequencyParser from '../frequencyParser';
import { CostCalculationParams } from '../types';

// Mock the frequency parser to avoid dependencies
jest.mock('../frequencyParser', () => ({
  parseFrequency: jest.fn(),
  parseDuration: jest.fn(),
  isOneTimeFrequency: jest.fn(),
}));

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('Cost Calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateItemCosts', () => {
    test('should calculate costs for recurring items correctly', async () => {
      // Mock frequency parser
      (frequencyParser.parseFrequency as jest.Mock).mockReturnValue({
        lowFrequency: 12,
        highFrequency: 12,
        isOneTime: false,
        original: '1 time per month',
        valid: true,
      });

      (frequencyParser.parseDuration as jest.Mock).mockReturnValue({
        lowDuration: 10,
        highDuration: 10,
        source: 'frequency',
        valid: true,
      });

      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '1 time per month',
        currentAge: 45,
        lifeExpectancy: 35,
      };

      const result = await calculateItemCosts(params);

      expect(result.annual).toBeCloseTo(1200, 2); // 100 * 12
      expect(result.lifetime).toBeCloseTo(12000, 2); // 1200 * 10
      expect(result.low).toBeCloseTo(12000, 2);
      expect(result.high).toBeCloseTo(12000, 2);
      expect(result.average).toBeCloseTo(12000, 2);
      expect(result.isOneTime).toBe(false);
    });

    test('should calculate costs for one-time items correctly', async () => {
      // Mock frequency parser
      (frequencyParser.parseFrequency as jest.Mock).mockReturnValue({
        lowFrequency: 0,
        highFrequency: 0,
        isOneTime: true,
        original: 'one-time',
        valid: true,
      });

      const params: CostCalculationParams = {
        baseRate: 500,
        frequency: 'one-time',
      };

      const result = await calculateItemCosts(params);

      expect(result.annual).toBe(0); // One-time items have no annual cost
      expect(result.lifetime).toBe(500); // Base rate for one-time items
      expect(result.low).toBe(500);
      expect(result.high).toBe(500);
      expect(result.average).toBe(500);
      expect(result.isOneTime).toBe(true);
    });

    test('should handle frequency parsing errors', async () => {
      // Mock frequency parser to return an error
      (frequencyParser.parseFrequency as jest.Mock).mockReturnValue({
        lowFrequency: 1,
        highFrequency: 1,
        isOneTime: false,
        original: '',
        valid: false,
        error: 'Invalid frequency',
      });

      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '',
      };

      await expect(calculateItemCosts(params)).rejects.toThrow('Failed to parse frequency');
    });

    test('should handle duration parsing errors', async () => {
      // Mock frequency parser
      (frequencyParser.parseFrequency as jest.Mock).mockReturnValue({
        lowFrequency: 12,
        highFrequency: 12,
        isOneTime: false,
        original: '1 time per month',
        valid: true,
      });

      // Mock duration parser to return an error
      (frequencyParser.parseDuration as jest.Mock).mockReturnValue({
        lowDuration: 1,
        highDuration: 30,
        source: 'default',
        valid: false,
        error: 'Invalid duration',
      });

      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '1 time per month',
      };

      await expect(calculateItemCosts(params)).rejects.toThrow('Failed to parse duration');
    });

    test('should handle invalid parameters', async () => {
      const params: CostCalculationParams = {
        baseRate: -100, // Negative base rate is invalid
        frequency: '1 time per month',
      };

      await expect(calculateItemCosts(params)).rejects.toThrow('Invalid calculation parameters');
    });
  });

  describe('calculateAdjustedCosts', () => {
    test('should calculate adjusted costs based on base rate', async () => {
      const result = await calculateAdjustedCosts({
        baseRate: 100,
      });

      expect(result.low).toBe(100);
      expect(result.average).toBe(100);
      expect(result.high).toBe(100);
    });

    test('should calculate costs from multiple sources', async () => {
      const result = await calculateAdjustedCosts({
        baseRate: 100,
        costResources: [
          { cost: 80 },
          { cost: 100 },
          { cost: 120 },
        ],
      });

      expect(result.low).toBe(80);
      expect(result.average).toBe(100);
      expect(result.high).toBe(120);
    });

    test('should handle empty cost resources', async () => {
      const result = await calculateAdjustedCosts({
        baseRate: 100,
        costResources: [],
      });

      expect(result.low).toBe(0);
      expect(result.average).toBe(0);
      expect(result.high).toBe(0);
    });

    test('should handle errors gracefully', async () => {
      // Force an error by passing invalid data
      const result = await calculateAdjustedCosts({
        baseRate: NaN,
      });

      // Should return base rate as fallback
      expect(result.low).toBe(NaN);
      expect(result.average).toBe(NaN);
      expect(result.high).toBe(NaN);
    });
  });
});
