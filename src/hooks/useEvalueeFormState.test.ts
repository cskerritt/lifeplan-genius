
import { renderHook, act } from '@testing-library/react-hooks';
import { useEvalueeFormState } from './useEvalueeFormState';
import { vi, describe, it, expect } from 'vitest';

describe('useEvalueeFormState', () => {
  const mockInitialData = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    dateOfInjury: '2020-01-01',
    gender: 'male',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    lifeExpectancy: '40',
    address: '',
    phone: '',
    email: ''
  };

  it('should initialize with default empty values', () => {
    const { result } = renderHook(() => useEvalueeFormState());

    expect(result.current.formData).toEqual({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      dateOfInjury: "",
      gender: "",
      city: "",
      state: "",
      zipCode: "",
      lifeExpectancy: "",
    });
  });

  it('should initialize with provided initial data', () => {
    const { result } = renderHook(() => useEvalueeFormState(mockInitialData));

    expect(result.current.formData).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      dateOfInjury: '2020-01-01',
      gender: 'male',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      lifeExpectancy: '40',
    });
  });

  it('should update form data correctly', () => {
    const { result } = renderHook(() => useEvalueeFormState());

    act(() => {
      result.current.updateFormData({
        firstName: 'Jane',
        lastName: 'Smith'
      });
    });

    expect(result.current.formData.firstName).toBe('Jane');
    expect(result.current.formData.lastName).toBe('Smith');
  });

  it('should preserve other fields when updating partially', () => {
    const { result } = renderHook(() => useEvalueeFormState(mockInitialData));

    act(() => {
      result.current.updateFormData({
        firstName: 'Jane'
      });
    });

    expect(result.current.formData.firstName).toBe('Jane');
    expect(result.current.formData.lastName).toBe('Doe');
    expect(result.current.formData.dateOfBirth).toBe('1990-01-01');
  });
});
