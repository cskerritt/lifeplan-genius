
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

export const isOneTimeItem = (item: CareItem): boolean => {
  const frequency = item.frequency.toLowerCase();
  return item.isOneTime || frequency.includes('one-time') || frequency.includes('one time');
};

export const calculateCategoryTotal = (items: CareItem[]) => {
  return items.reduce((sum, item) => {
    // Skip one-time items for annual totals
    if (isOneTimeItem(item)) {
      return sum;
    }
    return sum + item.annualCost;
  }, 0);
};

export const calculateOneTimeTotal = (items: CareItem[]) => {
  return items.reduce((sum, item) => {
    if (isOneTimeItem(item)) {
      // For one-time items, use the average of the cost range
      return sum + item.costRange.average;
    }
    return sum;
  }, 0);
};

export const calculateCategoryOneTimeTotal = (items: CareItem[]) => {
  return items.reduce((sum, item) => {
    if (isOneTimeItem(item)) {
      return sum + item.costRange.average;
    }
    return sum;
  }, 0);
};
