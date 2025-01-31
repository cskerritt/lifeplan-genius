export interface Evaluee {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
}

export interface CareItem {
  id: string;
  category: string;
  service: string;
  frequency: string;
  cptCode: string;
  costPerUnit: number;
  annualCost: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}