-- Voice Bot Latency Optimization - Add voice_knowledge_brief column
-- This stores a condensed knowledge summary for voice mode (skips RAG)

ALTER TABLE IF EXISTS public.chatbots
  ADD COLUMN IF NOT EXISTS voice_knowledge_brief TEXT;

COMMENT ON COLUMN public.chatbots.voice_knowledge_brief IS 
  'Pre-processed condensed knowledge for voice mode. Max ~300 tokens. Avoids RAG latency.';

-- Index for faster voice bot config lookups
CREATE INDEX IF NOT EXISTS chatbots_slug_voice_idx ON public.chatbots (slug) WHERE is_deleted = false;
