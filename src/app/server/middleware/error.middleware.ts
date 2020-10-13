import { MiddlewareFn } from 'type-graphql';
import { RumbleshipContext } from './../../rumbleship-context/rumbleship-context';

export const LogErrorMiddlewareFn: MiddlewareFn = async ({ root, args, context, info }, next) => {
  try {
    await next();
  } catch (error) {
    const { beeline, logger } = context as RumbleshipContext;
    const error_meta = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.constructor.name
      }
    };
    beeline.addTraceContext(error_meta);
    beeline.finishSpan(
      beeline.startSpan({
        name: error.constructor.name,
        ...error_meta,
        caught_by: 'LogErrorMiddlewareFn'
      })
    );
    logger.error(error.stack);
    throw error;
  }
};
