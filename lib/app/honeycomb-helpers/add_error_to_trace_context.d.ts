/**
 * This can be expanded to include different types of Exceptions where we cna harvest and trace interesting
 * additional attribues off the error instance
 */
import { RumbleshipContext } from '../rumbleship-context';
export declare function addErrorToTraceContext(ctx: RumbleshipContext, error: Error): void;
