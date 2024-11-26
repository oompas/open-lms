import { z } from "npm:zod@3.23.8";

const primaryKeyInt = () => z.number().int().min(1).max(Math.pow(2, 31) - 1);

const naturalNumber = () => z.number().int().min(0);

const uuid = () => z.string().uuid();

const bool = () => z.bool();

const number = (nullable: boolean = false) => z.number().nullable(nullable);

const string = (nullable: boolean = false) => z.string().nullable(nullable);

const array = (data: any) => z.array(data);

const object = (data: object) => z.object(data);

const union = (data: any[]) => z.union(data);

const enumValues = (data: any[]) => z.enum(data);

export { primaryKeyInt, naturalNumber, uuid, bool, number, string, array, object, union, enumValues };
