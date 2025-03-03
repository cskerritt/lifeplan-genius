from decimal import Decimal, getcontext
import logging
from .frequency_parser import parse_frequency, parse_duration, calculate_duration_from_age_increments
from lifecare.models import GeographicFactor, CPTCode

# Configure Decimal for financial calculations
getcontext().prec = 20
getcontext().rounding = 'ROUND_HALF_EVEN'  # Using banker's rounding

# Set up logging
logger = logging.getLogger(__name__)

# Default values for cost calculations
DEFAULT_VALUES = {
    # Default geographic factors when none are available
    'geoFactors': {
        'mfr_factor': Decimal('1.0'),
        'pfr_factor': Decimal('1.0'),
    },
    # Default life expectancy when not provided
    'lifeExpectancy': Decimal('30.5'),
}

def fetch_geo_factors(zip_code):
    """
    Fetches geographic adjustment factors for a ZIP code
    
    Args:
        zip_code: The ZIP code to fetch factors for
        
    Returns:
        A dictionary with the geographic factors or None if not found
    """
    logger.info(f"Fetching geographic factors for ZIP: {zip_code}")
    
    try:
        geo_factor = GeographicFactor.objects.filter(zip=zip_code).first()
        
        if geo_factor:
            factors = {
                'mfr_factor': geo_factor.mfr_factor or Decimal('1.0'),
                'pfr_factor': geo_factor.pfr_factor or Decimal('1.0'),
            }
            
            logger.info(f"Found geographic factors: {factors}")
            return factors
        
        logger.warning(f"No geographic factors found for ZIP: {zip_code}")
        return None
    except Exception as e:
        logger.error(f"Error fetching geographic factors: {e}")
        return None

def lookup_cpt_code(code):
    """
    Looks up a CPT code to get standard rates
    
    Args:
        code: The CPT code to look up
        
    Returns:
        The CPT code data or None if not found
    """
    logger.info(f"Looking up CPT code: {code}")
    
    try:
        cpt_code = CPTCode.objects.filter(code=code).first()
        
        if cpt_code:
            logger.info(f"Found CPT code data: {cpt_code}")
            return cpt_code
        
        logger.warning(f"No data found for CPT code: {code}")
        return None
    except Exception as e:
        logger.error(f"Error looking up CPT code: {e}")
        return None

