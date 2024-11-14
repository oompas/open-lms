import { z } from "npm:zod@3.23.8";

const primaryKeyInt = () => z.number().int().min(1).max(Math.pow(2, 31) - 1);

const naturalNumber = () => z.number().int().min(0);

const uuid = () => z.string().uuid();

const bool = () => z.bool();

const number = () => z.number();

const array = (data: any) => z.array(data);

const object = (data: object) => z.object(data);

export { primaryKeyInt, naturalNumber, uuid, bool, number, array, object };
