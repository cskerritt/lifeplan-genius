import Decimal from 'decimal.js';
import { CostCalculationParams, CalculatedCosts, CostRange, GeoFactors } from './types';
import { AgeIncrement } from '@/types/lifecare';
import calculationLogger from './logger';
import geoFactorsService from './services/geoFactorsService';
import cptCodeService from './services/cptCodeService';
import multiSourceCostService from './services/multiSourceCostService';
import adjustedCostService from './services/adjustedCostService';
import itemCostService from './services/itemCostService';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN }); // Using banker's rounding

/**
 * Default values for cost calculations
 */
const DEFAULT_VALUES = {
  // Default geographic factors when none are available
  geoFactors: geoFactorsService.DEFAULT_GEO_FACTORS,
  // Default life expectancy when not provided
  lifeExpectancy: itemCostService.DEFAULT_LIFE_EXPECTANCY,
};

/**
 * Utility functions for cost calculations
 */
const costCalculator = {
  // Geographic factors
  fetchGeoFactors: geoFactorsService.fetchGeoFactors,
  applyGeoFactors: geoFactorsService.applyGeoFactors,
  
  // CPT code lookup
  lookupCPTCode: cptCodeService.lookupCPTCode,
  hasMfuData: cptCodeService.hasMfuData,
  hasPfrData: cptCodeService.hasPfrData,
  
  // Multi-source cost calculations
  calculateMultiSourceCosts: multiSourceCostService.calculateMultiSourceCosts,
  
  // Adjusted cost calculations
  calculateAdjustedCosts: adjustedCostService.calculateAdjustedCosts,
  
  // Item cost calculations
  calculateItemCosts: itemCostService.calculateItemCosts,
  calculateItemCostsWithAgeIncrements: itemCostService.calculateItemCostsWithAgeIncrements,
  
  // Default values
  DEFAULT_VALUES,
};

export default costCalculator;

// Export individual functions for direct imports
export const {
  fetchGeoFactors,
  applyGeoFactors,
  lookupCPTCode,
  hasMfuData,
  hasPfrData,
  calculateMultiSourceCosts,
  calculateAdjustedCosts,
  calculateItemCosts,
  calculateItemCostsWithAgeIncrements
} = costCalculator;
