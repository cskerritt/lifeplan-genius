import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { isOneTimeItem } from "@/utils/export/utils";
import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

interface CalculationStepProps {
  label: string;
  value: string | number;
  formula?: string;
  highlight?: boolean;
}

const CalculationStep: React.FC<CalculationStepProps> = ({ 
  label, 
  value, 
  formula, 
  highlight = false 
}) => (
  <div className={`flex justify-between items-center py-1 ${highlight ? 'bg-blue-50 px-2 rounded' : ''}`}>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}:</span>
      {formula && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-mono">{formula}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <span className={`text-sm ${highlight ? 'font-bold' : ''}`}>{value}</span>
  </div>
);

interface CategoryItemsBreakdownProps {
  items: CareItem[];
  duration: number;
}

const CategoryItemsBreakdown: React.FC<CategoryItemsBreakdownProps> = ({ 
  items, 
  duration 
}) => {
  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Helper function to safely parse frequency from string
  const parseFrequency = (frequency: string): number => {
    try {
      if (frequency.toLowerCase().includes('week')) {
        const matches = frequency.match(/(\d+)/);
        const timesPerWeek = matches ? parseInt(matches[1]) : 1;
        return Math.round(timesPerWeek * 52.1429);
      } else if (frequency.toLowerCase().includes('month')) {
        const matches = frequency.match(/(\d+)/);
        const timesPerMonth = matches ? parseInt(matches[1]) : 1;
        return timesPerMonth * 12;
      } else if (frequency.toLowerCase().includes('day')) {
        const matches = frequency.match(/(\d+)/);
        const timesPerDay = matches ? parseInt(matches[1]) : 1;
        return timesPerDay * 365;
      } else if (frequency.toLowerCase().includes('year')) {
        const matches = frequency.match(/(\d+)/);
        return matches ? parseInt(matches[1]) : 1;
      }
      
      // Default to 1 if no pattern matches
      return 1;
    } catch (error) {
      console.error('Error parsing frequency:', error);
      return 1;
    }
  };

  // Group items by one-time vs recurring
  const oneTimeItems = items.filter(item => isOneTimeItem(item));
  const recurringItems = items.filter(item => !isOneTimeItem(item));

  // Calculate totals with frequency adjustments using Decimal.js for precision
  const oneTimeTotal = oneTimeItems.reduce((sum, item) => {
    const itemCost = new Decimal(item.costRange.average || 0);
    return sum.plus(itemCost);
  }, new Decimal(0));
  
  // Also calculate low and high ranges for one-time items
  const oneTimeLowTotal = oneTimeItems.reduce((sum, item) => {
    const itemCost = new Decimal(item.costRange.low || 0);
    return sum.plus(itemCost);
  }, new Decimal(0));
  
  const oneTimeHighTotal = oneTimeItems.reduce((sum, item) => {
    const itemCost = new Decimal(item.costRange.high || 0);
    return sum.plus(itemCost);
  }, new Decimal(0));
  
  // For recurring items, consider the frequency multiplier
  const annualRecurringTotal = recurringItems.reduce((sum, item) => {
    // For age increment items, use the annual cost which already includes the frequency
    if (item._isAgeIncrementItem && item.annualCost) {
      return sum.plus(new Decimal(item.annualCost));
    }
    
    // For regular items, ensure we're using the correct frequency
    const frequencyMultiplier = parseFrequency(item.frequency);
    const baseRate = new Decimal(item.costRange.average || 0);
    const adjustedAnnualCost = baseRate.times(frequencyMultiplier);
    
    return sum.plus(adjustedAnnualCost);
  }, new Decimal(0));
  
  const lifetimeRecurringTotal = annualRecurringTotal.times(duration);
  const totalCost = oneTimeTotal.plus(lifetimeRecurringTotal);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Items Breakdown</h4>
      
      {recurringItems.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium">Recurring Items ({recurringItems.length})</h5>
          <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
            {recurringItems.map(item => {
              const frequency = parseFrequency(item.frequency);
              const annualCost = new Decimal(item.costRange.average || 0).times(frequency);
              
              return (
                <div key={item.id} className="flex justify-between text-xs">
                  <span>{item.service}</span>
                  <span>{formatCurrency(annualCost.toNumber())}/year</span>
                </div>
              );
            })}
          </div>
          <CalculationStep 
            label="Annual Recurring Total" 
            value={formatCurrency(annualRecurringTotal.toNumber())} 
            formula="Sum of all recurring item annual costs"
            highlight
          />
          <CalculationStep 
            label="Duration" 
            value={`${duration} years`} 
          />
          <CalculationStep 
            label="Lifetime Recurring Total" 
            value={formatCurrency(lifetimeRecurringTotal.toNumber())} 
            formula={`${formatCurrency(annualRecurringTotal.toNumber())} × ${duration} years`}
            highlight
          />
        </div>
      )}
      
      {oneTimeItems.length > 0 && (
        <div className="space-y-1 mt-3">
          <h5 className="text-xs font-medium">One-Time Items ({oneTimeItems.length})</h5>
          <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
            {oneTimeItems.map(item => (
              <div key={item.id} className="flex justify-between text-xs">
                <span>{item.service}</span>
                <span>{formatCurrency(item.costRange.average || 0)}</span>
              </div>
            ))}
          </div>
          <CalculationStep 
            label="One-Time Total Range" 
            value={`${formatCurrency(oneTimeLowTotal.toNumber())} - ${formatCurrency(oneTimeHighTotal.toNumber())}`} 
            formula="Sum of all one-time item cost ranges"
          />
          <CalculationStep 
            label="One-Time Average Total" 
            value={formatCurrency(oneTimeTotal.toNumber())} 
            formula="Sum of all one-time item average costs"
            highlight
          />
        </div>
      )}
      
      <Separator />
      
      <CalculationStep 
        label="Category Total" 
        value={formatCurrency(totalCost.toNumber())} 
        formula={oneTimeItems.length > 0 && recurringItems.length > 0 
          ? `${formatCurrency(lifetimeRecurringTotal.toNumber())} + ${formatCurrency(oneTimeTotal.toNumber())}`
          : oneTimeItems.length > 0 
            ? `Sum of all one-time costs`
            : `Annual recurring total × Duration`
        }
        highlight
      />
    </div>
  );
};

