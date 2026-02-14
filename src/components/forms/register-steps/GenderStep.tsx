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
import { genderEnum } from "~/db/enum";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface GenderStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function GenderStep({ form, onNext }: GenderStepProps) {
  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem className="w-full max-w-lg space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight tracking-wide">
                Select your gender
              </FormLabel>
            </div>

            <FormControl>
              {/* Option List Container */}
              <div className="flex flex-col gap-3 pt-4">
                {genderEnum.enumValues.map((gender, index) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => {
                      field.onChange(gender);
                      onNext();
                    }}
                    // Staggered animation
                    style={{ animationDelay: `${index * 100}ms` }}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards",
                      field.value === gender &&
                      "bg-white/20 border-white/50 ring-1 ring-white/50",
                    )}
                  >
                    {/* Gender Label */}
                    <span className="text-xl font-medium text-white group-hover:translate-x-1 transition-transform duration-300 capitalize">
                      {gender}
                    </span>

                    {/* Selection Indicator */}
                    <div className="flex items-center gap-3">
                      {field.value === gender && (
                        <Check className="h-5 w-5 text-white animate-in zoom-in" />
                      )}

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
