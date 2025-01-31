import { useState, useEffect } from 'react';

interface AgeData {
  ageToday: number;
  ageAtInjury: number;
  projectedAgeAtDeath: number;
}

interface AgeCalculationInputs {
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
}

export function useAgeCalculations(inputs: AgeCalculationInputs): AgeData {
  const [ageData, setAgeData] = useState<AgeData>({
    ageToday: 0,
    ageAtInjury: 0,
    projectedAgeAtDeath: 0
  });

  useEffect(() => {
    if (!inputs.dateOfBirth) return;

    const today = new Date();
    const birth = new Date(inputs.dateOfBirth);
    const injury = inputs.dateOfInjury ? new Date(inputs.dateOfInjury) : null;
    const le = parseFloat(inputs.lifeExpectancy) || 0;

    let ageToday = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      ageToday--;
    }

    let ageAtInjury = 0;
    if (injury) {
      ageAtInjury = injury.getFullYear() - birth.getFullYear();
      const m2 = injury.getMonth() - birth.getMonth();
      if (m2 < 0 || (m2 === 0 && injury.getDate() < birth.getDate())) {
        ageAtInjury--;
      }
    }

    const projectedAgeAtDeath = ageToday + le;

    setAgeData({
      ageToday,
      ageAtInjury,
      projectedAgeAtDeath
    });
  }, [inputs.dateOfBirth, inputs.dateOfInjury, inputs.lifeExpectancy]);

  return ageData;
}