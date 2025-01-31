import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EvalueeInfoForm from './EvalueeInfoForm';
import DemographicsDisplay from './DemographicsDisplay';

interface EvalueeFormProps {
  onSave?: (evaluee: any) => void;
}

export default function EvalueeForm({ onSave }: EvalueeFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    dateOfInjury: "",
    gender: "",
    city: "",
    state: "",
    zipCode: "",
    lifeExpectancy: "",
  });

  const [geoFactors, setGeoFactors] = useState<any>(null);
  const [ageData, setAgeData] = useState({
    ageToday: 0,
    ageAtInjury: 0,
    projectedAgeAtDeath: 0
  });

  const calculateAges = () => {
    if (!formData.dateOfBirth) return;

    const today = new Date();
    const birth = new Date(formData.dateOfBirth);
    const injury = formData.dateOfInjury ? new Date(formData.dateOfInjury) : null;
    const le = parseFloat(formData.lifeExpectancy) || 0;

    let ageToday = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      ageToday--;
    }

    let ageAtInjury = 0;
    if (injury) {
      ageAtInjury = injury.getFullYear() - birth.getFullYear();
      const m2 = injury.getMonth() - birth.getMonth();
      if (m2 < 0 || (m2 === 0 && injury.getDate() < birth.getDate())) {
        ageAtInjury--;
      }
    }

    const projectedAgeAtDeath = ageToday + le;

    setAgeData({
      ageToday,
      ageAtInjury,
      projectedAgeAtDeath
    });
  };

  useEffect(() => {
    calculateAges();
  }, [formData.dateOfBirth, formData.dateOfInjury, formData.lifeExpectancy]);

  const lookupGeoFactors = async (city: string, state: string) => {
    console.log('Looking up GAF for:', city, state);

    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('mfr_code, pfr_code')
        .ilike('city', city)
        .eq('state_id', state)
        .maybeSingle();

      if (error) throw error;
      
      console.log('GAF lookup result:', data);

      if (data) {
        setGeoFactors({
          mfr_code: data.mfr_code,
          pfr_code: data.pfr_code
        });
      } else {
        setGeoFactors(null);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No geographic adjustment factors found for this location"
        });
      }
    } catch (error) {
      console.error('Error fetching geographic factors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch geographic factors"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to create a plan"
        });
        return;
      }

      const { data, error } = await supabase
        .from('life_care_plans')
        .insert([{
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          date_of_injury: formData.dateOfInjury,
          gender: formData.gender,
          zip_code: formData.zipCode,
          city: formData.city,
          state: formData.state,
          life_expectancy: parseFloat(formData.lifeExpectancy),
          projected_age_at_death: ageData.projectedAgeAtDeath
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Life care plan created successfully"
      });

      if (onSave && data) {
        onSave(data);
      }
      
      navigate('/');
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Life Care Plan</CardTitle>
        <CardDescription>Enter evaluee information to begin</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="evaluee">
          <TabsList>
            <TabsTrigger value="evaluee">Evaluee Information</TabsTrigger>
            <TabsTrigger value="demographics">Demographics & Factors</TabsTrigger>
          </TabsList>

          <TabsContent value="evaluee">
            <EvalueeInfoForm
              formData={formData}
              onFormDataChange={setFormData}
              onLocationChange={lookupGeoFactors}
              onCancel={() => navigate('/')}
              onSubmit={handleSubmit}
            />
          </TabsContent>

          <TabsContent value="demographics">
            <DemographicsDisplay
              ageData={ageData}
              geoFactors={geoFactors}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}