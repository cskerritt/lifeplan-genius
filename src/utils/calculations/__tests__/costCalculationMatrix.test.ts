import { CostCalculationParams, CalculatedCosts } from '../types';
import { CareCategory, AgeIncrement } from '@/types/lifecare';
import costCalculator from '../costCalculator';
import frequencyParser from '../frequencyParser';
import * as geoFactorsService from '../services/geoFactorsService';
import * as cptCodeService from '../services/cptCodeService';

// Mock external services
jest.mock('../services/geoFactorsService');
jest.mock('../services/cptCodeService');

/**
 * Test utility to generate expected results based on input parameters
 */
const generateExpectedResults = (params: CostCalculationParams & { ageIncrements?: AgeIncrement[] }): CalculatedCosts => {
  // This is a simplified version for testing purposes
  // In a real implementation, you would calculate the expected values based on the same logic
  // that the actual implementation uses, but independently implemented to verify correctness
  
  const { baseRate, frequency } = params;
  const parsedFrequency = frequencyParser.parseFrequency(frequency);
  const isOneTime = parsedFrequency.isOneTime;
  
  if (isOneTime) {
    return {
      annual: 0,
      lifetime: baseRate,
      low: baseRate * 0.9,
      high: baseRate * 1.1,
      average: baseRate,
      isOneTime: true
    };
  } else {
    const freqPerYear = (parsedFrequency.lowFrequency + parsedFrequency.highFrequency) / 2;
    const annualCost = baseRate * freqPerYear;
    const lifetime = annualCost * 10; // Assuming 10 years for simplicity in tests
    
    return {
      annual: annualCost,
      lifetime: lifetime,
      low: lifetime * 0.9,
      high: lifetime * 1.1,
      average: lifetime,
      isOneTime: false
    };
  }
};

/**
 * Setup mocks for external services
 */
const setupMocks = () => {
  // Mock geo factors service
  (geoFactorsService.fetchGeoFactors as jest.Mock).mockImplementation((zipCode: string) => {
    if (zipCode === '00000') {
      return Promise.resolve(null); // Invalid ZIP
    }
    return Promise.resolve({
      mfr_factor: 1.2,
      pfr_factor: 1.3
    });
  });
  
  // Mock CPT code service
  (cptCodeService.lookupCPTCode as jest.Mock).mockImplementation((cptCode: string) => {
    if (!cptCode || cptCode === 'invalid') {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      code: cptCode,
      code_description: 'Test CPT Code',
      mfu_50th: 100,
      mfu_75th: 150,
      mfu_90th: 200,
      pfr_50th: 120,
      pfr_75th: 170,
      pfr_90th: 220
    });
  });
  
  (cptCodeService.hasMfuData as jest.Mock).mockImplementation((cptCode: string) => {
    return cptCode !== 'no-mfu';
  });
  
  (cptCodeService.hasPfrData as jest.Mock).mockImplementation((cptCode: string) => {
    return cptCode !== 'no-pfr';
  });
};

