interface FrequencyFormProps {
  isOneTime: boolean;
  onIsOneTimeChange: (value: boolean) => void;
  minFrequency: string;
  maxFrequency: string;
  minDuration: string;
  maxDuration: string;
  onMinFrequencyChange: (value: string) => void;
  onMaxFrequencyChange: (value: string) => void;
  onMinDurationChange: (value: string) => void;
  onMaxDurationChange: (value: string) => void;
  costs: any | null;
}

export function FrequencyForm({
  isOneTime,
  onIsOneTimeChange,
  minFrequency,
  maxFrequency,
  minDuration,
  maxDuration,
  onMinFrequencyChange,
  onMaxFrequencyChange,
  onMinDurationChange,
  onMaxDurationChange,
  costs
}: FrequencyFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="oneTime"
          checked={isOneTime}
          onChange={(e) => onIsOneTimeChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="oneTime" className="ml-2 text-sm font-medium text-gray-700">
          One-time cost
        </label>
      </div>

      {!isOneTime && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Frequency
              </label>
              <input
                type="number"
                value={minFrequency}
                onChange={(e) => onMinFrequencyChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={!isOneTime}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Frequency
              </label>
              <input
                type="number"
                value={maxFrequency}
                onChange={(e) => onMaxFrequencyChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min={parseFloat(minFrequency) || 0}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Duration (years)
              </label>
              <input
                type="number"
                value={minDuration}
                onChange={(e) => onMinDurationChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={!isOneTime}
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Duration (years)
              </label>
              <input
                type="number"
                value={maxDuration}
                onChange={(e) => onMaxDurationChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min={parseFloat(minDuration) || 0.1}
                step="0.1"
              />
            </div>
          </div>
        </>
      )}

      {costs && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-900 mb-4">
            {isOneTime ? 'One-Time Cost' : 'Cost Summary'}
          </h4>
          {isOneTime ? (
            <p className="text-lg font-semibold">
              ${costs.avg_cost.toFixed(2)}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-indigo-700">Annual Cost Range</p>
                <div className="mt-1 text-lg font-semibold">
                  <div>${costs.min_annual_cost?.toFixed(2)}</div>
                  <div className="border-t border-indigo-200 mt-1 pt-1">
                    ${costs.max_annual_cost?.toFixed(2)}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-indigo-700">Average Annual Cost</p>
                <p className="mt-1 text-lg font-semibold">
                  ${costs.avg_annual_cost?.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}