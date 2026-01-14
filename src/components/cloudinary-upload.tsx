"use client";

import { Upload } from "lucide-react";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import * as React from "react";
import { Button } from "~/components/ui/button";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  uploadPreset?: string;
  maxFileSize?: number;
  allowedFormats?: string[];
  label?: string;
  folder?: string;
}

export function CloudinaryUpload({
  onUpload,
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  maxFileSize = 10000000, // 10MB default
  allowedFormats = ["jpg", "png", "jpeg", "webp"],
  label = "Upload Image",
  folder,
}: CloudinaryUploadProps) {
  const [error, setError] = React.useState<string | null>(null);

  const handleSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (
      typeof result.info === "object" &&
      "secure_url" in result.info &&
      result.info.secure_url
    ) {
      onUpload(result.info.secure_url as string);
      setError(null);
    }
  };

  const handleError = (err: unknown) => {
    console.error("Cloudinary Upload Error:", err);
    setError("Failed to upload image. Please try again.");
  };

  if (!uploadPreset) {
    return (
      <div className="text-destructive text-sm font-medium">
        Error: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET env var is missing.
      </div>
    );
  }

  return (
    <div className="w-full">
      <CldUploadWidget
        uploadPreset={uploadPreset}
        options={{
          folder: folder ? `hackfest26/${folder}` : "hackfest26",
          publicId: folder
            ? `hackfest26/${folder}/${crypto.randomUUID()}`
            : `hackfest26/${crypto.randomUUID()}`,
          maxFileSize: maxFileSize,
          clientAllowedFormats: allowedFormats,
          sources: ["local"],
          multiple: false,
        }}
        onSuccess={handleSuccess}
        onError={handleError}
      >
        {({ open }) => (
          <Button
            type="button"
            variant="secondary"
            onClick={() => open()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {label}
          </Button>
        )}
      </CldUploadWidget>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
