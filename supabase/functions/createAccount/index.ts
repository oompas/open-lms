import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { adminClient } from "../_config/adminClient.ts";

Deno.serve(async (req) => {
    const { email, password } = await req.json();

    console.log(`(1/3) Entering createAccount function with email: ${email}`);

    if (!email || !password) {
      return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400 }
      );
    }

    console.log(`(2/3) Email & password verified`);

    const { data, error } = await adminClient.auth.admin.createUser({ email, password });

    if (error) {
        console.log(`Error creating user: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    console.log(`(3/3) User created successfully: ${data.user.email}`);
    return new Response(JSON.stringify({ user: data.user }), { status: 200 });
});
