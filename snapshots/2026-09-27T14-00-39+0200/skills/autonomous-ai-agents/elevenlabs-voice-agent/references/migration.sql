-- Deploy via Management API: curl -X POST https://api.supabase.com/v1/projects/<ref>/database/query
-- Creates call_log table (public schema for REST API access) + RPC function.

CREATE TABLE IF NOT EXISTS public.hermes2_call_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid          TEXT NOT NULL UNIQUE,
  caller_number     TEXT NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL,
  duration_seconds  INTEGER DEFAULT 0,
  category          TEXT,
  priority          BOOLEAN DEFAULT FALSE,
  outcome           TEXT,
  ticket_id         TEXT,
  transcript        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_log_call_sid ON public.hermes2_call_log (call_sid);
CREATE INDEX IF NOT EXISTS idx_call_log_caller ON public.hermes2_call_log (caller_number);
CREATE INDEX IF NOT EXISTS idx_call_log_started_at ON public.hermes2_call_log (started_at);

CREATE OR REPLACE FUNCTION public.insert_call_log(
  p_call_sid TEXT,
  p_caller_number TEXT,
  p_started_at TIMESTAMPTZ,
  p_duration_seconds INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_priority BOOLEAN DEFAULT FALSE,
  p_outcome TEXT DEFAULT NULL,
  p_ticket_id TEXT DEFAULT NULL,
  p_transcript TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_id UUID;
BEGIN
  INSERT INTO public.hermes2_call_log (
    call_sid, caller_number, started_at, duration_seconds,
    category, priority, outcome, ticket_id, transcript
  ) VALUES (
    p_call_sid, p_caller_number, p_started_at, p_duration_seconds,
    p_category, p_priority, p_outcome, p_ticket_id, p_transcript
  )
  RETURNING id INTO v_row_id;

  RETURN jsonb_build_object('success', true, 'row_id', v_row_id);
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.hermes2_call_log SET
      duration_seconds = p_duration_seconds,
      category = COALESCE(p_category, category),
      priority = COALESCE(p_priority, priority),
      outcome = COALESCE(p_outcome, outcome),
      ticket_id = COALESCE(p_ticket_id, ticket_id),
      transcript = COALESCE(p_transcript, transcript)
    WHERE call_sid = p_call_sid
    RETURNING id INTO v_row_id;

    RETURN jsonb_build_object('success', true, 'row_id', v_row_id, 'updated', true);
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;