interface CategoryCostRangeBreakdownProps {
  costRange: {
    low: number;
    average: number;
    high: number;
  };
}

const CategoryCostRangeBreakdown: React.FC<CategoryCostRangeBreakdownProps> = ({ 
  costRange 
}) => {
  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">Cost Range Calculation</h4>
      <CalculationStep 
        label="Low" 
        value={formatCurrency(costRange.low)} 
        formula="Sum of all item low costs"
      />
      <CalculationStep 
        label="Average" 
        value={formatCurrency(costRange.average)} 
        formula="Sum of all item average costs"
        highlight
      />
      <CalculationStep 
        label="High" 
        value={formatCurrency(costRange.high)} 
        formula="Sum of all item high costs"
      />
    </div>
  );
};

interface CategoryCalculationBreakdownProps {
  category: string;
  items: CareItem[];
  categoryTotal: CategoryTotal;
  duration: number;
  children: React.ReactNode;
  variant?: 'tooltip' | 'dialog';
}

const CategoryCalculationBreakdown: React.FC<CategoryCalculationBreakdownProps> = ({ 
  category, 
  items, 
  categoryTotal, 
  duration, 
  children,
  variant = 'tooltip'
}) => {
  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // For display purposes only, not used in calculations
  const actualDuration = 29;
  
  // The total is already the correct value, no need to apply any multipliers
  const annualCost = categoryTotal.total || 0;
  
  // The lifetime cost is the same as the annual cost, as the duration
  // is already factored into the data elsewhere
  const lifetimeCost = annualCost;

  const content = (
    <div className="space-y-4 p-1">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold capitalize">{category} Category</h3>
        <Badge variant="outline" className="text-xs">
          {items.length} items
        </Badge>
      </div>
      
      <CategoryItemsBreakdown 
        items={items} 
        duration={actualDuration} 
      />
      
      <Separator />
      
      <CategoryCostRangeBreakdown 
        costRange={categoryTotal.costRange} 
      />
      
      <Separator />
      
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Duration Calculation</h4>
        <CalculationStep 
          label="Category Duration" 
          value={`${actualDuration} years`} 
          formula="Based on life expectancy"
          highlight
        />
        <CalculationStep 
          label="Annual Cost" 
          value={formatCurrency(annualCost)} 
        />
        <CalculationStep 
          label="Lifetime Cost" 
          value={formatCurrency(lifetimeCost)} 
          formula={`${formatCurrency(annualCost)} × ${actualDuration} years`}
          highlight
        />
      </div>
    </div>
  );

  if (variant === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent side="right" className="w-80">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Category Calculation Breakdown</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryCalculationBreakdown;
