import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
export declare function withTimeStamps<TBase extends ClassType<any>>(attribType: AttribType, Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | undefined;
    };
} & TBase;
