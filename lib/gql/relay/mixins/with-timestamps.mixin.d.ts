import { AttribType } from '../attrib.enum';
import { ClassType } from '../../../helpers/classtype';
export declare function withTimeStamps<TBase extends ClassType<Record<string, any>>>(attribType: AttribType, Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | undefined;
    };
} & TBase;
