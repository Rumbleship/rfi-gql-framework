import { MiddlewareFn } from 'type-graphql';
import { RumbleshipContext } from './../../rumbleship-context/rumbleship-context';

export const LogErrorMiddlewareFn: MiddlewareFn = async ({ root, args, context, info }, next) => {
  try {
    await next();
  } catch (error) {
    const { beeline, logger } = context as RumbleshipContext;
    const error_meta = {
      'error.message': error.message,
      'error.stack': error.stack
    };
    beeline.addTraceContext(error_meta);
    beeline.finishSpan(beeline.startSpan({ name: 'error', ...error_meta }));
    logger.error(error.stack);
    throw error;
  }
};
