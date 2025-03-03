import React from 'react';
import { Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CareItem } from '@/types/lifecare';
import { isOneTimeItem } from '@/utils/export/utils';

interface OneTimeCostsDisplayProps {
  items: CareItem[];
  formatCurrency: (value: number) => string;
}

const OneTimeCostsDisplay: React.FC<OneTimeCostsDisplayProps> = ({ items, formatCurrency }) => {
  // More detailed debug logs
  console.log('OneTimeCostsDisplay - items count:', items.length);
  
  // Log each item with its properties to check if they're correctly identified as one-time
  items.forEach((item, index) => {
    console.log(`Item ${index}:`, {
      id: item.id,
      service: item.service,
      frequency: item.frequency,
      isOneTime: item.isOneTime,
      isOneTimeByFunction: isOneTimeItem(item),
      annualCost: item.annualCost,
      costRange: item.costRange
    });
  });
  
  // Explicitly check for "One-time" in the frequency string as a backup
  const oneTimeItems = items.filter(item => {
    // First try the standard isOneTimeItem function
    const isOneTime = isOneTimeItem(item);
    
    // If that doesn't work, check the frequency string directly
    const frequencyCheck = item.frequency && 
      (item.frequency.toLowerCase().includes('one-time') || 
       item.frequency.toLowerCase() === 'one time' ||
       item.frequency.toLowerCase() === 'once');
    
    return isOneTime || frequencyCheck || item.isOneTime === true;
  });
  
  console.log('OneTimeCostsDisplay - one-time items count:', oneTimeItems.length);
  
  // Log each one-time item with its cost
  oneTimeItems.forEach((item, index) => {
    console.log(`One-time item ${index}:`, {
      id: item.id,
      service: item.service,
      frequency: item.frequency,
      annualCost: item.annualCost,
      costRange: item.costRange,
      isNaN: isNaN(item.annualCost)
    });
  });
  
  // Use both annualCost and costRange.average to ensure we get a value
  const oneTimeCostsTotal = oneTimeItems.reduce((sum, item) => {
    // First try to use annualCost
    let itemCost = isNaN(item.annualCost) ? 0 : item.annualCost;
    
    // If annualCost is 0 or NaN, try using costRange.average
    if (itemCost === 0 && item.costRange && !isNaN(item.costRange.average)) {
      itemCost = item.costRange.average;
    }
    
    console.log(`Adding cost for ${item.service}: ${itemCost}`);
    return sum + itemCost;
  }, 0);
  
  console.log('OneTimeCostsDisplay - one-time costs total:', oneTimeCostsTotal);
  
  return (
    <div className="flex justify-between text-md">
      <span>One-time Costs:</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help">
              {formatCurrency(oneTimeCostsTotal)}
              <Calculator className="h-4 w-4 text-blue-500" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="w-80">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">One-time Costs Breakdown</h3>
              <div className="space-y-1">
                {oneTimeItems.length > 0 ? (
                  <>
                    {oneTimeItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.service}:</span>
                        <span>{formatCurrency(isNaN(item.annualCost) || item.annualCost === 0 
                          ? (item.costRange?.average || 0) 
                          : item.annualCost)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 flex justify-between text-sm font-bold">
                      <span>Total one-time costs:</span>
                      <span>{formatCurrency(oneTimeCostsTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm italic">No one-time costs in this plan.</div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default OneTimeCostsDisplay; 