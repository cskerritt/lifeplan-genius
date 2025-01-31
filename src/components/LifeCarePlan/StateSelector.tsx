import React from 'react';
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateSelectorProps {
  value: string;
  states: { id: string; name: string; }[];
  isLoading: boolean;
  onValueChange: (value: string) => void;
}

export function StateSelector({ value, states = [], isLoading, onValueChange }: StateSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selectedState = states.find((state) => state.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="state">State</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              !value && "text-muted-foreground"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              "Loading states..."
            ) : selectedState ? (
              selectedState.name
            ) : (
              "Select state"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search states..." className="h-9" />
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {(states || []).map((state) => (
                <CommandItem
                  key={state.id}
                  value={state.name}
                  onSelect={() => {
                    onValueChange(state.id);
                    setOpen(false);
                  }}
                >
                  {state.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === state.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}