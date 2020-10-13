import { LogErrorMiddlewareFn, NotFoundError } from '../../../src';

const beeline = {
  addTraceContext: jest.fn(),
  startSpan: jest.fn().mockReturnValue({}),
  finishSpan: jest.fn()
};
const logger = { error: jest.fn() };
const context = { beeline, logger };

beforeEach(() => {
  beeline.addTraceContext.mockClear();
  beeline.startSpan.mockClear();
  beeline.finishSpan.mockClear();
  logger.error.mockClear();
});
describe('When catching a generic error', () => {
  const next = async () => {
    throw new Error('message goes here');
  };
  test('Then: the error data is to the trace context', async () => {
    await LogErrorMiddlewareFn({ context } as any, next).catch(() => console.log);
    const [error_meta] = beeline.addTraceContext.mock.calls[0];
    expect(error_meta.error.message).toBe('message goes here');
    expect(error_meta.error.stack).toBeTruthy();
    expect(error_meta.error.name).toBe('Error');
  });
  test('Then: the error is rethrown', async () => {
    await expect(LogErrorMiddlewareFn({ context } as any, next)).rejects.toThrow(
      'message goes here'
    );
  });
  test('Then: a standalone `Error` span is created', async () => {
    await LogErrorMiddlewareFn({ context } as any, next).catch(() => console.log);
    const [spanData] = beeline.startSpan.mock.calls[0];
    expect(spanData.name).toBe('Error');
  });
});

describe('When: catching a NotFoundError', () => {
  const next = async () => {
    throw new NotFoundError('message goes here');
  };
  test('Then: the error rethrown', async () => {
    await expect(LogErrorMiddlewareFn({ context } as any, next)).rejects.toThrow(
      'message goes here'
    );
  });
  test('Then: the error data is to the trace context', async () => {
    await LogErrorMiddlewareFn({ context } as any, next).catch(() => console.log);
    const [error_meta] = beeline.addTraceContext.mock.calls[0];
    expect(error_meta.error.message).toBe('message goes here');
    expect(error_meta.error.stack).toBeTruthy();
    expect(error_meta.error.name).toBe('NotFoundError');
  });
  test('Then: a standalone `NotFoundError` span is created', async () => {
    await LogErrorMiddlewareFn({ context } as any, next).catch(() => console.log);
    const [spanData] = beeline.startSpan.mock.calls[0];
    expect(spanData.name).toBe('NotFoundError');
  });
});
