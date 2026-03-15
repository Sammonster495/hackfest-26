"use client";

import { Loader2, QrCode } from "lucide-react";
import { useState } from "react";
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
import { calculateTotalAmount } from "~/lib/utils";

interface PaymentModalProps {
    teamId: string;
    memberCount: number;
    onSuccess?: () => void;
}

export function PaymentModal({
    teamId,
    memberCount,
    onSuccess,
}: PaymentModalProps) {
    const [open, setOpen] = useState(false);
    const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<
        string | null
    >(null);
    const [transactionId, setTransactionId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const amount = calculateTotalAmount(400, memberCount, 2);

    const handleSubmit = async () => {
        if (!paymentScreenshotUrl) {
            setError("Please upload a payment screenshot before submitting.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await apiFetch<unknown>(`/api/teams/${teamId}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentScreenshotUrl,
                    paymentTransactionId: transactionId.trim() || undefined,
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
            <DialogTrigger asChild>
                <Button className="w-full bg-[#10569c] text-white font-bold hover:bg-[#10569c]/90 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] h-12 rounded-xl">
                    Make Payment
                </Button>
            </DialogTrigger>

            {/* Force light mode on the dialog regardless of the root dark class */}
            <DialogContent
                onInteractOutside={(e) => {
                    // Prevent Radix from closing or stealing focus if interacting with the Cloudinary widget
                    const target = e.target as HTMLElement;
                    if (target.closest('.cloudinary-upload-widget') || target.tagName === 'IFRAME' || target.closest('[data-cloudinary]')) {
                        e.preventDefault();
                    }
                }}
                className="max-w-md !bg-white !text-zinc-900 [&_[data-slot=dialog-close]]:text-zinc-600 [&_[data-slot=dialog-close]]:hover:text-zinc-900 [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-zinc-300 [&_[data-slot=dialog-close]]:hover:bg-zinc-100"
            >
                <DialogHeader>
                    <DialogTitle className="font-pirate text-2xl text-[#10569c] tracking-wide">
                        Complete Payment
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Scan the QR code and upload your payment screenshot to confirm your
                        team&apos;s participation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Amount */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#10569c]/5 border border-[#10569c]/10">
                        <span className="text-sm font-bold text-[#10569c]/80 uppercase tracking-wider">
                            Amount Due
                        </span>
                        <span className="text-[#10569c] font-bold font-crimson text-lg">
                            {amount} INR
                        </span>
                    </div>

                    {/* QR code placeholder */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center w-48 h-48 bg-[#10569c]/5 border-2 border-dashed border-[#10569c]/20 rounded-xl">
                            <div className="flex flex-col items-center gap-2 text-[#10569c]/40">
                                <QrCode className="h-16 w-16" />
                                <p className="text-xs font-medium text-center">
                                    QR code will appear here
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-[#10569c]/60 text-center font-medium">
                            Scan to pay using any UPI app
                        </p>
                    </div>

                    {/* Transaction ID */}
                    <div className="space-y-2">
                        <label
                            htmlFor="transactionId"
                            className="text-sm font-bold text-[#10569c]/80 uppercase tracking-wider"
                        >
                            Transaction ID
                        </label>
                        <Input
                            id="transactionId"
                            placeholder="Enter UPI transaction ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="font-mono bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-[#10569c]/40"
                        />
                    </div>

                    {/* Screenshot upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#10569c]/80 uppercase tracking-wider">
                            Payment Screenshot
                        </label>

                        <CloudinaryUpload
                            onUpload={(url) => {
                                setPaymentScreenshotUrl(url);
                                setError(null);
                            }}
                            folder="payments"
                            label={
                                paymentScreenshotUrl ? "Screenshot Uploaded" : "Upload Screenshot"
                            }
                            allowedFormats={["jpg", "jpeg", "png", "webp"]}
                        />

                        {paymentScreenshotUrl && (
                            <p className="text-xs text-green-600 font-medium">
                                Screenshot uploaded successfully.
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    )}
                </div>

                <DialogFooter showCloseButton>
                    <Button
                        onClick={handleSubmit}
                        disabled={!paymentScreenshotUrl || isSubmitting}
                        className="bg-[#10569c] text-white font-bold hover:bg-[#10569c]/90"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
