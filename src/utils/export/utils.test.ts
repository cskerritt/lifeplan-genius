import { describe, it, expect } from 'vitest';
import { 
  groupItemsByCategory, 
  isOneTimeItem, 
  calculateCategoryTotal, 
  calculateOneTimeTotal,
  calculateCategoryOneTimeTotal
} from './utils';
import { CareItem, CareCategory } from '@/types/lifecare';

// Mock care items for testing
const createMockCareItem = (
  overrides: Partial<CareItem> = {}
): CareItem => ({
  id: 'test-id',
  category: 'physicianEvaluation' as CareCategory,
  service: 'Test Service',
  frequency: 'Annual',
  cptCode: '12345',
  costPerUnit: 100,
  annualCost: 1200,
  costRange: {
    low: 1000,
    average: 1200,
    high: 1400
  },
  isOneTime: false,
  ...overrides
});

describe('Export Utility Functions', () => {
  describe('groupItemsByCategory', () => {
    it('should group items by their category', () => {
      const items: CareItem[] = [
        createMockCareItem({ id: '1', category: 'physicianEvaluation' }),
        createMockCareItem({ id: '2', category: 'physicianEvaluation' }),
        createMockCareItem({ id: '3', category: 'therapyEvaluation' }),
        createMockCareItem({ id: '4', category: 'medication' })
      ];

      const result = groupItemsByCategory(items);
      
      expect(Object.keys(result)).toHaveLength(3);
      expect(result.physicianEvaluation).toHaveLength(2);
      expect(result.therapyEvaluation).toHaveLength(1);
      expect(result.medication).toHaveLength(1);
    });

    it('should return an empty object for empty input', () => {
      const result = groupItemsByCategory([]);
      expect(result).toEqual({});
    });
  });

  describe('isOneTimeItem', () => {
    it('should identify items with isOneTime flag', () => {
      const item = createMockCareItem({ isOneTime: true });
      expect(isOneTimeItem(item)).toBe(true);
    });

    it('should identify items with "one-time" in frequency', () => {
      const item = createMockCareItem({ frequency: 'One-time procedure' });
      expect(isOneTimeItem(item)).toBe(true);
    });

    it('should identify items with "one time" in frequency', () => {
      const item = createMockCareItem({ frequency: 'One time only' });
      expect(isOneTimeItem(item)).toBe(true);
    });

    it('should not identify recurring items as one-time', () => {
      const item = createMockCareItem({ frequency: 'Monthly' });
      expect(isOneTimeItem(item)).toBe(false);
    });
  });

  describe('calculateCategoryTotal', () => {
    it('should sum annual costs of recurring items', () => {
      const items: CareItem[] = [
        createMockCareItem({ id: '1', annualCost: 1000 }),
        createMockCareItem({ id: '2', annualCost: 2000 }),
        createMockCareItem({ id: '3', annualCost: 3000 })
      ];

      const result = calculateCategoryTotal(items);
      expect(result).toBe(6000);
    });

    it('should exclude one-time items from annual total', () => {
      const items: CareItem[] = [
        createMockCareItem({ id: '1', annualCost: 1000 }),
        createMockCareItem({ id: '2', annualCost: 2000, isOneTime: true }),
        createMockCareItem({ id: '3', annualCost: 3000 })
      ];

      const result = calculateCategoryTotal(items);
      expect(result).toBe(4000);
    });

    it('should return 0 for empty input', () => {
      const result = calculateCategoryTotal([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateOneTimeTotal', () => {
    it('should sum average costs of one-time items', () => {
      const items: CareItem[] = [
        createMockCareItem({ 
          id: '1', 
          isOneTime: true, 
          costRange: { low: 900, average: 1000, high: 1100 } 
        }),
        createMockCareItem({ 
          id: '2', 
          isOneTime: true, 
          costRange: { low: 1900, average: 2000, high: 2100 } 
        }),
        createMockCareItem({ 
          id: '3', 
          isOneTime: false, 
          costRange: { low: 2900, average: 3000, high: 3100 } 
        })
      ];

      const result = calculateOneTimeTotal(items);
      expect(result).toBe(3000); // 1000 + 2000
    });

    it('should return 0 for empty input', () => {
      const result = calculateOneTimeTotal([]);
      expect(result).toBe(0);
    });

    it('should return 0 when no one-time items exist', () => {
      const items: CareItem[] = [
        createMockCareItem({ id: '1', isOneTime: false }),
        createMockCareItem({ id: '2', isOneTime: false })
      ];

      const result = calculateOneTimeTotal(items);
      expect(result).toBe(0);
    });
  });

  describe('calculateCategoryOneTimeTotal', () => {
    it('should sum average costs of one-time items in a category', () => {
      const items: CareItem[] = [
        createMockCareItem({ 
          id: '1', 
          isOneTime: true, 
          costRange: { low: 900, average: 1000, high: 1100 } 
        }),
        createMockCareItem({ 
          id: '2', 
          isOneTime: true, 
          costRange: { low: 1900, average: 2000, high: 2100 } 
        }),
        createMockCareItem({ 
          id: '3', 
          isOneTime: false, 
          costRange: { low: 2900, average: 3000, high: 3100 } 
        })
      ];

      const result = calculateCategoryOneTimeTotal(items);
      expect(result).toBe(3000); // 1000 + 2000
    });

    it('should return 0 for empty input', () => {
      const result = calculateCategoryOneTimeTotal([]);
      expect(result).toBe(0);
    });
  });
}); 