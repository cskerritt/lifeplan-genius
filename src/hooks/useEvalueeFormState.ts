import { useState } from 'react';

export function useEvalueeFormState() {
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

  const updateFormData = (newData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  return { formData, updateFormData };
}