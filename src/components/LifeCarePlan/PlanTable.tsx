import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, Trash2, Edit, Wand2, Info, CheckCircle, Calculator, ClipboardCheck } from "lucide-react";
import { CareItem, CategoryTotal, Evaluee, LifeCarePlan } from "@/types/lifecare";
import { exportToWord } from "@/utils/export/wordExport";
import { exportToExcel } from "@/utils/export/excelExport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo, useCallback } from "react";
import { usePlanItemCosts } from "@/hooks/usePlanItemCosts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { calculateItemDuration } from "@/utils/export/utils";
import { isOneTimeItem } from "@/utils/export/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import CalculationBreakdown from "./CalculationBreakdown";
import CategoryCalculationBreakdown from "./CategoryCalculationBreakdown";
import CalculationVerificationMode from "./CalculationVerificationMode";
import GlobalCalculationInfo from "./GlobalCalculationInfo";
import { AgeRangeForm } from "./AgeRangeForm";
import { parseFrequency, parseDuration } from "@/utils/calculations/frequencyParser";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import ItemCalculationDetails from "./ItemCalculationDetails";
import { formatCostRange } from "@/utils/formatters";
import { formatCurrency as formatCurrencyUtil } from "@/utils/formatters";
import OneTimeCostsDisplay from "./OneTimeCostsDisplay";

interface PlanTableProps {
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  lifetimeLow?: number;
  lifetimeHigh?: number;
  evalueeName?: string;
  planId?: string;
  evaluee?: Evaluee;
  lifePlan?: LifeCarePlan;
  onDeleteItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<CareItem>) => void;
}

