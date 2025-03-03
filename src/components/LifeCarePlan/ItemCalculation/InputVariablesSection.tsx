import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CareItem } from "@/types/lifecare";
import { formatCurrency, safeFormat, safeFormatDecimal } from "@/utils/calculations/formatters";
import { FeeScheduleValues } from "@/utils/calculations/feeSchedule";
import Decimal from 'decimal.js';

interface InputVariablesSectionProps {
  item: CareItem;
  parsedFrequency: number;
  isOneTime: boolean;
  mfrValues: FeeScheduleValues;
  pfrValues: FeeScheduleValues;
  hasMFRData: boolean;
  hasPFRData: boolean;
  hasFeeScheduleData: boolean;
  combinedLow: number;
  combinedHigh: number;
  combinedAvg: number;
  duration: number;
  currentAge?: number;
  lifeExpectancy?: number;
}

const InputVariablesSection: React.FC<InputVariablesSectionProps> = ({
  item,
  parsedFrequency,
  isOneTime,
  mfrValues,
  pfrValues,
  hasMFRData,
  hasPFRData,
  hasFeeScheduleData,
  combinedLow,
  combinedHigh,
  combinedAvg,
  duration,
  currentAge,
  lifeExpectancy
}) => {
  // Calculate the average of MFR and PFR factors
  const avgGeoFactor = new Decimal(mfrValues.factor).plus(pfrValues.factor).dividedBy(2);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Input Variables</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md p-3">
          <h4 className="text-sm font-medium mb-1">Base Rate (Raw)</h4>
          <div className="flex justify-between">
            <span className="text-sm">Low:</span>
            <span className="font-mono text-sm">{formatCurrency(item.costRange.low)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Average:</span>
            <span className="font-mono text-sm">{formatCurrency(item.costRange.average)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">High:</span>
            <span className="font-mono text-sm">{formatCurrency(item.costRange.high)}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            <strong>Raw base rates before any multipliers</strong>
          </div>
        </div>
        
        {/* MFR and PFR Percentiles */}
        {hasFeeScheduleData && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-1">Fee Schedule Percentiles</h4>
            {hasMFRData && (
              <div className="mb-2">
                <p className="text-xs text-gray-500">MFR</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">50th Percentile:</p>
                    <p className="text-sm">{safeFormat(mfrValues.min)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">75th Percentile:</p>
                    <p className="text-sm">{safeFormat(mfrValues.max)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Geographic Factor:</p>
                    <p className="text-sm">{safeFormatDecimal(mfrValues.factor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Adjusted Average:</p>
                    <p className="text-sm">{safeFormat(mfrValues.avg * mfrValues.factor)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {hasPFRData && (
              <div className="mb-2">
                <p className="text-xs text-gray-500">PFR</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">50th Percentile:</p>
                    <p className="text-sm">{safeFormat(pfrValues.min)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">75th Percentile:</p>
                    <p className="text-sm">{safeFormat(pfrValues.max)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Geographic Factor:</p>
                    <p className="text-sm">{safeFormatDecimal(pfrValues.factor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Adjusted Average:</p>
                    <p className="text-sm">{safeFormat(pfrValues.avg * pfrValues.factor)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {hasMFRData && hasPFRData && (
              <div className="mt-2 bg-blue-50 p-2 rounded">
                <p className="text-xs font-medium text-blue-700">Combined Base Rate (After Geographic Adjustment)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Low:</p>
                    <p className="text-sm">{safeFormat(combinedLow)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">High:</p>
                    <p className="text-sm">{safeFormat(combinedHigh)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average:</p>
                    <p className="text-sm">{safeFormat(combinedAvg)}</p>
                  </div>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  <strong>Note:</strong> These values have already been adjusted using the average geographic factor of {safeFormatDecimal(avgGeoFactor.toNumber())}
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  <strong>Calculation:</strong> Raw Base Rate × Avg Geographic Factor = Combined Base Rate
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="border rounded-md p-3">
          <h4 className="text-sm font-medium mb-1">Frequency</h4>
          <div className="flex justify-between">
            <span className="text-sm">Raw:</span>
            <span className="font-mono text-sm">{item.frequency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Annual:</span>
            <span className="font-mono text-sm">{parsedFrequency} times/year</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Type:</span>
            <Badge variant="outline" className={isOneTime ? "bg-blue-50" : "bg-green-50"}>
              {isOneTime ? "One-time" : "Recurring"}
            </Badge>
          </div>
        </div>
        
        <div className="border rounded-md p-3">
          <h4 className="text-sm font-medium mb-1">Duration</h4>
          {item.startAge && (
            <div className="flex justify-between">
              <span className="text-sm">Start Age:</span>
              <span className="font-mono text-sm">{item.startAge} years</span>
            </div>
          )}
          {item.endAge && (
            <div className="flex justify-between">
              <span className="text-sm">End Age:</span>
              <span className="font-mono text-sm">{item.endAge} years</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm">Duration:</span>
            <span className="font-mono text-sm">{duration} years</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {item.startAge && item.endAge 
              ? "Calculated from age range" 
              : "Using default duration"}
          </div>
        </div>
        
        {item.cptCode && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-1">CPT Code Info</h4>
            <div className="flex justify-between">
              <span className="text-sm">Code:</span>
              <span className="font-mono text-sm">{item.cptCode}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Base rates derived from CPT code data
            </div>
          </div>
        )}
        
        {/* Geographic Adjustment Factors */}
        {(mfrValues.factor !== 1 || pfrValues.factor !== 1) && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-1">Geographic Adjustments</h4>
            {mfrValues.factor !== 1 && (
              <div className="flex justify-between">
                <span className="text-sm">MFR Factor:</span>
                <span className="font-mono text-sm">{safeFormatDecimal(mfrValues.factor)}</span>
              </div>
            )}
            {pfrValues.factor !== 1 && (
              <div className="flex justify-between">
                <span className="text-sm">PFR Factor:</span>
                <span className="font-mono text-sm">{safeFormatDecimal(pfrValues.factor)}</span>
              </div>
            )}
            {mfrValues.factor !== 1 && pfrValues.factor !== 1 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-600">Average Factor:</span>
                <span className="font-mono text-sm font-medium text-blue-600">{safeFormatDecimal(avgGeoFactor.toNumber())}</span>
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              Geographic adjustment factors applied to base rates
            </div>
            {mfrValues.factor !== 1 && pfrValues.factor !== 1 && (
              <div className="mt-1 text-xs text-blue-600">
                <strong>Note:</strong> The average of MFR and PFR factors is used for cost calculations
              </div>
            )}
          </div>
        )}
        
        {currentAge && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-1">Patient Info</h4>
            <div className="flex justify-between">
              <span className="text-sm">Current Age:</span>
              <span className="font-mono text-sm">{currentAge} years</span>
            </div>
            {lifeExpectancy && (
              <div className="flex justify-between">
                <span className="text-sm">Life Expectancy:</span>
                <span className="font-mono text-sm">{lifeExpectancy} years</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputVariablesSection;
