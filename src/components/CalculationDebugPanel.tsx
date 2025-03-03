import React, { useState, useEffect } from 'react';
import { calculationLogger } from '@/utils/calculations/logger';
import { CalculationLogEntry } from '@/utils/calculations/types';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Calculator, X, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GlobalCalculationInfo from './LifeCarePlan/GlobalCalculationInfo';

/**
 * Component to display calculation logs and details
 */
const CalculationDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<CalculationLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('logs');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch logs when the panel is opened
  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  // Refresh logs from the calculation logger
  const refreshLogs = () => {
    setLogs(calculationLogger.getAll());
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(timestamp);
  };

  // Get badge color based on log level
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'debug':
        return <Badge variant="outline" className="bg-gray-100">DEBUG</Badge>;
      case 'info':
        return <Badge variant="outline" className="bg-blue-100">INFO</Badge>;
      case 'warn':
        return <Badge variant="outline" className="bg-yellow-100">WARN</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100">ERROR</Badge>;
      default:
        return <Badge variant="outline">{level.toUpperCase()}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50 bg-white shadow-md"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculation Details
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            <span>Calculation Details</span>
            <Button variant="ghost" size="sm" onClick={refreshLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription>
            View all calculation details, variables, and explanations
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="logs">Calculation Logs</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="explanations">Explanations</TabsTrigger>
          </TabsList>
          
          {/* Calculation Logs Tab */}
          <TabsContent value="logs" className="mt-4">
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No calculation logs available. Try performing some calculations first.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="border rounded-md p-3 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getLevelBadge(log.level)}
                          <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm">{log.message}</p>
                      {log.data && (
                        <div className="mt-2 bg-gray-50 p-2 rounded-md">
                          <pre className="text-xs overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Variables Tab */}
          <TabsContent value="variables" className="mt-4">
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="font-medium mb-2">Frequency Variables</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-mono bg-gray-50 p-2 rounded">Weekly: 52.1429 times/year</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Monthly: 12 times/year</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Quarterly: 4 times/year</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Annually: 1 time/year</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Daily: 365 times/year</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Bi-weekly: 26 times/year</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="font-medium mb-2">Duration Variables</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="font-mono bg-gray-50 p-2 rounded">Default Duration: 30 years</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Age-based: endAge - startAge</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Life Expectancy: Based on actuarial tables</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="font-medium mb-2">Cost Variables</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="font-mono bg-gray-50 p-2 rounded">Base Rate: Cost per occurrence</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Annual Cost: Base Rate × Annual Frequency</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">Lifetime Cost: Annual Cost × Duration</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">One-time Cost: Base Rate (no frequency/duration)</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="font-medium mb-2">Geographic Adjustment Factors</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="font-mono bg-gray-50 p-2 rounded">MFR Factor: Multiplier for MFR rates</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">PFR Factor: Multiplier for PFR rates</div>
                      <div className="font-mono bg-gray-50 p-2 rounded">ASA Factor: Multiplier for ASA rates</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Explanations Tab */}
          <TabsContent value="explanations" className="mt-4">
            <ScrollArea className="h-[calc(90vh-200px)]">
              <GlobalCalculationInfo />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default CalculationDebugPanel; 