import { toast } from "sonner";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  toast?: boolean;
  toastType?: "success" | "error";
  title?: string;
  description?: string;
}

export async function apiFetch<T = unknown>(
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
    console.log("hi");
    if (!json.success) {
      const error = new Error(json.error || "REQUEST_FAILED") as Error & {
        title?: string;
        description?: string;
        isHandledError?: boolean;
      };
      error.title = json.title;
      error.description = json.description;
      error.isHandledError = true;
      throw error;
    }

    return json.data as T;
  } catch (error) {
    console.log(error);
    if (
      error instanceof Error &&
      error.message !== "REQUEST_FAILED" &&
      !(error as Error & { isHandledError?: boolean }).isHandledError
    ) {
      toast.error("Network Error", {
        description: "Something went wrong. Please try again.",
      });
    }
    throw error;
  }
}

// Had to duplicate (bad coding yeah but urgent)
export async function apiFetchWithoutToast<T = unknown>(
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
      toast: false,
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
    console.log("hi");
    if (!json.success) {
      const error = new Error(json.error || "REQUEST_FAILED") as Error & {
        title?: string;
        description?: string;
        isHandledError?: boolean;
      };
      error.title = json.title;
      error.description = json.description;
      error.isHandledError = true;
      throw error;
    }

    return json.data as T;
  } catch (error) {
    console.log(error);
    if (
      error instanceof Error &&
      error.message !== "REQUEST_FAILED" &&
      !(error as Error & { isHandledError?: boolean }).isHandledError
    ) {
      toast.error("Network Error", {
        description: "Something went wrong. Please try again.",
      });
    }
    throw error;
  }
}
