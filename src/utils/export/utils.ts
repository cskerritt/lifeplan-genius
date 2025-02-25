
import { CareItem } from '@/types/lifecare';

export const groupItemsByCategory = (items: CareItem[]) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CareItem[]>);
};

export const calculateCategoryTotal = (items: CareItem[]) => {
  return items.reduce((sum, item) => sum + item.annualCost, 0);
};

export const calculateOneTimeTotal = (items: CareItem[]) => {
  return items
    .filter(item => item.isOneTime)
    .reduce((sum, item) => sum + item.costRange.average, 0);
};
