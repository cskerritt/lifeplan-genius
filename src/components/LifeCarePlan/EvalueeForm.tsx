import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAgeCalculations } from '@/hooks/useAgeCalculations';
import { useEvalueeFormSubmit } from '@/hooks/useEvalueeFormSubmit';
import { supabase } from '@/integrations/supabase/client';

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
  const ageData = useAgeCalculations({
    dateOfBirth: formData.dateOfBirth,
    dateOfInjury: formData.dateOfInjury,
    lifeExpectancy: formData.lifeExpectancy
  });

  const { handleSubmit } = useEvalueeFormSubmit(onSave);

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

  const onFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, formData, ageData);
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
              onSubmit={onFormSubmit}
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