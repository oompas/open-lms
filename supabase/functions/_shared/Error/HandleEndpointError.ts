import { InternalError, logErr } from "../helpers.ts";
import DatabaseError from "./DatabaseError.ts";

const HandleEndpointError = async (req: Request, err: any) => {
    let message;
    if (err instanceof DatabaseError) {
        message = err.message || "Internal database error";
    } else {
        message = "An unexpected error occurred";
    }

    logErr(`Error caught: ${message}`);
    return new InternalError();
}

export default HandleEndpointError;
