export class MutationError extends Error {
  constructor(
    originalError: Error | any,
    public clientMutationId: string | null = null,
    message?: string
  ) {
    super(`${message ? message + ':' : ''}${originalError.message ?? ''}`);
    this.stack = originalError.stack ?? this.stack;
  }
}
