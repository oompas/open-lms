import { z } from "npm:zod@3.23.8";

const primaryKeyInt = () => z.number().int().min(1).max(Math.pow(2, 31) - 1);

const naturalNumber = () => z.number().int().min(0);

const uuid = () => z.string().uuid();

const bool = () => z.boolean();

const number = ({ nullable, min, max }: { nullable?: boolean; min?: number; max?: number } = {}) => {
    let schema = z.number();

    if (min !== undefined) {
        schema = schema.min(min, {
            message: `number must be at least ${min}`,
        });
    }

    if (max !== undefined) {
        schema = schema.max(max, {
            message: `number must be at most ${max}`,
        });
    }

    return nullable ? schema.nullable() : schema;
};

const string = ({ nullable, min, max }: { nullable?: boolean; min?: number; max?: number }) => {
    let schema = z.string();

    if (min !== undefined) {
        schema = schema.min(min, {
            message: `String must be at least ${min} characters long`,
        });
    }

    if (max !== undefined) {
        schema = schema.max(max, {
            message: `String must be at most ${max} characters long`,
        });
    }

    return nullable ? schema.nullable() : schema;
};

const array = (data: any) => z.array(data);

const object = (data: object) => z.object(data);

const union = (data: any[]) => z.union(data);

const enumValues = (data: any[]) => z.enum(data);

const literal = (data: any) => z.literal(data);

export { primaryKeyInt, naturalNumber, uuid, bool, number, string, array, object, union, enumValues, literal };
