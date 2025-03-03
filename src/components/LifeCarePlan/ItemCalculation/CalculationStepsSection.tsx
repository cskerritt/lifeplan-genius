import React from 'react';
import { CareItem } from "@/types/lifecare";
import { formatCurrency, safeFormat, safeFormatDecimal } from "@/utils/calculations/formatters";
import { FeeScheduleValues } from "@/utils/calculations/feeSchedule";
import Decimal from 'decimal.js';

interface CalculationStepsSectionProps {
  item: CareItem;
  isOneTime: boolean;
  mfrValues: FeeScheduleValues;
  pfrValues: FeeScheduleValues;
  hasMFRData: boolean;
  hasPFRData: boolean;
  hasFeeScheduleData: boolean;
  combinedLow: number;
  combinedHigh: number;
  parsedFrequency: number;
  annualCost: number;
  lifetimeCost: number;
  duration: number;
}

const CalculationStepsSection: React.FC<CalculationStepsSectionProps> = ({
  item,
  isOneTime,
  mfrValues,
  pfrValues,
  hasMFRData,
  hasPFRData,
  hasFeeScheduleData,
  combinedLow,
  combinedHigh,
  parsedFrequency,
  annualCost,
  lifetimeCost,
  duration
}) => {
  // Calculate the average of MFR and PFR factors
  const avgGeoFactor = new Decimal(mfrValues.factor).plus(pfrValues.factor).dividedBy(2);
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Calculation Steps</h3>
      <div className="space-y-4">
        {/* Base Rate Calculation */}
        {hasFeeScheduleData && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Base Rate Calculation</h4>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="font-mono text-sm">
                Base Rate = Average of Fee Schedule Percentiles with Geographic Adjustment
              </div>
              {hasMFRData && hasPFRData && (
                <>
                  <div className="font-mono text-sm mt-1">
                    MFR 50th: ${safeFormatDecimal(mfrValues.min, 2)}
                  </div>
                  <div className="font-mono text-sm">
                    MFR Factor: {safeFormatDecimal(mfrValues.factor)}
                  </div>
                  <div className="font-mono text-sm">
                    Adjusted MFR 50th: ${safeFormatDecimal(mfrValues.min * mfrValues.factor, 2)}
                  </div>
                  <div className="font-mono text-sm mt-1">
                    PFR 50th: ${safeFormatDecimal(pfrValues.min, 2)}
                  </div>
                  <div className="font-mono text-sm">
                    PFR Factor: {safeFormatDecimal(pfrValues.factor)}
                  </div>
                  <div className="font-mono text-sm">
                    Adjusted PFR 50th: ${safeFormatDecimal(pfrValues.min * pfrValues.factor, 2)}
                  </div>
                  <div className="font-mono text-sm">
                    Average Low: (${safeFormatDecimal(mfrValues.min * mfrValues.factor, 2)} + ${safeFormatDecimal(pfrValues.min * pfrValues.factor, 2)}) ÷ 2 = ${safeFormatDecimal(combinedLow, 2)}
                  </div>
                  {mfrValues.max > 0 && pfrValues.max > 0 && (
                    <>
                      <div className="font-mono text-sm mt-1">
                        MFR 75th: ${safeFormatDecimal(mfrValues.max, 2)}
                      </div>
                      <div className="font-mono text-sm">
                        Adjusted MFR 75th: ${safeFormatDecimal(mfrValues.max * mfrValues.factor, 2)}
                      </div>
                      <div className="font-mono text-sm mt-1">
                        PFR 75th: ${safeFormatDecimal(pfrValues.max, 2)}
                      </div>
                      <div className="font-mono text-sm">
                        Adjusted PFR 75th: ${safeFormatDecimal(pfrValues.max * pfrValues.factor, 2)}
                      </div>
                      <div className="font-mono text-sm">
                        Average High: (${safeFormatDecimal(mfrValues.max * mfrValues.factor, 2)} + ${safeFormatDecimal(pfrValues.max * pfrValues.factor, 2)}) ÷ 2 = ${safeFormatDecimal(combinedHigh, 2)}
                      </div>
                    </>
                  )}
                </>
              )}
              {hasMFRData && !hasPFRData && (
                <div className="font-mono text-sm mt-1">
                  Using MFR: ${safeFormatDecimal(mfrValues.min, 2)} to ${safeFormatDecimal(mfrValues.max, 2)}
                </div>
              )}
              {!hasMFRData && hasPFRData && (
                <div className="font-mono text-sm mt-1">
                  Using PFR: ${safeFormatDecimal(pfrValues.min, 2)} to ${safeFormatDecimal(pfrValues.max, 2)}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Base rates are derived from MFR and/or PFR fee schedules</p>
            </div>
          </div>
        )}
        
        {/* Geographic Adjustment Step */}
        {(mfrValues.factor !== 1 || pfrValues.factor !== 1) && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Geographic Adjustment Calculation</h4>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="font-mono text-sm">
                Base Rate × Geographic Factor = Adjusted Base Rate
              </div>
              {mfrValues.factor !== 1 && mfrValues.min > 0 && (
                <div className="font-mono text-sm mt-1">
                  MFR: ${safeFormatDecimal(mfrValues.min, 2)} × {safeFormatDecimal(mfrValues.factor)} = ${safeFormatDecimal(mfrValues.min * mfrValues.factor, 2)}
                </div>
              )}
              {pfrValues.factor !== 1 && pfrValues.min > 0 && (
                <div className="font-mono text-sm mt-1">
                  PFR: ${safeFormatDecimal(pfrValues.min, 2)} × {safeFormatDecimal(pfrValues.factor)} = ${safeFormatDecimal(pfrValues.min * pfrValues.factor, 2)}
                </div>
              )}
              {mfrValues.factor !== 1 && pfrValues.factor !== 1 && (
                <div className="font-mono text-sm mt-2 bg-blue-50 p-1 rounded">
                  <div className="font-medium">Average Geographic Factor Calculation:</div>
                  <div>Avg Factor = (MFR Factor + PFR Factor) ÷ 2</div>
                  <div>Avg Factor = ({safeFormatDecimal(mfrValues.factor)} + {safeFormatDecimal(pfrValues.factor)}) ÷ 2 = {safeFormatDecimal(avgGeoFactor.toNumber())}</div>
                  <div className="mt-1">Combined Base Rate × Avg Factor = Final Adjusted Rate</div>
                  <div>Low: ${safeFormatDecimal(combinedLow / avgGeoFactor.toNumber(), 2)} × {safeFormatDecimal(avgGeoFactor.toNumber())} = ${safeFormatDecimal(combinedLow, 2)}</div>
                  <div>High: ${safeFormatDecimal(combinedHigh / avgGeoFactor.toNumber(), 2)} × {safeFormatDecimal(avgGeoFactor.toNumber())} = ${safeFormatDecimal(combinedHigh, 2)}</div>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Geographic factors adjust base rates based on location</p>
              {mfrValues.factor !== 1 && pfrValues.factor !== 1 && (
                <p className="text-blue-600 mt-1"><strong>Note:</strong> The average of MFR and PFR factors is used for final cost calculations</p>
              )}
            </div>
          </div>
        )}
        
        {!isOneTime && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Annual Cost Calculation</h4>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="font-mono text-sm">
                Adjusted Base Rate × Annual Frequency = Annual Cost
              </div>
              <div className="font-mono text-sm mt-1">
                {formatCurrency(item.costRange.average)} × {parsedFrequency} = {formatCurrency(annualCost)}
              </div>
              {mfrValues.factor !== 1 && pfrValues.factor !== 1 && (
                <div className="bg-blue-50 p-1 mt-2 rounded">
                  <div className="font-mono text-sm text-blue-700">
                    <strong>Note:</strong> The base rate of {formatCurrency(item.costRange.average)} already includes the average geographic factor adjustment of {safeFormatDecimal(avgGeoFactor.toNumber())}
                  </div>
                  <div className="font-mono text-xs text-blue-600 mt-1">
                    Original Base Rate × Avg Geographic Factor = Adjusted Base Rate
                  </div>
                  <div className="font-mono text-xs text-blue-600">
                    ${safeFormatDecimal(item.costRange.average / avgGeoFactor.toNumber(), 2)} × {safeFormatDecimal(avgGeoFactor.toNumber())} = {formatCurrency(item.costRange.average)}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Using Decimal.js for precise financial calculations</p>
              <p className="font-mono">new Decimal({item.costRange.average}).times({parsedFrequency})</p>
            </div>
          </div>
        )}
        
        <div className="border rounded-md p-3">
          <h4 className="text-sm font-medium mb-2">Lifetime Cost Calculation</h4>
          <div className="bg-gray-50 p-2 rounded-md">
            {isOneTime ? (
              <>
                <div className="font-mono text-sm">
                  Base Rate Range = Lifetime Cost Range (One-time item)
                </div>
                {hasMFRData && hasPFRData ? (
                  <>
                    <div className="font-mono text-sm mt-1">
                      <div>Low: (MFR 50th + PFR 50th) ÷ 2 = {formatCurrency(item.costRange.low)}</div>
                      <div>High: (MFR 75th + PFR 75th) ÷ 2 = {formatCurrency(item.costRange.high)}</div>
                      <div>Average: (Low + High) ÷ 2 = {formatCurrency(item.costRange.average)} = {formatCurrency(lifetimeCost)}</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Using Decimal.js for precise financial calculations</p>
                      <p className="font-mono">Low: new Decimal({item.costRange.low})</p>
                      <p className="font-mono">Average: new Decimal({item.costRange.average})</p>
                      <p className="font-mono">High: new Decimal({item.costRange.high})</p>
                      <p className="font-mono">Values should be different if GAF adjustments are applied correctly</p>
                    </div>
                  </>
                ) : (
                  <div className="font-mono text-sm mt-1">
                    <div>Low: {formatCurrency(item.costRange.low)}</div>
                    <div>Average: {formatCurrency(item.costRange.average)} = {formatCurrency(lifetimeCost)}</div>
                    <div>High: {formatCurrency(item.costRange.high)}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Values should be different if GAF adjustments are applied correctly</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-mono text-sm">
                  Annual Cost × Duration = Lifetime Cost
                </div>
                <div className="font-mono text-sm mt-1">
                  {formatCurrency(annualCost)} × {duration} = {formatCurrency(lifetimeCost)}
                </div>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>Using Decimal.js for precise financial calculations</p>
            {isOneTime ? (
              <>
                <p className="font-mono">Low: new Decimal({item.costRange.low})</p>
                <p className="font-mono">Average: new Decimal({item.costRange.average})</p>
                <p className="font-mono">High: new Decimal({item.costRange.high})</p>
              </>
            ) : (
              <p className="font-mono">new Decimal({annualCost}).times({duration})</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationStepsSection;
