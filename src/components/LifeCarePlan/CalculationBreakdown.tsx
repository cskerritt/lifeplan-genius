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
import { CareItem } from "@/types/lifecare";
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

interface FrequencyBreakdownProps {
  frequency: string;
  parsedFrequency: {
    lowFrequency: number;
    highFrequency: number;
    isOneTime: boolean;
  };
}

const FrequencyBreakdown: React.FC<FrequencyBreakdownProps> = ({ 
  frequency, 
  parsedFrequency 
}) => (
  <div className="space-y-1">
    <h4 className="text-sm font-semibold">Frequency Calculation</h4>
    <CalculationStep 
      label="Original Input" 
      value={frequency} 
    />
    <CalculationStep 
      label="Parsed As" 
      value={parsedFrequency.isOneTime ? "One-time occurrence" : `${parsedFrequency.lowFrequency} times per year`} 
    />
    {!parsedFrequency.isOneTime && parsedFrequency.lowFrequency !== parsedFrequency.highFrequency && (
      <CalculationStep 
        label="Range" 
        value={`${parsedFrequency.lowFrequency} - ${parsedFrequency.highFrequency} times per year`} 
      />
    )}
  </div>
);

interface DurationBreakdownProps {
  frequency: string;
  startAge?: number;
  endAge?: number;
  currentAge?: number;
  lifeExpectancy?: number;
  calculatedDuration: number;
  source: string;
}

const DurationBreakdown: React.FC<DurationBreakdownProps> = ({ 
  frequency, 
  startAge, 
  endAge, 
  currentAge, 
  lifeExpectancy, 
  calculatedDuration,
  source
}) => (
  <div className="space-y-1">
    <h4 className="text-sm font-semibold">Duration Calculation</h4>
    <CalculationStep 
      label="Source" 
      value={source} 
    />
    {source === 'age-range' && startAge !== undefined && endAge !== undefined && (
      <>
        <CalculationStep 
          label="Age Range" 
          value={`${startAge} to ${endAge}`} 
        />
        <CalculationStep 
          label="Calculation" 
          value={`${endAge} - ${startAge} = ${calculatedDuration} years`} 
          formula={`endAge - startAge = duration`}
          highlight
        />
      </>
    )}
    {source === 'frequency' && (
      <CalculationStep 
        label="Extracted From" 
        value={frequency} 
        highlight
      />
    )}
    {source === 'default' && (
      <>
        <CalculationStep 
          label="Current Age" 
          value={currentAge !== undefined ? currentAge : 'Not specified'} 
        />
        <CalculationStep 
          label="Life Expectancy" 
          value={lifeExpectancy !== undefined ? lifeExpectancy : 'Default (30.5 years)'} 
        />
        <CalculationStep 
          label="Default Duration" 
          value={`${calculatedDuration} years`} 
          highlight
        />
      </>
    )}
  </div>
);

interface CostBreakdownProps {
  baseRate: number;
  frequency: number;
  duration: number;
  annualCost: number;
  lifetimeCost: number;
  costRange: {
    low: number;
    average: number;
    high: number;
  };
  isOneTime: boolean;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({ 
  baseRate, 
  frequency, 
  duration, 
  annualCost, 
  lifetimeCost,
  costRange,
  isOneTime
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">Cost Calculation</h4>
      <CalculationStep 
        label="Base Rate" 
        value={formatCurrency(baseRate)} 
      />
      {!isOneTime && (
        <>
          <CalculationStep 
            label="Annual Frequency" 
            value={`${frequency} times per year`} 
          />
          <CalculationStep 
            label="Annual Cost" 
            value={formatCurrency(annualCost)} 
            formula={`baseRate × frequency = annualCost`}
            highlight
          />
          <CalculationStep 
            label="Duration" 
            value={`${duration} years`} 
          />
          <CalculationStep 
            label="Lifetime Cost" 
            value={formatCurrency(lifetimeCost)} 
            formula={`annualCost × duration = lifetimeCost`}
            highlight
          />
        </>
      )}
      {isOneTime && (
        <CalculationStep 
          label="One-time Cost" 
          value={formatCurrency(costRange.average)} 
          highlight
        />
      )}
      <Separator className="my-2" />
      <div className="space-y-1">
        <h5 className="text-xs font-semibold">Cost Range</h5>
        <CalculationStep 
          label="Low" 
          value={formatCurrency(costRange.low)} 
        />
        <CalculationStep 
          label="Average" 
          value={formatCurrency(costRange.average)} 
        />
        <CalculationStep 
          label="High" 
          value={formatCurrency(costRange.high)} 
        />
      </div>
    </div>
  );
};

interface CalculationBreakdownProps {
  item: CareItem;
  currentAge?: number;
  lifeExpectancy?: number;
  children: React.ReactNode;
  variant?: 'tooltip' | 'dialog';
}

const CalculationBreakdown: React.FC<CalculationBreakdownProps> = ({ 
  item, 
  currentAge, 
  lifeExpectancy, 
  children,
  variant = 'tooltip'
}) => {
  const isOneTimeOccurrence = isOneTimeItem(item);
  const duration = isOneTimeOccurrence ? 1 : (item.endAge && item.startAge ? item.endAge - item.startAge : 30);
  
  // Determine the source of duration
  let durationSource = 'default';
  if (item.startAge !== undefined && item.endAge !== undefined) {
    durationSource = 'age-range';
  } else if (item.frequency.toLowerCase().includes('for') && item.frequency.toLowerCase().includes('year')) {
    durationSource = 'frequency';
  }

  // Parse frequency for display
  const parsedFrequency = {
    lowFrequency: isOneTimeOccurrence ? 0 : 
      (item.frequency.toLowerCase().includes('week') ? Math.round(parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 52.1429) : 
       item.frequency.toLowerCase().includes('month') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 12 : 
       item.frequency.toLowerCase().includes('day') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 365 : 
       parseInt(item.frequency.match(/\d+/)?.[0] || '1')),
    highFrequency: isOneTimeOccurrence ? 0 : 
      (item.frequency.toLowerCase().includes('week') ? Math.round(parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 52.1429) : 
       item.frequency.toLowerCase().includes('month') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 12 : 
       item.frequency.toLowerCase().includes('day') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 365 : 
       parseInt(item.frequency.match(/\d+/)?.[0] || '1')),
    isOneTime: isOneTimeOccurrence
  };

  const content = (
    <div className="space-y-4 p-1">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold">{item.service}</h3>
        <Badge variant="outline" className="text-xs">
          {isOneTimeOccurrence ? 'One-time' : 'Recurring'}
        </Badge>
      </div>
      
      <FrequencyBreakdown 
        frequency={item.frequency} 
        parsedFrequency={parsedFrequency} 
      />
      
      <Separator />
      
      {!isOneTimeOccurrence && (
        <>
          <DurationBreakdown 
            frequency={item.frequency}
            startAge={item.startAge}
            endAge={item.endAge}
            currentAge={currentAge}
            lifeExpectancy={lifeExpectancy}
            calculatedDuration={duration}
            source={durationSource}
          />
          
          <Separator />
        </>
      )}
      
      <CostBreakdown 
        baseRate={item.costRange.average}
        frequency={parsedFrequency.lowFrequency}
        duration={duration}
        annualCost={item.annualCost}
        lifetimeCost={item.annualCost * duration}
        costRange={item.costRange}
        isOneTime={isOneTimeOccurrence}
      />
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
          <DialogTitle>Calculation Breakdown</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CalculationBreakdown;
