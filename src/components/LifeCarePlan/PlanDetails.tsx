import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LifeCarePlan, GeographicFactor } from '@/types/lifecare';

export default function PlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<LifeCarePlan | null>(null);
  const [geoFactor, setGeoFactor] = useState<GeographicFactor | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const fetchPlanDetails = async () => {
    try {
      const { data: planData, error: planError } = await supabase
        .from('life_care_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      if (planData?.zip_code) {
        const { data: geoData, error: geoError } = await supabase
          .from('geographic_factors')
          .select('*')
          .eq('zip', planData.zip_code.padStart(5, '0'))
          .single();

        if (!geoError && geoData) {
          setGeoFactor(geoData);
        }
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanDetails();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!plan) {
    return <div>No plan found</div>;
  }

  return (
    <div>
      <button onClick={() => navigate(-1)}>
        <ArrowLeft /> Back
      </button>
      <h1>{plan.first_name} {plan.last_name}'s Life Care Plan</h1>
      <div>
        <p><MapPin /> {plan.street_address}, {plan.city}, {plan.state} {plan.zip_code}</p>
        <p><Calendar /> Date of Birth: {plan.date_of_birth}</p>
        <p><User /> Gender: {plan.gender}</p>
        <p>Age at Injury: {plan.age_at_injury}</p>
        <p>Statistical Lifespan: {plan.statistical_lifespan}</p>
      </div>
      {geoFactor && (
        <div>
          <h2>Geographic Factors</h2>
          <p>County: {geoFactor.county_name}</p>
          <p>Region: {geoFactor.region}</p>
        </div>
      )}
      <h2>Care Plan Items</h2>
      {/* Render care plan items here */}
    </div>
  );
}
