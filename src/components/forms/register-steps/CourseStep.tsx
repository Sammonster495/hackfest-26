"use client";

import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { courseEnum } from "~/db/enum";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface CourseStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function CourseStep({ form, onNext }: CourseStepProps) {
  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="course"
        render={({ field }) => (
          <FormItem className="w-full max-w-lg space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <FormLabel className="text-3xl md:text-5xl font-bold text-white drop-shadow-sm leading-tight">
                What course are you in?
              </FormLabel>
            </div>

            <FormControl>
              {/* Option List Container */}
              <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-3 pt-4">
                {courseEnum.enumValues.map((course, index) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => {
                      field.onChange(course);
                      onNext();
                    }}
                    // Staggered animation for list items
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={cn(
                      // FIXED: Removed 'hover:scale-[1.02]' to prevent overflow
                      "group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-white/20 hover:border-white/30 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards",
                      field.value === course &&
                        "bg-white/20 border-white/50 ring-1 ring-white/50 shadow-lg sticky top-0 z-10 backdrop-blur-md",
                    )}
                  >
                    {/* Course Name - Added group-hover:pl-2 for the internal movement effect */}
                    <span className="text-xl font-medium text-white group-hover:pl-2 transition-all duration-300">
                      {course}
                    </span>

                    {/* Selection Indicator */}
                    <div className="flex items-center gap-3">
                      {field.value === course && (
                        <Check className="h-5 w-5 text-white animate-in zoom-in" />
                      )}

                      {/* Keyboard shortcut hint */}
                      <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-white/50 bg-white/10 px-2 py-1 rounded">
                        Select
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </FormControl>

            <FormMessage className="text-center text-red-300 text-lg" />
          </FormItem>
        )}
      />
    </div>
  );
}
