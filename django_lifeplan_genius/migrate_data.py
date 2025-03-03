#!/usr/bin/env python
"""
Data Migration Script

This script helps migrate data from the existing database to the new Django database.
It connects to both databases and transfers the data while maintaining relationships.
"""

import os
import sys
import django
import psycopg2
from decimal import Decimal
import json
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lifeplan_genius.settings')
django.setup()

# Import Django models
from django.contrib.auth.models import User
from lifecare.models import Evaluee, LifeCarePlan, CarePlanEntry, GeographicFactor, CPTCode

def connect_to_source_db():
    """Connect to the source database (existing database)"""
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('SOURCE_DB_NAME', 'supabase_local_db'),
            user=os.getenv('SOURCE_DB_USER', 'postgres'),
            password=os.getenv('SOURCE_DB_PASSWORD', 'postgres'),
            host=os.getenv('SOURCE_DB_HOST', 'localhost'),
            port=os.getenv('SOURCE_DB_PORT', '5432')
        )
        print("Connected to source database")
        return conn
    except Exception as e:
        print(f"Error connecting to source database: {e}")
        sys.exit(1)

def migrate_users(source_conn):
    """Migrate users from source database to Django"""
    print("\nMigrating users...")
    
    try:
        cursor = source_conn.cursor()
        cursor.execute("SELECT id, email FROM auth.users")
        users = cursor.fetchall()
        
        for user_id, email in users:
            # Check if user already exists
            if not User.objects.filter(email=email).exists():
                # Create new user
                username = email.split('@')[0]
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password='changeme'  # Temporary password
                )
                print(f"Created user: {email}")
            else:
                print(f"User already exists: {email}")
    except Exception as e:
        print(f"Error migrating users: {e}")

def migrate_geographic_factors(source_conn):
    """Migrate geographic factors from source database to Django"""
    print("\nMigrating geographic factors...")
    
    try:
        cursor = source_conn.cursor()
        cursor.execute("""
            SELECT id, zip, city, state_id, state_name, county_fips, county_name, 
                   mfr_code, pfr_code, gaf_lookup, mfr_factor, pfr_factor, created_at
            FROM public.geographic_factors
        """)
        factors = cursor.fetchall()
        
        for (factor_id, zip_code, city, state_id, state_name, county_fips, county_name,
             mfr_code, pfr_code, gaf_lookup, mfr_factor, pfr_factor, created_at) in factors:
            
            # Check if factor already exists
            if not GeographicFactor.objects.filter(zip=zip_code, county_name=county_name).exists():
                # Create new factor
                GeographicFactor.objects.create(
                    id=factor_id,
                    zip=zip_code,
                    city=city,
                    state_id=state_id,
                    state_name=state_name,
                    county_fips=county_fips,
                    county_name=county_name,
                    mfr_code=mfr_code,
                    pfr_code=pfr_code,
                    gaf_lookup=gaf_lookup,
                    mfr_factor=mfr_factor,
                    pfr_factor=pfr_factor,
                    created_at=created_at
                )
                print(f"Created geographic factor: {zip_code} - {county_name}, {state_name}")
            else:
                print(f"Geographic factor already exists: {zip_code} - {county_name}, {state_name}")
    except Exception as e:
        print(f"Error migrating geographic factors: {e}")

def migrate_cpt_codes(source_conn):
    """Migrate CPT codes from source database to Django"""
    print("\nMigrating CPT codes...")
    
    try:
        cursor = source_conn.cursor()
        cursor.execute("""
            SELECT code, code_description, mfu_50th, mfu_75th, mfu_90th,
                   pfr_50th, pfr_75th, pfr_90th, mfr_factor, pfr_factor, created_at
            FROM public.cpt_codes
        """)
        codes = cursor.fetchall()
        
        for (code, code_description, mfu_50th, mfu_75th, mfu_90th,
             pfr_50th, pfr_75th, pfr_90th, mfr_factor, pfr_factor, created_at) in codes:
            
            # Check if code already exists
            if not CPTCode.objects.filter(code=code).exists():
                # Create new CPT code
                CPTCode.objects.create(
                    code=code,
                    code_description=code_description,
                    mfu_50th=mfu_50th,
                    mfu_75th=mfu_75th,
                    mfu_90th=mfu_90th,
                    pfr_50th=pfr_50th,
                    pfr_75th=pfr_75th,
                    pfr_90th=pfr_90th,
                    mfr_factor=mfr_factor,
                    pfr_factor=pfr_factor,
                    created_at=created_at
                )
                print(f"Created CPT code: {code}")
            else:
                print(f"CPT code already exists: {code}")
    except Exception as e:
        print(f"Error migrating CPT codes: {e}")

