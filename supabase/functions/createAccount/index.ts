import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

Deno.serve(async (req) => {
    const { email, password } = await req.json();

    console.log(`(1/4) Entering createAccount function with email: ${email}`);

    if (!email || !password) {
      return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400 }
      );
    }

    console.log(`(2/4) Email & password verified`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`(3/4) Client created`);

    const { data, error } = await supabase.auth.admin.createUser({ email, password });

    if (error) {
        console.log(`Error creating user: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    console.log(`(4/4) User created successfully: ${data.user.email}`);
    return new Response(JSON.stringify({ user: data.user }), { status: 200 });
});
