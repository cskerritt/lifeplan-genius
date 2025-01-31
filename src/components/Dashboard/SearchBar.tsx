import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchBar = ({ searchTerm, onSearchChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Search plans by name, city, or state..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 w-full max-w-xl bg-white/50 backdrop-blur-sm"
      />
    </div>
  );
};

export default SearchBar;