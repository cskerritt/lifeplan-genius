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
import { useState, useEffect, useMemo } from "react";
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
  console.log('PlanTable received evalueeName:', evalueeName);
  
  // Ensure evalueeName is valid
  const validEvalueeName = evalueeName && evalueeName.trim() !== '' ? evalueeName.trim() : "Unknown";
  console.log('PlanTable validEvalueeName:', validEvalueeName);
  
  const [editingItem, setEditingItem] = useState<CareItem | null>(null);
  const [startAge, setStartAge] = useState<string>("");
  const [endAge, setEndAge] = useState<string>("");
  const [itemsWithDefaults, setItemsWithDefaults] = useState<CareItem[]>([]);
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState<boolean>(false);
  const [recentlyUpdatedItems, setRecentlyUpdatedItems] = useState<string[]>([]);
  const [showAgeRangeInfo, setShowAgeRangeInfo] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryStartAge, setCategoryStartAge] = useState<string>("");
  const [categoryEndAge, setCategoryEndAge] = useState<string>("");
  const [verifyingItem, setVerifyingItem] = useState<CareItem | null>(null);
  const [showGlobalCalculationInfo, setShowGlobalCalculationInfo] = useState<boolean>(false);
  
  const calculateAgeFromDOB = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Provide default values if undefined
  const currentAge = evaluee?.dateOfBirth 
    ? calculateAgeFromDOB(evaluee.dateOfBirth) 
    : 0; // Default to 0 instead of undefined
  
  // Extract the numeric value from lifeExpectancy string if it exists
  const lifeExpectancyValue = evaluee?.lifeExpectancy 
    ? parseFloat(evaluee.lifeExpectancy) 
    : 0;
  
  // Provide default values if undefined - use 30.5 as default if no other data is available
  const maxAge = lifeExpectancyValue > 0
    ? (currentAge || 0) + lifeExpectancyValue
    : 30.5; // Default to 30.5 if no other data is available

  // Set default age ranges when items or current/max age changes
  useEffect(() => {
    if (items) {
      setItemsWithDefaults(items);
    }
  }, [items]);

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

  const handleExport = (format: 'word' | 'excel') => {
    console.log('handleExport called with format:', format);
    console.log('Using validEvalueeName:', validEvalueeName);
    
    // Auto-fill missing age ranges before export
    const exportItems = items.map(item => {
      if (!isOneTimeItem(item)) {
        if (item.startAge === undefined && item.endAge === undefined) {
          return {
            ...item,
            startAge: currentAge !== undefined ? currentAge : undefined,
            endAge: maxAge !== undefined ? maxAge : undefined
          };
        }
      }
      return item;
    });

    const exportData = {
      planId,
      evalueeName: validEvalueeName,
      items: exportItems,
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
      // Only include these fields if lifePlan is defined
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatCostRange = (low: number, high: number) => {
    return `${formatCurrency(low)} - ${formatCurrency(high)}`;
  };
  
  const openEditDialog = (item: CareItem) => {
    setEditingItem(item);
    setStartAge(item.startAge?.toString() || "");
    setEndAge(item.endAge?.toString() || "");
  };
  
  const saveAgeRanges = () => {
    if (editingItem && onUpdateItem) {
      const updates: Partial<CareItem> = {};
      
      const startAgeNum = startAge ? parseInt(startAge) : undefined;
      const endAgeNum = endAge ? parseInt(endAge) : undefined;
      
      // Add validation before saving
      if (startAgeNum !== undefined && endAgeNum !== undefined && endAgeNum < startAgeNum) {
        // Show error message to user
        alert("End age cannot be less than start age");
        return;
      }
      
      updates.startAge = startAgeNum;
      updates.endAge = endAgeNum;
      
      onUpdateItem(editingItem.id, updates);
      setEditingItem(null);
    }
  };

  const openCategoryEditDialog = (category: string) => {
    setEditingCategory(category);
    const range = categoryAgeRanges[category];
    setCategoryStartAge(range?.startAge?.toString() || "");
    setCategoryEndAge(range?.endAge?.toString() || "");
  };

  const saveCategoryAgeRanges = () => {
    if (editingCategory && onUpdateItem && groupedItems[editingCategory]) {
      const startAgeNum = categoryStartAge ? parseInt(categoryStartAge) : undefined;
      const endAgeNum = categoryEndAge ? parseInt(categoryEndAge) : undefined;
      
      // Add validation before saving
      if (startAgeNum !== undefined && endAgeNum !== undefined && endAgeNum < startAgeNum) {
        // Show error message to user
        alert("End age cannot be less than start age");
        return;
      }
      
      // Update all non-one-time items in this category
      const itemsToUpdate = groupedItems[editingCategory].filter(item => !isOneTimeItem(item));
      
      // Track which items were updated
      const updatedItemIds: string[] = [];
      
      itemsToUpdate.forEach(item => {
        onUpdateItem(item.id, {
          startAge: startAgeNum,
          endAge: endAgeNum
        });
        updatedItemIds.push(item.id);
      });
      
      // Show success message and highlight updated items
      if (updatedItemIds.length > 0) {
        setRecentlyUpdatedItems(updatedItemIds);
        setShowAutoFillSuccess(true);
        
        // Clear the highlight after 3 seconds
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
    
    // Use default values if undefined
    const startAgeValue = currentAge || 0;
    const endAgeValue = maxAge || 30.5; // Default to 30.5 if undefined
    
    // Track which items were updated
    const updatedItemIds: string[] = [];
    
    // Update only items without age ranges and that are not one-time items
    items.forEach(item => {
      if (!isOneTimeItem(item)) {
        const updates: Partial<CareItem> = {};
        let shouldUpdate = false;
        
        // Only update startAge if it's undefined
        if (item.startAge === undefined) {
          updates.startAge = startAgeValue;
          shouldUpdate = true;
        }
        
        // Only update endAge if it's undefined
        if (item.endAge === undefined) {
          updates.endAge = endAgeValue;
          shouldUpdate = true;
        }
        
        if (shouldUpdate) {
          onUpdateItem(item.id, updates);
          updatedItemIds.push(item.id);
        }
      }
    });
    
    // Show success message and highlight updated items
    if (updatedItemIds.length > 0) {
      setRecentlyUpdatedItems(updatedItemIds);
      setShowAutoFillSuccess(true);
      
      // Clear the highlight after 3 seconds
      setTimeout(() => {
        setShowAutoFillSuccess(false);
        setRecentlyUpdatedItems([]);
      }, 3000);
    }
  };

  // Calculate category duration
  const getCategoryDuration = (category: string): string => {
    const range = categoryAgeRanges[category];
    
    // Check if we have any items in this category that mention duration in frequency
    const categoryItems = groupedItems[category] || [];
    const nonOneTimeItems = categoryItems.filter(item => !isOneTimeItem(item));
    
    // Look for items with frequency that mentions years
    const itemsWithYearFrequency = nonOneTimeItems.filter(item => {
      const frequencyLower = item.frequency.toLowerCase();
      return frequencyLower.includes("years") || 
             frequencyLower.includes("yrs") || 
             frequencyLower.includes("30 years");
    });
    
    // If we have items with year frequency, use that for duration
    if (itemsWithYearFrequency.length > 0) {
      // Extract the number of years from the first item's frequency
      const frequencyLower = itemsWithYearFrequency[0].frequency.toLowerCase();
      const yearMatch = frequencyLower.match(/(\d+)\s*(?:years?|yrs?)/i);
      
      if (yearMatch) {
        return yearMatch[1];
      }
      
      // Special case for "4x per year 30 years"
      if (frequencyLower.includes("30 years")) {
        return "30";
      }
    }
    
    // If we have both startAge and endAge, calculate the duration
    if (range?.startAge !== undefined && range?.endAge !== undefined) {
      if (range.endAge < range.startAge) {
        return "Error: End age < Start age";
      }
      return (range.endAge - range.startAge).toString();
    } else if (range?.startAge === undefined && range?.endAge !== undefined) {
      // If we have endAge but no startAge, assume startAge is 0
      return range.endAge.toString();
    } else if (range?.startAge !== undefined && range?.endAge === undefined) {
      // If we have startAge but no endAge, assume a default duration of 30
      return "30";
    }
    
    return "30"; // Default to 30 if both are undefined
  };

  return (
    <div className="space-y-6">
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
          <Button
            variant="outline"
            onClick={() => setShowGlobalCalculationInfo(true)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Calculation Formulas
          </Button>
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
          <Button
            variant="outline"
            onClick={() => handleExport('word')}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export to Word
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export to Excel
          </Button>
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
            You can edit age ranges for individual items by clicking the edit (pencil) icon, or use the "Auto-fill Age Ranges" button to set them all at once.
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
            {items.map((item) => (
              <TableRow 
                key={item.id} 
                className={recentlyUpdatedItems.includes(item.id) ? "bg-green-50" : ""}
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
                        {currentAge !== undefined && currentAge !== null ? currentAge : "N/A"}
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
                        {maxAge !== undefined && maxAge !== null ? maxAge : "N/A"}
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
                                onClick={() => onDeleteItem(item.id)}
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
            ))}
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
                  duration={parseInt(getCategoryDuration(total.category))}
                >
                  <div>
                    <div className="text-sm text-gray-600 flex items-center justify-end gap-2">
                      <span>Range: {formatCostRange(total.costRange.low, total.costRange.high)}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 cursor-help">
                        Duration: {getCategoryDuration(total.category)}
                        <Calculator className="h-3 w-3 text-blue-500" />
                      </span>
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
          <div className="flex justify-between text-lg font-bold text-medical-600">
            <span>Lifetime Total:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    {lifetimeLow === 0 && lifetimeHigh === 0 ? (
                      // Calculate lifetime total on the fly if not provided
                      formatCostRange(
                        categoryTotals.reduce((sum, category) => {
                          const duration = parseFloat(getCategoryDuration(category.category)) || 30;
                          return sum + (category.total * duration);
                        }, 0),
                        categoryTotals.reduce((sum, category) => {
                          const duration = parseFloat(getCategoryDuration(category.category)) || 30;
                          return sum + (category.total * duration);
                        }, 0)
                      )
                    ) : (
                      formatCostRange(lifetimeLow, lifetimeHigh)
                    )}
                    <Calculator className="h-4 w-4 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-80">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold">Lifetime Total Calculation</h3>
                    <div className="space-y-1">
                      {categoryTotals.map((category) => {
                        const duration = parseFloat(getCategoryDuration(category.category)) || 30;
                        return (
                          <div key={category.category} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{category.category}:</span>
                              <span>{formatCurrency(category.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4">
                              <span>Duration:</span>
                              <span>{duration} years</span>
                            </div>
                            <div className="flex justify-between text-sm pl-4 font-medium">
                              <span>Lifetime cost:</span>
                              <span>{formatCurrency(category.total * duration)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t pt-1 flex justify-between text-sm font-bold">
                        <span>Sum of all lifetime costs:</span>
                        <span>
                          {formatCurrency(
                            categoryTotals.reduce((sum, category) => {
                              const duration = parseFloat(getCategoryDuration(category.category)) || 30;
                              return sum + (category.total * duration);
                            }, 0)
                          )}
                        </span>
                      </div>
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startAge" className="text-right">
                Age Initiated
              </Label>
              <Input
                id="startAge"
                type="number"
                min="0"
                className="col-span-3"
                value={startAge}
                onChange={(e) => setStartAge(e.target.value)}
                placeholder={getDefaultStartAge()}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endAge" className="text-right">
                Through Age
              </Label>
              <Input
                id="endAge"
                type="number"
                min="0"
                className="col-span-3"
                value={endAge}
                onChange={(e) => setEndAge(e.target.value)}
                placeholder={getDefaultEndAge()}
              />
            </div>
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryStartAge" className="text-right">
                Age Initiated
              </Label>
              <Input
                id="categoryStartAge"
                type="number"
                min="0"
                className="col-span-3"
                value={categoryStartAge}
                onChange={(e) => setCategoryStartAge(e.target.value)}
                placeholder={getDefaultStartAge()}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryEndAge" className="text-right">
                Through Age
              </Label>
              <Input
                id="categoryEndAge"
                type="number"
                min="0"
                className="col-span-3"
                value={categoryEndAge}
                onChange={(e) => setCategoryEndAge(e.target.value)}
                placeholder={getDefaultEndAge()}
              />
            </div>
            <p className="text-sm text-gray-500 col-span-4">
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
