// Edge Function: ElevenLabs Post-Call Webhook
// Writes call data to hermes2_call_log via public.insert_call_log RPC.
// transcript is NULL unless explicit spoken consent was given.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase runtime.

interface PostCallPayload {
  call_sid: string;
  caller_number: string;
  started_at: string;
  duration_seconds: number;
  category?: string;
  priority?: boolean;
  outcome?: string;
  ticket_id?: string | null;
  consent_given?: boolean;
  transcript?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload: PostCallPayload = await req.json();

    if (!payload.call_sid || !payload.caller_number || !payload.started_at) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: call_sid, caller_number, started_at" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const transcript = payload.consent_given ? (payload.transcript ?? null) : null;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/insert_call_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_call_sid: payload.call_sid,
        p_caller_number: payload.caller_number,
        p_started_at: payload.started_at,
        p_duration_seconds: payload.duration_seconds ?? 0,
        p_category: payload.category ?? null,
        p_priority: payload.priority ?? false,
        p_outcome: payload.outcome ?? null,
        p_ticket_id: payload.ticket_id ?? null,
        p_transcript: transcript,
      }),
    });

    const result = await rpcResponse.json();
    if (!rpcResponse.ok) throw new Error(`Supabase RPC failed: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (err) {
    console.error("Post-call webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});