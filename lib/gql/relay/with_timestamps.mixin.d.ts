import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
export declare function withTimeStamps<TBase extends ClassType<object>>(attribType: AttribType, Base: TBase): {
    new (...args: any[]): {
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | undefined;
    };
} & TBase;
