import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Evaluee } from "@/types/lifecare";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Plans = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Temporary mock data - this would come from your database
  const [evaluees] = useState<Evaluee[]>([]);

  const filteredEvaluees = evaluees.filter(
    (evaluee) =>
      evaluee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluee.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Life Care Plans</h1>
          <p className="mt-2 text-gray-600">
            Manage and view all life care plans
          </p>
        </div>
        <Button
          onClick={() => navigate("/plans/new")}
          className="bg-medical-500 hover:bg-medical-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search evaluees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvaluees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No life care plans found. Create your first one by clicking the
                  "New Plan" button.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvaluees.map((evaluee) => (
                <TableRow key={evaluee.id}>
                  <TableCell>
                    {evaluee.firstName} {evaluee.lastName}
                  </TableCell>
                  <TableCell>{evaluee.dateOfBirth}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/plans/${evaluee.id}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Plans;