import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Snowflake, Settings, Users, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isMobileDevice, generateRoomCode, getDeviceId } from "@/lib/deviceId";
import { toast } from "sonner";
import { shuffleArray } from "@/data/words";

interface DictOption {
  id: string;
  name: string;
  icon: string | null;
  type: string;
  wordCount: number;
}

export default function Lobby() {
  const navigate = useNavigate();
  const [dictionaries, setDictionaries] = useState<DictOption[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(isMobileDevice());

  useEffect(() => {
    supabase.from("dictionaries").select("id, name, icon, type").order("created_at").then(async ({ data }) => {
      if (!data) return;
      const withCounts = await Promise.all(data.map(async (d) => {
        const { count } = await supabase.from("words").select("*", { count: "exact", head: true }).eq("dictionary_id", d.id);
        return { ...d, wordCount: count || 0 };
      }));
      setDictionaries(withCounts);
    });
  }, []);

  const playSolo = (dictId: string) => {
    navigate(`/play?dict=${dictId}`);
  };

  const createRoom = async (dictId: string) => {
    setCreating(true);
    try {
      // Load words for the dict
      const { data: wordsData } = await supabase.from("words").select("word").eq("dictionary_id", dictId);
      if (!wordsData || wordsData.length === 0) {
        toast.error("Slovník je prázdný");
        return;
      }
      const wordList = shuffleArray(wordsData.map(w => w.word));

      // Generate unique code
      let code = generateRoomCode();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase.from("game_rooms").select("id").eq("code", code).maybeSingle();
        if (!existing) break;
        code = generateRoomCode();
      }

      const { data: room, error } = await supabase
        .from("game_rooms")
        .insert({
          code,
          dictionary_id: dictId,
          status: "waiting",
          word_list: wordList as never,
          current_word: wordList[0],
          current_word_index: 0,
        })
        .select()
        .single();

      if (error || !room) throw error || new Error("Nepodařilo se vytvořit místnost");

      // Join as host
      await supabase.from("game_participants").insert({
        room_id: room.id,
        device_id: getDeviceId(),
        role: "host",
      });

      navigate(`/host/${room.id}`);
    } catch (e: any) {
      toast.error(e.message || "Chyba");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 3) {
      toast.error("Zadej kód místnosti");
      return;
    }
    setJoining(true);
    try {
      const { data: room } = await supabase.from("game_rooms").select("id, status").eq("code", code).maybeSingle();
      if (!room) {
        toast.error("Místnost nenalezena");
        return;
      }
      navigate(`/join/${room.id}`);
    } catch (e: any) {
      toast.error(e.message || "Chyba");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative">
      <button
        onClick={() => navigate("/admin")}
        className="absolute top-4 right-4 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all"
        title="Administrace"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gradient font-display">KUFR</h1>
        <p className="text-xl text-muted-foreground font-display">Generátor slov pro hru</p>
      </div>

      {/* Mobile: Join first */}
      {showJoin && (
        <div className="w-full max-w-sm mb-8 space-y-4">
          <div className="p-6 rounded-2xl bg-card game-card-shadow border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold font-display">Připojit k inscenaci</h2>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="KÓD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              />
              <Button onClick={joinRoom} disabled={joining} className="game-gradient text-primary-foreground">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vstoupit"}
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowJoin(false)}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors font-display"
          >
            ↓ Nebo si zahraj sólo na tomto zařízení
          </button>
        </div>
      )}

      {!showJoin && (
        <>
          <div className="flex flex-col sm:flex-row gap-6 flex-wrap justify-center max-w-4xl mb-6">
            {dictionaries.map((d) => {
              const isChristmas = d.type === "christmas";
              return (
                <div
                  key={d.id}
                  className={`group relative px-6 py-5 rounded-2xl game-card-shadow border transition-all duration-300 hover:scale-[1.02] ${
                    isChristmas
                      ? "bg-gradient-to-br from-red-500/10 to-green-500/10 border-red-500/30 hover:border-red-500/50"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 mb-4">
                    {d.type === "normal" ? (
                      <Sparkles className="w-10 h-10 text-primary" />
                    ) : isChristmas ? (
                      <Snowflake className="w-10 h-10 text-red-500" />
                    ) : (
                      <span className="text-4xl">{d.icon || "📚"}</span>
                    )}
                    <span className="text-xl font-semibold text-card-foreground font-display">{d.name}</span>
                    <span className="text-muted-foreground text-xs">{d.wordCount} slov</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playSolo(d.id)}
                      className="w-full"
                    >
                      Sólo
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => createRoom(d.id)}
                      disabled={creating}
                      className="w-full game-gradient text-primary-foreground gap-1"
                    >
                      <Users className="w-4 h-4" />
                      Inscenace
                    </Button>
                  </div>
                </div>
              );
            })}
            {dictionaries.length === 0 && (
              <p className="text-muted-foreground text-center">Žádné slovníky. Nastav je v administraci.</p>
            )}
          </div>

          <button
            onClick={() => setShowJoin(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" /> Mám kód k připojení
          </button>
        </>
      )}
    </div>
  );
}
