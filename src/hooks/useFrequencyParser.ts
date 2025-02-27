
import { 
  parseFrequency as parseFrequencyUtil, 
  parseDuration as parseDurationUtil,
  isOneTimeFrequency
} from '@/utils/calculations';
import { ParsedFrequency, ParsedDuration } from '@/utils/calculations/types';
import { useCallback } from 'react';

/**
 * Hook for parsing frequency and duration strings
 * This is a wrapper around the centralized frequency parser utilities
 * to maintain backward compatibility with existing code
 */
export const useFrequencyParser = () => {
  /**
   * Parse a frequency string to determine the number of occurrences per year
   * @param frequency - The frequency string to parse
   * @returns An object with lowFrequency and highFrequency properties
   */
  const parseFrequency = useCallback((frequency: string): { lowFrequency: number; highFrequency: number } => {
    const result = parseFrequencyUtil(frequency);
    
    // Log the result for debugging
    console.log('Parsed frequency:', { 
      lowFrequency: result.lowFrequency, 
      highFrequency: result.highFrequency,
      isOneTime: result.isOneTime
    });
    
    // Return only the properties that the original hook returned
    // to maintain backward compatibility
    return { 
      lowFrequency: result.lowFrequency, 
      highFrequency: result.highFrequency 
    };
  }, []);

  /**
   * Parse duration information from a frequency string
   * @param frequency - The frequency string to parse
   * @param currentAge - The current age of the evaluee
   * @param lifeExpectancy - The life expectancy of the evaluee
   * @returns An object with lowDuration and highDuration properties
   */
  const parseDuration = useCallback((
    frequency: string, 
    currentAge?: number, 
    lifeExpectancy?: number
  ): { lowDuration: number; highDuration: number } => {
    const result = parseDurationUtil(frequency, currentAge, lifeExpectancy);
    
    // Log the result for debugging
    console.log('Parsed duration:', { 
      lowDuration: result.lowDuration, 
      highDuration: result.highDuration,
      source: result.source
    });
    
    // Return only the properties that the original hook returned
    // to maintain backward compatibility
    return { 
      lowDuration: result.lowDuration, 
      highDuration: result.highDuration 
    };
  }, []);

  return {
    parseFrequency,
    parseDuration,
    isOneTimeFrequency
  };
};
