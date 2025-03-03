import React, { useState } from 'react';
import { MissingDataError, UserPromptOptions } from '@/utils/calculations/utilities/userPromptUtils';

interface DataPromptDialogProps {
  error: MissingDataError;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

/**
 * A dialog component that prompts the user for missing data
 * This is used when a calculation requires data that is not available
 */
const DataPromptDialog: React.FC<DataPromptDialogProps> = ({ error, onSubmit, onCancel }) => {
  const { promptOptions } = error;
  const [value, setValue] = useState<string>(
    promptOptions.defaultValue !== undefined ? String(promptOptions.defaultValue) : ''
  );
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the input if a validator is provided
    if (promptOptions.validator) {
      const validationResult = promptOptions.validator(value);
      if (!validationResult.valid) {
        setValidationError(validationResult.error);
        return;
      }
    }
    
    // If validation passes or no validator is provided, submit the value
    onSubmit(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{promptOptions.title}</h2>
        <p className="mb-4">{promptOptions.message}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setValidationError(undefined); // Clear validation error when input changes
              }}
              className={`w-full p-2 border rounded ${
                validationError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`Enter ${error.dataType.toLowerCase()}`}
              required={promptOptions.required}
              autoFocus
            />
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataPromptDialog;
