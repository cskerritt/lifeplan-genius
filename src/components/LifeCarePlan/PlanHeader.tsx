
import { FC } from 'react';

interface PlanHeaderProps {
  isNew: boolean;
}

export const PlanHeader: FC<PlanHeaderProps> = ({ isNew }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">
        {isNew ? "New Life Care Plan" : "Edit Life Care Plan"}
      </h1>
      <p className="mt-2 text-gray-600">
        {isNew ? "Create a new life care plan" : "Update existing life care plan"}
      </p>
    </div>
  );
};
