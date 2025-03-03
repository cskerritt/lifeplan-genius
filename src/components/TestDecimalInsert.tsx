import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function TestDecimalInsert() {
  const [decimalValue, setDecimalValue] = useState<string>('123.45');
  const [planId, setPlanId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; name: string }>>([]);
  const [existingEntries, setExistingEntries] = useState<Array<any>>([]);

  // Fetch available plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('life_care_plans')
        .select('id, first_name, last_name')
        .limit(10);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const plans = data.map(plan => ({
          id: plan.id,
          name: `${plan.first_name} ${plan.last_name}`
        }));
        setAvailablePlans(plans);
        
        // Set the first plan as default
        setPlanId(plans[0].id);

        // Fetch existing entries for the first plan
        if (plans[0].id) {
          fetchExistingEntries(plans[0].id);
        }
      } else {
        setResult({
          success: false,
          message: 'No plans found in the database. Please create a plan first.'
        });
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setResult({
        success: false,
        message: `Error fetching plans: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingEntries = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('care_plan_entries')
        .select('id, item, annual_cost, lifetime_cost')
        .eq('plan_id', id)
        .limit(5);
      
      if (error) {
        console.error('Error fetching existing entries:', error);
        return;
      }
      
      setExistingEntries(data || []);
    } catch (error) {
      console.error('Error fetching existing entries:', error);
    }
  };

  // Test inserting a decimal value
  const testInsert = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      if (!planId) {
        throw new Error('Please select a plan');
      }
      
      const numericValue = parseFloat(decimalValue);
      if (isNaN(numericValue)) {
        throw new Error('Please enter a valid decimal number');
      }
      
      console.log(`Attempting to insert decimal value: ${numericValue}`);
      
      const { data, error } = await supabase
        .from('care_plan_entries')
        .insert({
          plan_id: planId,
          category: 'test',
          item: 'Decimal Test',
          annual_cost: numericValue,
          lifetime_cost: numericValue,
          min_cost: numericValue,
          avg_cost: numericValue,
          max_cost: numericValue,
          start_age: 0,
          end_age: 1
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      setResult({
        success: true,
        message: `Successfully inserted decimal value ${numericValue}. This confirms the migration was successful!`
      });
      
      // Refresh the list of existing entries
      fetchExistingEntries(planId);
      
      // Clean up the test record after a delay
      if (data && data.length > 0) {
        const testId = data[0].id;
        setTimeout(async () => {
          await supabase
            .from('care_plan_entries')
            .delete()
            .eq('id', testId);
          
          // Refresh the list again after deletion
          fetchExistingEntries(planId);
        }, 5000); // 5 second delay to allow viewing the result
      }
    } catch (error) {
      console.error('Error testing decimal insert:', error);
      
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for specific error types
      if (errorMessage.includes('invalid input syntax for type integer')) {
        errorMessage = 'The migration was NOT successful. The columns are still INTEGER type.';
      } else if (errorMessage.includes('foreign key constraint')) {
        errorMessage = 'Foreign key constraint error. Please select a valid plan ID.';
      } else if (errorMessage.includes('row-level security')) {
        errorMessage = 'Row-level security policy error. You may not have permission to insert records.';
      }
      
      setResult({
        success: false,
        message: `Error: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Check existing entries for decimal values
  const checkExistingEntries = () => {
    if (existingEntries.length === 0) {
      setResult({
        success: false,
        message: 'No existing entries found for this plan.'
      });
      return;
    }
    
    // Check if any entries have decimal values
    const entriesWithDecimals = existingEntries.filter(entry => {
      const annualCost = entry.annual_cost;
      const lifetimeCost = entry.lifetime_cost;
      
      return (
        (typeof annualCost === 'number' && annualCost % 1 !== 0) ||
        (typeof lifetimeCost === 'number' && lifetimeCost % 1 !== 0)
      );
    });
    
    if (entriesWithDecimals.length > 0) {
      setResult({
        success: true,
        message: `Found ${entriesWithDecimals.length} entries with decimal values. This confirms the migration was successful!`
      });
    } else {
      setResult({
        success: false,
        message: 'No entries with decimal values found. This does not necessarily mean the migration failed, as all existing values might be whole numbers.'
      });
    }
  };

  return (
    <Card className="w-[500px] mx-auto my-8">
      <CardHeader>
        <CardTitle>Test Decimal Insert</CardTitle>
        <CardDescription>
          Test if the database can handle decimal values after the migration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="planId">Plan ID</Label>
          {availablePlans.length === 0 ? (
            <Button 
              variant="outline" 
              onClick={fetchPlans} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Fetch Available Plans'}
            </Button>
          ) : (
            <select
              id="planId"
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                fetchExistingEntries(e.target.value);
              }}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              {availablePlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.id})
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="decimalValue">Decimal Value</Label>
          <Input
            id="decimalValue"
            type="number"
            step="0.01"
            value={decimalValue}
            onChange={(e) => setDecimalValue(e.target.value)}
            disabled={loading}
          />
        </div>
        
        {existingEntries.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Existing Entries:</h3>
            <div className="text-xs bg-gray-50 p-2 rounded max-h-[150px] overflow-y-auto">
              {existingEntries.map(entry => (
                <div key={entry.id} className="mb-1 pb-1 border-b border-gray-200">
                  <div><strong>Item:</strong> {entry.item}</div>
                  <div><strong>Annual Cost:</strong> {entry.annual_cost} (Type: {typeof entry.annual_cost})</div>
                  <div><strong>Lifetime Cost:</strong> {entry.lifetime_cost} (Type: {typeof entry.lifetime_cost})</div>
                  <div><strong>Is Decimal?</strong> {
                    (typeof entry.annual_cost === 'number' && entry.annual_cost % 1 !== 0) ||
                    (typeof entry.lifetime_cost === 'number' && entry.lifetime_cost % 1 !== 0)
                      ? '✅ Yes' : '❌ No'
                  }</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={testInsert} 
          disabled={loading || !planId}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Decimal Insert'}
        </Button>
        
        <Button 
          variant="outline"
          onClick={checkExistingEntries}
          disabled={loading || existingEntries.length === 0}
          className="w-full"
        >
          Check Existing Entries
        </Button>
      </CardFooter>
    </Card>
  );
} 