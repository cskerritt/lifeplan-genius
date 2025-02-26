
import { renderHook } from '@testing-library/react-hooks';
import { useEvalueeFormSubmit } from './useEvalueeFormSubmit';
import { supabase } from "@/integrations/supabase/client";
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useEvalueeFormSubmit', () => {
  const mockNavigate = vi.fn();
  const mockFormData = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    dateOfInjury: '2020-01-01',
    gender: 'male',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    lifeExpectancy: '40'
  };

  const mockAgeData = {
    ageToday: 33,
    ageAtInjury: 30,
    projectedAgeAtDeath: 73
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockImplementation(() => mockNavigate);
    (supabase.auth.getUser as any).mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });

  it('should handle new plan creation successfully', async () => {
    const mockResponse = {
      data: {
        id: 'new-plan-id',
        first_name: 'John',
        last_name: 'Doe'
      },
      error: null
    };

    (supabase.from as any).mockImplementation(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue(mockResponse)
        }))
      }))
    }));

    const { result } = renderHook(() => useEvalueeFormSubmit());
    const mockEvent = { preventDefault: vi.fn() };

    await result.current.handleSubmit(
      mockEvent as any,
      mockFormData,
      mockAgeData
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should handle plan updates successfully', async () => {
    const mockResponse = {
      data: {
        id: 'existing-plan-id',
        first_name: 'John',
        last_name: 'Doe'
      },
      error: null
    };

    (supabase.from as any).mockImplementation(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue(mockResponse)
          }))
        }))
      }))
    }));

    const { result } = renderHook(() => useEvalueeFormSubmit());
    const mockEvent = { preventDefault: vi.fn() };

    await result.current.handleSubmit(
      mockEvent as any,
      mockFormData,
      mockAgeData,
      'existing-plan-id'
    );

    expect(mockNavigate).not.toHaveBeenCalled(); // Should not navigate on update
  });

  it('should handle authentication errors', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ 
      data: { user: null },
      error: new Error('Not authenticated')
    });

    const { result } = renderHook(() => useEvalueeFormSubmit());
    const mockEvent = { preventDefault: vi.fn() };

    await result.current.handleSubmit(
      mockEvent as any,
      mockFormData,
      mockAgeData
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
