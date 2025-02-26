
import { renderHook, act } from '@testing-library/react-hooks';
import { useGafLookup } from './useGafLookup';
import { supabase } from "@/integrations/supabase/client";
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          not: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useGafLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should lookup geographic factors by ZIP code', async () => {
    const mockGafData = {
      mfr_code: 1.2,
      pfr_code: 1.1,
      city: 'Test City',
      state_name: 'Test State'
    };

    // Setup mock response
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockGafData }),
      }),
    });

    (supabase.from as any).mockImplementation(() => ({
      select: mockSelect,
    }));

    const { result } = renderHook(() => useGafLookup());

    await act(async () => {
      await result.current.lookupGeoFactors('12345');
    });

    expect(result.current.geoFactors).toEqual({
      mfr_code: 1.2,
      pfr_code: 1.1,
      city: 'Test City',
      state_name: 'Test State'
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle ZIP code not found', async () => {
    // Setup mock response for no data found
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }),
    });

    (supabase.from as any).mockImplementation(() => ({
      select: mockSelect,
    }));

    const { result } = renderHook(() => useGafLookup());

    await act(async () => {
      await result.current.lookupGeoFactors('00000');
    });

    expect(result.current.geoFactors).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should lookup cities by state', async () => {
    const mockCities = [
      { city: 'City 1' },
      { city: 'City 2' },
      { city: 'City 3' }
    ];

    // Setup mock response
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: mockCities }),
      }),
    });

    (supabase.from as any).mockImplementation(() => ({
      select: mockSelect,
    }));

    const { result } = renderHook(() => useGafLookup());

    await act(async () => {
      await result.current.lookupCitiesByState('Test State');
    });

    expect(result.current.cities).toEqual(['City 1', 'City 2', 'City 3']);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors during lookup', async () => {
    // Setup mock response to throw error
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    (supabase.from as any).mockImplementation(() => ({
      select: mockSelect,
    }));

    const { result } = renderHook(() => useGafLookup());

    await act(async () => {
      await result.current.lookupGeoFactors('12345');
    });

    expect(result.current.geoFactors).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
