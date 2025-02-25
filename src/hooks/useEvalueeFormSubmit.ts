
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dateOfInjury: string;
  gender: string;
  city: string;
  state: string;
  zipCode: string;
  lifeExpectancy: string;
}

interface AgeData {
  ageToday: number;
  ageAtInjury: number;
  projectedAgeAtDeath: number;
}

export function useEvalueeFormSubmit(onSave?: (evaluee: any) => void) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent, formData: FormData, ageData: AgeData, planId?: string) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to update the plan"
        });
        return;
      }

      const planData = {
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
      };

      if (planId) {
        // Update existing plan
        const { data, error } = await supabase
          .from('life_care_plans')
          .update(planData)
          .eq('id', planId)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Life care plan updated successfully"
        });

        if (onSave && data) {
          onSave(data);
        }
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('life_care_plans')
          .insert([{
            ...planData,
            user_id: user.id
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
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  return { handleSubmit };
}
