import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, CheckCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CareItem } from "@/types/lifecare";
import { isOneTimeItem } from "@/utils/export/utils";
import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN }); // Using banker's rounding

interface CalculationVerificationModeProps {
  item: CareItem;
  onClose: () => void;
}

const CalculationVerificationMode: React.FC<CalculationVerificationModeProps> = ({ 
  item, 
  onClose 
}) => {
  const isOneTime = isOneTimeItem(item);
  const duration = isOneTime ? 1 : (item.endAge && item.startAge ? item.endAge - item.startAge : 30);
  
  // Parse frequency for display
  const parsedFrequency = isOneTime ? 0 : 
    (item.frequency.toLowerCase().includes('week') ? Math.round(parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 52.1429) : 
     item.frequency.toLowerCase().includes('month') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 12 : 
     item.frequency.toLowerCase().includes('day') ? parseInt(item.frequency.match(/\d+/)?.[0] || '1') * 365 : 
     parseInt(item.frequency.match(/\d+/)?.[0] || '1'));
  
  // State for user inputs
  const [userBaseRate, setUserBaseRate] = useState<string>(item.costRange.average.toString());
  const [userFrequency, setUserFrequency] = useState<string>(parsedFrequency.toString());
  const [userDuration, setUserDuration] = useState<string>(duration.toString());
  const [userAnnualCost, setUserAnnualCost] = useState<string>('');
  const [userLifetimeCost, setUserLifetimeCost] = useState<string>('');
  
  // State for verification results
  const [annualVerified, setAnnualVerified] = useState<boolean | null>(null);
  const [lifetimeVerified, setLifetimeVerified] = useState<boolean | null>(null);
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Calculate expected values
  const expectedAnnualCost = isOneTime ? 0 : new Decimal(userBaseRate || '0').times(userFrequency || '0').toNumber();
  const expectedLifetimeCost = isOneTime 
    ? new Decimal(userBaseRate || '0').toNumber()
    : new Decimal(expectedAnnualCost).times(userDuration || '0').toNumber();
  
  // Verify user calculations
  const verifyAnnualCost = () => {
    if (!userAnnualCost) return;
    
    const userValue = parseFloat(userAnnualCost.replace(/[^0-9.-]+/g, ''));
    const expectedValue = expectedAnnualCost;
    
    // Allow for small rounding differences (within $0.10)
    setAnnualVerified(Math.abs(userValue - expectedValue) < 0.1);
  };
  
  const verifyLifetimeCost = () => {
    if (!userLifetimeCost) return;
    
    const userValue = parseFloat(userLifetimeCost.replace(/[^0-9.-]+/g, ''));
    const expectedValue = expectedLifetimeCost;
    
    // Allow for small rounding differences (within $0.10)
    setLifetimeVerified(Math.abs(userValue - expectedValue) < 0.1);
  };
  
  // Reset verification
  const resetVerification = () => {
    setUserBaseRate(item.costRange.average.toString());
    setUserFrequency(parsedFrequency.toString());
    setUserDuration(duration.toString());
    setUserAnnualCost('');
    setUserLifetimeCost('');
    setAnnualVerified(null);
    setLifetimeVerified(null);
  };
  
  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Calculation Verification Mode</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md text-sm">
        <p>This mode allows you to manually verify calculations for <strong>{item.service}</strong>.</p>
        <p>Enter your own calculations and check if they match the system's calculations.</p>
      </div>
      
      <div className="space-y-3">
        <h4 className="font-medium">Input Values</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="baseRate">Base Rate</Label>
            <Input
              id="baseRate"
              type="number"
              step="0.01"
              value={userBaseRate}
              onChange={(e) => setUserBaseRate(e.target.value)}
            />
          </div>
          
          {!isOneTime && (
            <div>
              <Label htmlFor="frequency">Annual Frequency</Label>
              <Input
                id="frequency"
                type="number"
                value={userFrequency}
                onChange={(e) => setUserFrequency(e.target.value)}
              />
            </div>
          )}
          
          {!isOneTime && (
            <div>
              <Label htmlFor="duration">Duration (Years)</Label>
              <Input
                id="duration"
                type="number"
                value={userDuration}
                onChange={(e) => setUserDuration(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <h4 className="font-medium">Verify Your Calculations</h4>
        
        {!isOneTime && (
          <div className="space-y-2">
            <Label htmlFor="annualCost">Annual Cost (Base Rate × Frequency)</Label>
            <div className="flex gap-2">
              <Input
                id="annualCost"
                placeholder="Enter your calculation"
                value={userAnnualCost}
                onChange={(e) => setUserAnnualCost(e.target.value)}
              />
              <Button onClick={verifyAnnualCost} className="whitespace-nowrap">
                Verify
              </Button>
            </div>
            {annualVerified !== null && (
              <div className={`flex items-center gap-2 text-sm ${annualVerified ? 'text-green-600' : 'text-red-600'}`}>
                {annualVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Correct! {formatCurrency(expectedAnnualCost)}</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>Incorrect. Expected: {formatCurrency(expectedAnnualCost)}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="lifetimeCost">
            {isOneTime ? 'One-time Cost' : 'Lifetime Cost (Annual Cost × Duration)'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="lifetimeCost"
              placeholder="Enter your calculation"
              value={userLifetimeCost}
              onChange={(e) => setUserLifetimeCost(e.target.value)}
            />
            <Button onClick={verifyLifetimeCost} className="whitespace-nowrap">
              Verify
            </Button>
          </div>
          {lifetimeVerified !== null && (
            <div className={`flex items-center gap-2 text-sm ${lifetimeVerified ? 'text-green-600' : 'text-red-600'}`}>
              {lifetimeVerified ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Correct! {formatCurrency(expectedLifetimeCost)}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  <span>Incorrect. Expected: {formatCurrency(expectedLifetimeCost)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={resetVerification}>
          Reset
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default CalculationVerificationMode;
