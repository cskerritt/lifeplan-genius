
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

interface AgeData {
  ageToday: number;
  ageAtInjury: number;
  projectedAgeAtDeath: number;
  formattedDateOfBirth?: string;
  formattedDateOfInjury?: string;
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
    const birth = parseISO(inputs.dateOfBirth);
    const injury = inputs.dateOfInjury ? parseISO(inputs.dateOfInjury) : null;
    const le = parseFloat(inputs.lifeExpectancy) || 0;

    // Calculate age today
    let ageToday = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      ageToday--;
    }

    // Calculate age at injury
    let ageAtInjury = 0;
    if (injury) {
      ageAtInjury = injury.getFullYear() - birth.getFullYear();
      const m2 = injury.getMonth() - birth.getMonth();
      if (m2 < 0 || (m2 === 0 && injury.getDate() < birth.getDate())) {
        ageAtInjury--;
      }
    }

    const projectedAgeAtDeath = ageToday + le;

    // Format dates consistently
    const formattedDateOfBirth = format(birth, 'MM/dd/yyyy');
    const formattedDateOfInjury = injury ? format(injury, 'MM/dd/yyyy') : undefined;

    setAgeData({
      ageToday,
      ageAtInjury,
      projectedAgeAtDeath,
      formattedDateOfBirth,
      formattedDateOfInjury
    });
  }, [inputs.dateOfBirth, inputs.dateOfInjury, inputs.lifeExpectancy]);

  return ageData;
}
