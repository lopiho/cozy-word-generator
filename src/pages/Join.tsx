import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom, type Role } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/button";
import { Timer, Edit3, ChevronRight, Plus, Minus, ArrowLeft, Check, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Join() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, participants, updateRoom, myDeviceId, myParticipant } = useGameRoom(roomId || null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [joining, setJoining] = useState(false);

  const timerTaken = participants.some(p => p.role === "timer" && p.device_id !== myDeviceId);
  const scorerTaken = participants.some(p => p.role === "scorer" && p.device_id !== myDeviceId);

  // Auto-leave on unmount
  useEffect(() => {
    return () => {
      if (myParticipant) {
        supabase.from("game_participants").delete().eq("id", myParticipant.id).then();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myParticipant?.id]);

  const chooseRole = async (role: Role) => {
    if (!room) return;
    setJoining(true);
    try {
      // Upsert: if I already exist update role, else insert
      if (myParticipant) {
        await supabase.from("game_participants").update({ role }).eq("id", myParticipant.id);
      } else {
        const { error } = await supabase.from("game_participants").insert({
          room_id: room.id,
          device_id: myDeviceId,
          role,
        });
        if (error) throw error;
      }
      setSelectedRole(role);
    } catch (e: any) {
      toast.error(e.message || "Nepodařilo se vybrat roli");
    } finally {
      setJoining(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Načítám...</p>
      </div>
    );
  }

  const myRole = myParticipant?.role || selectedRole;

  // Role selection screen
  if (!myRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
          </Button>
          <div className="text-center mb-8">
            <p className="text-muted-foreground">Místnost</p>
            <p className="text-4xl font-bold font-mono text-gradient">{room.code}</p>
          </div>
          <h2 className="text-xl font-semibold text-center mb-6 font-display">Vyber svou roli</h2>
          <div className="space-y-3">
            <button
              onClick={() => chooseRole("timer")}
              disabled={timerTaken || joining}
              className="w-full p-6 rounded-2xl bg-card border-2 border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-4"
            >
              <Timer className="w-10 h-10 text-primary" />
              <div className="text-left flex-1">
                <p className="font-bold text-lg font-display">⏱️ Časovač</p>
                <p className="text-xs text-muted-foreground">
                  {timerTaken ? "Obsazeno" : "Posouvá slova, měří čas, ukončuje hru"}
                </p>
              </div>
            </button>
            <button
              onClick={() => chooseRole("scorer")}
              disabled={scorerTaken || joining}
              className="w-full p-6 rounded-2xl bg-card border-2 border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-4"
            >
              <Edit3 className="w-10 h-10 text-accent" />
              <div className="text-left flex-1">
                <p className="font-bold text-lg font-display">✏️ Zapisovač</p>
                <p className="text-xs text-muted-foreground">
                  {scorerTaken ? "Obsazeno" : "Zapisuje skóre čárkami pro 2 týmy"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (room.status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold font-display mb-2">Čeká se na spuštění...</p>
        <p className="text-muted-foreground">Tvoje role: <strong>{myRole === "timer" ? "⏱️ Časovač" : "✏️ Zapisovač"}</strong></p>
        <p className="text-muted-foreground text-sm mt-1">Místnost: <span className="font-mono">{room.code}</span></p>
      </div>
    );
  }

  if (room.status === "finished") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-2xl font-bold mb-2 font-display">Hra skončila</p>
        <p className="text-muted-foreground mb-6">Skóre se zobrazuje na PC</p>
        <Button onClick={() => navigate("/")} variant="outline">Zpět do lobby</Button>
      </div>
    );
  }

  // Playing - render role-specific UI
  if (myRole === "timer") return <TimerView room={room} updateRoom={updateRoom} />;
  if (myRole === "scorer") return <ScorerView room={room} />;
  return null;
}

// ============ TIMER VIEW ============
function TimerView({ room, updateRoom }: { room: any; updateRoom: (u: any) => Promise<void> }) {
  const [timeLeft, setTimeLeft] = useState(room.timer_seconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ending, setEnding] = useState(false);

  const isFinished = room.current_word_index >= room.word_list.length - 1;

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, timeLeft]);

  const startTimer = () => {
    if (timeLeft === 0) setTimeLeft(60);
    setRunning(true);
  };
  const pauseTimer = () => setRunning(false);
  const resetTimer = () => {
    setRunning(false);
    setTimeLeft(60);
  };

  const nextWord = useCallback(async () => {
    const nextIdx = room.current_word_index + 1;
    if (nextIdx >= room.word_list.length) return;
    await updateRoom({
      current_word_index: nextIdx,
      current_word: room.word_list[nextIdx],
      score: room.score + 1,
    });
  }, [room, updateRoom]);

  const endGame = async () => {
    if (!confirm("Ukončit hru a zobrazit výsledky na PC?")) return;
    setEnding(true);
    await updateRoom({ status: "finished" });
  };

  const timerColor = timeLeft === 0 ? "text-destructive" : timeLeft <= 10 ? "text-destructive" : timeLeft <= 30 ? "text-accent" : "text-foreground";

  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      {/* Top status bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground font-mono">{room.code}</span>
        <span className="text-xs text-muted-foreground">
          {room.current_word_index + 1} / {room.word_list.length}
        </span>
      </div>

      {/* Time-up notice (small, top) */}
      {timeLeft === 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2 mb-4 flex items-center gap-2 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-destructive font-semibold">Čas vypršel</span>
        </div>
      )}

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <div className={`px-8 py-4 rounded-2xl bg-card border-2 ${timeLeft === 0 ? "border-destructive animate-pulse" : "border-border"}`}>
          <div className="flex items-center gap-3">
            <Timer className={`w-8 h-8 ${timerColor}`} />
            <span className={`text-5xl font-bold font-mono tabular-nums ${timerColor}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Timer controls */}
      <div className="flex justify-center gap-2 mb-8">
        {!running ? (
          <Button onClick={startTimer} className="game-gradient text-primary-foreground">
            {timeLeft === 0 ? "Nový čas" : timeLeft < 60 ? "Pokračovat" : "Start"}
          </Button>
        ) : (
          <Button onClick={pauseTimer} variant="outline">Pauza</Button>
        )}
        <Button onClick={resetTimer} variant="ghost" size="icon">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Word card */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-card rounded-3xl game-card-shadow border border-border p-8 mb-6">
          <div className="min-h-[120px] flex items-center justify-center">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-card-foreground font-display">
              {isFinished ? "🎉 Konec slov" : (room.current_word || "—").toUpperCase()}
            </h2>
          </div>
        </div>

        <Button
          onClick={nextWord}
          disabled={isFinished}
          size="lg"
          className="w-full game-gradient text-primary-foreground gap-2 h-16 text-lg"
        >
          Uhádnuto / Další <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* End game */}
      <Button
        onClick={endGame}
        variant="outline"
        disabled={ending}
        className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ukončit hru a zobrazit skóre"}
      </Button>
    </div>
  );
}

// ============ SCORER VIEW ============
function ScorerView({ room }: { room: any }) {
  const [teamA, setTeamA] = useState(0);
  const [teamB, setTeamB] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // When game finishes, broadcast scores to host
  useEffect(() => {
    if (room.status === "finished" && !submitted) {
      const channel = supabase.channel(`scores-${room.id}`);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "final_scores",
            payload: { teamA, teamB },
          }).then(() => {
            setSubmitted(true);
            supabase.removeChannel(channel);
          });
        }
      });
    }
  }, [room.status, room.id, teamA, teamB, submitted]);

  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground font-mono">{room.code}</span>
        <span className="text-xs text-muted-foreground">✏️ Zapisovač</span>
      </div>

      <h2 className="text-xl font-bold text-center mb-2 font-display">Skóre týmů</h2>
      <p className="text-xs text-center text-muted-foreground mb-6">Tap ➕ pro přidání čárky</p>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <TeamCard label="Tým A" color="primary" score={teamA} onAdd={() => setTeamA(s => s + 1)} onSub={() => setTeamA(s => Math.max(0, s - 1))} />
        <TeamCard label="Tým B" color="accent" score={teamB} onAdd={() => setTeamB(s => s + 1)} onSub={() => setTeamB(s => Math.max(0, s - 1))} />
      </div>

      <div className="mt-4 p-3 rounded-xl bg-card border border-border text-center">
        <p className="text-xs text-muted-foreground">Aktuální slovo (jen pro info)</p>
        <p className="text-2xl font-bold mt-1">{room.current_word?.toUpperCase() || "—"}</p>
      </div>
    </div>
  );
}

function TeamCard({ label, color, score, onAdd, onSub }: { label: string; color: "primary" | "accent"; score: number; onAdd: () => void; onSub: () => void }) {
  const colorClasses = color === "primary"
    ? "bg-primary/10 border-primary/40 text-primary"
    : "bg-accent/10 border-accent/40 text-accent";

  // Render up to 5 marks per row (gate-style)
  const groups = Math.floor(score / 5);
  const remainder = score % 5;

  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col ${colorClasses}`}>
      <p className="text-center font-bold text-lg font-display">{label}</p>
      <div className="text-center text-6xl font-bold tabular-nums my-3">{score}</div>

      {/* Tally marks */}
      <div className="flex-1 flex flex-wrap gap-2 justify-center items-center text-2xl font-mono opacity-80 min-h-[60px]">
        {Array.from({ length: groups }).map((_, i) => <span key={i}>卌</span>)}
        {remainder > 0 && <span>{"|".repeat(remainder)}</span>}
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={onSub} className="flex-1">
          <Minus className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={onAdd} className="flex-1 game-gradient text-primary-foreground">
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
