import React from 'react';
import { Separator } from "@/components/ui/separator";

const GlobalCalculationInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">CPT Code Cost Calculation</h3>
        <p>When a CPT code is provided, the system looks up standard rates and applies geographic adjustments:</p>
        <ol className="list-decimal list-inside space-y-2 pl-4">
          <li>Retrieve CPT code data (MFR and PFR percentiles)</li>
          <li>Calculate the average of MFR and PFR geographic adjustment factors</li>
          <li>Apply the average geographic factor to the combined rates</li>
          <li>Calculate low, average, and high costs using the adjusted data</li>
        </ol>
        <div className="bg-gray-100 p-4 rounded-md">
          <pre className="text-sm whitespace-pre-wrap">
            {`// Example calculation
if (cptCode) {
  // Get CPT code data
  const cptData = await lookupCPTCode(cptCode);
  
  // Store the unadjusted percentiles
  const mfr50th = new Decimal(cptData.mfu_50th);
  const mfr75th = new Decimal(cptData.mfu_75th);
  const pfr50th = new Decimal(cptData.pfr_50th);
  const pfr75th = new Decimal(cptData.pfr_75th);
  
  // Apply geographic adjustment
  if (zipCode) {
    const geoFactors = await fetchGeoFactors(zipCode);
    
    // Calculate the average of MFR and PFR factors
    const avgGeoFactor = new Decimal(geoFactors.mfr_factor)
      .plus(geoFactors.pfr_factor)
      .dividedBy(2);
    
    // Calculate combined base rates
    const combinedLow = mfr50th.plus(pfr50th).dividedBy(2);
    const combinedHigh = mfr75th.plus(pfr75th).dividedBy(2);
    
    // Apply the average geographic factor
    low = combinedLow.times(avgGeoFactor);
    high = combinedHigh.times(avgGeoFactor);
    average = low.plus(high).dividedBy(2);
  }
}`}
          </pre>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="font-medium">Frequency Calculations</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div>
            <p className="font-medium">Weekly:</p>
            <p className="font-mono text-sm">X times per week = X × 52.1429 times per year</p>
          </div>
          <div>
            <p className="font-medium">Monthly:</p>
            <p className="font-mono text-sm">12 times per year</p>
          </div>
          <div>
            <p className="font-medium">Quarterly:</p>
            <p className="font-mono text-sm">4 times per year</p>
          </div>
          <div>
            <p className="font-medium">Twice monthly:</p>
            <p className="font-mono text-sm">24 times per year</p>
          </div>
          <div>
            <p className="font-medium">Annual:</p>
            <p className="font-mono text-sm">1 time per year</p>
          </div>
          <div>
            <p className="font-medium">Semi-annual:</p>
            <p className="font-mono text-sm">2 times per year</p>
          </div>
          <div>
            <p className="font-medium">Every X days:</p>
            <p className="font-mono text-sm">365 ÷ X times per year</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="font-medium">Duration Calculations</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div>
            <p className="font-medium">From age range:</p>
            <p className="font-mono text-sm">Duration = End Age - Start Age</p>
          </div>
          <div>
            <p className="font-medium">From frequency text:</p>
            <p className="font-mono text-sm">Duration = Years mentioned in frequency (e.g., "for 10 years")</p>
          </div>
          <div>
            <p className="font-medium">Default duration:</p>
            <p className="font-mono text-sm">Duration = 30 years (if no other information available)</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="font-medium">Cost Calculations</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div>
            <p className="font-medium">Annual Cost (recurring items):</p>
            <p className="font-mono text-sm">Annual Cost = Base Rate × Annual Frequency</p>
          </div>
          <div>
            <p className="font-medium">Lifetime Cost (recurring items):</p>
            <p className="font-mono text-sm">Lifetime Cost = Annual Cost × Duration</p>
          </div>
          <div>
            <p className="font-medium">One-time Cost:</p>
            <p className="font-mono text-sm">Lifetime Cost = Base Rate</p>
          </div>
          <div>
            <p className="font-medium">Category Total:</p>
            <p className="font-mono text-sm">Sum of all item costs in the category</p>
          </div>
          <div>
            <p className="font-medium">Grand Total:</p>
            <p className="font-mono text-sm">Sum of all category totals</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="font-medium">Cost Range Calculations</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div>
            <p className="font-medium">From CPT code:</p>
            <p className="font-mono text-sm">Low = Average of (MFR 50th and PFR 50th)</p>
            <p className="font-mono text-sm">High = Average of (MFR 75th and PFR 75th)</p>
            <p className="font-mono text-sm">Average = Average of (Low and High)</p>
          </div>
          <div>
            <p className="font-medium">Geographic adjustment:</p>
            <p className="font-mono text-sm">Average Factor = (MFR Factor + PFR Factor) ÷ 2</p>
            <p className="font-mono text-sm">Combined Rate × Average Geographic Factor</p>
          </div>
          <div>
            <p className="font-medium">Multiple sources:</p>
            <p className="font-mono text-sm">Low = Minimum value</p>
            <p className="font-mono text-sm">Average = Mean of values (excluding outliers)</p>
            <p className="font-mono text-sm">High = Maximum value</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md mt-4">
        <p className="text-sm">
          <strong>Note:</strong> All financial calculations use Decimal.js with banker's rounding to ensure precision and avoid floating-point errors.
        </p>
        <p className="text-sm mt-2">
          <strong>Important:</strong> The system uses the average of MFR and PFR geographic factors for all cost calculations to ensure consistent geographic adjustments.
        </p>
      </div>
    </div>
  );
};

export default GlobalCalculationInfo;
