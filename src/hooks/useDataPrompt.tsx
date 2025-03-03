import { useState, useCallback } from 'react';
import { MissingDataError } from '@/utils/calculations/utilities/userPromptUtils';
import DataPromptDialog from '@/components/ui/DataPromptDialog';

/**
 * Hook for handling missing data prompts
 * This hook provides a way to handle MissingDataError and show a dialog to prompt the user for the missing data
 */
const useDataPrompt = () => {
  const [currentError, setCurrentError] = useState<MissingDataError | null>(null);
  const [pendingOperation, setPendingOperation] = useState<(() => Promise<any>) | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  /**
   * Executes an async operation that might throw a MissingDataError
   * If a MissingDataError is thrown, it shows a dialog to prompt the user for the missing data
   * @param operation - The async operation to execute
   * @returns A promise that resolves with the result of the operation
   */
  const executeWithPrompt = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof MissingDataError) {
        setCurrentError(error);
        setIsPrompting(true);
        setPendingOperation(() => operation);
        
        // Return a new promise that will be resolved when the user provides the missing data
        return new Promise<T>((resolve, reject) => {
          // This promise will be resolved or rejected by the handleSubmit or handleCancel functions
          // The actual resolution happens after the user interaction with the dialog
          // We store the resolve/reject functions in the component state
          setPendingOperation(() => async () => {
            try {
              const result = await operation();
              resolve(result);
              return result;
            } catch (err) {
              reject(err);
              throw err;
            }
          });
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  }, []);

  /**
   * Handles the submission of the missing data
   * @param value - The value provided by the user
   */
  const handleSubmit = useCallback(async (value: string) => {
    if (!pendingOperation) return;
    
    setIsPrompting(false);
    setCurrentError(null);
    
    try {
      // Re-execute the operation now that we have the missing data
      // The missing data will be fetched from the UI or database as needed
      await pendingOperation();
    } catch (error) {
      // If another MissingDataError is thrown, we'll handle it recursively
      if (error instanceof MissingDataError) {
        setCurrentError(error);
        setIsPrompting(true);
      } else {
        console.error('Error after providing missing data:', error);
      }
    } finally {
      setPendingOperation(null);
    }
  }, [pendingOperation]);

  /**
   * Handles the cancellation of the missing data prompt
   */
  const handleCancel = useCallback(() => {
    setIsPrompting(false);
    setCurrentError(null);
    setPendingOperation(null);
  }, []);

  // Render the dialog if we're prompting for missing data
  const promptDialog = isPrompting && currentError ? (
    <DataPromptDialog
      error={currentError}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  ) : null;

  return {
    executeWithPrompt,
    promptDialog,
    isPrompting
  };
};

export default useDataPrompt;
