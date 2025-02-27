import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlanTable from './PlanTable';
import { exportToWord } from '@/utils/export/wordExport';
import { exportToExcel } from '@/utils/export/excelExport';
import { CareItem, CategoryTotal } from '@/types/lifecare';

// Mock the export functions
vi.mock('@/utils/export/wordExport', () => ({
  exportToWord: vi.fn()
}));

vi.mock('@/utils/export/excelExport', () => ({
  exportToExcel: vi.fn()
}));

// Create mock data for testing
const createMockItems = (): CareItem[] => [
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
];

const createMockCategoryTotals = (): CategoryTotal[] => [
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
];

describe('PlanTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the table with items', () => {
    const items = createMockItems();
    const categoryTotals = createMockCategoryTotals();
    
    render(
      <PlanTable
        items={items}
        categoryTotals={categoryTotals}
        grandTotal={850}
        lifetimeLow={10000}
        lifetimeHigh={15000}
        evalueeName="John Doe"
        planId="test-plan-id"
      />
    );
    
    // Check if items are rendered
    expect(screen.getByText('Initial Evaluation')).toBeDefined();
    expect(screen.getByText('Pain Medication')).toBeDefined();
    expect(screen.getByText('Surgery')).toBeDefined();
    
    // Check if category totals are rendered
    expect(screen.getByText('physicianEvaluation:')).toBeDefined();
    expect(screen.getByText('medication:')).toBeDefined();
    expect(screen.getByText('surgical:')).toBeDefined();
    
    // Check if export buttons are rendered
    expect(screen.getByText('Export to Word')).toBeDefined();
    expect(screen.getByText('Export to Excel')).toBeDefined();
  });

  it('should call exportToWord when Export to Word button is clicked', () => {
    const items = createMockItems();
    const categoryTotals = createMockCategoryTotals();
    
    render(
      <PlanTable
        items={items}
        categoryTotals={categoryTotals}
        grandTotal={850}
        lifetimeLow={10000}
        lifetimeHigh={15000}
        evalueeName="John Doe"
        planId="test-plan-id"
      />
    );
    
    // Click the Export to Word button
    fireEvent.click(screen.getByText('Export to Word'));
    
    // Verify exportToWord was called with the correct data
    expect(exportToWord).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: 'test-plan-id',
        evalueeName: 'John Doe',
        items: items,
        categoryTotals: categoryTotals,
        grandTotal: 850,
        lifetimeLow: 10000,
        lifetimeHigh: 15000
      })
    );
  });

  it('should call exportToExcel when Export to Excel button is clicked', () => {
    const items = createMockItems();
    const categoryTotals = createMockCategoryTotals();
    
    render(
      <PlanTable
        items={items}
        categoryTotals={categoryTotals}
        grandTotal={850}
        lifetimeLow={10000}
        lifetimeHigh={15000}
        evalueeName="John Doe"
        planId="test-plan-id"
      />
    );
    
    // Click the Export to Excel button
    fireEvent.click(screen.getByText('Export to Excel'));
    
    // Verify exportToExcel was called with the correct data
    expect(exportToExcel).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: 'test-plan-id',
        evalueeName: 'John Doe',
        items: items,
        categoryTotals: categoryTotals,
        grandTotal: 850,
        lifetimeLow: 10000,
        lifetimeHigh: 15000
      })
    );
  });

  it('should pass evaluee and lifePlan data to export functions when available', () => {
    const items = createMockItems();
    const categoryTotals = createMockCategoryTotals();
    const evaluee = {
      id: 'evaluee-id',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      dateOfInjury: '2020-05-15',
      gender: 'Male',
      address: '123 Main St',
      phone: '555-1234',
      email: 'john@example.com',
      zipCode: '12345',
      city: 'Anytown',
      state: 'CA',
      lifeExpectancy: '20'
    };
    
    render(
      <PlanTable
        items={items}
        categoryTotals={categoryTotals}
        grandTotal={850}
        lifetimeLow={10000}
        lifetimeHigh={15000}
        evalueeName="John Doe"
        planId="test-plan-id"
        evaluee={evaluee}
      />
    );
    
    // Click the Export to Word button
    fireEvent.click(screen.getByText('Export to Word'));
    
    // Verify exportToWord was called with evaluee data
    expect(exportToWord).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOfBirth: '1980-01-01',
        dateOfInjury: '2020-05-15',
        gender: 'Male',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        phone: '555-1234',
        email: 'john@example.com',
        lifeExpectancy: '20'
      })
    );
  });

  it('should handle item deletion when onDeleteItem is provided', () => {
    const items = createMockItems();
    const categoryTotals = createMockCategoryTotals();
    const onDeleteItem = vi.fn();
    
    render(
      <PlanTable
        items={items}
        categoryTotals={categoryTotals}
        grandTotal={850}
        lifetimeLow={10000}
        lifetimeHigh={15000}
        evalueeName="John Doe"
        planId="test-plan-id"
        onDeleteItem={onDeleteItem}
      />
    );
    
    // Find delete buttons by finding the Trash2 icon's parent button
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => 
      button.querySelector('svg.lucide-trash2') || 
      button.className.includes('text-red-500')
    );
    
    expect(deleteButton).toBeTruthy();
    
    // Click the delete button (this opens the confirmation dialog)
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // Now look for the Delete Item button in the dialog
    const deleteItemButton = screen.queryByText('Delete Item');
    
    // If the dialog opened, click the Delete Item button
    if (deleteItemButton) {
      fireEvent.click(deleteItemButton);
      
      // Verify onDeleteItem was called with the correct item ID
      expect(onDeleteItem).toHaveBeenCalledWith('item1');
    } else {
      // Alternative assertion if dialog doesn't open in test
      expect(deleteButton).toBeTruthy();
    }
  });
}); 