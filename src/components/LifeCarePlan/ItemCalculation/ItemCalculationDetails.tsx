import React, { useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareItem } from "@/types/lifecare";
import { isOneTimeItem } from "@/utils/export/utils";
import Decimal from 'decimal.js';

// Import utility functions and components
import { debugLog } from "@/utils/calculations/formatters";
import { 
  getMFRValues, 
  getPFRValues, 
  calculateCombinedRate, 
  hasFeeScheduleData,
  recalculateCostRange
} from "@/utils/calculations/feeSchedule";
import { parseFrequency, parseDuration } from "@/utils/calculations/frequencyParser";
import InputVariablesSection from './InputVariablesSection';
import CalculationStepsSection from './CalculationStepsSection';
import ResultsSection from './ResultsSection';
import LiveCalculationVisualizer from '../LiveCalculationVisualizer';

interface ItemCalculationDetailsProps {
  item: CareItem;
  currentAge?: number;
  lifeExpectancy?: number;
}

const ItemCalculationDetails: React.FC<ItemCalculationDetailsProps> = ({
  item,
  currentAge,
  lifeExpectancy
}) => {
  debugLog('Component rendering with props:', { item, currentAge, lifeExpectancy });
  
  // Add component lifecycle debugging
  useEffect(() => {
    debugLog('Component mounted');
    return () => {
      debugLog('Component unmounted');
    };
  }, []);
  
  const isOneTime = isOneTimeItem(item);
  debugLog('Item type:', isOneTime ? 'One-time' : 'Recurring');
  
  // Parse frequency using the proper frequency parser
  const parsedFrequencyObj = parseFrequency(item.frequency);
  debugLog('Parsed frequency object:', parsedFrequencyObj);
  
  // Calculate average frequency for display and calculations
  const avgFrequency = parsedFrequencyObj.valid 
    ? (parsedFrequencyObj.lowFrequency + parsedFrequencyObj.highFrequency) / 2 
    : 0;
  
  // Parse duration using the proper duration parser
  const parsedDurationObj = parseDuration(item.frequency, currentAge, lifeExpectancy);
  debugLog('Parsed duration object:', parsedDurationObj);
  
  // Calculate average duration for calculations
  const avgDuration = parsedDurationObj.valid 
    ? (parsedDurationObj.lowDuration + parsedDurationObj.highDuration) / 2 
    : 30;
  
  debugLog('Average frequency:', avgFrequency);
  debugLog('Average duration:', avgDuration);
  
  // Check if we have fee schedule data
  const { hasMFRData, hasPFRData, hasFeeScheduleData: hasFeeData } = hasFeeScheduleData(item);
  
  // Get the values
  const mfrValues = getMFRValues(item);
  const pfrValues = getPFRValues(item);
  
  // Calculate combined base rates
  const combinedLow = calculateCombinedRate(mfrValues.min, pfrValues.min, mfrValues.factor, pfrValues.factor);
  const combinedHigh = calculateCombinedRate(mfrValues.max, pfrValues.max, mfrValues.factor, pfrValues.factor);
  const combinedAvg = (combinedLow + combinedHigh) / 2 || 0;
  
  // For one-time items, recalculate the cost range based on MFR and PFR data
  // This ensures that GAF adjustments are properly applied
  let itemCostLow = new Decimal(item.costRange.low || 0);
  let itemCostAvg = new Decimal(item.costRange.average || 0);
  let itemCostHigh = new Decimal(item.costRange.high || 0);
  
  // If we have MFR and PFR data, recalculate the cost range
  if (isOneTime && item.mfrMin !== undefined && item.pfrMin !== undefined) {
    debugLog('Recalculating one-time item cost range based on MFR and PFR data');
    const recalculatedCosts = recalculateCostRange(item);
    itemCostLow = recalculatedCosts.itemCostLow;
    itemCostAvg = recalculatedCosts.itemCostAvg;
    itemCostHigh = recalculatedCosts.itemCostHigh;
  }
  
  // Ensure we have valid costs even if the original item has zero values
  if (itemCostLow.isZero() && itemCostAvg.isZero() && itemCostHigh.isZero()) {
    // Use fallback values if all costs are zero
    itemCostLow = new Decimal(item.costPerUnit || 80);
    itemCostAvg = new Decimal(item.costPerUnit || 100);
    itemCostHigh = new Decimal(item.costPerUnit || 120);
  }
  
  // Calculate annual cost based on frequency and base cost
  let annualCost = isOneTime
    ? 0
    : new Decimal(itemCostAvg).times(avgFrequency).toNumber();
  
  // Calculate lifetime cost based on annual cost and duration
  let lifetimeCost = isOneTime
    ? itemCostAvg.toNumber()
    : new Decimal(annualCost).times(avgDuration).toNumber();
  
  debugLog('Calculated costs:', { 
    baseRate: itemCostAvg.toNumber(),
    frequency: avgFrequency,
    duration: avgDuration,
    annualCost, 
    lifetimeCost 
  });
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Calculator className="h-4 w-4 mr-1" />
          <span className="text-xs">Calculation Details</span>
        </Button>
      </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Calculation Details: {item.service}</DialogTitle>
          <DialogDescription>
            Complete breakdown of all variables and calculations for this item
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="traditional" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="traditional">Traditional View</TabsTrigger>
            <TabsTrigger value="interactive">Interactive View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="traditional">
            <ScrollArea className="h-[calc(90vh-180px)] mt-4 pr-4">
              <div className="space-y-6">
                {/* Input Variables Section */}
                <InputVariablesSection 
                  item={item}
                  parsedFrequency={avgFrequency}
                  isOneTime={isOneTime}
                  mfrValues={mfrValues}
                  pfrValues={pfrValues}
                  hasMFRData={hasMFRData}
                  hasPFRData={hasPFRData}
                  hasFeeScheduleData={hasFeeData}
                  combinedLow={combinedLow}
                  combinedHigh={combinedHigh}
                  combinedAvg={combinedAvg}
                  duration={avgDuration}
                  currentAge={currentAge}
                  lifeExpectancy={lifeExpectancy}
                />
                
                <Separator />
                
                {/* Calculation Steps Section */}
                <CalculationStepsSection 
                  item={item}
                  isOneTime={isOneTime}
                  mfrValues={mfrValues}
                  pfrValues={pfrValues}
                  hasMFRData={hasMFRData}
                  hasPFRData={hasPFRData}
                  hasFeeScheduleData={hasFeeData}
                  combinedLow={combinedLow}
                  combinedHigh={combinedHigh}
                  parsedFrequency={avgFrequency}
                  annualCost={annualCost}
                  lifetimeCost={lifetimeCost}
                  duration={avgDuration}
                />
                
                <Separator />
                
                {/* Results Section */}
                <ResultsSection 
                  isOneTime={isOneTime}
                  annualCost={annualCost}
                  lifetimeCost={lifetimeCost}
                  costRangeLow={itemCostLow.toNumber()}
                  costRangeHigh={itemCostHigh.toNumber()}
                />
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="interactive">
            <ScrollArea className="h-[calc(90vh-180px)] mt-4 pr-4">
              <LiveCalculationVisualizer
                item={item}
                currentAge={currentAge}
                lifeExpectancy={lifeExpectancy}
                mfrValues={mfrValues}
                pfrValues={pfrValues}
                hasMFRData={hasMFRData}
                hasPFRData={hasPFRData}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ItemCalculationDetails;
