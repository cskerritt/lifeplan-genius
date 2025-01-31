import React from 'react';
import { Card } from "@/components/ui/card";

interface DemographicsDisplayProps {
  ageData: {
    ageToday: number;
    ageAtInjury: number;
    projectedAgeAtDeath: number;
  };
  geoFactors: {
    mfr_code: number;
    pfr_code: number;
  } | null;
}

export default function DemographicsDisplay({ ageData, geoFactors }: DemographicsDisplayProps) {
  console.log('GAF values:', geoFactors); // Debug log

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Age Information</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Age Today</p>
            <p className="text-2xl font-bold">{ageData.ageToday}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age at Injury</p>
            <p className="text-2xl font-bold">{ageData.ageAtInjury}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Projected Age at Death</p>
            <p className="text-2xl font-bold">{ageData.projectedAgeAtDeath.toFixed(1)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Geographic Adjustment Factors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">MFR</p>
            <p className="text-2xl font-bold">
              {geoFactors?.mfr_code ? geoFactors.mfr_code.toFixed(4) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">PFR</p>
            <p className="text-2xl font-bold">
              {geoFactors?.pfr_code ? geoFactors.pfr_code.toFixed(4) : 'N/A'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}