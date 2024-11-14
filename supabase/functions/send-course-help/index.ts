import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OptionsRsp, SuccessResponse } from "../_shared/helpers.ts";
import { sendEmail } from "../_shared/emails.ts";
import { getRequestUser, getUserById } from "../_shared/auth.ts";
import { getRows } from "../_shared/database.ts";

Deno.serve(async (req) => {




    return SuccessResponse("Success!!");
});
