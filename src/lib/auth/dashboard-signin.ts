"use client";

export async function dashboardSignIn(
  username: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const csrfResponse = await fetch("/api/auth/dashboard/csrf");
    if (!csrfResponse.ok) {
      return {
        ok: false,
        error: "Failed to initialize authentication. Please refresh the page.",
      };
    }
    const { csrfToken } = await csrfResponse.json();

    const response = await fetch("/api/auth/dashboard/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        password,
        csrfToken,
        redirect: "false",
        json: "true",
      }),
      credentials: "include",
    });

    if (response.redirected) {
      const url = new URL(response.url);
      const error = url.searchParams.get("error");
      if (error) {
        return {
          ok: false,
          error: getErrorMessage(error),
        };
      }
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      if (response.ok || response.status === 302) {
        return { ok: true };
      }
      return {
        ok: false,
        error: "Invalid response from server. Please try again.",
      };
    }

    if (!response.ok) {
      const errorData = data as { error?: string; message?: string };
      const errorMessage =
        errorData.error || errorData.message || "Authentication failed";
      return {
        ok: false,
        error: getErrorMessage(errorMessage),
      };
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        return {
          ok: false,
          error: "Network error. Please check your connection and try again.",
        };
      }
      return {
        ok: false,
        error: error.message || "An unexpected error occurred.",
      };
    }
    return {
      ok: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

function getErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    MissingCSRF:
      "Security token missing. Please refresh the page and try again.",
    CredentialsSignin: "Invalid username or password.",
    Configuration:
      "Authentication configuration error. Please contact support.",
    AccessDenied: "Access denied. Your account may be inactive.",
    Verification: "Verification failed. Please try again.",
    Default: "Authentication failed. Please try again.",
  };

  if (error.includes("CSRF")) {
    return errorMap.MissingCSRF;
  }
  if (error.includes("Credentials") || error.includes("Invalid")) {
    return errorMap.CredentialsSignin;
  }
  if (error.includes("Access") || error.includes("Denied")) {
    return errorMap.AccessDenied;
  }

  return errorMap[error] || errorMap.Default;
}
