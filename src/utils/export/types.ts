
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
}
