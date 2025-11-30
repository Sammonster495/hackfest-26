import { NextResponse } from "next/server";
import { AppError } from "../errors/app-error";

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        toast: err.toast ?? true,
        toastType: "error",
        title: err.title,
        description: err.description,
      },
      { status: err.status },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "SERVER_ERROR",
      toast: true,
      toastType: "error",
      title: "Unexpected Error",
      description: "Something went wrong.",
    },
    { status: 500 },
  );
}
