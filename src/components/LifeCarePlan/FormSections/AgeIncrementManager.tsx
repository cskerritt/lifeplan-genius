import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AgeIncrement } from "@/types/lifecare";
import { Plus, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { validateAgeIncrements, normalizeAgeIncrements } from "@/utils/calculations/durationCalculator";

interface AgeIncrementManagerProps {
  ageIncrements: AgeIncrement[];
  onAgeIncrementsChange: (ageIncrements: AgeIncrement[]) => void;
  minAge: number;
  maxAge: number;
}

export function AgeIncrementManager({ 
  ageIncrements, 
  onAgeIncrementsChange,
  minAge,
  maxAge
}: AgeIncrementManagerProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [showNormalizeButton, setShowNormalizeButton] = useState(false);
  const [useProgressiveFrequency, setUseProgressiveFrequency] = useState(false);
  const [baseFrequency, setBaseFrequency] = useState<string>("1x per year");

  // Validate age increments whenever they change
  useEffect(() => {
    if (ageIncrements.length > 0) {
      const validationResult = validateAgeIncrements(ageIncrements);
      setErrors(validationResult.errors);
      setShowNormalizeButton(!validationResult.valid);
    } else {
      setErrors([]);
      setShowNormalizeButton(false);
    }
  }, [ageIncrements]);

  // Helper function to calculate the next frequency multiplier
  const calculateNextFrequency = (currentFrequency: string, index: number): string => {
    if (!useProgressiveFrequency) return currentFrequency;
    
    // Extract the multiplier from the frequency string
    const match = currentFrequency.match(/(\d+)x\s+per\s+year/i);
    if (!match) return `${index + 1}x per year`; // Default to index+1 if can't parse
    
    const currentMultiplier = parseInt(match[1]);
    
    // For progressive frequency, we use the index+1 as the multiplier
    // This ensures 1x, 2x, 3x, etc. progression
    return `${index + 1}x per year`;
  };

  const addIncrement = () => {
    // Find the highest end age or use minAge if no increments exist
    const lastEndAge = ageIncrements.length > 0 
      ? Math.max(...ageIncrements.map(inc => inc.endAge))
      : minAge;
    
    // Default new increment to start at the last end age and extend 5 years
    // But ensure it doesn't exceed maxAge
    let endAge = lastEndAge + 5;
    if (endAge > maxAge) {
      endAge = maxAge;
    }
    
    // Only add a new increment if there's room for it
    if (lastEndAge < maxAge) {
      const newIncrement: AgeIncrement = {
        startAge: lastEndAge,
        endAge: endAge,
        frequency: baseFrequency, // Always use base frequency for new increments
        isOneTime: false
      };
      
      onAgeIncrementsChange([...ageIncrements, newIncrement]);
    }
  };

  const updateIncrement = (index: number, field: keyof AgeIncrement, value: any) => {
    const updatedIncrements = [...ageIncrements];
    
    // If updating end age, ensure it doesn't exceed maxAge
    if (field === 'endAge' && typeof value === 'number' && maxAge !== undefined && value > maxAge) {
      value = maxAge;
    }
    
    updatedIncrements[index] = {
      ...updatedIncrements[index],
      [field]: value
    };
    
    onAgeIncrementsChange(updatedIncrements);
  };

  const removeIncrement = (index: number) => {
    const updatedIncrements = ageIncrements.filter((_, i) => i !== index);
    onAgeIncrementsChange(updatedIncrements);
  };

  const handleNormalizeIncrements = () => {
    const normalizedIncrements = normalizeAgeIncrements(ageIncrements);
    onAgeIncrementsChange(normalizedIncrements);
  };

  // Function to update all frequencies based on progressive setting
  const updateAllFrequencies = () => {
    if (ageIncrements.length === 0) return;
    
    const updatedIncrements = [...ageIncrements].map((increment, index) => ({
      ...increment,
      frequency: useProgressiveFrequency 
        ? calculateNextFrequency(baseFrequency, index)
        : baseFrequency
    }));
    
    onAgeIncrementsChange(updatedIncrements);
  };

  // Removed automatic frequency update when toggle changes

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Age Increments</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addIncrement}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Age Increment
        </Button>
      </div>
      
      <div className="space-y-4 border p-4 rounded-md">
        <h4 className="font-medium">Progressive Frequency Settings</h4>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="progressive-frequency"
            checked={useProgressiveFrequency}
            onCheckedChange={setUseProgressiveFrequency}
          />
          <Label htmlFor="progressive-frequency">Use Progressive Frequency (1x, 2x, 3x, etc.)</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="base-frequency" className="w-32">Base Frequency:</Label>
          <Input
            id="base-frequency"
            value={baseFrequency}
            onChange={(e) => setBaseFrequency(e.target.value)}
            placeholder="e.g., 1x per year"
            disabled={!useProgressiveFrequency}
            className="max-w-xs"
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={updateAllFrequencies}
          disabled={!useProgressiveFrequency}
          className="mt-2"
        >
          Apply Progressive Frequencies
        </Button>
        
        <p className="text-sm text-gray-500 mt-2">
          Note: Clicking "Apply" will override any manually set frequencies with the progressive pattern.
        </p>
      </div>
      
      {errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          <p className="font-medium">Please fix the following issues:</p>
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {showNormalizeButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleNormalizeIncrements}
            >
              Auto-Fix Issues
            </Button>
          )}
        </div>
      )}
      
      {/* Age increment timeline visualization */}
      {ageIncrements.length > 0 && (
        <div className="mt-4 mb-6">
          <Label className="mb-2 block">Age Timeline</Label>
          <div className="relative h-8 bg-gray-100 rounded-md">
            {/* Render age labels */}
            <div className="absolute -top-6 left-0">{minAge}</div>
            <div className="absolute -top-6 right-0">{maxAge}</div>
            
            {/* Render each age increment as a colored segment */}
            {ageIncrements.map((increment, index) => {
              const totalRange = maxAge - minAge;
              const startPercent = ((increment.startAge - minAge) / totalRange) * 100;
              const widthPercent = ((increment.endAge - increment.startAge) / totalRange) * 100;
              
              // Generate a color based on the index
              const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'
              ];
              const colorClass = colors[index % colors.length];
              
              return (
                <div 
                  key={index}
                  className={`absolute h-8 flex items-center justify-center text-xs text-white ${colorClass}`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  {increment.startAge}-{increment.endAge}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {ageIncrements.map((increment, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Age Increment {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeIncrement(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Age</Label>
              <Input
                type="number"
                min={minAge}
                max={maxAge - 1}
                value={increment.startAge}
                onChange={(e) => updateIncrement(index, 'startAge', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>End Age</Label>
              <Input
                type="number"
                min={increment.startAge + 1}
                max={maxAge}
                value={increment.endAge}
                onChange={(e) => updateIncrement(index, 'endAge', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div>
            <Label>Frequency</Label>
            <Input
              type="text"
              value={increment.frequency}
              onChange={(e) => updateIncrement(index, 'frequency', e.target.value)}
              placeholder="e.g., 4x per year"
            />
          </div>
          
          <div className="flex items-center">
            <Label className="mr-2">One-time</Label>
            <input
              type="checkbox"
              checked={increment.isOneTime}
              onChange={(e) => updateIncrement(index, 'isOneTime', e.target.checked)}
            />
          </div>
        </div>
      ))}
      
      {ageIncrements.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No age increments defined. Click "Add Age Increment" to create one.
        </div>
      )}
    </div>
  );
}
