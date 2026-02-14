"use client";

import { Github } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface GithubStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
  initialGithubUsername?: string;
}

export function GithubStep({ form, initialGithubUsername }: GithubStepProps) {
  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="github"
        render={({ field }) => (
          <FormItem className="w-full space-y-8 text-center px-4">
            {/* Icon Decoration */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
                <Github className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight block tracking-wide">
                GitHub Username
              </FormLabel>
              <p className="text-white/60 text-lg">
                This account is linked to your registration
              </p>
            </div>

            <FormControl>
              <div className="relative w-full max-w-xl mx-auto">
                {/* INPUT FIELD (Plain & Simple) */}
                <Input
                  readOnly
                  title={field.value ?? initialGithubUsername ?? ""}
                  className="
                    block w-full 
                    bg-transparent 
                    border-0 border-b-2 border-white/20 
                    border-dashed
                    rounded-4xl
                    
                    /* TEXT STYLING */
                    text-center font-mono text-white/90 
                    text-xl px-0
                    md:text-4xl 
                    
                    /* INTERACTION */
                    cursor-not-allowed
                    focus-visible:ring-0 focus-visible:border-white/40
                    focus-visible:outline-none 
                    py-4
                    transition-all duration-300
                    overflow-hidden text-ellipsis
                    placeholder:text-white/20
                  "
                  value={field.value ?? initialGithubUsername ?? ""}
                />
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
