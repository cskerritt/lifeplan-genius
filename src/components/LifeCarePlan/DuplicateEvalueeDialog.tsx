import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Evaluee } from "@/types/lifecare";
import { Checkbox } from "@/components/ui/checkbox";

interface DuplicateEvalueeDialogProps {
  evaluee: Evaluee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (evalueeId: string, modifications: any) => void;
}

const DuplicateEvalueeDialog: React.FC<DuplicateEvalueeDialogProps> = ({
  evaluee,
  open,
  onOpenChange,
  onDuplicate
}) => {
  const [modifications, setModifications] = useState<any>({
    first_name: evaluee ? `${evaluee.firstName} (Copy)` : '',
    last_name: evaluee?.lastName || '',
    date_of_birth: evaluee?.dateOfBirth || '',
    date_of_injury: evaluee?.dateOfInjury || '',
    gender: evaluee?.gender || '',
    street_address: evaluee?.address || '',
    city: evaluee?.city || '',
    state: evaluee?.state || '',
    zip_code: evaluee?.zipCode || '',
    life_expectancy: evaluee?.lifeExpectancy || ''
  });

  const handleChange = (field: string, value: string | boolean) => {
    setModifications({
      ...modifications,
      [field]: value
    });
  };

  const handleDuplicate = () => {
    if (evaluee) {
      onDuplicate(evaluee.id, modifications);
      onOpenChange(false);
    }
  };

  if (!evaluee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Evaluee</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Create a copy of this evaluee with all care plan items. You can modify the information below.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input 
                id="first_name" 
                value={modifications.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input 
                id="last_name" 
                value={modifications.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input 
                id="date_of_birth" 
                type="date"
                value={modifications.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date_of_injury">Date of Injury</Label>
              <Input 
                id="date_of_injury" 
                type="date"
                value={modifications.date_of_injury}
                onChange={(e) => handleChange('date_of_injury', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Input 
              id="gender" 
              value={modifications.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="street_address">Address</Label>
            <Input 
              id="street_address" 
              value={modifications.street_address}
              onChange={(e) => handleChange('street_address', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                value={modifications.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                value={modifications.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input 
                id="zip_code" 
                value={modifications.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="life_expectancy">Life Expectancy (years)</Label>
            <Input 
              id="life_expectancy" 
              type="number"
              value={modifications.life_expectancy}
              onChange={(e) => handleChange('life_expectancy', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate}>
            Duplicate Evaluee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateEvalueeDialog;
