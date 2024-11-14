import { z } from "npm:zod@3.23.8";

const primaryKeyInt = () => z.number().int().positive().max(Math.pow(2, 31) - 1);

const uuid = () => z.string().uuid();

const bool = () => z.bool();

const number = () => z.number();

const array = () => z.array();

const object = () => z.object();

export { primaryKeyInt, uuid, bool, number, array, object };
