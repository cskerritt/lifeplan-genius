interface AgeRangeFormProps {
  startAge: string;
  endAge: string;
  onStartAgeChange: (value: string) => void;
  onEndAgeChange: (value: string) => void;
}

export function AgeRangeForm({
  startAge,
  endAge,
  onStartAgeChange,
  onEndAgeChange
}: AgeRangeFormProps) {
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
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Age</label>
        <input
          type="number"
          value={endAge}
          onChange={(e) => onEndAgeChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          min="0"
          step="0.1"
        />
      </div>
    </div>
  );
}