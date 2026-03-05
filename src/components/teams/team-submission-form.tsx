"use client";

import { Download, Loader2, Send, Trash2, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  onSubmitSuccess?: () => void;
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
  onSubmitSuccess,
}: TeamSubmissionFormProps) {
  const router = useRouter();
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
      onSubmitSuccess?.();
      router.refresh();
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
      <Card className="border-[#10569c]/20 bg-[#0a3d6e] backdrop-blur-md shadow-xl rounded-xl">
        <CardHeader className="pb-3 border-b border-white/10">
          <CardTitle className="text-white font-pirate text-2xl tracking-wide">
            Submitted Idea
          </CardTitle>
          <CardDescription className="text-white/80 text-base font-crimson font-medium">
            Your team has submitted an idea for the{" "}
            <span className="font-bold text-white">{submission.trackName}</span>{" "}
            track.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="group relative inline-block w-full max-w-sm">
            <div className="relative rounded-xl bg-white/20 p-4 shadow-md border border-white/20">
              <div className="absolute inset-0 rounded-xl bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
              <PdfPreview
                file={submission.pdfUrl}
                pages={[1]}
                height={isMobile ? 150 : 200}
                width={isMobile ? 200 : 300}
                className="mx-auto w-fit rounded-lg overflow-hidden shadow-lg border border-white/10"
              />
              <p className="mt-4 text-sm text-white/90 font-medium font-crimson text-center w-full">
                <a
                  href={submission.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors underline font-bold"
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
    <Card className="border-[#10569c]/20 bg-[#0a3d6e] backdrop-blur-md shadow-xl rounded-xl">
      <CardHeader className="pb-3 border-b border-white/10">
        <CardTitle className="text-white font-pirate text-2xl tracking-wide">
          Submit Idea
        </CardTitle>
        <CardDescription className="text-white/80 text-base font-crimson font-medium">
          Upload your presentation and select a track to submit your idea.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/10 p-4 rounded-xl border border-white/20 gap-4">
          <div>
            <h3 className="text-white font-bold text-lg font-pirate tracking-wide">
              Presentation Template
            </h3>
            <p className="text-white/80 text-sm font-crimson font-medium">
              Download the official template to prepare your idea submission.
            </p>
          </div>
          <a
            href="/pptTemplate/Hackfest26-ppt-template.pptx"
            download
            className="flex items-center justify-center gap-2 bg-white text-[#10569c] w-full sm:w-auto px-4 py-2 rounded-lg font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Download Template
          </a>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="file-upload"
            className="text-sm font-bold text-white/90 uppercase tracking-wider leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 font-bold rounded-lg transition-all"
              >
                <Upload className="h-4 w-4" />
                Select PDF
              </Button>
            ) : (
              <div className="group relative inline-block w-full">
                <div className="relative rounded-xl bg-white/20 p-4 shadow-md border border-white/20">
                  <div className="absolute inset-0 rounded-xl bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
                  <PdfPreview
                    file={selectedFile}
                    pages={[1]}
                    height={isMobile ? 150 : 200}
                    width={isMobile ? 200 : 300}
                    className="mx-auto w-fit rounded-lg overflow-hidden shadow-lg border border-white/10"
                  />
                  <p className="mt-2 text-sm text-white/90 font-medium font-crimson text-center truncate w-full">
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
          <p className="text-xs font-medium font-crimson text-white/70">
            Max file size: 5MB. Format: PDF only.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="track-select"
            className="text-sm font-bold text-white/90 uppercase tracking-wider leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select Track
          </label>
          <Select
            value={selectedTrack}
            onValueChange={setSelectedTrack}
            disabled={isSubmitting}
          >
            <SelectTrigger className="bg-white/20 border-white/20 text-white focus:ring-white/50 rounded-lg shadow-sm placeholder:text-white/70">
              <SelectValue placeholder="Select a track for your idea" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a3d6e] border-white/20 shadow-xl rounded-xl">
              {tracks.map((track) => (
                <SelectItem
                  key={track.id}
                  value={track.id}
                  className="text-white hover:bg-white/20 focus:bg-white/20 rounded-md cursor-pointer font-medium font-crimson text-base"
                >
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="bg-white/5 border-t border-white/10 px-6 py-4 rounded-b-xl">
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !selectedTrack || isSubmitting}
          className="w-full sm:w-auto bg-white text-[#10569c] hover:bg-white/90 font-bold border-none shadow-md h-11 rounded-xl tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
        >
          {getButtonContent()}
        </Button>
      </CardFooter>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#0a3d6e] border-white/20 text-white rounded-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-pirate text-2xl tracking-wide text-white">
              Remove PDF?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 font-crimson text-base font-medium">
              Are you sure you want to remove this PDF? You will need to upload
              it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold rounded-xl transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFile}
              className="bg-red-500 hover:bg-red-600 font-bold rounded-xl text-white border-none shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
