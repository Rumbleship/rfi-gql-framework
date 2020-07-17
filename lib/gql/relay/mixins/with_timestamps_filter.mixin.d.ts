import { ClassType } from '../../../helpers/classtype';
import { DateRange } from '../../scalars/daterange.scalar';
export declare function withTimeStampsFilter<TFilterBase extends ClassType<any>>(Base: TFilterBase): {
    new (...args: any[]): {
        [x: string]: any;
        created_at?: Date | undefined;
        created_between?: DateRange | undefined;
        updated_at?: Date | undefined;
        updated_between?: DateRange | undefined;
        deleted_at?: Date | undefined;
        deleted_between?: DateRange | undefined;
    };
} & TFilterBase;
