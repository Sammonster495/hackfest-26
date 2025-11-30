import { toast } from "sonner";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  toast?: boolean;
  toastType?: "success" | "error";
  title?: string;
  description?: string;
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const json: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      error: "Invalid response",
      toast: true,
      toastType: "error",
      title: "Error",
      description: "Failed to parse server response.",
    }));

    if (json.toast) {
      if (json.success && json.toastType === "success") {
        toast.success(json.title || "Success", {
          description: json.description,
        });
      } else if (!json.success && json.toastType === "error") {
        toast.error(json.title || "Error", {
          description: json.description || json.error,
        });
      }
    }

    if (!json.success) {
      const error = new Error(json.error || "REQUEST_FAILED");
      (error as any).isHandledError = true;
      throw error;
    }

    return json.data as T;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message !== "REQUEST_FAILED" &&
      !(error as any).isHandledError
    ) {
      toast.error("Network Error", {
        description: "Something went wrong. Please try again.",
      });
    }
    throw error;
  }
}