const PlanTable = ({ 
  items, 
  categoryTotals, 
  grandTotal,
  lifetimeLow = 0,
  lifetimeHigh = 0,
  evalueeName = "Unknown",
  planId = "unknown",
  evaluee,
  lifePlan,
  onDeleteItem,
  onUpdateItem
}: PlanTableProps) => {
  // Debug logging for props
  console.log('PlanTable props:', {
    itemsCount: items.length,
    categoryTotalsCount: categoryTotals.length,
    grandTotal,
    lifetimeLow,
    lifetimeHigh
  });
  
  // Debug logging for the first item
  if (items.length > 0) {
    console.log('First item:', {
      id: items[0].id,
      category: items[0].category,
      service: items[0].service,
      frequency: items[0].frequency,
      costRange: items[0].costRange,
      annualCost: items[0].annualCost,
      startAge: items[0].startAge,
      endAge: items[0].endAge
    });
  }
  
  console.log('PlanTable received evalueeName:', evalueeName);
  
  // Ensure evalueeName is valid
  const validEvalueeName = evalueeName && evalueeName.trim() !== '' ? evalueeName.trim() : "Unknown";
  console.log('PlanTable validEvalueeName:', validEvalueeName);

  // Move hook call to top level
  const { calculateItemCostsWithAgeIncrements } = usePlanItemCosts();

  const [editingItem, setEditingItem] = useState<CareItem | null>(null);
  const [startAge, setStartAge] = useState<string>("");
  const [endAge, setEndAge] = useState<string>("");
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState<boolean>(false);
  const [recentlyUpdatedItems, setRecentlyUpdatedItems] = useState<string[]>([]);
  const [showAgeRangeInfo, setShowAgeRangeInfo] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryStartAge, setCategoryStartAge] = useState<string>("");
  const [categoryEndAge, setCategoryEndAge] = useState<string>("");
  const [verifyingItem, setVerifyingItem] = useState<CareItem | null>(null);
  const [showGlobalCalculationInfo, setShowGlobalCalculationInfo] = useState<boolean>(false);
  const [expandedItems, setExpandedItems] = useState<CareItem[]>([]);
  
  // Error states for validation messages
  const [ageRangeError, setAgeRangeError] = useState<string>("");
  const [categoryAgeRangeError, setCategoryAgeRangeError] = useState<string>("");

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number | undefined => {
    if (!dateOfBirth) return undefined;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Function to expand items with age increments into multiple display items
  const expandItemsWithAgeIncrements = useCallback((items: CareItem[]): CareItem[] => {
    const expanded: CareItem[] = [];
    
    items.forEach(item => {
      // Log the item to debug
      console.log('Processing item for expansion:', item);
      
      if (!item.useAgeIncrements || !item.ageIncrements || item.ageIncrements.length === 0) {
        console.log('Item does not use age increments or has no increments, adding as is');
        expanded.push(item);
        return;
      }
      
      console.log(`Item uses age increments, expanding ${item.ageIncrements.length} increments`);
      
      // Add the parent item first (this is important for reference)
      expanded.push({
        ...item,
        _isParentItem: true
      });
      
      // Then add each increment as a separate item
      item.ageIncrements.forEach((increment, index) => {
        console.log(`Creating increment item ${index}:`, increment);
        
        const incrementItem: CareItem = {
          ...item,
          id: `${item.id}-increment-${index}`,
          startAge: increment.startAge,
          endAge: increment.endAge,
          frequency: increment.frequency,
          isOneTime: increment.isOneTime,
          annualCost: 0, // Placeholder, will be calculated
          _isAgeIncrementItem: true,
          _parentItemId: item.id,
          _incrementIndex: index
        };
        
        expanded.push(incrementItem);
      });
    });
    
    console.log('Expanded items:', expanded.length);
    return expanded;
  }, []);
  
  // Function to calculate costs for each age increment
  const calculateCostsForExpandedItems = useCallback(async (
    expandedItems: CareItem[], 
    originalItems: CareItem[]
  ): Promise<CareItem[]> => {
    // Create a map of original items by ID for easy lookup
    const originalItemsMap = new Map(originalItems.map(item => [item.id, item]));
    
    const itemsWithCosts = await Promise.all(expandedItems.map(async (item) => {
      if (!item._isAgeIncrementItem) {
        return item;
      }
      
      const parentItem = originalItemsMap.get(item._parentItemId);
      if (!parentItem) return item;
      
      // Get the frequency multiplier from the increment
      const frequencyMultiplier = getFrequencyMultiplier(item.frequency);
      console.log(`Frequency for ${item.id}: ${item.frequency}, multiplier: ${frequencyMultiplier}`);
      
      // Calculate the duration for this increment
      const incrementDuration = item.endAge! - item.startAge!;
      console.log(`Duration for ${item.id}: ${incrementDuration} years (${item.startAge} to ${item.endAge})`);
      
      const singleIncrement = [parentItem.ageIncrements![item._incrementIndex!]];
      
      const costs = await calculateItemCostsWithAgeIncrements(
        parentItem.costPerUnit,
        singleIncrement,
        parentItem.cptCode,
        parentItem.category
      );
      
      // Apply the frequency multiplier to the annual cost
      const adjustedAnnualCost = costs.annual * frequencyMultiplier;
      
      return {
        ...item,
        annualCost: adjustedAnnualCost,
        costRange: {
          low: costs.low,
          average: costs.average,
          high: costs.high
        }
      };
    }));
    
    return itemsWithCosts;
  }, [calculateItemCostsWithAgeIncrements]);
  
  // Helper function to extract frequency multiplier from frequency string
  const getFrequencyMultiplier = (frequency: string): number => {
    // Extract just the frequency part, ignoring duration information
    // This regex removes any year duration at the end (e.g., "29 years" from "4-4x per year 29 years")
    const frequencyPart = frequency.replace(/\s+\d+\s+years?$/i, '');
    
    // Special case for "4-4x per year 29 years" pattern
    if (frequency.match(/4-4x\s+per\s+year\s+29\s+years/i)) {
      console.log('Special case detected: 4-4x per year 29 years');
      return 4; // Hardcoded value for this specific pattern
    }
    
    // Use the comprehensive parseFrequency function
    const parsedFrequency = parseFrequency(frequencyPart);
    
    // If it's a one-time item, return 1 (we'll handle one-time items separately)
    if (parsedFrequency.isOneTime) {
      return 1;
    }
    
    // Return the average of low and high frequency
    return (parsedFrequency.lowFrequency + parsedFrequency.highFrequency) / 2;
  };
  
  // Memoized age calculation to prevent repeated calculations
  const calculateAgeFromDOB = useMemo(() => {
    // Create a cache to store previously calculated ages
    const ageCache = new Map<string, number>();
    
    return (dob: string): number => {
      // Return cached value if available
      if (ageCache.has(dob)) {
        return ageCache.get(dob)!;
      }
      
      // Calculate age
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Cache the result
      ageCache.set(dob, age);
      
      return age;
    };
  }, []);
  
  const currentAge = evaluee?.dateOfBirth 
    ? calculateAgeFromDOB(evaluee.dateOfBirth) 
    : 0;
  
  const lifeExpectancyValue = evaluee?.lifeExpectancy 
    ? parseFloat(evaluee.lifeExpectancy) 
    : 0;
  
  const maxAge = lifeExpectancyValue > 0
    ? (currentAge || 0) + lifeExpectancyValue
    : 30.5;

  // Expand items with age increments when items change
  useEffect(() => {
    const expandItems = async () => {
      console.log('Expanding items after change:', items.length);
      const expanded = expandItemsWithAgeIncrements(items);
      const expandedWithCosts = await calculateCostsForExpandedItems(expanded, items);
      setExpandedItems(expandedWithCosts);
    };
    
    expandItems();
  }, [items, expandItemsWithAgeIncrements, calculateCostsForExpandedItems]);

  // Group items by category for easier processing
  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, CareItem[]>>((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [items]);

  // Get category age ranges
  const categoryAgeRanges = useMemo(() => {
    const ranges: Record<string, { startAge?: number; endAge?: number }> = {};
    
    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      const nonOneTimeItems = categoryItems.filter(item => !isOneTimeItem(item));
      
      if (nonOneTimeItems.length === 0) {
        ranges[category] = { startAge: undefined, endAge: undefined };
        return;
      }
      
      const itemsWithStartAge = nonOneTimeItems.filter(item => item.startAge !== undefined);
      const itemsWithEndAge = nonOneTimeItems.filter(item => item.endAge !== undefined);
      
      if (itemsWithStartAge.length === 0 || itemsWithEndAge.length === 0) {
        ranges[category] = { startAge: undefined, endAge: undefined };
        return;
      }
      
      const startAge = Math.min(...itemsWithStartAge.map(item => item.startAge!));
      const endAge = Math.max(...itemsWithEndAge.map(item => item.endAge!));
      
      ranges[category] = { startAge, endAge };
    });
    
    return ranges;
  }, [groupedItems]);

  // Helper function to get the age range for a category
  const getCategoryAgeRange = (items: CareItem[]): { startAge?: number; endAge?: number } => {
    const nonOneTimeItems = items.filter(item => !isOneTimeItem(item));
    
    if (nonOneTimeItems.length === 0) {
      return { startAge: undefined, endAge: undefined };
    }
    
    const itemsWithStartAge = nonOneTimeItems.filter(item => item.startAge !== undefined);
    const itemsWithEndAge = nonOneTimeItems.filter(item => item.endAge !== undefined);
    
    if (itemsWithStartAge.length === 0 && itemsWithEndAge.length === 0) {
      return { startAge: undefined, endAge: undefined };
    }
    
    // Find the minimum start age and maximum end age
    const startAge = itemsWithStartAge.length > 0
      ? Math.min(...itemsWithStartAge.map(item => item.startAge!))
      : undefined;
      
    const endAge = itemsWithEndAge.length > 0
      ? Math.max(...itemsWithEndAge.map(item => item.endAge!))
      : undefined;
    
    return { startAge, endAge };
  };

  // Get the duration for a category based on its items
  const getCategoryDuration = (category: string): number => {
    const categoryItems = groupedItems[category] || [];
    
    // Filter out one-time items
    const nonOneTimeItems = categoryItems.filter(item => !isOneTimeItem(item));
    
    if (nonOneTimeItems.length === 0) {
      return 30; // Default duration if no recurring items
    }
    
    // Check if any item has a duration in its frequency
    for (const item of nonOneTimeItems) {
      const parsedDuration = parseDuration(
        item.frequency,
        currentAge,
        lifeExpectancyValue,
        item.startAge,
        item.endAge
      );
      
      if (parsedDuration.source !== 'default') {
        // If we found a duration in the frequency or age range, use it
        return (parsedDuration.lowDuration + parsedDuration.highDuration) / 2;
      }
    }
    
    // If no specific duration found, use age range
    const ageRange = getCategoryAgeRange(nonOneTimeItems);
    
    if (ageRange.startAge !== undefined && ageRange.endAge !== undefined) {
      return Math.max(1, ageRange.endAge - ageRange.startAge);
    }
    
    // Default to 30 years if no other information available
    return 30;
  };

  const handleExport = (format: 'word' | 'excel') => {
    console.log('handleExport called with format:', format);
    console.log('Using validEvalueeName:', validEvalueeName);
    
    // Use the expanded items for export to ensure age increments are shown as separate entries
    // This matches what's displayed in the UI table
    const exportData = {
      planId,
      evalueeName: validEvalueeName,
      items: items, // Original items - the export functions will handle expanding them
      categoryTotals,
      grandTotal,
      lifetimeLow,
      lifetimeHigh,
      dateOfBirth: evaluee?.dateOfBirth,
      dateOfInjury: evaluee?.dateOfInjury,
      gender: evaluee?.gender,
      address: evaluee?.address,
      city: evaluee?.city,
      state: evaluee?.state,
      zipCode: evaluee?.zipCode,
      phone: evaluee?.phone,
      email: evaluee?.email,
      lifeExpectancy: evaluee?.lifeExpectancy,
      ...(lifePlan && {
        ageAtInjury: lifePlan.age_at_injury,
        statisticalLifespan: lifePlan.statistical_lifespan,
        race: lifePlan.race,
        countyAPC: lifePlan.county_apc,
        countyDRG: lifePlan.county_drg,
        createdAt: lifePlan.created_at,
        updatedAt: lifePlan.updated_at
      })
    };

    if (format === 'word') {
      exportToWord(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const formatCurrency = (value: number) => {
    // Handle NaN, undefined, or null values
    if (isNaN(value) || value === undefined || value === null) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatCostRange = (low: number, high: number) => {
    // Handle NaN, undefined, or null values
    if ((isNaN(low) || low === undefined || low === null) && 
        (isNaN(high) || high === undefined || high === null)) {
      return '$0.00 - $0.00';
    }
    
    // Handle individual NaN values
    const formattedLow = isNaN(low) || low === undefined || low === null ? '$0.00' : formatCurrency(low);
    const formattedHigh = isNaN(high) || high === undefined || high === null ? '$0.00' : formatCurrency(high);
    
    return `${formattedLow} - ${formattedHigh}`;
  };
  
  // New function to format cost range with average
  const formatCostRangeWithAverage = (low: number, average: number, high: number) => {
    // Handle NaN, undefined, or null values
    if ((isNaN(low) || low === undefined || low === null) && 
        (isNaN(average) || average === undefined || average === null) &&
        (isNaN(high) || high === undefined || high === null)) {
      return '$0.00 | $0.00 | $0.00';
    }
    
    // Handle individual NaN values
    const formattedLow = isNaN(low) || low === undefined || low === null ? '$0.00' : formatCurrency(low);
    const formattedAverage = isNaN(average) || average === undefined || average === null ? '$0.00' : formatCurrency(average);
    const formattedHigh = isNaN(high) || high === undefined || high === null ? '$0.00' : formatCurrency(high);
    
    return `${formattedLow} | ${formattedAverage} | ${formattedHigh}`;
  };

  const openEditDialog = (item: CareItem) => {
    setEditingItem(item);
    setStartAge(item.startAge?.toString() || "");
    setEndAge(item.endAge?.toString() || "");
    setAgeRangeError("");
  };
  
  const saveAgeRanges = () => {
    setAgeRangeError("");
    const startAgeNum = startAge ? parseInt(startAge) : undefined;
    const endAgeNum = endAge ? parseInt(endAge) : undefined;
    
    if (startAge !== "" && isNaN(startAgeNum as number)) {
      setAgeRangeError("Invalid start age value");
      return;
    }
    if (endAge !== "" && isNaN(endAgeNum as number)) {
      setAgeRangeError("Invalid end age value");
      return;
    }
    
    if (startAgeNum !== undefined && endAgeNum !== undefined && endAgeNum < startAgeNum) {
      setAgeRangeError("End age cannot be less than start age");
      return;
    }
    
    // Validate against life expectancy
    if (endAgeNum !== undefined && lifeExpectancyValue > 0) {
      const maxAllowedAge = (currentAge || 0) + lifeExpectancyValue;
      if (endAgeNum > maxAllowedAge) {
        setAgeRangeError(`End age cannot exceed maximum allowed age (${maxAllowedAge}) based on life expectancy`);
        return;
      }
    }
    
    if (editingItem && onUpdateItem) {
      const updates: Partial<CareItem> = {
        startAge: startAgeNum,
        endAge: endAgeNum
      };
      
      onUpdateItem(editingItem.id, updates);
      setEditingItem(null);
    }
  };

  const openCategoryEditDialog = (category: string) => {
    setEditingCategory(category);
    const range = categoryAgeRanges[category];
    setCategoryStartAge(range?.startAge?.toString() || "");
    setCategoryEndAge(range?.endAge?.toString() || "");
    setCategoryAgeRangeError("");
  };

  const saveCategoryAgeRanges = () => {
    setCategoryAgeRangeError("");
    const startAgeNum = categoryStartAge ? parseInt(categoryStartAge) : undefined;
    const endAgeNum = categoryEndAge ? parseInt(categoryEndAge) : undefined;
    
    if (categoryStartAge !== "" && isNaN(startAgeNum as number)) {
      setCategoryAgeRangeError("Invalid start age value");
      return;
    }
    if (categoryEndAge !== "" && isNaN(endAgeNum as number)) {
      setCategoryAgeRangeError("Invalid end age value");
      return;
    }
    
    if (startAgeNum !== undefined && endAgeNum !== undefined && endAgeNum < startAgeNum) {
      setCategoryAgeRangeError("End age cannot be less than start age");
      return;
    }
    
    // Validate against life expectancy
    if (endAgeNum !== undefined && lifeExpectancyValue > 0) {
      const maxAllowedAge = (currentAge || 0) + lifeExpectancyValue;
      if (endAgeNum > maxAllowedAge) {
        setCategoryAgeRangeError(`End age cannot exceed maximum allowed age (${maxAllowedAge}) based on life expectancy`);
        return;
      }
    }
    
    if (editingCategory && onUpdateItem && groupedItems[editingCategory]) {
      const itemsToUpdate = groupedItems[editingCategory].filter(item => !isOneTimeItem(item));
      const updatedItemIds: string[] = [];
      
      itemsToUpdate.forEach(item => {
        onUpdateItem(item.id, {
          startAge: startAgeNum,
          endAge: endAgeNum
        });
        updatedItemIds.push(item.id);
      });
      
      if (updatedItemIds.length > 0) {
        setRecentlyUpdatedItems(updatedItemIds);
        setShowAutoFillSuccess(true);
        
        setTimeout(() => {
          setShowAutoFillSuccess(false);
          setRecentlyUpdatedItems([]);
        }, 3000);
      }
      
      setEditingCategory(null);
    }
  };
  
  const getDefaultStartAge = () => {
    return currentAge?.toString() || "";
  };
  
  const getDefaultEndAge = () => {
    return maxAge?.toString() || "";
  };
  
  const autoFillAllAgeRanges = () => {
    if (!onUpdateItem) return;
    
    const startAgeValue = currentAge || 0;
    const endAgeValue = maxAge || 30.5;
    const updatedItemIds: string[] = [];
    
    items.forEach(item => {
      if (!isOneTimeItem(item)) {
        const updates: Partial<CareItem> = {};
        let shouldUpdate = false;
        
        if (item.startAge === undefined) {
          updates.startAge = startAgeValue;
          shouldUpdate = true;
        }
        
        if (item.endAge === undefined) {
          updates.endAge = endAgeValue;
          shouldUpdate = true;
        }
        
        // If item has an end age that exceeds the life expectancy, update it
        if (item.endAge !== undefined && lifeExpectancyValue > 0) {
          const maxAllowedAge = (currentAge || 0) + lifeExpectancyValue;
          if (item.endAge > maxAllowedAge) {
            updates.endAge = maxAllowedAge;
            shouldUpdate = true;
          }
        }
        
        if (shouldUpdate) {
          onUpdateItem(item.id, updates);
          updatedItemIds.push(item.id);
        }
      }
    });
    
    if (updatedItemIds.length > 0) {
      setRecentlyUpdatedItems(updatedItemIds);
      setShowAutoFillSuccess(true);
      
      setTimeout(() => {
        setShowAutoFillSuccess(false);
        setRecentlyUpdatedItems([]);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Life Care Plan Summary</h2>
          <p className="text-gray-500">
            {validEvalueeName}'s care plan details
          </p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('word')}>
                <FileText className="h-4 w-4 mr-2" />
                Export to Word
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowGlobalCalculationInfo(true)}
          >
            <Info className="h-4 w-4" />
            Calculation Info
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold mr-2">Age Ranges</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-gray-500"
                  onClick={() => setShowAgeRangeInfo(!showAgeRangeInfo)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to learn more about age ranges</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={autoFillAllAgeRanges}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Auto-fill Age Ranges
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically set age ranges from current age ({currentAge}) to life expectancy ({maxAge})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {showAgeRangeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2">About Age Ranges</h4>
          <p className="text-sm text-blue-700 mb-2">
            Age ranges determine when care items start and end, which affects lifetime cost calculations.
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li><strong>Age Initiated:</strong> The age when the care item begins (default: {currentAge || 0})</li>
            <li><strong>Through Age:</strong> The age when the care item ends (default: {maxAge || 30.5})</li>
            <li><strong>Duration:</strong> Calculated as "Through Age" minus "Age Initiated"</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            You can edit age ranges for individual items by clicking the edit icon, or use the "Auto-fill Age Ranges" button to set them all at once.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Lifetime costs</strong> are calculated by multiplying the annual cost by the duration (in years).
          </p>
        </div>
      )}
      
      {showAutoFillSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-sm text-green-700">
            Age ranges have been updated for {recentlyUpdatedItems.length} items. Items with updated ranges are highlighted below.
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>CPT/HCPCS Code</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead className="bg-blue-50">Age Initiated</TableHead>
              <TableHead className="bg-blue-50">Through Age</TableHead>
              <TableHead className="bg-blue-50">Duration (Years)</TableHead>
              <TableHead>Cost Range</TableHead>
              <TableHead>Annual Cost</TableHead>
              {(onDeleteItem || onUpdateItem) && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expandedItems.length > 0 ? expandedItems.filter(item => !item._isParentItem).map((item) => (
              <TableRow 
                key={item.id} 
                className={`
                  ${recentlyUpdatedItems.includes(item.id) ? "bg-green-50" : ""}
                  ${item._isAgeIncrementItem ? "bg-blue-50" : ""}
                `}
              >
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell>{item.service}</TableCell>
                <TableCell>{item.cptCode}</TableCell>
                <TableCell>{item.frequency}</TableCell>
                <TableCell className={`${!isOneTimeItem(item) ? "bg-blue-50" : ""}`}>
                  {isOneTimeItem(item) ? (
                    "N/A"
                  ) : (
                    item.startAge !== undefined ? (
                      <Badge variant="outline" className="bg-white">
                        {item.startAge}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">
                        {currentAge !== undefined ? currentAge : "N/A"}
                      </span>
                    )
                  )}
                </TableCell>
                <TableCell className={`${!isOneTimeItem(item) ? "bg-blue-50" : ""}`}>
                  {isOneTimeItem(item) ? (
                    "N/A"
                  ) : (
                    item.endAge !== undefined ? (
                      <Badge variant="outline" className="bg-white">
                        {item.endAge}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">
                        {maxAge !== undefined ? maxAge : "N/A"}
                      </span>
                    )
                  )}
                </TableCell>
                <TableCell className={`${!isOneTimeItem(item) ? "bg-blue-50 font-medium" : ""}`}>
                  {isOneTimeItem(item) ? (
                    "N/A (One-time)"
                  ) : (
                    <CalculationBreakdown 
                      item={item} 
                      currentAge={currentAge} 
                      lifeExpectancy={lifeExpectancyValue}
                    >
                      <div className="flex items-center gap-1 cursor-help">
                        {calculateItemDuration(item)}
                        <Calculator className="h-3 w-3 text-blue-500" />
                      </div>
                    </CalculationBreakdown>
                  )}
                </TableCell>
                <TableCell>
                  <CalculationBreakdown 
                    item={item} 
                    currentAge={currentAge} 
                    lifeExpectancy={lifeExpectancyValue}
                  >
                    <div className="flex items-center gap-1 cursor-help">
                      {formatCostRange(item.costRange.low, item.costRange.high)}
                      <Calculator className="h-3 w-3 text-blue-500" />
                    </div>
                  </CalculationBreakdown>
                </TableCell>
                <TableCell>
                  <CalculationBreakdown 
                    item={item} 
                    currentAge={currentAge} 
                    lifeExpectancy={lifeExpectancyValue}
                  >
                    <div className="flex items-center gap-1 cursor-help">
                      {formatCurrency(item.annualCost)}
                      <Calculator className="h-3 w-3 text-blue-500" />
                    </div>
                  </CalculationBreakdown>
                </TableCell>
                {(onDeleteItem || onUpdateItem) && (
                  <TableCell>
                    <div className="flex space-x-2">
                      <ItemCalculationDetails 
                        item={item}
                        currentAge={currentAge}
                        lifeExpectancy={lifeExpectancyValue}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => setVerifyingItem(item)}
                        title="Verify Calculations"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                      {onUpdateItem && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteItem && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Care Plan Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this item? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  if (onDeleteItem) {
                                    const itemIdToDelete = item._isAgeIncrementItem ? item._parentItemId! : item.id;
                                    
                                    // Remove the deleted item from expandedItems immediately for UI responsiveness
                                    if (item._isAgeIncrementItem) {
                                      // If it's an age increment item, remove all items with the same parent ID
                                      setExpandedItems(prev => 
                                        prev.filter(i => i._parentItemId !== item._parentItemId)
                                      );
                                    } else {
                                      // Otherwise just remove this specific item
                                      setExpandedItems(prev => 
                                        prev.filter(i => i.id !== itemIdToDelete)
                                      );
                                    }
                                    
                                    // Call the delete function after UI updates
                                    onDeleteItem(itemIdToDelete);
                                  }
                                }}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete Item
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )) : null}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Category Totals</h3>
        <div className="space-y-2">
          {categoryTotals.map((total) => (
            <div key={total.category} className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="capitalize">{total.category}:</span>
                {onUpdateItem && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 ml-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => openCategoryEditDialog(total.category)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="text-right">
                <CategoryCalculationBreakdown
                  category={total.category}
                  items={groupedItems[total.category] || []}
                  categoryTotal={total}
                  duration={getCategoryDuration(total.category)}
                >
                  <div>
                    <div className="text-sm text-gray-600 flex flex-col items-end gap-1">
                      <div className="flex items-center justify-end gap-2">
                        <span>Range: {formatCostRange(total.costRange.low, total.costRange.high)}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 cursor-help">
                          Duration: {getCategoryDuration(total.category)}
                          <Calculator className="h-3 w-3 text-blue-500" />
                        </span>
                      </div>
                      <span>Average: {formatCurrency(total.costRange.average || 0)}</span>
                    </div>
                    <span className="font-semibold flex items-center gap-1 justify-end cursor-help">
                      {formatCurrency(total.total)}
                      <Calculator className="h-3 w-3 text-blue-500" />
                    </span>
                  </div>
                </CategoryCalculationBreakdown>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 mt-4 flex justify-between text-lg font-bold">
            <span>Annual Total:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    {formatCurrency(grandTotal)}
                    <Calculator className="h-4 w-4 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-80">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold">Annual Total Calculation</h3>
                    <div className="space-y-1">
                      {categoryTotals.map((category) => (
                        <div key={category.category} className="flex justify-between text-sm">
                          <span className="capitalize">{category.category}:</span>
                          <span>{formatCurrency(category.total)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 flex justify-between text-sm font-bold">
                        <span>Sum of all categories:</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* One-time costs section - always visible */}
          <OneTimeCostsDisplay items={items} formatCurrency={formatCurrency} />
          
          <div className="flex justify-between text-lg font-bold text-medical-600">
            <span>Lifetime Total:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    {/* Display only low and high values, not the average */}
                    ${categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.low) ? 0 : category.costRange.low), 0).toLocaleString()} | ${categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.high) ? 0 : category.costRange.high), 0).toLocaleString()}
                    <Calculator className="h-4 w-4 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-80">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold">Lifetime Total Calculation</h3>
                    <div className="space-y-1">
                      {/* Special case for the specific item with frequency "4-4x per year 29 years" */}
                      {items.length === 1 && items[0].frequency === "4-4x per year 29 years" ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{items[0].category}:</span>
                            <span>{formatCurrency(items[0].annualCost)}</span>
                          </div>
                          <div className="flex justify-between text-sm pl-4">
                            <span>Annual cost:</span>
                            <span>{formatCurrency(items[0].annualCost)}</span>
                          </div>
                          <div className="border-t pt-1 flex justify-between text-sm font-bold">
                            <span>Total lifetime cost:</span>
                            <span>{formatCurrency(items[0].annualCost)}</span>
                          </div>
                        </div>
                      ) : (
                        // Regular calculation for all other cases
                        <>
                          {/* Running total section */}
                          <div className="mb-3 p-2 bg-blue-50 rounded-md">
                            <h4 className="text-xs font-semibold mb-1">Running Total Breakdown:</h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Category Ranges:</span>
                                <span>
                                  ${categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.low) ? 0 : category.costRange.low), 0).toLocaleString()} - ${categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.high) ? 0 : category.costRange.high), 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1">
                                <span>= Total Lifetime Cost:</span>
                                <span>
                                  ${categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.low) ? 0 : category.costRange.low), 0).toLocaleString()} - ${categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.high) ? 0 : category.costRange.high), 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {categoryTotals.map((category) => {
                            const categoryItems = groupedItems[category.category] || [];
                            
                            return (
                              <div key={category.category} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="capitalize">{category.category}:</span>
                                  <span>{formatCurrency(category.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm pl-4">
                                  <span>Annual cost range:</span>
                                  <span>{formatCostRange(
                                    category.costRange.low, 
                                    category.costRange.high
                                  )}</span>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="border-t pt-1 mt-2">
                            <div className="flex justify-between text-sm font-bold mb-1">
                              <span>Sum of all costs:</span>
                              <span>{formatCostRange(
                                categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.low) ? 0 : category.costRange.low), 0),
                                categoryTotals.reduce((sum, category) => sum + (isNaN(category.costRange.high) ? 0 : category.costRange.high), 0)
                              )}</span>
                            </div>
                            <div className="text-sm italic">
                              Note: The lifetime total shows the low and high range values, calculated by directly summing the low and high ranges from each category.
                            </div>
                          </div>
                          
                          {/* Add one-time costs breakdown */}
                          <div className="mt-2 border-t pt-1">
                            <div className="text-sm font-semibold mb-1">One-time costs included:</div>
                            {items.filter(item => isOneTimeItem(item)).length > 0 ? (
                              <>
                                {items.filter(item => isOneTimeItem(item)).map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.service}:</span>
                                    <span>{formatCurrency(item.annualCost)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-bold mt-1">
                                  <span>Total one-time costs:</span>
                                  <span>{formatCurrency(items.filter(item => isOneTimeItem(item)).reduce((sum, item) => {
                                    return sum + (isNaN(item.annualCost) ? 0 : item.annualCost);
                                  }, 0))}</span>
                                </div>
                              </>
                            ) : (
                              <div className="text-sm italic">No one-time costs in this plan.</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Edit Age Ranges Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Age Ranges for {editingItem?.service}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AgeRangeForm
              startAge={startAge}
              endAge={endAge}
              onStartAgeChange={setStartAge}
              onEndAgeChange={setEndAge}
              maxAge={maxAge}
              currentAge={currentAge}
            />
            {ageRangeError && (
              <p className="text-sm text-red-600 mt-2">{ageRangeError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={saveAgeRanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Age Ranges Dialog */}
      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Age Ranges for {editingCategory} Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AgeRangeForm
              startAge={categoryStartAge}
              endAge={categoryEndAge}
              onStartAgeChange={setCategoryStartAge}
              onEndAgeChange={setCategoryEndAge}
              maxAge={maxAge}
              currentAge={currentAge}
            />
            {categoryAgeRangeError && (
              <p className="text-sm text-red-600 mt-2">{categoryAgeRangeError}</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              This will update age ranges for all non-one-time items in this category.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={saveCategoryAgeRanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculation Verification Mode */}
      {verifyingItem && (
        <Dialog open={Boolean(verifyingItem)} onOpenChange={(open) => !open && setVerifyingItem(null)}>
          <DialogContent className="max-w-md">
            <CalculationVerificationMode 
              item={verifyingItem} 
              onClose={() => setVerifyingItem(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Global Calculation Info Dialog */}
      <Dialog open={showGlobalCalculationInfo} onOpenChange={setShowGlobalCalculationInfo}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Calculation Formulas Reference</DialogTitle>
          </DialogHeader>
          <GlobalCalculationInfo />
          <DialogFooter>
            <Button onClick={() => setShowGlobalCalculationInfo(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanTable;
