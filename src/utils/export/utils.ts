
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
  console.log('Calculating category total for items:', items);
  return items.reduce((sum, item) => {
    // Skip one-time items for annual totals
    if (isOneTimeItem(item)) {
      console.log('Skipping one-time item:', item);
      return sum;
    }
    console.log('Adding annual cost:', item.annualCost);
    return sum + item.annualCost;
  }, 0);
};

export const calculateOneTimeTotal = (items: CareItem[]) => {
  console.log('Calculating one-time total for items:', items);
  return items.reduce((sum, item) => {
    if (isOneTimeItem(item)) {
      // For one-time items, use the average of the cost range
      console.log('Adding one-time item cost:', item.costRange.average);
      return sum + item.costRange.average;
    }
    return sum;
  }, 0);
};

export const calculateCategoryOneTimeTotal = (items: CareItem[]) => {
  console.log('Calculating category one-time total for items:', items);
  return items.reduce((sum, item) => {
    if (isOneTimeItem(item)) {
      console.log('Adding category one-time cost:', item.costRange.average);
      return sum + item.costRange.average;
    }
    return sum;
  }, 0);
};
