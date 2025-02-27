import { CategoryTotal, CareItem } from '@/types/lifecare';

export interface ExportData {
  planId: string;
  evalueeName: string;
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  lifetimeLow: number;
  lifetimeHigh: number;
  lifeExpectancy?: string;
  dateOfBirth?: string;
  dateOfInjury?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  ageAtInjury?: number;
  statisticalLifespan?: number;
  race?: string;
  countyAPC?: string;
  countyDRG?: string;
  createdAt?: string;
  updatedAt?: string;
}
