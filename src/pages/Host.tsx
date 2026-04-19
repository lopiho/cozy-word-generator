import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, Timer, Edit3, Users, Trophy, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function Host() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, participants, updateRoom } = useGameRoom(roomId || null);
  const [scores, setScores] = useState<{ teamA: number; teamB: number } | null>(null);

  // Listen for final score broadcast
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`scores-${roomId}`)
      .on("broadcast", { event: "final_scores" }, ({ payload }) => {
        setScores(payload as { teamA: number; teamB: number });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const timerParticipant = participants.find(p => p.role === "timer");
  const scorerParticipant = participants.find(p => p.role === "scorer");

  if (!roomId || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Načítám místnost...</p>
      </div>
    );
  }

  const closeRoom = async () => {
    if (!confirm("Opravdu ukončit inscenaci?")) return;
    await supabase.from("game_rooms").delete().eq("id", roomId);
    navigate("/");
  };

  const startGame = () => {
    updateRoom({ status: "playing" });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-display">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={closeRoom}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Ukončit
          </Button>
          <h1 className="text-2xl font-bold text-gradient">KUFR — Inscenace</h1>
          <div className="w-20" />
        </div>

        {/* Room code display */}
        <div className="text-center mb-12">
          <p className="text-muted-foreground mb-2">Kód místnosti</p>
          <div className="inline-block px-12 py-6 bg-card rounded-3xl game-card-shadow border-2 border-primary/30">
            <div className="text-7xl md:text-9xl font-bold tracking-widest font-mono text-gradient">
              {room.code}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4" />
            Otevři tuto stránku v mobilech a zadej kód
          </p>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
          <ParticipantCard
            icon={<Timer className="w-6 h-6" />}
            label="Časovač"
            connected={!!timerParticipant}
          />
          <ParticipantCard
            icon={<Edit3 className="w-6 h-6" />}
            label="Zapisovač"
            connected={!!scorerParticipant}
          />
        </div>

        {/* Game state */}
        {room.status === "waiting" && (
          <div className="text-center max-w-md mx-auto">
            <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> Připojeno: {participants.length}
            </p>
            <Button
              onClick={startGame}
              disabled={participants.length < 1}
              size="lg"
              className="game-gradient text-primary-foreground gap-2"
            >
              <Play className="w-5 h-5" /> Spustit hru
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Stačí alespoň jeden mobilní hráč pro spuštění.
            </p>
          </div>
        )}

        {room.status === "playing" && (
          <div className="text-center">
            <div className="bg-card rounded-3xl game-card-shadow border border-border p-12 max-w-2xl mx-auto">
              <p className="text-muted-foreground mb-4">Aktuální slovo na mobilu časovače</p>
              <div className="text-6xl md:text-8xl font-bold text-gradient mb-8">
                {room.current_word?.toUpperCase() || "—"}
              </div>
              <div className="flex items-center justify-center gap-8 text-muted-foreground">
                <div>
                  <p className="text-xs">Slovo</p>
                  <p className="text-2xl font-bold text-foreground">{room.current_word_index + 1} / {room.word_list.length}</p>
                </div>
                <div>
                  <p className="text-xs">Kolo</p>
                  <p className="text-2xl font-bold text-foreground">{room.round_number}</p>
                </div>
                <div>
                  <p className="text-xs">Skóre</p>
                  <p className="text-2xl font-bold text-foreground">{room.score}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {room.status === "finished" && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-card rounded-3xl game-card-shadow border border-border p-12">
              <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-6">Hra skončila!</h2>
              {scores ? (
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-primary/10 rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground mb-2">Tým A</p>
                    <p className="text-6xl font-bold text-primary">{scores.teamA}</p>
                  </div>
                  <div className="bg-accent/10 rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground mb-2">Tým B</p>
                    <p className="text-6xl font-bold text-accent">{scores.teamB}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-5xl font-bold text-primary mb-2">{room.score}</p>
                  <p className="text-muted-foreground">uhádnutých slov</p>
                </div>
              )}
              <Button onClick={closeRoom} variant="outline" className="gap-2 mt-4">
                <RotateCcw className="w-4 h-4" /> Zpět do lobby
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantCard({ icon, label, connected }: { icon: React.ReactNode; label: string; connected: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${
      connected
        ? "border-primary bg-primary/5"
        : "border-dashed border-border bg-card/50"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">
            {connected ? "✓ Připojen" : "Čeká na připojení..."}
          </p>
        </div>
      </div>
    </div>
  );
}
