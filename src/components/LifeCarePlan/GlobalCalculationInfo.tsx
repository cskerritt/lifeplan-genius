import React from 'react';
import { Separator } from "@/components/ui/separator";

const GlobalCalculationInfo: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Calculation Formulas</h3>
      
      <div className="space-y-2">
        <h4 className="font-medium">Frequency Calculations</h4>
        <div className="bg-gray-50 p-3 rounded-md space-y-2">
          <div>
            <p className="font-medium">Daily:</p>
            <p className="font-mono text-sm">365 times per year</p>
          </div>
          <div>
            <p className="font-medium">Weekly:</p>
            <p className="font-mono text-sm">52.1429 times per year</p>
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
            <p className="font-medium">Biweekly:</p>
            <p className="font-mono text-sm">26 times per year</p>
          </div>
          <div>
            <p className="font-medium">Twice weekly:</p>
            <p className="font-mono text-sm">104 times per year</p>
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
            <p className="font-mono text-sm">Low = 50th percentile rate</p>
            <p className="font-mono text-sm">Average = 75th percentile rate</p>
            <p className="font-mono text-sm">High = 90th percentile rate</p>
          </div>
          <div>
            <p className="font-medium">Geographic adjustment:</p>
            <p className="font-mono text-sm">Rate × Geographic Factor for ZIP code</p>
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
      </div>
    </div>
  );
};

export default GlobalCalculationInfo;
