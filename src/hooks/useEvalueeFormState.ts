
import { useState, useEffect } from 'react';
import { Evaluee } from '@/types/lifecare';

export function useEvalueeFormState(initialData?: Evaluee | null) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    dateOfInjury: "",
    gender: "",
    city: "",
    state: "",
    zipCode: "",
    lifeExpectancy: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        dateOfBirth: initialData.dateOfBirth || "",
        dateOfInjury: initialData.dateOfInjury || "",
        gender: initialData.gender || "",
        city: initialData.city || "",
        state: initialData.state || "",
        zipCode: initialData.zipCode || "",
        lifeExpectancy: initialData.lifeExpectancy || "",
      });
    }
  }, [initialData]);

  const updateFormData = (newData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  return { formData, updateFormData };
}
