import { TestDecimalInsert } from '@/components/TestDecimalInsert';

export default function TestDecimalPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Database Migration Test
      </h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        This page tests if the database migration from INTEGER to NUMERIC was successful.
        It will attempt to insert a decimal value into the database and report the result.
      </p>
      <TestDecimalInsert />
    </div>
  );
} 