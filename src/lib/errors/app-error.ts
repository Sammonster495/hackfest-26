export class AppError extends Error {
  status: number;
  toast?: boolean;
  title?: string; //Toast title
  description?: string; //Toast dec

  constructor(
    message: string,
    status = 400,
    options?: {
      toast?: boolean;
      title?: string;
      description?: string;
    },
  ) {
    super(message);
    this.status = status;
    this.toast = options?.toast ?? true;
    this.title = options?.title;
    this.description = options?.description;
  }
}
