// Interactive Calculation Debugger Module
// This module provides functions for the interactive calculation debugger UI

// Standalone implementation - no imports from project source code
// This allows the debugger to work without requiring the project's TypeScript files

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Frequency parsing functions
function parseFrequency(frequencyStr) {
    if (!frequencyStr) {
        return { lowFrequency: 0, highFrequency: 0, isOneTime: false, valid: false, error: 'No frequency provided' };
    }
    
    const frequencyLower = frequencyStr.toLowerCase().trim();
    
    // Check for one-time frequencies
    if (frequencyLower === 'one-time' || frequencyLower === 'once' || frequencyLower === 'one time') {
        return { lowFrequency: 0, highFrequency: 0, isOneTime: true, valid: true, original: frequencyStr };
    }
    
    // Handle common frequencies
    if (frequencyLower === 'daily') {
        return { lowFrequency: 365, highFrequency: 365, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    if (frequencyLower === 'weekly') {
        return { lowFrequency: 52, highFrequency: 52, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    if (frequencyLower === 'monthly') {
        return { lowFrequency: 12, highFrequency: 12, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    if (frequencyLower === 'quarterly') {
        return { lowFrequency: 4, highFrequency: 4, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    if (frequencyLower === 'annually' || frequencyLower === 'yearly') {
        return { lowFrequency: 1, highFrequency: 1, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    // Handle multipliers (e.g., 2x daily, 3x weekly)
    const multiplierMatch = frequencyLower.match(/^(\d+)x\s+(daily|weekly|monthly|quarterly|annually|yearly)$/);
    if (multiplierMatch) {
        const multiplier = parseInt(multiplierMatch[1], 10);
        const period = multiplierMatch[2];
        
        let baseFrequency = 0;
        if (period === 'daily') baseFrequency = 365;
        else if (period === 'weekly') baseFrequency = 52;
        else if (period === 'monthly') baseFrequency = 12;
        else if (period === 'quarterly') baseFrequency = 4;
        else if (period === 'annually' || period === 'yearly') baseFrequency = 1;
        
        const frequency = baseFrequency * multiplier;
        return { lowFrequency: frequency, highFrequency: frequency, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    // Handle "every X" patterns (e.g., every 2 days, every 3 weeks)
    const everyMatch = frequencyLower.match(/^every\s+(\d+)\s+(days?|weeks?|months?|years?)$/);
    if (everyMatch) {
        const interval = parseInt(everyMatch[1], 10);
        const period = everyMatch[2].replace(/s$/, ''); // Remove trailing 's' if present
        
        let baseFrequency = 0;
        if (period === 'day') baseFrequency = 365;
        else if (period === 'week') baseFrequency = 52;
        else if (period === 'month') baseFrequency = 12;
        else if (period === 'year') baseFrequency = 1;
        
        const frequency = baseFrequency / interval;
        return { lowFrequency: frequency, highFrequency: frequency, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    // Handle "X per Y" patterns (e.g., 2 per week, 3 per month)
    const perMatch = frequencyLower.match(/^(\d+)\s+(?:times\s+)?per\s+(day|week|month|year)$/);
    if (perMatch) {
        const times = parseInt(perMatch[1], 10);
        const period = perMatch[2];
        
        let baseFrequency = 0;
        if (period === 'day') baseFrequency = 365;
        else if (period === 'week') baseFrequency = 52;
        else if (period === 'month') baseFrequency = 12;
        else if (period === 'year') baseFrequency = 1;
        
        const frequency = baseFrequency * (times / 1); // times per 1 period
        return { lowFrequency: frequency, highFrequency: frequency, isOneTime: false, valid: true, original: frequencyStr };
    }
    
    // If we couldn't parse the frequency, return an error
    return { lowFrequency: 0, highFrequency: 0, isOneTime: false, valid: false, error: `Could not parse frequency: ${frequencyStr}`, original: frequencyStr };
}

function isOneTimeFrequency(frequencyStr) {
    const result = parseFrequency(frequencyStr);
    return result.isOneTime;
}

// Duration calculation function
function calculateDuration(params) {
    const { startAge, endAge, lifeExpectancy } = params;
    
    if (startAge === undefined || startAge === null) {
        return { lowDuration: 0, highDuration: 0, valid: false, error: 'No start age provided', source: 'default' };
    }
    
    if (lifeExpectancy === undefined || lifeExpectancy === null) {
        return { lowDuration: 0, highDuration: 0, valid: false, error: 'No life expectancy provided', source: 'default' };
    }
    
    // If end age is provided, use it to calculate duration
    if (endAge !== undefined && endAge !== null) {
        if (endAge < startAge) {
            return { lowDuration: 0, highDuration: 0, valid: false, error: 'End age cannot be less than start age', source: 'age-range' };
        }
        
        return { lowDuration: endAge - startAge, highDuration: endAge - startAge, valid: true, source: 'age-range' };
    }
    
    // If no end age, use life expectancy
    if (startAge > lifeExpectancy) {
        return { lowDuration: 0, highDuration: 0, valid: false, error: 'Start age cannot be greater than life expectancy', source: 'default' };
    }
    
    return { lowDuration: lifeExpectancy - startAge, highDuration: lifeExpectancy - startAge, valid: true, source: 'default' };
}

// Validation function
function validateCalculationParams(params) {
    // Check required parameters
    if (!params.baseRate && params.baseRate !== 0) {
        return { valid: false, error: 'Base rate is required' };
    }
    
    if (!params.frequency) {
        return { valid: false, error: 'Frequency is required' };
    }
    
    // Validate numeric values
    if (typeof params.baseRate !== 'number' || isNaN(params.baseRate)) {
        return { valid: false, error: 'Base rate must be a number' };
    }
    
    if (params.baseRate < 0) {
        return { valid: false, error: 'Base rate cannot be negative' };
    }
    
    return { valid: true };
}

// Strategy pattern implementation
class CostCalculationStrategy {
    async calculate(params) {
        throw new Error('Method not implemented');
    }
}

class OneTimeCostStrategy extends CostCalculationStrategy {
    async calculate(params) {
        const baseRate = params.baseRate || 0;
        
        return {
            annual: 0,
            lifetime: baseRate,
            low: baseRate,
            high: baseRate,
            average: baseRate,
            isOneTime: true
        };
    }
}

class RecurringCostStrategy extends CostCalculationStrategy {
    async calculate(params) {
        const baseRate = params.baseRate || 0;
        const frequencyResult = parseFrequency(params.frequency);
        const durationResult = calculateDuration({
            startAge: params.startAge || params.currentAge,
            endAge: params.endAge,
            lifeExpectancy: params.lifeExpectancy
        });
        
        if (!frequencyResult.valid) {
            throw new Error(`Failed to parse frequency: ${frequencyResult.error}`);
        }
        
        if (!durationResult.valid) {
            throw new Error(`Failed to calculate duration: ${durationResult.error}`);
        }
        
        const frequency = frequencyResult.lowFrequency;
        const duration = durationResult.lowDuration;
        
        const annual = baseRate * frequency;
        const lifetime = annual * duration;
        
        return {
            annual,
            lifetime,
            low: lifetime * 0.9, // Simplified range calculation
            high: lifetime * 1.1,
            average: lifetime,
            isOneTime: false
        };
    }
}

class CostCalculationStrategyFactory {
    static createStrategy(params) {
        if (isOneTimeFrequency(params.frequency)) {
            return new OneTimeCostStrategy();
        } else {
            return new RecurringCostStrategy();
        }
    }
}

// Global state for tracking calculation steps and intermediate values
let calculationSteps = [];
let calculationState = {};
let calculationStateHistory = [];
let calculationCode = '';

/**
 * Run a calculation with the given parameters
 * @param {Object} params - Calculation parameters
 * @returns {Promise<Object>} - Calculation result
 */
export async function runCalculation(params) {
    // Reset state
    calculationSteps = [];
    calculationState = {};
    calculationStateHistory = [];
    calculationCode = '';
    
    try {
        // Log the initial parameters
        addCalculationStep('Initialize Parameters', `Input parameters: ${JSON.stringify(params, null, 2)}`);
        updateState('params', params);
        
        // Validate parameters
        addCalculationStep('Validate Parameters', 'Checking if all required parameters are provided and valid');
        const validationResult = validateParams(params);
        if (!validationResult.valid) {
            throw new Error(`Invalid parameters: ${validationResult.error}`);
        }
        updateState('validationResult', validationResult);
        
        // Parse frequency
        addCalculationStep('Parse Frequency', `Parsing frequency: "${params.frequency}"`);
        const frequencyResult = await parseFrequencyWithLogging(params.frequency);
        updateState('frequencyResult', frequencyResult);
        
        // Calculate duration
        addCalculationStep('Calculate Duration', 'Calculating duration based on age parameters');
        const durationResult = await calculateDurationWithLogging(params);
        updateState('durationResult', durationResult);
        
        // Determine if one-time
        const isOneTime = isOneTimeFrequency(params.frequency);
        addCalculationStep('Check Frequency Type', `Is one-time frequency: ${isOneTime}`);
        updateState('isOneTime', isOneTime);
        
        // Get CPT code data if provided
        let cptData = null;
        if (params.cptCode) {
            addCalculationStep('Lookup CPT Code', `Looking up CPT code: ${params.cptCode}`);
            cptData = await lookupCPTCode(params.cptCode);
            updateState('cptData', cptData);
        }
        
        // Get geographic factors if provided
        let geoFactors = { mfr_factor: 1.0, pfr_factor: 1.0 };
        if (params.zipCode) {
            addCalculationStep('Get Geographic Factors', `Getting geographic factors for ZIP code: ${params.zipCode}`);
            geoFactors = await getGeographicFactors(params.zipCode);
            updateState('geoFactors', geoFactors);
        }
        
        // Calculate costs using strategy pattern
        addCalculationStep('Select Calculation Strategy', `Selecting appropriate calculation strategy based on parameters`);
        const strategy = CostCalculationStrategyFactory.createStrategy(params);
        updateState('strategy', strategy.constructor.name);
        
        addCalculationStep('Execute Calculation', 'Executing calculation using selected strategy');
        const result = await calculateWithStrategy(strategy, params);
        updateState('result', result);
        
        // Apply age increments if provided
        if (params.ageIncrements && Array.isArray(params.ageIncrements) && params.ageIncrements.length > 0) {
            addCalculationStep('Apply Age Increments', 'Applying age-based adjustment factors');
            const adjustedResult = await applyAgeIncrements(result, params);
            updateState('adjustedResult', adjustedResult);
            
            addCalculationStep('Finalize Result', 'Calculation complete with age increments applied');
            return adjustedResult;
        }
        
        addCalculationStep('Finalize Result', 'Calculation complete');
        return result;
    } catch (error) {
        addCalculationStep('Error', `Calculation error: ${error.message}`);
        throw error;
    }
}

/**
 * Get the calculation steps and state
 * @returns {Object} - Calculation steps and state
 */
export function getCalculationSteps() {
    return {
        steps: calculationSteps,
        state: calculationState,
        stateHistory: calculationStateHistory,
        code: calculationCode
    };
}

/**
 * Add a calculation step
 * @param {string} title - Step title
 * @param {string} content - Step content
 */
function addCalculationStep(title, content) {
    calculationSteps.push({
        title,
        content
    });
}

/**
 * Update the calculation state
 * @param {string} key - State key
 * @param {any} value - State value
 */
function updateState(key, value) {
    calculationState = {
        ...calculationState,
        [key]: value
    };
    
    // Save a copy of the current state in history
    calculationStateHistory.push({...calculationState});
}

/**
 * Validate calculation parameters
 * @param {Object} params - Calculation parameters
 * @returns {Object} - Validation result
 */
function validateParams(params) {
    try {
        // Check required parameters
        if (!params.baseRate && params.baseRate !== 0) {
            return { valid: false, error: 'Base rate is required' };
        }
        
        if (!params.frequency) {
            return { valid: false, error: 'Frequency is required' };
        }
        
        // Validate numeric values
        if (typeof params.baseRate !== 'number' || isNaN(params.baseRate)) {
            return { valid: false, error: 'Base rate must be a number' };
        }
        
        if (params.baseRate < 0) {
            return { valid: false, error: 'Base rate cannot be negative' };
        }
        
        // Validate age parameters if provided
        if (params.currentAge !== undefined) {
            if (typeof params.currentAge !== 'number' || isNaN(params.currentAge)) {
                return { valid: false, error: 'Current age must be a number' };
            }
            
            if (params.currentAge < 0) {
                return { valid: false, error: 'Current age cannot be negative' };
            }
        }
        
        if (params.lifeExpectancy !== undefined) {
            if (typeof params.lifeExpectancy !== 'number' || isNaN(params.lifeExpectancy)) {
                return { valid: false, error: 'Life expectancy must be a number' };
            }
            
            if (params.lifeExpectancy < 0) {
                return { valid: false, error: 'Life expectancy cannot be negative' };
            }
        }
        
        if (params.startAge !== undefined) {
            if (typeof params.startAge !== 'number' || isNaN(params.startAge)) {
                return { valid: false, error: 'Start age must be a number' };
            }
            
            if (params.startAge < 0) {
                return { valid: false, error: 'Start age cannot be negative' };
            }
        }
        
        if (params.endAge !== undefined) {
            if (typeof params.endAge !== 'number' || isNaN(params.endAge)) {
                return { valid: false, error: 'End age must be a number' };
            }
            
            if (params.endAge < 0) {
                return { valid: false, error: 'End age cannot be negative' };
            }
            
            if (params.startAge !== undefined && params.endAge < params.startAge) {
                return { valid: false, error: 'End age cannot be less than start age' };
            }
        }
        
        // Validate age increments if provided
        if (params.ageIncrements && Array.isArray(params.ageIncrements)) {
            for (const increment of params.ageIncrements) {
                if (!increment.startAge || !increment.endAge || !increment.adjustmentFactor) {
                    return { valid: false, error: 'Age increments must have startAge, endAge, and adjustmentFactor' };
                }
                
                if (increment.startAge >= increment.endAge) {
                    return { valid: false, error: 'Age increment end age must be greater than start age' };
                }
                
                if (increment.adjustmentFactor <= 0) {
                    return { valid: false, error: 'Age increment adjustment factor must be positive' };
                }
            }
        }
        
        return { valid: true };
    } catch (error) {
        return { valid: false, error: `Validation error: ${error.message}` };
    }
}

/**
 * Parse frequency with logging
 * @param {string} frequencyStr - Frequency string
 * @returns {Object} - Parsed frequency
 */
async function parseFrequencyWithLogging(frequencyStr) {
    try {
        const result = parseFrequency(frequencyStr);
        
        if (!result.valid) {
            addCalculationStep('Frequency Error', `Failed to parse frequency: ${result.error}`);
            throw new Error(`Failed to parse frequency: ${result.error}`);
        }
        
        addCalculationStep('Frequency Result', `
Parsed frequency: ${frequencyStr}
Low frequency: ${result.lowFrequency} times per year
High frequency: ${result.highFrequency} times per year
Is one-time: ${result.isOneTime}
        `);
        
        return result;
    } catch (error) {
        addCalculationStep('Frequency Error', `Error parsing frequency: ${error.message}`);
        throw error;
    }
}

/**
 * Calculate duration with logging
 * @param {Object} params - Calculation parameters
 * @returns {Object} - Duration result
 */
async function calculateDurationWithLogging(params) {
    try {
        const durationParams = {
            startAge: params.startAge || params.currentAge,
            endAge: params.endAge,
            lifeExpectancy: params.lifeExpectancy
        };
        
        const result = calculateDuration(durationParams);
        
        if (!result.valid) {
            addCalculationStep('Duration Error', `Failed to calculate duration: ${result.error}`);
            throw new Error(`Failed to calculate duration: ${result.error}`);
        }
        
        addCalculationStep('Duration Result', `
Duration calculation:
Start age: ${durationParams.startAge}
End age: ${durationParams.endAge || 'Not specified (using life expectancy)'}
Life expectancy: ${durationParams.lifeExpectancy}
Low duration: ${result.lowDuration} years
High duration: ${result.highDuration} years
Source: ${result.source}
        `);
        
        return result;
    } catch (error) {
        addCalculationStep('Duration Error', `Error calculating duration: ${error.message}`);
        throw error;
    }
}

/**
 * Lookup CPT code
 * @param {string} cptCode - CPT code
 * @returns {Object} - CPT code data
 */
async function lookupCPTCode(cptCode) {
    try {
        // Mock CPT code data for testing
        // In a real implementation, this would call the actual CPT code service
        const mockData = {
            '99213': {
                code: '99213',
                code_description: 'Office/outpatient visit, new patient',
                mfr_50th: 150.00,
                mfr_75th: 200.00,
                pfr_50th: 175.00,
                pfr_75th: 225.00
            },
            '97110': {
                code: '97110',
                code_description: 'Physical therapy',
                mfr_50th: 120.00,
                mfr_75th: 160.00,
                pfr_50th: 140.00,
                pfr_75th: 180.00
            }
        };
        
        const cptData = mockData[cptCode] || null;
        
        if (!cptData) {
            addCalculationStep('CPT Code Warning', `CPT code not found: ${cptCode}. Using base rate instead.`);
            return null;
        }
        
        addCalculationStep('CPT Code Result', `
CPT code data for ${cptCode}:
Description: ${cptData.code_description}
MFR 50th percentile: ${formatCurrency(cptData.mfr_50th)}
MFR 75th percentile: ${formatCurrency(cptData.mfr_75th)}
PFR 50th percentile: ${formatCurrency(cptData.pfr_50th)}
PFR 75th percentile: ${formatCurrency(cptData.pfr_75th)}
        `);
        
        return cptData;
    } catch (error) {
        addCalculationStep('CPT Code Error', `Error looking up CPT code: ${error.message}`);
        return null;
    }
}

/**
 * Get geographic factors
 * @param {string} zipCode - ZIP code
 * @returns {Object} - Geographic factors
 */
async function getGeographicFactors(zipCode) {
    try {
        // Mock geographic factors for testing
        // In a real implementation, this would call the actual geographic factors service
        const mockFactors = {
            '90210': { mfr_factor: 1.2, pfr_factor: 1.25 },
            '10001': { mfr_factor: 1.3, pfr_factor: 1.35 },
            '60601': { mfr_factor: 1.1, pfr_factor: 1.15 }
        };
        
        const factors = mockFactors[zipCode] || { mfr_factor: 1.0, pfr_factor: 1.0 };
        
        addCalculationStep('Geographic Factors Result', `
Geographic factors for ZIP code ${zipCode}:
MFR factor: ${factors.mfr_factor.toFixed(2)}
PFR factor: ${factors.pfr_factor.toFixed(2)}
        `);
        
        return factors;
    } catch (error) {
        addCalculationStep('Geographic Factors Error', `Error getting geographic factors: ${error.message}`);
        return { mfr_factor: 1.0, pfr_factor: 1.0 };
    }
}

/**
 * Calculate using strategy
 * @param {Object} strategy - Calculation strategy
 * @param {Object} params - Calculation parameters
 * @returns {Object} - Calculation result
 */
async function calculateWithStrategy(strategy, params) {
    try {
        // Get the strategy name
        const strategyName = strategy.constructor.name;
        
        addCalculationStep('Strategy Selection', `Using ${strategyName} for calculation`);
        
        // Calculate using the strategy
        const result = await strategy.calculate(params);
        
        addCalculationStep('Strategy Result', `
Calculation result using ${strategyName}:
Annual cost: ${formatCurrency(result.annual)}
Lifetime cost: ${formatCurrency(result.lifetime)}
Low cost: ${formatCurrency(result.low)}
High cost: ${formatCurrency(result.high)}
Average cost: ${formatCurrency(result.average)}
Is one-time: ${result.isOneTime}
        `);
        
        return result;
    } catch (error) {
        addCalculationStep('Strategy Error', `Error calculating with strategy: ${error.message}`);
        throw error;
    }
}

/**
 * Apply age increments
 * @param {Object} result - Calculation result
 * @param {Object} params - Calculation parameters
 * @returns {Object} - Adjusted calculation result
 */
async function applyAgeIncrements(result, params) {
    try {
        // Clone the result
        const adjustedResult = { ...result };
        
        // Get age parameters
        const startAge = params.startAge || params.currentAge;
        const endAge = params.endAge || params.lifeExpectancy;
        
        // Sort age increments by start age
        const sortedIncrements = [...params.ageIncrements].sort((a, b) => a.startAge - b.startAge);
        
        addCalculationStep('Age Increments', `
Applying age increments:
Start age: ${startAge}
End age: ${endAge}
Number of increments: ${sortedIncrements.length}
        `);
        
        // Calculate total cost with age increments
        let totalCost = 0;
        let currentAge = startAge;
        
        for (const increment of sortedIncrements) {
            if (currentAge >= endAge) break;
            
            const incrementStartAge = Math.max(currentAge, increment.startAge);
            const incrementEndAge = Math.min(endAge, increment.endAge);
            
            if (incrementStartAge < incrementEndAge) {
                const incrementDuration = incrementEndAge - incrementStartAge;
                const annualCost = result.annual;
                const incrementCost = annualCost * incrementDuration * increment.adjustmentFactor;
                
                addCalculationStep('Age Increment Calculation', `
Age increment from ${incrementStartAge} to ${incrementEndAge}:
Duration: ${incrementDuration} years
Adjustment factor: ${increment.adjustmentFactor}
Annual cost: ${formatCurrency(annualCost)}
Increment cost: ${formatCurrency(incrementCost)}
                `);
                
                totalCost += incrementCost;
            }
            
            currentAge = Math.max(currentAge, increment.endAge);
        }
        
        // Update the result
        adjustedResult.lifetime = totalCost;
        
        addCalculationStep('Age Increments Result', `
Final result after applying age increments:
Annual cost: ${formatCurrency(adjustedResult.annual)}
Lifetime cost: ${formatCurrency(adjustedResult.lifetime)}
Low cost: ${formatCurrency(adjustedResult.low)}
High cost: ${formatCurrency(adjustedResult.high)}
Average cost: ${formatCurrency(adjustedResult.average)}
Is one-time: ${adjustedResult.isOneTime}
        `);
        
        return adjustedResult;
    } catch (error) {
        addCalculationStep('Age Increments Error', `Error applying age increments: ${error.message}`);
        return result;
    }
}

// Mock implementation of the CostCalculationStrategyFactory if not available
if (typeof CostCalculationStrategyFactory === 'undefined') {
    class MockStrategy {
        async calculate(params) {
            const isOneTime = isOneTimeFrequency(params.frequency);
            
            if (isOneTime) {
                return {
                    annual: 0,
                    lifetime: params.baseRate,
                    low: params.baseRate,
                    high: params.baseRate,
                    average: params.baseRate,
                    isOneTime: true
                };
            }
            
            const frequency = 12; // Monthly
            const duration = 10; // 10 years
            
            const annual = params.baseRate * frequency;
            const lifetime = annual * duration;
            
            return {
                annual,
                lifetime,
                low: lifetime * 0.8,
                high: lifetime * 1.2,
                average: lifetime,
                isOneTime: false
            };
        }
    }
    
    global.CostCalculationStrategyFactory = {
        createStrategy: () => new MockStrategy()
    };
}
