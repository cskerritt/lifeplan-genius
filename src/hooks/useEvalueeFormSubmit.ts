import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

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

      // Ensure life expectancy is properly parsed before sending to the database
      const lifeExpectancy = formData.lifeExpectancy ? parseFloat(formData.lifeExpectancy) : null;
      console.log('Life expectancy being saved:', lifeExpectancy);

      const planData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        date_of_injury: formData.dateOfInjury || null,
        gender: formData.gender,
        zip_code: formData.zipCode,
        city: formData.city,
        state: formData.state,
        life_expectancy: lifeExpectancy,
        projected_age_at_death: ageData.projectedAgeAtDeath,
        user_id: user.id
      };

      let response;
      
      if (planId && planId !== 'new') {
        // Update existing plan
        response = await supabase
          .from('life_care_plans')
          .update(planData)
          .eq('id', planId)
          .select()
          .single();
      } else {
        // Create new plan
        response = await supabase
          .from('life_care_plans')
          .insert([planData])
          .select()
          .single();
      }

      if (response.error) {
        console.error('Supabase error:', response.error);
        throw response.error;
      }

      toast({
        title: "Success",
        description: planId && planId !== 'new' ? "Life care plan updated successfully" : "Life care plan created successfully"
      });

      if (response.data) {
        console.log('Response data:', response.data);
        
        // Transform the response data back to our Evaluee format
        const transformedData = {
          id: response.data.id,
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          dateOfBirth: response.data.date_of_birth,
          dateOfInjury: response.data.date_of_injury || '',
          gender: response.data.gender,
          zipCode: response.data.zip_code || '',
          city: response.data.city,
          state: response.data.state,
          // Ensure life expectancy is converted to string
          lifeExpectancy: response.data.life_expectancy?.toString() || '',
          address: response.data.street_address || '',
          phone: '',
          email: ''
        };

        if (onSave) {
          onSave(transformedData);
        }

        // Invalidate and refetch the life care plans query to update the dashboard
        queryClient.invalidateQueries({ queryKey: ['life-care-plans'] });

        if (!planId || planId === 'new') {
          // Add a small delay before navigation to allow the query to be invalidated
          setTimeout(() => {
            navigate('/');
          }, 100);
        }
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
