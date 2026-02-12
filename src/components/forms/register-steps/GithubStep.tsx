"use client";

import { CheckCircle2, Github, Lock } from "lucide-react";
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
              <FormLabel className="text-3xl md:text-5xl font-bold text-white drop-shadow-sm leading-tight block">
                GitHub Username
              </FormLabel>
              <p className="text-white/60 text-lg">
                This account is linked to your registration
              </p>
            </div>

            <FormControl>
              {/* LAYOUT CONTAINER: 
                  Mobile: Flex Column (Vertical Stack)
                  Desktop (md): Block/Relative (Horizontal Overlay)
              */}
              <div className="relative w-full max-w-xl mx-auto group flex flex-col items-center md:block">
                {/* 1. LOCK ICON */}
                <div
                  className="
                  text-white/40 group-hover:text-white/60 transition-colors z-10
                  mb-2 md:mb-0
                  md:absolute md:left-2 md:top-1/2 md:-translate-y-1/2
                "
                >
                  <Lock className="w-5 h-5 md:w-6 md:h-6" />
                </div>

                {/* 2. INPUT FIELD */}
                <Input
                  readOnly
                  title={field.value ?? initialGithubUsername ?? ""}
                  className="
                    block w-full 
                    bg-transparent 
                    border-0 border-b-2 border-white/20 
                    border-dashed
                    rounded-none 
                    
                    /* TEXT STYLING */
                    text-center font-mono text-white/90 
                    /* Mobile: Smaller text, no side padding */
                    text-xl px-0
                    /* Desktop: Large text, padding for icons */
                    md:text-4xl md:pl-10 md:pr-32
                    
                    cursor-not-allowed
                    focus-visible:ring-0 focus-visible:border-white/40
                    focus-visible:outline-none 
                    py-4
                    transition-all duration-300
                    overflow-hidden text-ellipsis
                  "
                  value={field.value ?? initialGithubUsername ?? ""}
                />

                {/* 3. VERIFIED BADGE */}
                <div
                  className="
                  z-10
                  mt-4 md:mt-0
                  md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2
                "
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-400 bg-green-950/30 border border-green-500/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
