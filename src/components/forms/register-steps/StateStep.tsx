"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { stateEnum } from "~/db/enum";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface StateStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function StateStep({ form, onNext }: StateStepProps) {
  const [search, setSearch] = useState("");

  // 1. Get the current selected value
  const selectedState = form.watch("state");

  // 2. Filter AND Sort based on selection
  const filteredStates = useMemo(() => {
    // A. Filter by search term first
    const options = search
      ? stateEnum.enumValues.filter((state) =>
        state.toLowerCase().includes(search.toLowerCase()),
      )
      : stateEnum.enumValues;

    // B. Sort: Move selected item to the top
    return [...options].sort((a, b) => {
      if (a === selectedState) return -1; // 'a' moves to top
      if (b === selectedState) return 1; // 'b' moves to top
      return 0; // Keep original order for others
    });
  }, [search, selectedState]);

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem className="w-full max-w-lg space-y-8">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight text-center tracking-wide">
                Select your state
              </FormLabel>
              <p className="text-white/60 text-lg">
                Type to search, click to select
              </p>
            </div>

            {/* Search Input */}
            <FormControl>
              <div className="relative">
                {/* Centered the search icon perfectly */}
                <Search className="absolute left-1 top-4 -translate-y-1/2 h-6 w-6 text-white/50" />
                <Input
                  autoFocus
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    block w-full 
                    pl-10 /* Added padding left so text doesn't hit icon */
                    bg-transparent 
                    border-0 border-b-2 border-white/20 
                    rounded-none 
                    text-2xl md:text-3xl font-light text-white 
                    placeholder:text-white/30 
                    focus-visible:ring-0 focus-visible:border-white 
                    focus-visible:outline-none 
                    py-4 mb-8
                    transition-all duration-300
                  "
                />
              </div>
            </FormControl>

            {/* Scrollable List of Options */}
            <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => {
                      field.onChange(state);
                      onNext();
                    }}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/20 hover:border-white/30 active:scale-[0.98]",
                      // Highlight style if selected
                      field.value === state &&
                      "bg-white/20 border-white/50 ring-1 ring-white/50 sticky top-0 z-10 backdrop-blur-md shadow-lg",
                    )}
                  >
                    {/* State Name */}
                    <span className="text-xl font-medium text-white group-hover:pl-2 transition-all duration-300">
                      {state}
                    </span>

                    {/* Selection Indicator */}
                    <div className="flex items-center gap-3">
                      {field.value === state && (
                        <Check className="h-5 w-5 text-white animate-in zoom-in" />
                      )}
                      {/* Keyboard shortcut hint */}
                      <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-white/50 bg-white/10 px-2 py-1 rounded">
                        Select
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-white/40 italic">
                  No state found matching "{search}"
                </div>
              )}
            </div>

            <FormMessage className="text-center text-red-300" />
          </FormItem>
        )}
      />
    </div>
  );
}
