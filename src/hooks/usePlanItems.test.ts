
import { renderHook } from '@testing-library/react-hooks';
import { usePlanItems } from './usePlanItems';
import { CareCategory, CareItem } from '@/types/lifecare';
import { vi, describe, it, expect } from 'vitest';

vi.mock('./useCostCalculations', () => ({
  useCostCalculations: () => ({
    calculateAdjustedCosts: vi.fn().mockResolvedValue({
      low: 100,
      average: 150,
      high: 200
    }),
    lookupCPTCode: vi.fn()
  })
}));

vi.mock('./usePlanItemCosts', () => ({
  usePlanItemCosts: () => ({
    calculateItemCosts: vi.fn().mockReturnValue({
      annual: 1000,
      lifetime: 10000,
      low: 900,
      high: 1100,
      average: 1000
    })
  })
}));

vi.mock('./usePlanItemsDb', () => ({
  usePlanItemsDb: () => ({
    insertPlanItem: vi.fn(),
    deletePlanItem: vi.fn()
  })
}));

describe('usePlanItems', () => {
  const mockItems: CareItem[] = [
    {
      id: '1',
      category: 'physicianEvaluation',
      service: 'Office Visit',
      frequency: '4x per year',
      cptCode: '99213',
      costPerUnit: 150,
      annualCost: 600,
      costRange: {
        low: 500,
        average: 600,
        high: 700
      }
    }
  ];

  it('should calculate totals correctly', () => {
    const { result } = renderHook(() => usePlanItems('test-plan', mockItems, vi.fn()));
    
    const { categoryTotals, grandTotal } = result.current.calculateTotals();

    expect(categoryTotals).toHaveLength(1);
    expect(categoryTotals[0].category).toBe('physicianEvaluation');
    expect(grandTotal).toBe(600);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() => usePlanItems('test-plan', [], vi.fn()));
    
    const { categoryTotals, grandTotal } = result.current.calculateTotals();

    expect(categoryTotals).toHaveLength(0);
    expect(grandTotal).toBe(0);
  });
});
