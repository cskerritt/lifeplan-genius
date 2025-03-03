import React, { useState, useEffect } from 'react';
import { CareItem } from "@/types/lifecare";
import { formatCurrency, safeFormat, safeFormatDecimal } from "@/utils/calculations/formatters";
import { FeeScheduleValues } from "@/utils/calculations/feeSchedule";
import Decimal from 'decimal.js';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Calculator, DollarSign, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { isOneTimeItem } from "@/utils/export/utils";
import { CostCalculationStrategyFactory } from "@/utils/calculations/strategies/costCalculationStrategyFactory";
import { CostCalculationParams } from "@/utils/calculations/types";

interface LiveCalculationVisualizerProps {
  item: CareItem;
  currentAge?: number;
  lifeExpectancy?: number;
  mfrValues: FeeScheduleValues;
  pfrValues: FeeScheduleValues;
  hasMFRData: boolean;
  hasPFRData: boolean;
}

const LiveCalculationVisualizer: React.FC<LiveCalculationVisualizerProps> = ({
  item,
  currentAge,
  lifeExpectancy,
  mfrValues,
  pfrValues,
  hasMFRData,
  hasPFRData
}) => {
  const isOneTime = isOneTimeItem(item);
  
  // State for interactive adjustments
  const [baseRate, setBaseRate] = useState<number>(item.costRange.average);
  const [frequency, setFrequency] = useState<number>(
    isOneTime ? 1 : 
    (item.frequency.toLowerCase().includes('week') ? Math.round(parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 52.1429) : 
     item.frequency.toLowerCase().includes('month') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 12 : 
     item.frequency.toLowerCase().includes('day') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 365 : 
     parseInt(item.frequency.match(/\d+/)?.[0] || '1'))
  );
  const [duration, setDuration] = useState<number>(
    isOneTime ? 1 : (item.endAge && item.startAge ? item.endAge - item.startAge : 30)
  );
  const [mfrFactor, setMfrFactor] = useState<number>(mfrValues.factor);
  const [pfrFactor, setPfrFactor] = useState<number>(pfrValues.factor);
  
  // Calculation results
  const [annualCost, setAnnualCost] = useState<number>(0);
  const [lifetimeCost, setLifetimeCost] = useState<number>(0);
  const [calculationSteps, setCalculationSteps] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  
  // Calculate the average of MFR and PFR factors
  const avgGeoFactor = new Decimal(mfrFactor).plus(pfrFactor).dividedBy(2);
  
  // Recalculate costs when inputs change
  useEffect(() => {
    const calculateCosts = async () => {
      // Reset steps
      const steps: string[] = [];
      
      // Step 1: Start with base rate
      steps.push(`Start with base rate: ${formatCurrency(baseRate)}`);
      
      // Step 2: Apply geographic factors if available
      if (mfrFactor !== 1 || pfrFactor !== 1) {
        steps.push(`Calculate average geographic factor: (${safeFormatDecimal(mfrFactor)} + ${safeFormatDecimal(pfrFactor)}) ÷ 2 = ${safeFormatDecimal(avgGeoFactor.toNumber())}`);
        steps.push(`Apply geographic factor: ${formatCurrency(baseRate)} × ${safeFormatDecimal(avgGeoFactor.toNumber())} = ${formatCurrency(new Decimal(baseRate).times(avgGeoFactor).toNumber())}`);
      }
      
      // Step 3: Calculate annual cost (for recurring items)
      if (!isOneTime) {
        const adjustedBaseRate = new Decimal(baseRate).times(avgGeoFactor);
        const calculatedAnnualCost = adjustedBaseRate.times(frequency);
        steps.push(`Calculate annual cost: ${formatCurrency(adjustedBaseRate.toNumber())} × ${frequency} times per year = ${formatCurrency(calculatedAnnualCost.toNumber())}`);
        setAnnualCost(calculatedAnnualCost.toNumber());
        
        // Step 4: Calculate lifetime cost
        const calculatedLifetimeCost = calculatedAnnualCost.times(duration);
        steps.push(`Calculate lifetime cost: ${formatCurrency(calculatedAnnualCost.toNumber())} × ${duration} years = ${formatCurrency(calculatedLifetimeCost.toNumber())}`);
        setLifetimeCost(calculatedLifetimeCost.toNumber());
      } else {
        // For one-time items
        const adjustedBaseRate = new Decimal(baseRate).times(avgGeoFactor);
        steps.push(`One-time item: Lifetime cost = ${formatCurrency(adjustedBaseRate.toNumber())}`);
        setAnnualCost(0);
        setLifetimeCost(adjustedBaseRate.toNumber());
      }
      
      // Update steps and trigger animation
      setCalculationSteps(steps);
      setActiveStep(0);
      setShowAnimation(true);
      
      // Animate through steps
      for (let i = 1; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setActiveStep(i);
      }
      
      // Use the Strategy pattern to calculate costs
      try {
        const params: CostCalculationParams = {
          baseRate,
          frequency: isOneTime ? 'one time' : `${frequency}x per year`,
          currentAge: currentAge || 0,
          lifeExpectancy: lifeExpectancy || 30,
          startAge: item.startAge,
          endAge: item.endAge,
          cptCode: item.cptCode,
          category: item.category,
          zipCode: '00000' // Default value
        };
        
        const strategy = CostCalculationStrategyFactory.createStrategy(params);
        const result = await strategy.calculate(params);
        
        console.log('Strategy calculation result:', result);
      } catch (error) {
        console.error('Error using strategy pattern:', error);
      }
    };
    
    calculateCosts();
  }, [baseRate, frequency, duration, mfrFactor, pfrFactor, isOneTime, avgGeoFactor, item, currentAge, lifeExpectancy]);
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="visualization" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Adjustments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualization" className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calculator className="mr-2 h-5 w-5 text-blue-500" />
              Live Calculation Steps
            </h3>
            
            <div className="space-y-4">
              <AnimatePresence>
                {calculationSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={index <= activeStep ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className={`p-3 rounded-md ${index === activeStep ? 'bg-blue-100 border border-blue-200' : 'bg-white'}`}
                  >
                    <div className="flex items-start">
                      <Badge variant="outline" className="mr-2 bg-blue-500 text-white">
                        Step {index + 1}
                      </Badge>
                      <div>
                        <p className="font-mono text-sm">{step}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {activeStep === calculationSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md"
                >
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Final Result
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {!isOneTime && (
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-gray-500">Annual Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(annualCost)}</p>
                      </div>
                    )}
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-500">Lifetime Cost</p>
                      <p className="text-xl font-bold">{formatCurrency(lifetimeCost)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="interactive" className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Adjust Calculation Inputs</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="base-rate">Base Rate</Label>
                  <span className="text-sm font-mono">{formatCurrency(baseRate)}</span>
                </div>
                <Slider
                  id="base-rate"
                  min={Math.max(1, baseRate * 0.5)}
                  max={baseRate * 1.5}
                  step={1}
                  value={[baseRate]}
                  onValueChange={(value) => setBaseRate(value[0])}
                />
              </div>
              
              {!isOneTime && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="frequency">Annual Frequency</Label>
                      <span className="text-sm font-mono">{frequency} times per year</span>
                    </div>
                    <Slider
                      id="frequency"
                      min={1}
                      max={Math.max(52, frequency * 2)}
                      step={1}
                      value={[frequency]}
                      onValueChange={(value) => setFrequency(value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="duration">Duration (Years)</Label>
                      <span className="text-sm font-mono">{duration} years</span>
                    </div>
                    <Slider
                      id="duration"
                      min={1}
                      max={Math.max(30, duration * 1.5)}
                      step={1}
                      value={[duration]}
                      onValueChange={(value) => setDuration(value[0])}
                    />
                  </div>
                </>
              )}
              
              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Geographic Factors</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="mfr-factor">MFR Factor</Label>
                      <span className="text-sm font-mono">{safeFormatDecimal(mfrFactor)}</span>
                    </div>
                    <Slider
                      id="mfr-factor"
                      min={0.8}
                      max={1.2}
                      step={0.01}
                      value={[mfrFactor]}
                      onValueChange={(value) => setMfrFactor(value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="pfr-factor">PFR Factor</Label>
                      <span className="text-sm font-mono">{safeFormatDecimal(pfrFactor)}</span>
                    </div>
                    <Slider
                      id="pfr-factor"
                      min={0.8}
                      max={1.2}
                      step={0.01}
                      value={[pfrFactor]}
                      onValueChange={(value) => setPfrFactor(value[0])}
                    />
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Geographic Factor:</span>
                    <Badge variant="outline" className="bg-blue-100">
                      {safeFormatDecimal(avgGeoFactor.toNumber())}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Results</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {!isOneTime && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Annual Cost</p>
                      <p className="text-xl font-bold">{formatCurrency(annualCost)}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Lifetime Cost</p>
                    <p className="text-xl font-bold">{formatCurrency(lifetimeCost)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveCalculationVisualizer;
