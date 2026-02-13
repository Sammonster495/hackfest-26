"use client";

import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";
import { CloudinaryUpload } from "~/components/cloudinary-upload"; // Assuming this accepts className, if not, the wrapper handles positioning
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface IdProofStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function IdProofStep({ form, onNext }: IdProofStepProps) {
  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="idProof"
        render={({ field }) => (
          <FormItem className="w-full max-w-2xl space-y-8 text-center">
            {/* Header Section */}
            <div className="space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-bold text-white drop-shadow-sm leading-tight">
                Upload your ID Proof
              </FormLabel>
              <p className="text-white/60 text-lg">
                College ID or Government ID (Max 1MB)
              </p>
            </div>

            <FormControl>
              <div className="flex justify-center w-full">
                {field.value ? (
                  /* IMAGE PREVIEW STATE */
                  <div className="relative group w-full max-w-lg aspect-video overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black/20 backdrop-blur-sm transition-all hover:scale-[1.01]">
                    <Image
                      src={field.value}
                      alt="ID Proof"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <Button
                        type="button"
                        variant="destructive"
                        size="lg"
                        className="gap-2 rounded-full shadow-lg hover:bg-red-600"
                        onClick={() => field.onChange(undefined)}
                      >
                        <X className="h-5 w-5" />
                        Remove Image
                      </Button>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                      UPLOADED
                    </div>
                  </div>
                ) : (
                  /* UPLOAD STATE WRAPPER */
                  <div className="w-full max-w-lg">
                    <div
                      className="
                      relative 
                      group
                      flex flex-col items-center justify-center 
                      w-full min-h-[300px] 
                      rounded-3xl 
                      border-2 border-dashed border-white/20 
                      bg-white/5 
                      hover:bg-white/10 hover:border-white/40 
                      transition-all duration-300
                    "
                    >
                      {/* NOTE: Assuming CloudinaryUpload renders a button. 
                         We position it centrally. 
                         If CloudinaryUpload has its own styling, this wrapper provides the 'glass' container context.
                      */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 rounded-full bg-white/10 mb-4">
                          <UploadCloud className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-white/80 font-medium">
                          Click to upload
                        </p>
                        <p className="text-white/40 text-sm mt-1">JPG, PNG</p>
                      </div>

                      {/* The actual functional component - Positioned relative to accept clicks */}
                      <div className="z-10 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity p-8">
                        <CloudinaryUpload
                          onUpload={(url) => {
                            field.onChange(url);
                            onNext();
                          }}
                          allowedFormats={["png", "jpg", "jpeg"]}
                          maxFileSize={1024 * 1024}
                          label="Select File" // Changed label to be simpler since we have custom text above
                          folder="idProof"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormControl>

            <FormMessage className="text-red-300 text-lg" />
          </FormItem>
        )}
      />
    </div>
  );
}
