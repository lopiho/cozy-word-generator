-- Game rooms for multi-device sessions
CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  dictionary_id uuid REFERENCES public.dictionaries(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting', -- waiting | playing | finished
  current_word text,
  current_word_index integer NOT NULL DEFAULT 0,
  word_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  timer_seconds integer NOT NULL DEFAULT 60,
  timer_running boolean NOT NULL DEFAULT false,
  timer_started_at timestamptz,
  score integer NOT NULL DEFAULT 0,
  round_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Track which devices have joined and their roles
CREATE TABLE public.game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  role text NOT NULL, -- host | timer | scorer
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, device_id)
);

CREATE INDEX idx_game_rooms_code ON public.game_rooms(code);
CREATE INDEX idx_game_participants_room ON public.game_participants(room_id);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- Public access for the game (no auth, code is the secret)
CREATE POLICY "Anyone can read game rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create game rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game rooms" ON public.game_rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete game rooms" ON public.game_rooms FOR DELETE USING (true);

CREATE POLICY "Anyone can read participants" ON public.game_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join as participant" ON public.game_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.game_participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can leave" ON public.game_participants FOR DELETE USING (true);

CREATE TRIGGER update_game_rooms_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.game_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_participants;