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

export interface CostResource {
  name: string;
  cost: number;
}

export interface GeographicFactor {
  id: string;
  zip: string;
  city: string | null;
  state_id: string;
  state_name: string;
  county_fips: string;
  county_name: string;
  mfr_code: string;
  pfr_code: string;
  gaf_lookup: number | null;
  created_at: string | null;
  mfr_factor: number | null;
  pfr_factor: number | null;
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
  costResources?: CostResource[];
  geographicFactor?: GeographicFactor;
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
  code_description: string;
  created_at?: string;
  mfu_50th: number;
  mfu_75th: number;
  mfu_90th: number;
  pfr_50th: number;
  pfr_75th: number;
  pfr_90th: number;
  mfr_factor?: number;
  pfr_factor?: number;
}

export interface LifeCarePlan {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  date_of_injury: string | null;
  race: string;
  gender: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string | null;
  county_apc: string;
  county_drg: string;
  age_at_injury: number | null;
  statistical_lifespan: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VehicleModification {
  item: string;
  cost: number;
}

export interface MedicationDetails {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  pharmacyPrices: CostResource[];
}

export interface SurgicalComponent {
  id: string;
  type: 'professional' | 'anesthesia' | 'facility';
  description: string;
  cptCodes: string[];
  cost: number;
}

export interface SurgicalProcedure {
  name: string;
  components: SurgicalComponent[];
}
