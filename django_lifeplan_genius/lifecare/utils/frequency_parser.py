import re
from datetime import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal

def parse_frequency(frequency_str):
    """
    Parse a frequency string into a structured format
    
    Args:
        frequency_str: A string describing the frequency (e.g., "2x per year", "monthly")
        
    Returns:
        A dictionary with the parsed frequency information
    """
    if not frequency_str:
        return {
            'valid': False,
            'error': 'Frequency string is empty',
            'isOneTime': False,
            'lowFrequency': 0,
            'highFrequency': 0
        }
    
    # Check for one-time items
    if 'one time' in frequency_str.lower() or 'once' in frequency_str.lower():
        return {
            'valid': True,
            'isOneTime': True,
            'lowFrequency': 1,
            'highFrequency': 1
        }
    
    # Regular expressions for common patterns
    patterns = [
        # "Nx per year" pattern
        (r'(\d+)x per year', lambda m: (Decimal(m.group(1)), Decimal(m.group(1)))),
        
        # "N times per year" pattern
        (r'(\d+) times? per year', lambda m: (Decimal(m.group(1)), Decimal(m.group(1)))),
        
        # "Every N months" pattern
        (r'every (\d+) months?', lambda m: (Decimal('12') / Decimal(m.group(1)), Decimal('12') / Decimal(m.group(1)))),
        
        # "Monthly" pattern
        (r'monthly', lambda m: (Decimal('12'), Decimal('12'))),
        
        # "Weekly" pattern
        (r'weekly', lambda m: (Decimal('52'), Decimal('52'))),
        
        # "Daily" pattern
        (r'daily', lambda m: (Decimal('365'), Decimal('365'))),
        
        # "N-M times per year" pattern
        (r'(\d+)-(\d+) times? per year', lambda m: (Decimal(m.group(1)), Decimal(m.group(2)))),
    ]
    
    # Try each pattern
    for pattern, handler in patterns:
        match = re.search(pattern, frequency_str.lower())
        if match:
            low_freq, high_freq = handler(match)
            return {
                'valid': True,
                'isOneTime': False,
                'lowFrequency': low_freq,
                'highFrequency': high_freq
            }
    
    # If no pattern matches
    return {
        'valid': False,
        'error': f'Could not parse frequency: {frequency_str}',
        'isOneTime': False,
        'lowFrequency': 0,
        'highFrequency': 0
    }

def parse_duration(frequency_str, current_age, life_expectancy, start_age=None, end_age=None):
    """
    Parse duration from frequency string and age parameters
    
    Args:
        frequency_str: A string describing the frequency
        current_age: The current age of the evaluee
        life_expectancy: The life expectancy of the evaluee
        start_age: Optional start age for the care item
        end_age: Optional end age for the care item
        
    Returns:
        A dictionary with the parsed duration information
    """
    if not frequency_str:
        return {
            'valid': False,
            'error': 'Frequency string is empty',
            'lowDuration': 0,
            'highDuration': 0
        }
    
    # Use provided start/end ages if available
    if start_age is not None and end_age is not None:
        if start_age > end_age:
            return {
                'valid': False,
                'error': 'Start age cannot be greater than end age',
                'lowDuration': 0,
                'highDuration': 0
            }
        
        duration = end_age - start_age
        return {
            'valid': True,
            'lowDuration': Decimal(str(duration)),
            'highDuration': Decimal(str(duration))
        }
    
    # Check for one-time items
    if 'one time' in frequency_str.lower() or 'once' in frequency_str.lower():
        return {
            'valid': True,
            'lowDuration': Decimal('1'),
            'highDuration': Decimal('1')
        }
    
    # Default to using life expectancy
    if life_expectancy is None:
        life_expectancy = 30.5  # Default value
    
    remaining_years = Decimal(str(life_expectancy)) - Decimal(str(current_age))
    
    # Regular expressions for duration patterns
    duration_patterns = [
        # "For N years" pattern
        (r'for (\d+) years?', lambda m: (Decimal(m.group(1)), Decimal(m.group(1)))),
        
        # "For N-M years" pattern
        (r'for (\d+)-(\d+) years?', lambda m: (Decimal(m.group(1)), Decimal(m.group(2)))),
        
        # "Lifetime" pattern
        (r'lifetime', lambda m: (remaining_years, remaining_years)),
    ]
    
    # Try each pattern
    for pattern, handler in duration_patterns:
        match = re.search(pattern, frequency_str.lower())
        if match:
            low_duration, high_duration = handler(match)
            return {
                'valid': True,
                'lowDuration': low_duration,
                'highDuration': high_duration
            }
    
    # If no pattern matches, default to remaining lifetime
    return {
        'valid': True,
        'lowDuration': remaining_years,
        'highDuration': remaining_years
    }

def calculate_duration_from_age_increments(age_increments):
    """
    Calculate the total duration from a list of age increments
    
    Args:
        age_increments: A list of age increment objects
        
    Returns:
        The total duration in years
    """
    if not age_increments:
        return Decimal('0')
    
    total_duration = Decimal('0')
    
    for increment in age_increments:
        start_age = Decimal(str(increment.get('startAge', 0)))
        end_age = Decimal(str(increment.get('endAge', 0)))
        
        if end_age > start_age:
            total_duration += end_age - start_age
    
    return total_duration
