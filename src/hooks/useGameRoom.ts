import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

export type RoomStatus = "waiting" | "playing" | "finished";
export type Role = "host" | "timer" | "scorer";

export interface GameRoom {
  id: string;
  code: string;
  dictionary_id: string | null;
  status: RoomStatus;
  current_word: string | null;
  current_word_index: number;
  word_list: string[];
  timer_seconds: number;
  timer_running: boolean;
  timer_started_at: string | null;
  score: number;
  round_number: number;
}

export interface Participant {
  id: string;
  room_id: string;
  device_id: string;
  role: Role;
}

export function useGameRoom(roomId: string | null) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const deviceId = useRef(getDeviceId());

  // Initial load + subscription
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setParticipants([]);
      return;
    }

    const loadRoom = async () => {
      const { data } = await supabase.from("game_rooms").select("*").eq("id", roomId).maybeSingle();
      if (data) setRoom(data as unknown as GameRoom);
    };
    const loadParts = async () => {
      const { data } = await supabase.from("game_participants").select("*").eq("room_id", roomId);
      if (data) setParticipants(data as unknown as Participant[]);
    };
    loadRoom();
    loadParts();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRoom(null);
          } else if (payload.new) {
            setRoom(payload.new as unknown as GameRoom);
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "game_participants", filter: `room_id=eq.${roomId}` },
        () => loadParts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const updateRoom = useCallback(async (updates: Partial<GameRoom>) => {
    if (!roomId) return;
    await supabase.from("game_rooms").update(updates as never).eq("id", roomId);
  }, [roomId]);

  const myParticipant = participants.find(p => p.device_id === deviceId.current) || null;

  return { room, participants, updateRoom, myDeviceId: deviceId.current, myParticipant };
}
