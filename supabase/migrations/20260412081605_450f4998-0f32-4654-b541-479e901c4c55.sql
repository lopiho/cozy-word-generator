
-- Create dictionaries table
CREATE TABLE public.dictionaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📚',
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('normal', 'christmas', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create words table
CREATE TABLE public.words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  dictionary_id UUID NOT NULL REFERENCES public.dictionaries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast word lookups
CREATE INDEX idx_words_dictionary_id ON public.words(dictionary_id);
CREATE INDEX idx_words_word ON public.words(word);

-- Enable RLS
ALTER TABLE public.dictionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read dictionaries" ON public.dictionaries FOR SELECT USING (true);
CREATE POLICY "Anyone can read words" ON public.words FOR SELECT USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dictionaries_updated_at
BEFORE UPDATE ON public.dictionaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
