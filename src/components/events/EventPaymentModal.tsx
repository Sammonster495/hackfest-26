"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { CloudinaryUpload } from "~/components/cloudinary-upload";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { apiFetch } from "~/lib/fetcher";

interface EventPaymentModalProps {
  eventId: string;
  teamId: string;
  amount: number;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function EventPaymentModal({
  eventId,
  teamId,
  amount,
  onSuccess,
  disabled = false,
}: EventPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<
    string | null
  >(null);
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);

  const handleHealthCheckAndOpen = async () => {
    setIsHealthChecking(true);
    try {
      const res = await apiFetch(`/api/events/${eventId}/healthCheck`, {
        method: "GET",
      });
      if (res) {
        setOpen(true);
      }
    } catch (err) {
      const error = err as Error & { title?: string; description?: string };
      toast.error(error.title || error.message || "Error", {
        description:
          error.description || "Failed to verify event availability.",
      });
    } finally {
      setIsHealthChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!paymentScreenshotUrl) {
      setError("Please upload a payment screenshot before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch<unknown>(`/api/events/${eventId}/teams/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentScreenshotUrl,
          transactionId: transactionId.trim() || undefined,
          amount,
        }),
      });

      setOpen(false);
      setPaymentScreenshotUrl(null);
      setTransactionId("");
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit payment.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!isSubmitting) {
      setOpen(next);
      if (!next) {
        setPaymentScreenshotUrl(null);
        setTransactionId("");
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        onClick={handleHealthCheckAndOpen}
        disabled={disabled || isHealthChecking}
        className="flex-1 bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isHealthChecking ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Checking Availability...
          </>
        ) : (
          "Pay to Confirm"
        )}
      </Button>

      <DialogContent
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest(".cloudinary-upload-widget") ||
            target.tagName === "IFRAME" ||
            target.closest("[data-cloudinary]")
          ) {
            e.preventDefault();
          }
        }}
        className="bg-[#0f1823] border border-[#39577c] text-white p-6 max-w-md md:max-w-2xl w-full rounded-2xl **:data-[slot=dialog-close]:text-white/60 **:data-[slot=dialog-close]:hover:bg-white/10"
      >
        <DialogHeader>
          <DialogTitle className="font-pirate text-3xl tracking-wider text-[#f4d35e]">
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Scan the QR code and upload your payment screenshot to confirm your
            event registration.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            {/* Amount */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#133c55]/40 border border-[#39577c]/60">
              <span className="text-sm font-bold text-[#f4d35e]/60 uppercase tracking-widest">
                Amount Due
              </span>
              <span className="text-[#f4d35e] font-bold font-mono text-xl tracking-wider">
                {amount} INR
              </span>
            </div>

            {/* QR code placeholder */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center bg-white p-3 rounded-xl border-4 border-[#39577c]/60 shadow-[0_0_15px_rgba(244,211,94,0.1)]">
                <QRCode
                  value={`upi://pay?pa=puneeth.reval3131@ybl&pn=PUNEETH%20R%20P&mc=0000&mode=02&purpose=00&tn=${teamId}`}
                  size={180}
                  viewBox={`0 0 256 256`}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-xs text-[#f4d35e]/60 text-center font-medium tracking-wide">
                Scan to pay using any UPI app
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            {/* Transaction ID */}
            <div className="space-y-2">
              <label
                htmlFor="transactionId"
                className="text-xs font-semibold text-[#f4d35e]/60 uppercase tracking-widest"
              >
                Transaction ID (Optional)
              </label>
              <Input
                id="transactionId"
                placeholder="Enter UPI transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="font-mono bg-[#133c55]/20 border-[#39577c]/60 text-white placeholder:text-white/30 focus-visible:ring-[#f4d35e]/40 rounded-xl px-4 h-12"
              />
            </div>

            {/* Screenshot upload */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#f4d35e]/60 uppercase tracking-widest flex flex-col gap-1">
                <span>Payment Screenshot *</span>
                <span className="text-[10px] font-normal text-white/40 tracking-normal normal-case">
                  (UPI Transaction ID should be visible in the screenshot)
                </span>
              </p>

              <CloudinaryUpload
                onUpload={(url) => {
                  setPaymentScreenshotUrl(url);
                  setError(null);
                }}
                folder="payments"
                label={
                  paymentScreenshotUrl
                    ? "Screenshot Uploaded ✓"
                    : "Upload Screenshot"
                }
                allowedFormats={["jpg", "jpeg", "png", "webp"]}
              />

              {paymentScreenshotUrl && (
                <p className="text-xs text-emerald-400 font-medium">
                  Screenshot uploaded successfully.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

        <DialogFooter className="mt-4 pt-4 border-t border-[#39577c]/50">
          <Button
            onClick={handleSubmit}
            disabled={!paymentScreenshotUrl || isSubmitting}
            className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 h-12 rounded-xl transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