describe('Cost Calculation Matrix Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });
  
  // Define test parameters
  const categories: CareCategory[] = [
    'physicianEvaluation', 'physicianFollowUp', 'therapyEvaluation', 
    'therapyFollowUp', 'medication', 'surgical', 'dme', 'supplies', 
    'homeCare', 'homeModification', 'transportation', 'interventional', 
    'diagnostics'
  ];
  
  const frequencies = [
    'one-time', 'once', 'annual', 'yearly', 'once a year',
    'semi-annual', 'twice a year', 'quarterly', 'monthly', 
    '2 times per month', 'twice a month', 'biweekly', 'every other week',
    'weekly', '2 times per week', 'twice a week', 'daily', 'every day',
    '3 times per day', '3-5 times per year', '4-4x per year 30 years'
  ];
  
  const durationScenarios = [
    { type: 'from-frequency', value: 'for 5-10 years' },
    { type: 'from-age-range', startAge: 45, endAge: 75 },
    { type: 'default', currentAge: 45, lifeExpectancy: 35 }
  ];
  
  const geoScenarios = [
    { type: 'with-zip', zipCode: '90210' },
    { type: 'without-zip' },
    { type: 'invalid-zip', zipCode: '00000' }
  ];
  
  const cptScenarios = [
    { type: 'with-cpt', cptCode: '99213' },
    { type: 'without-cpt', cptCode: null },
    { type: 'invalid-cpt', cptCode: 'invalid' },
    { type: 'no-mfu-data', cptCode: 'no-mfu' },
    { type: 'no-pfr-data', cptCode: 'no-pfr' }
  ];
  
  const ageIncrementScenarios = [
    { type: 'no-increments' },
    { type: 'with-increments', increments: [
      { startAge: 45, endAge: 55, frequency: 'monthly', isOneTime: false },
      { startAge: 55, endAge: 65, frequency: 'quarterly', isOneTime: false },
      { startAge: 65, endAge: 75, frequency: 'one-time', isOneTime: true }
    ]}
  ];
  
  // Test a subset of combinations to keep test runtime reasonable
  // In a real implementation, you might want to test more combinations
  // or use a more sophisticated approach to select representative combinations
  
  // Test one-time frequencies with different categories
  categories.forEach(category => {
    it(`should calculate one-time costs correctly for ${category}`, async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: 'one-time',
        category,
        zipCode: '90210'
      };
      
      const result = await costCalculator.calculateItemCosts(params);
      
      // Basic validation
      expect(result.isOneTime).toBe(true);
      expect(result.annual).toBe(0); // One-time items don't have annual costs
      expect(result.lifetime).toBeGreaterThan(0);
      expect(result.low).toBeLessThan(result.average);
      expect(result.high).toBeGreaterThan(result.average);
    });
  });
  
  // Test recurring frequencies with different categories
  categories.forEach(category => {
    it(`should calculate recurring costs correctly for ${category}`, async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: 'monthly',
        category,
        zipCode: '90210',
        currentAge: 45,
        lifeExpectancy: 85
      };
      
      const result = await costCalculator.calculateItemCosts(params);
      
      // Basic validation
      expect(result.isOneTime).toBe(false);
      expect(result.annual).toBeGreaterThan(0);
      expect(result.lifetime).toBeGreaterThan(result.annual);
      expect(result.low).toBeLessThan(result.average);
      expect(result.high).toBeGreaterThan(result.average);
    });
  });
  
  // Test different frequency patterns
  frequencies.forEach(frequency => {
    it(`should handle frequency pattern "${frequency}" correctly`, async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency,
        category: 'physicianFollowUp',
        zipCode: '90210',
        currentAge: 45,
        lifeExpectancy: 85
      };
      
      const result = await costCalculator.calculateItemCosts(params);
      
      // Check if one-time is correctly identified
      const parsedFrequency = frequencyParser.parseFrequency(frequency);
      expect(result.isOneTime).toBe(parsedFrequency.isOneTime);
      
      // Basic validation
      if (parsedFrequency.isOneTime) {
        expect(result.annual).toBe(0);
      } else {
        expect(result.annual).toBeGreaterThan(0);
      }
      expect(result.lifetime).toBeGreaterThan(0);
    });
  });
  
  // Test different duration scenarios
  durationScenarios.forEach(scenario => {
    it(`should handle duration scenario "${scenario.type}" correctly`, async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: scenario.type === 'from-frequency' 
          ? `monthly ${scenario.value}` 
          : 'monthly',
        category: 'physicianFollowUp',
        zipCode: '90210'
      };
      
      if (scenario.type === 'from-age-range') {
        params.startAge = scenario.startAge;
        params.endAge = scenario.endAge;
      } else if (scenario.type === 'default') {
        params.currentAge = scenario.currentAge;
        params.lifeExpectancy = scenario.lifeExpectancy;
      }
      
      const result = await costCalculator.calculateItemCosts(params);
      
      // Basic validation
      expect(result.isOneTime).toBe(false);
      expect(result.annual).toBeGreaterThan(0);
      expect(result.lifetime).toBeGreaterThan(result.annual);
    });
  });
  
  // Test different geographic adjustment scenarios
  geoScenarios.forEach(scenario => {
    it(`should handle geographic adjustment scenario "${scenario.type}" correctly`, async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: 'monthly',
        category: 'physicianFollowUp',
        zipCode: scenario.zipCode
      };
      
      const result = await costCalculator.calculateItemCosts(params);
      
      // Basic validation
      expect(result.isOneTime).toBe(false);
      expect(result.annual).toBeGreaterThan(0);
      expect(result.lifetime).toBeGreaterThan(result.annual);
    });
  });
  
  // Test different CPT code scenarios
  cptScenarios.forEach(scenario => {
    it(`should handle CPT code scenario "${scenario.type}" correctly`, async () => {
      const params: CostCalculationParams = {
        baseRate: 100,
        frequency: 'monthly',
        category: 'physicianFollowUp',
        zipCode: '90210',
        cptCode: scenario.cptCode
      };
      
      const result = await costCalculator.calculateItemCosts(params);
      
      // Basic validation
      expect(result.isOneTime).toBe(false);
      expect(result.annual).toBeGreaterThan(0);
      expect(result.lifetime).toBeGreaterThan(result.annual);
    });
  });
  
  // Test age increment scenarios
  ageIncrementScenarios.forEach(scenario => {
    it(`should handle age increment scenario "${scenario.type}" correctly`, async () => {
      if (scenario.type === 'with-increments') {
        // For scenarios with age increments, use the specific function
        const params: CostCalculationParams & { ageIncrements: AgeIncrement[] } = {
          baseRate: 100,
          frequency: 'monthly',
          category: 'physicianFollowUp',
          zipCode: '90210',
          ageIncrements: scenario.increments
        };
        
        const result = await costCalculator.calculateItemCostsWithAgeIncrements(params);
        
        // Basic validation
        expect(result.annual).toBeGreaterThan(0);
        expect(result.lifetime).toBeGreaterThan(0);
      } else {
        // For scenarios without age increments, use the standard function
        const params: CostCalculationParams = {
          baseRate: 100,
          frequency: 'monthly',
          category: 'physicianFollowUp',
          zipCode: '90210'
        };
        
        const result = await costCalculator.calculateItemCosts(params);
        
        // Basic validation
        expect(result.annual).toBeGreaterThan(0);
        expect(result.lifetime).toBeGreaterThan(0);
      }
    });
  });
  
  // Test edge cases
  
  it('should handle zero base rate correctly', async () => {
    const params: CostCalculationParams = {
      baseRate: 0,
      frequency: 'monthly',
      category: 'physicianFollowUp'
    };
    
    const result = await costCalculator.calculateItemCosts(params);
    
    expect(result.annual).toBe(0);
    expect(result.lifetime).toBe(0);
    expect(result.low).toBe(0);
    expect(result.high).toBe(0);
    expect(result.average).toBe(0);
  });
  
  it('should handle invalid frequency correctly', async () => {
    const params: CostCalculationParams = {
      baseRate: 100,
      frequency: 'invalid-frequency',
      category: 'physicianFollowUp'
    };
    
    const result = await costCalculator.calculateItemCosts(params);
    
    // Should use default values
    expect(result.isOneTime).toBe(false);
    expect(result.annual).toBeGreaterThan(0);
    expect(result.lifetime).toBeGreaterThan(0);
  });
  
  it('should handle age increments with gaps correctly', async () => {
    const params = {
      baseRate: 100,
      frequency: 'monthly',
      category: 'physicianFollowUp' as CareCategory,
      zipCode: '90210',
      ageIncrements: [
        { startAge: 45, endAge: 55, frequency: 'monthly', isOneTime: false },
        // Gap between 55 and 65
        { startAge: 65, endAge: 75, frequency: 'quarterly', isOneTime: false }
      ] as AgeIncrement[]
    };
    
    const result = await costCalculator.calculateItemCostsWithAgeIncrements(params);
    
    // Basic validation
    expect(result.annual).toBeGreaterThan(0);
    expect(result.lifetime).toBeGreaterThan(0);
  });
  
  it('should handle age increments with overlaps correctly', async () => {
    const params = {
      baseRate: 100,
      frequency: 'monthly',
      category: 'physicianFollowUp' as CareCategory,
      zipCode: '90210',
      ageIncrements: [
        { startAge: 45, endAge: 60, frequency: 'monthly', isOneTime: false },
        // Overlap between 55 and 60
        { startAge: 55, endAge: 75, frequency: 'quarterly', isOneTime: false }
      ] as AgeIncrement[]
    };
    
    const result = await costCalculator.calculateItemCostsWithAgeIncrements(params);
    
    // Basic validation
    expect(result.annual).toBeGreaterThan(0);
    expect(result.lifetime).toBeGreaterThan(0);
  });
  
  it('should handle negative durations correctly', async () => {
    const params: CostCalculationParams = {
      baseRate: 100,
      frequency: 'monthly',
      category: 'physicianFollowUp',
      startAge: 75, // End age is less than start age
      endAge: 45
    };
    
    const result = await costCalculator.calculateItemCosts(params);
    
    // Should handle this gracefully
    expect(result.annual).toBeGreaterThan(0);
    expect(result.lifetime).toBeGreaterThan(0);
  });
});
