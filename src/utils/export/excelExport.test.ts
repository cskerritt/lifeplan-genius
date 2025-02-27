import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToExcel } from './excelExport';
import * as XLSX from 'xlsx';
import { ExportData } from './types';

// Mock the XLSX library
vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}));

// Create mock data for testing
const createMockExportData = (overrides: Partial<ExportData> = {}): ExportData => ({
  planId: 'test-plan-id',
  evalueeName: 'John Doe',
  items: [
    {
      id: 'item1',
      category: 'physicianEvaluation',
      service: 'Initial Evaluation',
      frequency: 'Annual',
      cptCode: '99204',
      costPerUnit: 250,
      annualCost: 250,
      costRange: { low: 200, average: 250, high: 300 },
      isOneTime: false
    },
    {
      id: 'item2',
      category: 'medication',
      service: 'Pain Medication',
      frequency: 'Monthly',
      cptCode: '12345',
      costPerUnit: 50,
      annualCost: 600,
      costRange: { low: 500, average: 600, high: 700 },
      isOneTime: false
    },
    {
      id: 'item3',
      category: 'surgical',
      service: 'Surgery',
      frequency: 'One-time',
      cptCode: '67890',
      costPerUnit: 5000,
      annualCost: 0,
      costRange: { low: 4500, average: 5000, high: 5500 },
      isOneTime: true
    }
  ],
  categoryTotals: [
    {
      category: 'physicianEvaluation',
      total: 250,
      costRange: { low: 200, average: 250, high: 300 }
    },
    {
      category: 'medication',
      total: 600,
      costRange: { low: 500, average: 600, high: 700 }
    },
    {
      category: 'surgical',
      total: 0,
      costRange: { low: 4500, average: 5000, high: 5500 }
    }
  ],
  grandTotal: 850,
  lifetimeLow: 10000,
  lifetimeHigh: 15000,
  lifeExpectancy: '20',
  dateOfBirth: '1980-01-01',
  dateOfInjury: '2020-05-15',
  gender: 'Male',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  ...overrides
});

describe('Excel Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an Excel workbook with the correct structure', () => {
    const mockData = createMockExportData();
    
    exportToExcel(mockData);
    
    // Verify book_new was called to create a new workbook
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    
    // Verify aoa_to_sheet was called 3 times (for evaluee info, lifetime costs, and detailed items)
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledTimes(3);
    
    // Verify book_append_sheet was called 3 times
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3);
    
    // Verify writeFile was called with the correct filename
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      'John_Doe_LifeCarePlan.xlsx'
    );
  });

  it('should sanitize filenames with special characters', async () => {
    const specialData = {
      ...createMockExportData(),
      evalueeName: 'John/Doe: Special & Characters?',
    };
    
    await exportToExcel(specialData);
    
    // Verify writeFile was called with sanitized filename
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      'John_Doe__Special___Characters__LifeCarePlan.xlsx'
    );
  });

  it('should create evaluee information worksheet with correct data', async () => {
    const mockData = createMockExportData();
    
    await exportToExcel(mockData);
    
    // Verify aoa_to_sheet was called with evaluee information
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.arrayContaining(['LIFE CARE PLAN FOR:', 'JOHN DOE']),
        expect.arrayContaining(['EVALUEE INFORMATION']),
      ])
    );
    
    // Verify the worksheet was added to the workbook
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Evaluee Information'
    );
  });

  it('should create lifetime projected costs worksheet with correct data', () => {
    const mockData = createMockExportData();
    
    exportToExcel(mockData);
    
    // Verify aoa_to_sheet was called with lifetime projected costs
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([
        ['LIFETIME PROJECTED COSTS SUMMARY'],
        ['Projected Care:', 'Duration Required (Years):', 'Annual Cost:', 'Annual Cost x Duration Required:', 'Total One-Time Cost:'],
        // We can't easily check the exact rows due to the formatting function, but we can check the lifetime total
        ['', '', '', 'LIFETIME TOTAL:', '$10000.00 - $15000.00']
      ])
    );
  });

  it('should create detailed items worksheet with correct data', () => {
    const mockData = createMockExportData();
    
    exportToExcel(mockData);
    
    // Verify aoa_to_sheet was called with detailed items
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([
        ['DETAILED CARE ITEMS'],
        ['Category', 'Service', 'CPT/HCPCS Code', 'Frequency', 'Cost Per Unit', 'Annual Cost', 'Start Age', 'End Age', 'Notes']
      ])
    );
  });

  it('should handle missing evaluee information gracefully', () => {
    const mockData = createMockExportData({
      dateOfBirth: undefined,
      dateOfInjury: undefined,
      gender: undefined,
      address: undefined,
      city: undefined,
      state: undefined,
      zipCode: undefined,
      lifeExpectancy: undefined
    });
    
    exportToExcel(mockData);
    
    // Workbook should still be created without errors
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledTimes(3);
    expect(XLSX.writeFile).toHaveBeenCalled();
  });
}); 