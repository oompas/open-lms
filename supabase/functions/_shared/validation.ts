import { z } from "npm:zod@3.23.8";

const primaryKeyInt = () => z.number().int().min(1).max(Math.pow(2, 31) - 1);

const naturalNumber = () => z.number().int().min(0);

const uuid = () => z.string().uuid();

const bool = () => z.bool();

const number = (nullable: boolean = false) => z.number().nullable(nullable);

const string = ({ nullable = false, min, max }: { nullable?: boolean; min?: number; max?: number }) => {
    let schema = z.string();

    if (min !== undefined) {
        schema = schema.min(options.min, {
            message: `String must be at least ${options.min} characters long`,
        });
    }

    if (max !== undefined) {
        schema = schema.max(options.max, {
            message: `String must be at most ${options.max} characters long`,
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
