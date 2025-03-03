import { calculateItemCosts, calculateItemCostsWithAgeIncrements } from '../services/itemCostService';
import adjustedCostService from '../services/adjustedCostService';
import geoFactorsService from '../services/geoFactorsService';
import { CostCalculationParams } from '../types';
import { AgeIncrement } from '@/types/lifecare';

// Mock dependencies
jest.mock('../services/adjustedCostService');
jest.mock('../services/geoFactorsService');
jest.mock('../logger', () => ({
  createContext: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('itemCostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (adjustedCostService.calculateAdjustedCosts as jest.Mock).mockResolvedValue({
      costRange: { low: 100, average: 150, high: 200 },
      mfrCosts: { low: 90, average: 140, high: 190 },
      pfrCosts: { low: 110, average: 160, high: 210 },
    });
    
    (geoFactorsService.fetchGeoFactors as jest.Mock).mockResolvedValue({
      mfr_factor: 1.1,
      pfr_factor: 1.3,
    });
    
    (geoFactorsService.DEFAULT_GEO_FACTORS as any) = {
      mfr_factor: 1.0,
      pfr_factor: 1.0,
    };
  });
  
  describe('calculateItemCosts', () => {
    it('should correctly apply average of MFU and PFR factors for recurring items', async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: '1x per year',
        currentAge: 30,
        lifeExpectancy: 80,
        zipCode: '12345',
      };
      
      const result = await calculateItemCosts(params);
      
      // The average factor should be (1.1 + 1.3) / 2 = 1.2
      // The average cost should be (140 + 160) / 2 = 150
      // The adjusted average cost should be 150 * 1.2 = 180
      // For 1x per year over 50 years, lifetime cost should be 180 * 50 = 9000
      expect(result.annual).toBeCloseTo(180, 0);
      expect(result.lifetime).toBeCloseTo(9000, 0);
      expect(result.isOneTime).toBe(false);
    });
    
    it('should correctly handle one-time items', async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: 'one time',
        zipCode: '12345',
      };
      
      const result = await calculateItemCosts(params);
      
      // For one-time items, annual cost should be 0
      expect(result.annual).toBe(0);
      // The average factor should be (1.1 + 1.3) / 2 = 1.2
      // The average cost should be (140 + 160) / 2 = 150
      // The adjusted average cost should be 150 * 1.2 = 180
      expect(result.lifetime).toBeCloseTo(180, 0);
      expect(result.isOneTime).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const params: CostCalculationParams = {
        baseRate: -100, // Invalid base rate
        frequency: '1x per year',
      };
      
      // This should not throw but return a default object
      const result = await calculateItemCosts(params);
      
      expect(result).toEqual({
        annual: 0,
        lifetime: 0,
        low: 0,
        high: 0,
        average: 0,
        isOneTime: false
      });
    });
  });
  
  describe('calculateItemCostsWithAgeIncrements', () => {
    it('should correctly calculate costs with age increments', async () => {
      const params: CostCalculationParams & { ageIncrements: AgeIncrement[] } = {
        baseRate: 100,
        frequency: '1x per year', // Add frequency even though it will be overridden by age increments
        zipCode: '12345',
        ageIncrements: [
          { startAge: 30, endAge: 40, frequency: '1x per year', isOneTime: false } as AgeIncrement,
          { startAge: 40, endAge: 50, frequency: '2x per year', isOneTime: false } as AgeIncrement,
        ],
      };
      
      const result = await calculateItemCostsWithAgeIncrements(params);
      
      // The average factor should be (1.1 + 1.3) / 2 = 1.2
      // The average cost should be (140 + 160) / 2 = 150
      // The adjusted average cost should be 150 * 1.2 = 180
      // For first increment: 180 * 1 * 10 = 1800
      // For second increment: 180 * 2 * 10 = 3600
      // Total lifetime cost should be 1800 + 3600 = 5400
      expect(result.lifetime).toBeCloseTo(5400, 0);
      expect(result.isOneTime).toBe(false);
    });
    
    it('should fall back to standard calculation if no age increments', async () => {
      const params: CostCalculationParams & { ageIncrements: AgeIncrement[] } = {
        baseRate: 100,
        frequency: '1x per year', // Required by CostCalculationParams
        zipCode: '12345',
        ageIncrements: [],
      };
      
      const result = await calculateItemCostsWithAgeIncrements(params);
      
      // Should behave like a standard 1x per year calculation
      expect(result.isOneTime).toBe(false);
    });
  });
});
