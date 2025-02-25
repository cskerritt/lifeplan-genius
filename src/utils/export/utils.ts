
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
  return items.reduce((sum, item) => {
    // If it's a one-time cost, don't include it in the annual total
    if (item.isOneTime || item.frequency.toLowerCase().includes('one-time')) {
      return sum;
    }
    return sum + item.annualCost;
  }, 0);
};

export const calculateOneTimeTotal = (items: CareItem[]) => {
  return items.reduce((sum, item) => {
    if (item.isOneTime || item.frequency.toLowerCase().includes('one-time')) {
      return sum + item.costRange.average;
    }
    return sum;
  }, 0);
};

export const calculateCategoryOneTimeTotal = (items: CareItem[]) => {
  return items.reduce((sum, item) => {
    if (item.isOneTime || item.frequency.toLowerCase().includes('one-time')) {
      return sum + item.costRange.average;
    }
    return sum;
  }, 0);
};
