
import { renderHook } from '@testing-library/react-hooks';
import { useCostCalculations } from './useCostCalculations';
import { supabase } from "@/integrations/supabase/client";
import { CareCategory } from '@/types/lifecare';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('useCostCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGeoFactors', () => {
    it('should fetch geographic factors for a valid ZIP code', async () => {
      const mockData = [{
        mfr_code: 1.2,
        pfr_code: 1.1
      }];

      (supabase.rpc as any).mockResolvedValueOnce({ data: mockData, error: null });

      const { result } = renderHook(() => useCostCalculations());
      const factors = await result.current.fetchGeoFactors('12345');

      expect(factors).toEqual({
        mfr_factor: 1.2,
        pfr_factor: 1.1
      });
    });

    it('should handle invalid ZIP codes', async () => {
      (supabase.rpc as any).mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useCostCalculations());
      const factors = await result.current.fetchGeoFactors('00000');

      expect(factors).toBeNull();
    });
  });

  describe('calculateAdjustedCosts', () => {
    it('should calculate adjusted costs with geographic factors', async () => {
      const { result } = renderHook(() => useCostCalculations());
      const mockGeoFactors = {
        mfr_factor: 1.2,
        pfr_factor: 1.1
      };

      // Set the geoFactors
      await result.current.fetchGeoFactors('12345');
      
      const costs = await result.current.calculateAdjustedCosts(100, null, 'physicianEvaluation' as CareCategory);

      expect(costs).toMatchObject({
        low: expect.any(Number),
        average: expect.any(Number),
        high: expect.any(Number)
      });
    });

    it('should handle transportation category differently', async () => {
      const { result } = renderHook(() => useCostCalculations());
      const costs = await result.current.calculateAdjustedCosts(
        1000,
        null,
        'transportation' as CareCategory,
        [{ name: 'Vendor 1', cost: 1000 }]
      );

      expect(costs).toEqual({
        low: 1000,
        average: 1000,
        high: 1000
      });
    });
  });

  describe('lookupCPTCode', () => {
    it('should fetch CPT code data', async () => {
      const mockCptData = [{
        pfr_50th: 100,
        pfr_75th: 150,
        pfr_90th: 200
      }];

      (supabase.rpc as any).mockResolvedValueOnce({ data: mockCptData, error: null });

      const { result } = renderHook(() => useCostCalculations());
      const cptData = await result.current.lookupCPTCode('99213');

      expect(cptData).toEqual(mockCptData);
    });

    it('should handle invalid CPT codes', async () => {
      (supabase.rpc as any).mockResolvedValueOnce({ data: null, error: new Error('Invalid CPT code') });

      const { result } = renderHook(() => useCostCalculations());
      const cptData = await result.current.lookupCPTCode('invalid');

      expect(cptData).toBeNull();
    });
  });
});
