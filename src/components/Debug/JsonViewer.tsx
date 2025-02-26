
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JsonViewerProps {
  data: any;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!data) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-center py-2"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Hide Response Data
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Response Data
            </>
          )}
        </Button>
        {isVisible && (
          <div className="p-4 max-h-[50vh] overflow-auto">
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonViewer;
