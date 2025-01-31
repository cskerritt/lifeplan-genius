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
    city?: string;
    state_name?: string;
  } | null;
}

export default function DemographicsDisplay({ ageData, geoFactors }: DemographicsDisplayProps) {
  const formatNumber = (value: number | undefined | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(4);
  };

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
            <p className="text-sm text-gray-500">MFR (Medicare Fee Relative)</p>
            <p className="text-2xl font-bold">{formatNumber(geoFactors?.mfr_code)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">PFR (Private Fee Relative)</p>
            <p className="text-2xl font-bold">{formatNumber(geoFactors?.pfr_code)}</p>
          </div>
          {geoFactors?.city && geoFactors?.state_name && (
            <div className="col-span-2 mt-2">
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-lg">{geoFactors.city}, {geoFactors.state_name}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}