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
  resourceType?: "image" | "raw" | "auto";
}

export function CloudinaryUpload({
  onUpload,
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  maxFileSize = 10000000, // 10MB default
  allowedFormats = ["jpg", "png", "jpeg", "webp"],
  label = "Upload Image",
  folder,
  resourceType = "image",
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
          resourceType: resourceType,
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

interface UploadOptions {
  folder?: string;
  onProgress?: (progress: number) => void;
}

export async function uploadFileToCloudinary(
  file: File,
  options: UploadOptions = {},
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (options.folder) {
    formData.append("folder", `hackfest26/${options.folder}`);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        options.onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText) as { secure_url: string };
        resolve(response.secure_url);
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

export function validatePdfFile(file: File, maxSizeMB = 10): string | null {
  if (file.type !== "application/pdf") {
    return "Please select a PDF file.";
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be less than ${maxSizeMB}MB.`;
  }
  return null;
}
