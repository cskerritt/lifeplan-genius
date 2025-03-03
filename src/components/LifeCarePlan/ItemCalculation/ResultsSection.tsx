import React from 'react';
import { formatCurrency } from "@/utils/calculations/formatters";

interface ResultsSectionProps {
  isOneTime: boolean;
  annualCost: number;
  lifetimeCost: number;
  costRangeLow: number;
  costRangeHigh: number;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  isOneTime,
  annualCost,
  lifetimeCost,
  costRangeLow,
  costRangeHigh
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Final Results</h3>
      <div className="grid grid-cols-2 gap-4">
        {!isOneTime && (
          <div className="border rounded-md p-3 bg-blue-50">
            <h4 className="text-sm font-medium mb-1">Annual Cost</h4>
            <p className="text-xl font-semibold">{formatCurrency(annualCost)}</p>
            <p className="text-xs text-gray-600 mt-1">
              Base rate × Frequency = Annual cost
            </p>
          </div>
        )}
        
        <div className="border rounded-md p-3 bg-green-50">
          <h4 className="text-sm font-medium mb-1">Lifetime Cost</h4>
          {isOneTime ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm">Low:</span>
                <span className="font-semibold">{formatCurrency(costRangeLow)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average:</span>
                <span className="font-semibold">{formatCurrency(lifetimeCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">High:</span>
                <span className="font-semibold">{formatCurrency(costRangeHigh)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Base rate range (one-time cost)
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">{formatCurrency(lifetimeCost)}</p>
              <p className="text-xs text-gray-600 mt-1">
                Annual cost × Duration
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;
