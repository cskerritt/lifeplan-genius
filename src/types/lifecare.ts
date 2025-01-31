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

export interface CostRange {
  low: number;
  average: number;
  high: number;
}

export interface GeographicAdjustment {
  region: string;
  factor: number;
}

export interface CareItem {
  id: string;
  category: CareCategory;
  service: string;
  frequency: string;
  cptCode: string;
  costPerUnit: number;
  annualCost: number;
  costRange: CostRange;
  geographicAdjustment?: GeographicAdjustment;
}

export type CareCategory =
  | "physician"
  | "medication"
  | "surgical"
  | "dme"
  | "supplies"
  | "homeCare"
  | "homeModification"
  | "transportation";

export interface CategoryTotal {
  category: CareCategory;
  total: number;
  costRange: CostRange;
}

export interface CPTCode {
  code: string;
  description: string;
  base_rate_50th: number;
  base_rate_75th: number;
  mfr_factor?: number;
  pfr_factor?: number;
}

export interface SurgicalComponent {
  surgeonFee: CostRange;
  anesthesiaFee: CostRange;
  facilityFee: CostRange;
  total: CostRange;
}

export interface MedicationDetails {
  name: string;
  dosage: string;
  quantity: number;
  priceQuotes: number[];
  costRange: CostRange;
}

export interface LifeCarePlan {
  id: string;
  evalueeId: string;
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: CostRange;
  createdAt: string;
  updatedAt: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  date_of_injury: string;
  race: string;
  gender: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  county_apc: string;
  county_drg: string;
  statistical_lifespan?: number;
}