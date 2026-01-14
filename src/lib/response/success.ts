import { NextResponse } from "next/server";

interface SuccessOpts {
  toast?: boolean;
  title?: string;
  description?: string;
}

export function successResponse(data: unknown, opts: SuccessOpts = {}) {
  return NextResponse.json({
    success: true,
    data,
    toast: opts.toast ?? true,
    toastType: "success",
    title: opts.title,
    description: opts.description,
  });
}
