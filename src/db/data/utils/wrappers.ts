import { AppError } from "~/lib/errors/app-error";

export function safeDB<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  error: string,
) {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch {
      throw new AppError(error);
    }
  };
}
