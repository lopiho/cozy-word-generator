import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronRight, RotateCcw, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { shuffleArray } from "@/data/words";
import { Snowflakes } from "@/components/Snowflakes";
import { Button } from "@/components/ui/button";

export default function Play() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dictId = params.get("dict");

  const [words, setWords] = useState<string[]>([]);
  const [dictType, setDictType] = useState<string>("normal");
  const [dictName, setDictName] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!dictId) {
      navigate("/");
      return;
    }
    (async () => {
      const { data: dict } = await supabase.from("dictionaries").select("name, type").eq("id", dictId).maybeSingle();
      if (dict) {
        setDictType(dict.type);
        setDictName(dict.name);
      }
      const { data: ws } = await supabase.from("words").select("word").eq("dictionary_id", dictId);
      if (ws) {
        setWords(shuffleArray(ws.map(w => w.word)));
        setCurrentIndex(0);
        setAnimationKey(k => k + 1);
      }
    })();
  }, [dictId, navigate]);

  const isChristmas = dictType === "christmas";

  useEffect(() => {
    if (isChristmas) document.documentElement.classList.add("christmas");
    else document.documentElement.classList.remove("christmas");
    return () => document.documentElement.classList.remove("christmas");
  }, [isChristmas]);

  const nextWord = useCallback(() => {
    if (isAnimating || currentIndex >= words.length - 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimationKey(k => k + 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentIndex, words.length]);

  const resetGame = useCallback(() => {
    setWords(prev => shuffleArray([...prev]));
    setCurrentIndex(0);
    setAnimationKey(k => k + 1);
  }, []);

  if (words.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Načítám...</p></div>;
  }

  const currentWord = words[currentIndex] || "";
  const isFinished = currentIndex >= words.length - 1;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative ${isChristmas ? "font-christmas" : "font-display"}`}>
      {isChristmas && <Snowflakes />}

      <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="absolute top-4 left-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
      </Button>

      <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
        <span className="text-muted-foreground font-display text-sm">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-card rounded-3xl game-card-shadow border border-border p-8 md:p-12 animate-pulse-glow">
          <div className="min-h-[120px] flex items-center justify-center mb-8">
            <h2
              key={animationKey}
              className={`text-4xl md:text-6xl font-bold text-center text-card-foreground animate-word-enter ${isChristmas ? "font-christmas" : "font-display"}`}
            >
              {isFinished ? "🎉 Hotovo!" : currentWord.toUpperCase()}
            </h2>
          </div>

          <div className="flex justify-center gap-4">
            {!isFinished ? (
              <button
                onClick={nextWord}
                disabled={isAnimating}
                className="group game-gradient text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-display"
              >
                Další slovo
                <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="group game-gradient text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg font-display"
              >
                <RotateCcw className="w-5 h-5" /> Hrát znovu
              </button>
            )}
          </div>
        </div>

        {isChristmas && (
          <>
            <div className="absolute -top-4 -left-4 text-4xl animate-float">🎄</div>
            <div className="absolute -top-4 -right-4 text-4xl animate-float" style={{ animationDelay: "1s" }}>⭐</div>
            <div className="absolute -bottom-4 -left-4 text-4xl animate-float" style={{ animationDelay: "0.5s" }}>🎁</div>
            <div className="absolute -bottom-4 -right-4 text-4xl animate-float" style={{ animationDelay: "1.5s" }}>🔔</div>
          </>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full game-gradient transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
