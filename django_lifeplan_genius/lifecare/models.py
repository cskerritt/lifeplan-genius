from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Evaluee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    date_of_injury = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=50)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    zip_code = models.CharField(max_length=20, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    life_expectancy = models.CharField(max_length=50, null=True, blank=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class LifeCarePlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='life_care_plans')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    date_of_injury = models.DateField(null=True, blank=True)
    race = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=50)
    street_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=20, null=True, blank=True)
    county_apc = models.CharField(max_length=100, blank=True)
    county_drg = models.CharField(max_length=100, blank=True)
    age_at_injury = models.IntegerField(null=True, blank=True)
    statistical_lifespan = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    use_age_increments = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Plan for {self.first_name} {self.last_name}"

class CareCategory(models.TextChoices):
    PHYSICIAN_EVALUATION = 'physicianEvaluation', 'Physician Evaluation'
    PHYSICIAN_FOLLOW_UP = 'physicianFollowUp', 'Physician Follow-up'
    THERAPY_EVALUATION = 'therapyEvaluation', 'Therapy Evaluation'
    THERAPY_FOLLOW_UP = 'therapyFollowUp', 'Therapy Follow-up'
    MEDICATION = 'medication', 'Medication'
    SURGICAL = 'surgical', 'Surgical'
    DME = 'dme', 'DME'
    SUPPLIES = 'supplies', 'Supplies'
    HOME_CARE = 'homeCare', 'Home Care'
    HOME_MODIFICATION = 'homeModification', 'Home Modification'
    TRANSPORTATION = 'transportation', 'Transportation'
    INTERVENTIONAL = 'interventional', 'Interventional'
    DIAGNOSTICS = 'diagnostics', 'Diagnostics'

class CarePlanEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(LifeCarePlan, on_delete=models.CASCADE, related_name='entries')
    category = models.CharField(max_length=50, choices=CareCategory.choices)
    service = models.CharField(max_length=255)
    frequency = models.CharField(max_length=255)
    cpt_code = models.CharField(max_length=50, blank=True)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    min_cost = models.DecimalField(max_digits=10, decimal_places=2)
    avg_cost = models.DecimalField(max_digits=10, decimal_places=2)
    max_cost = models.DecimalField(max_digits=10, decimal_places=2)
    annual_cost = models.DecimalField(max_digits=10, decimal_places=2)
    lifetime_cost = models.DecimalField(max_digits=10, decimal_places=2)
    start_age = models.IntegerField(null=True, blank=True)
    end_age = models.IntegerField(null=True, blank=True)
    is_one_time = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    use_age_increments = models.BooleanField(default=False)
    age_increments = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.service} ({self.category})"

class GeographicFactor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    zip = models.CharField(max_length=20, db_index=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state_id = models.CharField(max_length=2)
    state_name = models.CharField(max_length=100)
    county_fips = models.CharField(max_length=10)
    county_name = models.CharField(max_length=100)
    mfr_code = models.CharField(max_length=10)
    pfr_code = models.CharField(max_length=10)
    gaf_lookup = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    mfr_factor = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pfr_factor = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.zip} - {self.county_name}, {self.state_name}"

class CPTCode(models.Model):
    code = models.CharField(max_length=20, primary_key=True)
    code_description = models.TextField()
    mfu_50th = models.DecimalField(max_digits=10, decimal_places=2)
    mfu_75th = models.DecimalField(max_digits=10, decimal_places=2)
    mfu_90th = models.DecimalField(max_digits=10, decimal_places=2)
    pfr_50th = models.DecimalField(max_digits=10, decimal_places=2)
    pfr_75th = models.DecimalField(max_digits=10, decimal_places=2)
    pfr_90th = models.DecimalField(max_digits=10, decimal_places=2)
    mfr_factor = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pfr_factor = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.code} - {self.code_description[:50]}"
