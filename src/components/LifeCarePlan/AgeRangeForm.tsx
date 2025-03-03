interface AgeRangeFormProps {
  startAge: string;
  endAge: string;
  onStartAgeChange: (value: string) => void;
  onEndAgeChange: (value: string) => void;
  maxAge?: number; // Maximum allowed age (based on life expectancy)
  currentAge?: number; // Current age for reference
}

export function AgeRangeForm({
  startAge,
  endAge,
  onStartAgeChange,
  onEndAgeChange,
  maxAge,
  currentAge
}: AgeRangeFormProps) {
  // Calculate the maximum allowed end age
  const maxEndAge = maxAge !== undefined ? maxAge : 100;
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Age</label>
        <input
          type="number"
          value={startAge}
          onChange={(e) => onStartAgeChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          min="0"
          step="0.1"
          placeholder={currentAge !== undefined ? currentAge.toString() : "0"}
        />
        {currentAge !== undefined && (
          <p className="text-xs text-gray-500 mt-1">Current age: {currentAge}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Age</label>
        <input
          type="number"
          value={endAge}
          onChange={(e) => onEndAgeChange(e.target.value)}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            parseFloat(endAge) > maxEndAge ? "border-red-500" : ""
          }`}
          required
          min="0"
          max={maxEndAge}
          step="0.1"
          placeholder={maxEndAge.toString()}
        />
        {maxAge !== undefined && (
          <p className={`text-xs mt-1 ${parseFloat(endAge) > maxEndAge ? "text-red-500" : "text-gray-500"}`}>
            Maximum allowed age: {maxEndAge} (based on life expectancy)
            {parseFloat(endAge) > maxEndAge && " - Current value exceeds maximum!"}
          </p>
        )}
      </div>
    </div>
  );
}
