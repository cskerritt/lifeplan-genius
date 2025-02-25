
export const useFrequencyParser = () => {
  const parseFrequency = (frequency: string) => {
    const frequencyMatch = frequency.match(/(\d+)-(\d+)(?:x|times?)?\s*(?:\/|\s+per\s+|\s+a\s+)year/i);
    let lowFrequency = 1;
    let highFrequency = 1;

    if (frequencyMatch) {
      lowFrequency = parseInt(frequencyMatch[1]);
      highFrequency = parseInt(frequencyMatch[2]);
      console.log('Parsed frequency:', { lowFrequency, highFrequency });
    }

    return { lowFrequency, highFrequency };
  };

  const parseDuration = (frequency: string) => {
    const durationMatch = frequency.match(/(\d+)-(\d+)\s*(?:years?|yrs?)/i) ||
                         frequency.match(/for\s+(\d+)-(\d+)\s*(?:years?|yrs?)/i);

    let lowDuration = 5; // Default to 5 years if not specified
    let highDuration = 10; // Default to 10 years if not specified

    if (durationMatch) {
      lowDuration = parseInt(durationMatch[1]);
      highDuration = parseInt(durationMatch[2]);
      console.log('Parsed duration:', { lowDuration, highDuration });
    }

    return { lowDuration, highDuration };
  };

  return {
    parseFrequency,
    parseDuration
  };
};
