"use client";

import { Check, Loader2, Search } from "lucide-react";
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
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface College {
  id: string;
  name: string | null;
  state: string | null;
}

interface CollegeStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
  colleges: College[];
  loadingColleges: boolean;
}

export function CollegeStep({
  form,
  onNext,
  colleges,
  loadingColleges,
}: CollegeStepProps) {
  const [search, setSearch] = useState("");

  // 1. Watch the current selection
  const selectedCollegeId = form.watch("collegeId");

  // 2. Filter AND Sort
  const filteredColleges = useMemo(() => {
    // A. Filter by search term
    let result = colleges;
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = colleges.filter(
        (c) =>
          (c.name?.toLowerCase() ?? "").includes(lowerSearch) ||
          (c.state?.toLowerCase() ?? "").includes(lowerSearch),
      );
    }

    // B. Sort: Move selected item to the top
    return [...result].sort((a, b) => {
      if (a.id === selectedCollegeId) return -1;
      if (b.id === selectedCollegeId) return 1;
      return 0;
    });
  }, [search, colleges, selectedCollegeId]);

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="collegeId"
        render={({ field }) => (
          <FormItem className="w-full max-w-2xl space-y-8">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight text-center tracking-wide">
                Select your College
              </FormLabel>
              <p className="text-white/60 text-lg">
                Type to search, click to select
              </p>
            </div>

            {/* Search Input */}
            <FormControl>
              <div className="relative">
                {/* Fixed alignment for the search icon */}
                <Search className="absolute left-2 top-4 -translate-y-1/2 h-6 w-6 text-white/50" />
                <Input
                  autoFocus
                  placeholder="Type to search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    block w-full 
                    pl-10
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

            {/* List Container */}
            <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {loadingColleges ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/60 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Loading colleges...</p>
                </div>
              ) : filteredColleges.length > 0 ? (
                filteredColleges.map((college) => (
                  <button
                    key={college.id}
                    type="button"
                    onClick={() => {
                      field.onChange(college.id);
                      onNext();
                    }}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/20 hover:border-white/30 active:scale-[0.98]",
                      // Highlight & Sticky logic for selected item
                      field.value === college.id &&
                      "bg-white/20 border-white/50 ring-1 ring-white/50 sticky top-0 z-10 backdrop-blur-md shadow-lg",
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      {/* College Name */}
                      <span className="text-xl font-medium text-white group-hover:pl-2 transition-all duration-300">
                        {college.name ?? "Unnamed College"}
                      </span>
                      {/* State Subtitle */}
                      <span className="text-sm text-white/50 group-hover:pl-2 transition-all duration-300">
                        {college.state}
                      </span>
                    </div>

                    {/* Selection UI */}
                    <div className="flex items-center gap-3">
                      {field.value === college.id && (
                        <Check className="h-5 w-5 text-white animate-in zoom-in" />
                      )}
                      <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-white/50 bg-white/10 px-2 py-1 rounded">
                        Select
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-white/40 italic border border-dashed border-white/10 rounded-xl">
                  No college found matching "{search}"
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
