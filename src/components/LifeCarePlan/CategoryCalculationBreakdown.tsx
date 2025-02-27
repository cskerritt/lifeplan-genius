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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Group items by one-time vs recurring
  const oneTimeItems = items.filter(item => isOneTimeItem(item));
  const recurringItems = items.filter(item => !isOneTimeItem(item));

  // Calculate totals
  const oneTimeTotal = oneTimeItems.reduce((sum, item) => sum + item.costRange.average, 0);
  const annualRecurringTotal = recurringItems.reduce((sum, item) => sum + item.annualCost, 0);
  const lifetimeRecurringTotal = annualRecurringTotal * duration;
  const totalCost = oneTimeTotal + lifetimeRecurringTotal;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Items Breakdown</h4>
      
      {recurringItems.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium">Recurring Items ({recurringItems.length})</h5>
          <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
            {recurringItems.map(item => (
              <div key={item.id} className="flex justify-between text-xs">
                <span>{item.service}</span>
                <span>{formatCurrency(item.annualCost)}/year</span>
              </div>
            ))}
          </div>
          <CalculationStep 
            label="Annual Recurring Total" 
            value={formatCurrency(annualRecurringTotal)} 
            formula="Sum of all recurring item annual costs"
            highlight
          />
          <CalculationStep 
            label="Duration" 
            value={`${duration} years`} 
          />
          <CalculationStep 
            label="Lifetime Recurring Total" 
            value={formatCurrency(lifetimeRecurringTotal)} 
            formula={`${formatCurrency(annualRecurringTotal)} × ${duration} years`}
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
                <span>{formatCurrency(item.costRange.average)}</span>
              </div>
            ))}
          </div>
          <CalculationStep 
            label="One-Time Total" 
            value={formatCurrency(oneTimeTotal)} 
            formula="Sum of all one-time item costs"
            highlight
          />
        </div>
      )}
      
      <Separator />
      
      <CalculationStep 
        label="Category Total" 
        value={formatCurrency(totalCost)} 
        formula={oneTimeItems.length > 0 && recurringItems.length > 0 
          ? `${formatCurrency(lifetimeRecurringTotal)} + ${formatCurrency(oneTimeTotal)}`
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

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
        duration={duration} 
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
          value={`${duration} years`} 
          formula="Based on age ranges of items in this category"
          highlight
        />
        <CalculationStep 
          label="Annual Cost" 
          value={formatCurrency(categoryTotal.total)} 
        />
        <CalculationStep 
          label="Lifetime Cost" 
          value={formatCurrency(categoryTotal.total * duration)} 
          formula={`${formatCurrency(categoryTotal.total)} × ${duration} years`}
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
