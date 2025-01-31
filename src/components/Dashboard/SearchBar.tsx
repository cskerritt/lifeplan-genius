import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchBar = ({ searchTerm, onSearchChange }: SearchBarProps) => {
  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
      <Search className="w-5 h-5 text-gray-400" />
      <Input
        placeholder="Search by name, city, or state..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-md"
      />
    </div>
  );
};

export default SearchBar;