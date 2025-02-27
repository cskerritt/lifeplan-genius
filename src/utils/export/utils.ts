import { CareItem } from '@/types/lifecare';
import { 
  isOneTimeFrequency, 
  calculateAgeFromDOB,
  determineDuration,
  calculateDurationFromAgeRange
} from '@/utils/calculations';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN }); // Using banker's rounding

/**
 * Group items by their category
 * @param items - The items to group
 * @returns An object with categories as keys and arrays of items as values
 */
export const groupItemsByCategory = (items: CareItem[]) => {
  if (!Array.isArray(items)) {
    console.error('Expected items to be an array but got:', items);
    return {};
  }
  
  return items.reduce<Record<string, CareItem[]>>((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
};

/**
 * Determine if an item is a one-time occurrence
 * @param item - The item to check
 * @returns True if the item is a one-time occurrence
 */
export const isOneTimeItem = (item: CareItem) => {
  // First check if the item has an isOneTime property
  if (item.isOneTime !== undefined) {
    return item.isOneTime;
  }
  
  // Otherwise, use the frequency parser to determine if it's one-time
  return isOneTimeFrequency(item.frequency);
};

/**
 * Calculate the total annual cost for a category
 * @param items - The items in the category
 * @returns The total annual cost
 */
export const calculateCategoryTotal = (items: CareItem[]) => {
  return items
    .filter((item) => !isOneTimeItem(item))
    .reduce((total, item) => {
      // Use Decimal.js for precise financial calculations
      return new Decimal(total).plus(item.annualCost).toNumber();
    }, 0);
};

/**
 * Calculate the total one-time cost for all items
 * @param items - The items to calculate for
 * @returns The total one-time cost
 */
export const calculateOneTimeTotal = (items: CareItem[]) => {
  return items
    .filter((item) => isOneTimeItem(item))
    .reduce((total, item) => {
      // Use Decimal.js for precise financial calculations
      return new Decimal(total).plus(item.costRange.average).toNumber();
    }, 0);
};

/**
 * Calculate the total one-time cost for a category
 * @param items - The items in the category
 * @returns The total one-time cost
 */
export const calculateCategoryOneTimeTotal = (items: CareItem[]) => {
  return items
    .filter((item) => isOneTimeItem(item))
    .reduce((total, item) => {
      // Use Decimal.js for precise financial calculations
      return new Decimal(total).plus(item.costRange.average).toNumber();
    }, 0);
};

/**
 * Calculate the duration for an item as a string
 * @param item - The item to calculate duration for
 * @returns The duration as a string
 */
export const calculateItemDuration = (item: CareItem): string => {
  if (isOneTimeItem(item)) {
    return "N/A (One-time)";
  }
  
  // Use the duration calculator to determine the duration
  const duration = getItemDuration(item);
  
  // Return as string
  return duration.toString();
};

/**
 * Calculate the lifetime cost for an item
 * @param item - The item to calculate for
 * @returns The lifetime cost
 */
export const calculateLifetimeCost = (item: CareItem): number => {
  if (isOneTimeItem(item)) {
    return item.costRange.average; // For one-time items, just return the average cost
  }
  
  const duration = getItemDuration(item);
  
  // For recurring items, multiply annual cost by duration
  // Use Decimal.js for precise financial calculations
  return new Decimal(item.annualCost).times(duration).toNumber();
};

/**
 * Get the duration in years for an item
 * @param item - The item to get duration for
 * @returns The duration in years
 */
export const getItemDuration = (item: CareItem): number => {
  if (isOneTimeItem(item)) {
    return 1; // One-time items occur once
  }
  
  // If we have both startAge and endAge, calculate the duration
  if (item.startAge !== undefined && item.endAge !== undefined) {
    if (item.endAge < item.startAge) {
      console.warn(`Invalid age range for item ${item.id}: endAge (${item.endAge}) < startAge (${item.startAge})`);
      return 1; // Minimum duration
    }
    
    // Use the duration calculator to calculate from age range
    return calculateDurationFromAgeRange(item.startAge, item.endAge);
  }
  
  // Use the duration calculator to determine the duration from frequency
  const parsedDuration = determineDuration(item.frequency);
  
  // Return the average of low and high duration
  return Math.round((parsedDuration.lowDuration + parsedDuration.highDuration) / 2);
};

/**
 * Calculate the total lifetime cost for a category
 * @param items - The items in the category
 * @returns The total lifetime cost
 */
export const calculateCategoryLifetimeCost = (items: CareItem[]): number => {
  return items.reduce((total, item) => {
    // Use Decimal.js for precise financial calculations
    return new Decimal(total).plus(calculateLifetimeCost(item)).toNumber();
  }, 0);
};

/**
 * Get the effective age range for a category based on its items
 * @param items - The items in the category
 * @param defaultStartAge - The default start age to use if not available from items
 * @param defaultEndAge - The default end age to use if not available from items
 * @returns The start and end ages for the category
 */
export const getCategoryAgeRange = (
  items: CareItem[],
  defaultStartAge?: number,
  defaultEndAge?: number
): { startAge?: number; endAge?: number } => {
  const nonOneTimeItems = items.filter(item => !isOneTimeItem(item));
  
  if (nonOneTimeItems.length === 0) {
    return { startAge: defaultStartAge, endAge: defaultEndAge };
  }
  
  // Process items with defined start ages
  const itemsWithStartAge = nonOneTimeItems.filter(item => item.startAge !== undefined);
  const itemsWithEndAge = nonOneTimeItems.filter(item => item.endAge !== undefined);
  
  // If no items have defined ages but defaults are provided, use those
  if (itemsWithStartAge.length === 0 && itemsWithEndAge.length === 0) {
    return { startAge: defaultStartAge, endAge: defaultEndAge };
  }
  
  // Calculate start age (use default if no items have defined start age)
  let startAge: number | undefined;
  if (itemsWithStartAge.length > 0) {
    startAge = Math.min(...itemsWithStartAge.map(item => item.startAge!));
  } else {
    startAge = defaultStartAge;
  }
  
  // Calculate end age (use default if no items have defined end age)
  let endAge: number | undefined;
  if (itemsWithEndAge.length > 0) {
    endAge = Math.max(...itemsWithEndAge.map(item => item.endAge!));
  } else {
    endAge = defaultEndAge;
  }
  
  return { startAge, endAge };
};