def calculate_multi_source_costs(resources):
    """
    Calculates costs from multiple sources and provides statistical measures
    
    Args:
        resources: Array of cost resources
        
    Returns:
        A cost range with low, average, and high values
    """
    logger.info(f"Calculating costs from {len(resources)} sources")
    
    if not resources:
        logger.warning("No resources provided for cost calculation")
        return {'low': Decimal('0'), 'average': Decimal('0'), 'high': Decimal('0')}
    
    # Convert all costs to Decimal for precise calculations
    costs = [Decimal(str(r.get('cost', 0))) for r in resources]
    sorted_costs = sorted(costs)
    
    # Calculate statistical measures
    n = len(sorted_costs)
    q1_index = int(n * 0.25)
    q3_index = int(n * 0.75)
    
    low = sorted_costs[0]
    high = sorted_costs[-1]
    median = (sorted_costs[n//2 - 1] + sorted_costs[n//2]) / 2 if n % 2 == 0 else sorted_costs[n//2]
    
    # Calculate IQR for outlier detection
    q1 = sorted_costs[q1_index]
    q3 = sorted_costs[q3_index]
    iqr = q3 - q1
    lower_bound = q1 - (iqr * Decimal('1.5'))
    upper_bound = q3 + (iqr * Decimal('1.5'))
    
    # Filter out outliers
    valid_costs = [cost for cost in sorted_costs if lower_bound <= cost <= upper_bound]
    
    # Calculate average of valid costs
    average = sum(valid_costs) / len(valid_costs) if valid_costs else Decimal('0')
    
    # Round to 2 decimal places
    result = {
        'low': round(low, 2),
        'average': round(average, 2),
        'high': round(high, 2)
    }
    
    logger.info(f"Calculated multi-source costs: {result}")
    
    return result

def calculate_adjusted_costs(params):
    """
    Calculates adjusted costs based on various factors
    
    Args:
        params: The calculation parameters
        
    Returns:
        A cost range with low, average, and high values
    """
    logger.info(f"Calculating adjusted costs: {params}")
    
    base_rate = Decimal(str(params.get('baseRate', 0)))
    cpt_code = params.get('cptCode')
    category = params.get('category')
    zip_code = params.get('zipCode')
    cost_resources = params.get('costResources', [])
    
    try:
        # Special handling for multi-source costs
        if cost_resources:
            logger.info(f"Using {len(cost_resources)} cost resources for calculation")
            return calculate_multi_source_costs(cost_resources)
        
        # Initialize with base rate
        low = base_rate
        average = base_rate
        high = base_rate
        
        # Adjust based on CPT code if available
        if cpt_code:
            cpt_data = lookup_cpt_code(cpt_code)
            if cpt_data:
                logger.info(f"Adjusting costs based on CPT code data: {cpt_data}")
                low = Decimal(str(cpt_data.pfr_50th))
                average = Decimal(str(cpt_data.pfr_75th))
                high = Decimal(str(cpt_data.pfr_90th))
            else:
                logger.warning(f"No CPT code data found for {cpt_code}, using base rate")
        
        # Apply geographic adjustment if ZIP code is provided
        if zip_code:
            geo_factors = fetch_geo_factors(zip_code)
            if geo_factors:
                logger.info(f"Applying geographic factors: {geo_factors}")
                pfr_factor = Decimal(str(geo_factors.get('pfr_factor', 1.0)))
                
                low = low * pfr_factor
                average = average * pfr_factor
                high = high * pfr_factor
            else:
                logger.warning(f"No geographic factors found for ZIP {zip_code}, using default factors")
        
        # Round to 2 decimal places
        result = {
            'low': round(low, 2),
            'average': round(average, 2),
            'high': round(high, 2)
        }
        
        logger.info(f"Calculated adjusted costs: {result}")
        
        return result
    except Exception as e:
        logger.error(f"Error calculating adjusted costs: {e}")
        # Return base rate as fallback
        return {
            'low': base_rate,
            'average': base_rate,
            'high': base_rate
        }

def calculate_item_costs(params):
    """
    Calculates costs for an item based on frequency, duration, and other factors
    
    Args:
        params: The calculation parameters
        
    Returns:
        A dictionary with the calculated costs
    """
    logger.info(f"Calculating item costs: {params}")
    
    base_rate = Decimal(str(params.get('baseRate', 0)))
    frequency = params.get('frequency', '')
    current_age = Decimal(str(params.get('currentAge', 0)))
    life_expectancy = Decimal(str(params.get('lifeExpectancy', DEFAULT_VALUES['lifeExpectancy'])))
    start_age = params.get('startAge')
    end_age = params.get('endAge')
    cpt_code = params.get('cptCode')
    category = params.get('category')
    zip_code = params.get('zipCode')
    
    try:
        # Parse frequency and duration
        parsed_frequency = parse_frequency(frequency)
        if not parsed_frequency.get('valid', False):
            error_msg = f"Failed to parse frequency: {parsed_frequency.get('error', 'Unknown error')}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        parsed_duration = parse_duration(
            frequency,
            current_age,
            life_expectancy,
            start_age,
            end_age
        )
        
        if not parsed_duration.get('valid', False):
            error_msg = f"Failed to parse duration: {parsed_duration.get('error', 'Unknown error')}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get adjusted costs
        cost_range = calculate_adjusted_costs({
            'baseRate': base_rate,
            'cptCode': cpt_code,
            'category': category,
            'zipCode': zip_code
        })
        
        # Handle one-time items
        if parsed_frequency.get('isOneTime', False):
            logger.info("Processing one-time item")
            return {
                'annual': Decimal('0'),  # One-time items don't have an annual recurring cost
                'lifetime': cost_range['average'],  # The lifetime cost is just the average cost
                'low': cost_range['low'],
                'high': cost_range['high'],
                'average': cost_range['average'],
                'isOneTime': True
            }
        
        # Calculate annual costs for recurring items
        low_annual_cost = Decimal(str(cost_range['low'])) * Decimal(str(parsed_frequency['lowFrequency']))
        high_annual_cost = Decimal(str(cost_range['high'])) * Decimal(str(parsed_frequency['highFrequency']))
        avg_annual_cost = Decimal(str(cost_range['average'])) * (
            Decimal(str(parsed_frequency['lowFrequency'])) + Decimal(str(parsed_frequency['highFrequency']))
        ) / Decimal('2')
        
        logger.info(f"Calculated annual costs: low={low_annual_cost}, high={high_annual_cost}, avg={avg_annual_cost}")
        
        # Calculate lifetime costs
        low_lifetime_cost = low_annual_cost * Decimal(str(parsed_duration['lowDuration']))
        high_lifetime_cost = high_annual_cost * Decimal(str(parsed_duration['highDuration']))
        avg_lifetime_cost = avg_annual_cost * (
            Decimal(str(parsed_duration['lowDuration'])) + Decimal(str(parsed_duration['highDuration']))
        ) / Decimal('2')
        
        logger.info(f"Calculated lifetime costs: low={low_lifetime_cost}, high={high_lifetime_cost}, avg={avg_lifetime_cost}")
        
        # Round to 2 decimal places
        return {
            'annual': round(avg_annual_cost, 2),
            'lifetime': round(avg_lifetime_cost, 2),
            'low': round(low_lifetime_cost, 2),
            'high': round(high_lifetime_cost, 2),
            'average': round(avg_lifetime_cost, 2),
            'isOneTime': False
        }
    except Exception as e:
        logger.error(f"Error calculating item costs: {e}")
        raise

def calculate_item_costs_with_age_increments(params):
    """
    Calculates costs for an item based on age increments
    
    Args:
        params: The calculation parameters including age increments
        
    Returns:
        A dictionary with the calculated costs
    """
    logger.info(f"Calculating item costs with age increments: {params}")
    
    base_rate = Decimal(str(params.get('baseRate', 0)))
    cpt_code = params.get('cptCode')
    category = params.get('category')
    zip_code = params.get('zipCode')
    age_increments = params.get('ageIncrements', [])
    
    try:
        # Get adjusted costs
        cost_range = calculate_adjusted_costs({
            'baseRate': base_rate,
            'cptCode': cpt_code,
            'category': category,
            'zipCode': zip_code
        })
        
        # If no age increments, fall back to standard calculation
        if not age_increments:
            logger.warning("No age increments provided, falling back to standard calculation")
            return calculate_item_costs({
                'baseRate': base_rate,
                'frequency': "1x per year",
                'cptCode': cpt_code,
                'category': category,
                'zipCode': zip_code
            })
        
        # Calculate costs for each age increment
        total_annual_cost = Decimal('0')
        total_lifetime_cost = Decimal('0')
        total_low_cost = Decimal('0')
        total_high_cost = Decimal('0')
        
        # Calculate total duration for annual cost averaging
        total_duration = calculate_duration_from_age_increments(age_increments)
        
        for increment in age_increments:
            # Parse frequency for this increment
            parsed_frequency = parse_frequency(increment.get('frequency', ''))
            if not parsed_frequency.get('valid', False):
                logger.warning(f"Invalid frequency for age increment {increment.get('startAge')}-{increment.get('endAge')}: {parsed_frequency.get('error', 'Unknown error')}")
                continue
            
            # Calculate duration for this increment
            start_age = Decimal(str(increment.get('startAge', 0)))
            end_age = Decimal(str(increment.get('endAge', 0)))
            duration = end_age - start_age
            
            # Skip invalid increments
            if duration <= 0:
                logger.warning(f"Invalid duration for age increment {start_age}-{end_age}")
                continue
            
            # Handle one-time items
            if increment.get('isOneTime', False) or parsed_frequency.get('isOneTime', False):
                total_lifetime_cost += Decimal(str(cost_range['average']))
                total_low_cost += Decimal(str(cost_range['low']))
                total_high_cost += Decimal(str(cost_range['high']))
                continue
            
            # Calculate annual costs for this increment
            low_annual_cost = Decimal(str(cost_range['low'])) * Decimal(str(parsed_frequency['lowFrequency']))
            high_annual_cost = Decimal(str(cost_range['high'])) * Decimal(str(parsed_frequency['highFrequency']))
            avg_annual_cost = Decimal(str(cost_range['average'])) * (
                Decimal(str(parsed_frequency['lowFrequency'])) + Decimal(str(parsed_frequency['highFrequency']))
            ) / Decimal('2')
            
            # Add to total annual cost (weighted by duration)
            if total_duration > 0:
                total_annual_cost += avg_annual_cost * duration / total_duration
            
            # Calculate lifetime costs for this increment
            low_lifetime_cost = low_annual_cost * duration
            high_lifetime_cost = high_annual_cost * duration
            avg_lifetime_cost = avg_annual_cost * duration
            
            # Add to total lifetime costs
            total_lifetime_cost += avg_lifetime_cost
            total_low_cost += low_lifetime_cost
            total_high_cost += high_lifetime_cost
        
        # Round to 2 decimal places
        return {
            'annual': round(total_annual_cost, 2),
            'lifetime': round(total_lifetime_cost, 2),
            'low': round(total_low_cost, 2),
            'high': round(total_high_cost, 2),
            'average': round(total_lifetime_cost, 2),
            'isOneTime': False
        }
    except Exception as e:
        logger.error(f"Error calculating item costs with age increments: {e}")
        raise
