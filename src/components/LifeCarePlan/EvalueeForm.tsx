import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

    // Calculate age today
    let ageToday = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      ageToday--;
    }

    // Calculate age at injury
    let ageAtInjury = 0;
    if (injury) {
      ageAtInjury = injury.getFullYear() - birth.getFullYear();
      const m2 = injury.getMonth() - birth.getMonth();
      if (m2 < 0 || (m2 === 0 && injury.getDate() < birth.getDate())) {
        ageAtInjury--;
      }
    }

    // Calculate projected age at death
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

  const lookupGeoFactors = async (zip: string) => {
    if (zip.length !== 5) return;

    try {
      const { data, error } = await supabase
        .from('geographic_factors')
        .select('*')
        .eq('zip', zip.padStart(5, '0'))
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setGeoFactors(data);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfInjury">Date of Injury</Label>
                  <Input
                    id="dateOfInjury"
                    type="date"
                    value={formData.dateOfInjury}
                    onChange={(e) => setFormData({ ...formData, dateOfInjury: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => {
                      const zip = e.target.value.slice(0, 5);
                      setFormData({ ...formData, zipCode: zip });
                      if (zip.length === 5) {
                        lookupGeoFactors(zip);
                      }
                    }}
                    pattern="[0-9]{5}"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifeExpectancy">Life Expectancy (years)</Label>
                  <Input
                    id="lifeExpectancy"
                    type="number"
                    step="0.01"
                    value={formData.lifeExpectancy}
                    onChange={(e) => setFormData({ ...formData, lifeExpectancy: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Plan
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="demographics">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Age Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Age Today</Label>
                    <div className="text-2xl font-bold mt-1">{ageData.ageToday}</div>
                  </div>
                  <div>
                    <Label>Age at Injury</Label>
                    <div className="text-2xl font-bold mt-1">{ageData.ageAtInjury}</div>
                  </div>
                  <div>
                    <Label>Projected Age at Death</Label>
                    <div className="text-2xl font-bold mt-1">{ageData.projectedAgeAtDeath.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {geoFactors && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Geographic Adjustment Factors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>MFR</Label>
                      <div className="text-2xl font-bold mt-1">{geoFactors.mfr_factor?.toFixed(4)}</div>
                    </div>
                    <div>
                      <Label>PFR</Label>
                      <div className="text-2xl font-bold mt-1">{geoFactors.pfr_factor?.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}