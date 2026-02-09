"use client";

import { Loader2, Send, Trash2, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  uploadFileToCloudinary,
  validatePdfFile,
} from "~/components/cloudinary-upload";

const PdfPreview = dynamic(() => import("~/components/pdf"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[200px] w-[300px] bg-slate-800 rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  ),
});

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface TeamSubmissionFormProps {
  teamId: string;
  submission?: {
    pdfUrl: string;
    trackId: string;
    trackName: string;
  } | null;
}

interface Track {
  id: string;
  name: string;
}

const getTracks = async (): Promise<Track[]> => {
  const tracks = await fetch("/api/tracks", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
  return tracks;
};

const submitIdea = async ({
  teamId,
  pdfUrl,
  trackId,
}: {
  teamId: string;
  pdfUrl: string;
  trackId: string;
}) => {
  const res = await fetch("/api/ideasubmission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ teamId, pdfUrl, trackId }),
  }).then((res) => res.json());
  return res;
};

export function TeamSubmissionForm({
  teamId,
  submission,
}: TeamSubmissionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTracks().then(setTracks);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validatePdfFile(file, 10);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select your presentation PDF.");
      return;
    }
    if (!selectedTrack) {
      toast.error("Please select a track.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const pdfUrl = await uploadFileToCloudinary(selectedFile, {
        folder: `submissions/${teamId}`,
        onProgress: setUploadProgress,
      });

      await submitIdea({ teamId, pdfUrl, trackId: selectedTrack });

      toast.success("Idea submitted successfully!");
      setSelectedFile(null);
      setSelectedTrack("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getButtonContent = () => {
    if (!isSubmitting) {
      return (
        <>
          <Send className="mr-2 h-4 w-4" />
          Submit Idea
        </>
      );
    }

    if (uploadProgress < 100) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading... {uploadProgress}%
        </>
      );
    }

    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Submitting...
      </>
    );
  };

  if (submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submitted Idea</CardTitle>
          <CardDescription>
            Your team has submitted an idea for the{" "}
            <span className="font-semibold text-primary">
              {submission.trackName}
            </span>{" "}
            track.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="group relative inline-block w-full max-w-sm">
            <div className="relative rounded-xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-xl border border-slate-700/50">
              <div className="absolute inset-0 rounded-xl bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
              <PdfPreview
                file={submission.pdfUrl}
                pages={[1]}
                height={isMobile ? 150 : 200}
                width={isMobile ? 200 : 300}
                className="mx-auto w-fit rounded-lg overflow-hidden shadow-lg"
              />
              <p className="mt-4 text-xs text-slate-400 text-center w-full">
                <a
                  href={submission.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors underline"
                >
                  View Full PDF
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Idea</CardTitle>
        <CardDescription>
          Upload your presentation and select a track to submit your idea.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="file-upload"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Upload Presentation (PDF only)
          </label>
          <div className="flex items-start gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isSubmitting}
            />
            {!selectedFile ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Select PDF
              </Button>
            ) : (
              <div className="group relative inline-block w-full">
                <div className="relative rounded-xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-xl border border-slate-700/50">
                  <div className="absolute inset-0 rounded-xl bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                  <PdfPreview
                    file={selectedFile}
                    pages={[1]}
                    height={isMobile ? 150 : 200}
                    width={isMobile ? 200 : 300}
                    className="mx-auto w-fit rounded-lg overflow-hidden shadow-lg"
                  />
                  <p className="mt-2 text-xs text-slate-400 text-center truncate w-full">
                    {selectedFile.name}
                  </p>
                </div>
                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Max file size: 10MB. Format: PDF only.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="track-select"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select Track
          </label>
          <Select
            value={selectedTrack}
            onValueChange={setSelectedTrack}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a track for your idea" />
            </SelectTrigger>
            <SelectContent>
              {tracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !selectedTrack || isSubmitting}
          className="w-full sm:w-auto"
        >
          {getButtonContent()}
        </Button>
      </CardFooter>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove PDF?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this PDF? You will need to upload
              it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFile}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
