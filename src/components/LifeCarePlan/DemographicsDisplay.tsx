import React from 'react';
import { Label } from "@/components/ui/label";

interface DemographicsDisplayProps {
  ageData: {
    ageToday: number;
    ageAtInjury: number;
    projectedAgeAtDeath: number;
  };
  geoFactors: {
    mfr_factor: number;
    pfr_factor: number;
  } | null;
}

export default function DemographicsDisplay({ ageData, geoFactors }: DemographicsDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Age Information</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Age Today</Label>
            <div className="text-2xl font-bold mt-1">{ageData.ageToday}</div>
          </div>
          <div>
            <Label>Age at Injury</Label>
            <div className="text-2xl font-bold mt-1">{ageData.ageAtInjury}</div>
          </div>
          <div>
            <Label>Projected Age at Death</Label>
            <div className="text-2xl font-bold mt-1">{ageData.projectedAgeAtDeath.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {geoFactors && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Geographic Adjustment Factors</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>MFR</Label>
              <div className="text-2xl font-bold mt-1">{geoFactors.mfr_factor?.toFixed(4)}</div>
            </div>
            <div>
              <Label>PFR</Label>
              <div className="text-2xl font-bold mt-1">{geoFactors.pfr_factor?.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}