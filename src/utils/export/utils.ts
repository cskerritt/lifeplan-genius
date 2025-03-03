import { AgeIncrement, CareItem } from '@/types/lifecare';
import { 
  isOneTimeFrequency, 
  calculateAgeFromDOB,
  determineDuration,
  calculateDurationFromAgeRange,
  calculateDurationFromAgeIncrements
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
  
  // First, try to extract years from the frequency string
  const frequencyLower = item.frequency.toLowerCase();
  
  // Check for years at the end of the string (e.g., "4-4x per year 29 years")
  const fullYearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)$/i);
  if (fullYearMatch) {
    return fullYearMatch[1];
  }
  
  // Check for any year pattern in the string
  const yearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (yearMatch) {
    return yearMatch[1];
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
  
  // Check if using age increments with different frequencies
  if (item.useAgeIncrements && item.ageIncrements && item.ageIncrements.length > 0) {
    // Calculate costs for each age increment
    let totalCost = new Decimal(0);
    
    for (const increment of item.ageIncrements) {
      // Skip one-time increments as they're handled separately
      if (increment.isOneTime) {
        totalCost = totalCost.plus(item.costRange.average);
        continue;
      }
      
      // Parse frequency for this increment
      const frequency = isOneTimeFrequency(increment.frequency) ? 0 : 
        parseFrequencyValue(increment.frequency);
      
      // Calculate duration for this increment
      const duration = increment.endAge - increment.startAge;
      
      // Calculate the annual cost for this specific increment based on its frequency
      let incrementAnnualCost = item.annualCost;
      
      // If the parent item has a different frequency than this increment,
      // we need to adjust the annual cost proportionally
      if (item.frequency !== increment.frequency) {
        // Extract numeric values from frequencies for comparison
        const itemFreqMatch = item.frequency.match(/(\d+)x/i);
        const incFreqMatch = increment.frequency.match(/(\d+)x/i);
        
        if (itemFreqMatch && incFreqMatch) {
          const itemFreq = parseInt(itemFreqMatch[1]);
          const incFreq = parseInt(incFreqMatch[1]);
          
          if (itemFreq > 0) {
            // Adjust annual cost based on frequency ratio
            incrementAnnualCost = (item.annualCost / itemFreq) * incFreq;
          }
        }
      }
      
      // Calculate cost for this increment using the adjusted annual cost
      const incrementCost = new Decimal(incrementAnnualCost)
        .times(duration);
      
      // Add to total cost
      totalCost = totalCost.plus(incrementCost);
    }
    
    return totalCost.toNumber();
  }
  
  // First, try to extract years from the frequency string
  const frequencyLower = item.frequency.toLowerCase();
  
  // Check for years at the end of the string (e.g., "4-4x per year 29 years")
  const fullYearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)$/i);
  if (fullYearMatch) {
    const years = parseInt(fullYearMatch[1]);
    return new Decimal(item.annualCost).times(years).toNumber();
  }
  
  // Check for any year pattern in the string
  const yearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    return new Decimal(item.annualCost).times(years).toNumber();
  }
  
  const duration = getItemDuration(item);
  
  // For recurring items, multiply annual cost by duration
  // Use Decimal.js for precise financial calculations
  return new Decimal(item.annualCost).times(duration).toNumber();
};

/**
 * Parse a frequency string to get a numeric value
 * @param frequency - The frequency string to parse
 * @returns The numeric frequency value
 */
export const parseFrequencyValue = (frequency: string): number => {
  // Extract numeric value from frequency string
  const match = frequency.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Default to 1 if no numeric value found
  return 1;
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
  
  // First, try to extract years from the frequency string
  const frequencyLower = item.frequency.toLowerCase();
  
  // Check for years at the end of the string (e.g., "4-4x per year 29 years")
  const fullYearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)$/i);
  if (fullYearMatch) {
    return parseInt(fullYearMatch[1]);
  }
  
  // Check for any year pattern in the string
  const yearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (yearMatch) {
    return parseInt(yearMatch[1]);
  }
  
  // Check if using age increments
  if (item.useAgeIncrements && item.ageIncrements && item.ageIncrements.length > 0) {
    // Use the duration calculator to calculate from age increments
    return calculateDurationFromAgeIncrements(item.ageIncrements);
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
  // Handle empty items array
  if (!items || items.length === 0) {
    return { startAge: defaultStartAge, endAge: defaultEndAge };
  }
  
  const nonOneTimeItems = items.filter(item => !isOneTimeItem(item));
  
  if (nonOneTimeItems.length === 0) {
    return { startAge: defaultStartAge, endAge: defaultEndAge };
  }
  
  // Process items with age increments
  const itemsWithAgeIncrements = nonOneTimeItems.filter(
    item => item.useAgeIncrements && item.ageIncrements && item.ageIncrements.length > 0
  );
  
  if (itemsWithAgeIncrements.length > 0) {
    // Collect all start and end ages from age increments
    const allStartAges: number[] = [];
    const allEndAges: number[] = [];
    
    itemsWithAgeIncrements.forEach(item => {
      if (item.ageIncrements) {
        item.ageIncrements.forEach(increment => {
          // Ensure we have valid numbers
          if (typeof increment.startAge === 'number' && !isNaN(increment.startAge)) {
            allStartAges.push(increment.startAge);
          }
          if (typeof increment.endAge === 'number' && !isNaN(increment.endAge)) {
            allEndAges.push(increment.endAge);
          }
        });
      }
    });
    
    // Find the minimum start age and maximum end age
    if (allStartAges.length > 0 && allEndAges.length > 0) {
      const minStartAge = Math.min(...allStartAges);
      const maxEndAge = Math.max(...allEndAges);
      
      return { startAge: minStartAge, endAge: maxEndAge };
    }
  }
  
  // Process items with defined start ages
  const itemsWithStartAge = nonOneTimeItems.filter(item => 
    item.startAge !== undefined && typeof item.startAge === 'number' && !isNaN(item.startAge)
  );
  const itemsWithEndAge = nonOneTimeItems.filter(item => 
    item.endAge !== undefined && typeof item.endAge === 'number' && !isNaN(item.endAge)
  );
  
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
