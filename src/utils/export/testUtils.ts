import { ExportData } from './types';

// Create mock data for testing
export const mockExportData: ExportData = {
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
  zipCode: '12345'
}; 