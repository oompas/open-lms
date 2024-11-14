import { z } from "npm:zod@3.23.8";

const primaryKeyInt = () => z.number().int().positive().max(Math.pow(2, 31) - 1);

export { primaryKeyInt };
