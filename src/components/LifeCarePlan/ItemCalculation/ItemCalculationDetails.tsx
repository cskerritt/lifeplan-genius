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
  
  // Parse frequency for display
  const parsedFrequency = isOneTime ? 0 : 
    (item.frequency.toLowerCase().includes('week') ? Math.round(parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 52.1429) : 
     item.frequency.toLowerCase().includes('month') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 12 : 
     item.frequency.toLowerCase().includes('day') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 365 : 
     parseInt(item.frequency.match(/\d+/)?.[0] || '1'));
  
  debugLog('Parsed frequency:', parsedFrequency);
  
  // For display purposes only, not used in calculations
  const duration = 29;
  
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
  
  // The base cost is already the correct value, no need to apply frequency multiplier
  // as it's already factored into the data
  const annualCost = isOneTime ? 0 : itemCostAvg.toNumber();
  
  // The lifetime cost is the same as the annual cost, as the duration
  // is already factored into the data elsewhere
  const lifetimeCost = isOneTime 
    ? itemCostAvg.toNumber()
    : annualCost;
  
  debugLog('Calculated costs:', { annualCost, lifetimeCost });
  
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
                  parsedFrequency={parsedFrequency}
                  isOneTime={isOneTime}
                  mfrValues={mfrValues}
                  pfrValues={pfrValues}
                  hasMFRData={hasMFRData}
                  hasPFRData={hasPFRData}
                  hasFeeScheduleData={hasFeeData}
                  combinedLow={combinedLow}
                  combinedHigh={combinedHigh}
                  combinedAvg={combinedAvg}
                  duration={duration}
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
                  parsedFrequency={parsedFrequency}
                  annualCost={annualCost}
                  lifetimeCost={lifetimeCost}
                  duration={duration}
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