def migrate_life_care_plans(source_conn):
    """Migrate life care plans from source database to Django"""
    print("\nMigrating life care plans...")
    
    try:
        cursor = source_conn.cursor()
        cursor.execute("""
            SELECT id, user_id, first_name, last_name, date_of_birth, date_of_injury,
                   race, gender, street_address, city, state, zip_code, county_apc,
                   county_drg, age_at_injury, statistical_lifespan, use_age_increments,
                   created_at, updated_at
            FROM public.life_care_plans
        """)
        plans = cursor.fetchall()
        
        for (plan_id, user_id, first_name, last_name, date_of_birth, date_of_injury,
             race, gender, street_address, city, state, zip_code, county_apc,
             county_drg, age_at_injury, statistical_lifespan, use_age_increments,
             created_at, updated_at) in plans:
            
            # Check if plan already exists
            if not LifeCarePlan.objects.filter(id=plan_id).exists():
                # Get the Django user
                try:
                    user = User.objects.get(email=user_id)
                except User.DoesNotExist:
                    # Create a default user if the original user doesn't exist
                    username = f"user_{uuid.uuid4().hex[:8]}"
                    user = User.objects.create_user(
                        username=username,
                        email=f"{username}@example.com",
                        password='changeme'
                    )
                
                # Create new life care plan
                LifeCarePlan.objects.create(
                    id=plan_id,
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=date_of_birth,
                    date_of_injury=date_of_injury,
                    race=race or '',
                    gender=gender,
                    street_address=street_address,
                    city=city,
                    state=state,
                    zip_code=zip_code,
                    county_apc=county_apc or '',
                    county_drg=county_drg or '',
                    age_at_injury=age_at_injury,
                    statistical_lifespan=statistical_lifespan,
                    use_age_increments=use_age_increments or False,
                    created_at=created_at,
                    updated_at=updated_at
                )
                print(f"Created life care plan: {first_name} {last_name}")
            else:
                print(f"Life care plan already exists: {first_name} {last_name}")
    except Exception as e:
        print(f"Error migrating life care plans: {e}")

def migrate_care_plan_entries(source_conn):
    """Migrate care plan entries from source database to Django"""
    print("\nMigrating care plan entries...")
    
    try:
        cursor = source_conn.cursor()
        cursor.execute("""
            SELECT id, plan_id, category, service, frequency, cpt_code,
                   cost_per_unit, min_cost, avg_cost, max_cost, annual_cost,
                   lifetime_cost, start_age, end_age, is_one_time, notes,
                   use_age_increments, age_increments, created_at, updated_at
            FROM public.care_plan_entries
        """)
        entries = cursor.fetchall()
        
        for (entry_id, plan_id, category, service, frequency, cpt_code,
             cost_per_unit, min_cost, avg_cost, max_cost, annual_cost,
             lifetime_cost, start_age, end_age, is_one_time, notes,
             use_age_increments, age_increments, created_at, updated_at) in entries:
            
            # Check if entry already exists
            if not CarePlanEntry.objects.filter(id=entry_id).exists():
                # Get the life care plan
                try:
                    plan = LifeCarePlan.objects.get(id=plan_id)
                except LifeCarePlan.DoesNotExist:
                    print(f"Life care plan {plan_id} not found, skipping entry")
                    continue
                
                # Create new care plan entry
                CarePlanEntry.objects.create(
                    id=entry_id,
                    plan=plan,
                    category=category,
                    service=service,
                    frequency=frequency,
                    cpt_code=cpt_code or '',
                    cost_per_unit=cost_per_unit or Decimal('0'),
                    min_cost=min_cost or Decimal('0'),
                    avg_cost=avg_cost or Decimal('0'),
                    max_cost=max_cost or Decimal('0'),
                    annual_cost=annual_cost or Decimal('0'),
                    lifetime_cost=lifetime_cost or Decimal('0'),
                    start_age=start_age,
                    end_age=end_age,
                    is_one_time=is_one_time or False,
                    notes=notes or '',
                    use_age_increments=use_age_increments or False,
                    age_increments=age_increments,
                    created_at=created_at,
                    updated_at=updated_at
                )
                print(f"Created care plan entry: {service}")
            else:
                print(f"Care plan entry already exists: {service}")
    except Exception as e:
        print(f"Error migrating care plan entries: {e}")

def main():
    """Main function to run the migration"""
    print("Starting data migration...")
    
    # Connect to source database
    source_conn = connect_to_source_db()
    
    # Migrate data
    migrate_users(source_conn)
    migrate_geographic_factors(source_conn)
    migrate_cpt_codes(source_conn)
    migrate_life_care_plans(source_conn)
    migrate_care_plan_entries(source_conn)
    
    # Close connection
    source_conn.close()
    
    print("\nData migration completed successfully!")

if __name__ == "__main__":
    main()
