import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronRight, RotateCcw, Sparkles, Snowflake, Settings, Timer, Play, Pause } from 'lucide-react';
import { normalWords, christmasWords, shuffleArray } from '@/data/words';
import { Snowflakes } from './Snowflakes';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type Mode = 'normal' | 'christmas';

interface DictOption {
  id: string;
  name: string;
  icon: string | null;
  type: string;
  wordCount: number;
}

export function WordGenerator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedDictId, setSelectedDictId] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [dictionaries, setDictionaries] = useState<DictOption[]>([]);
  const [useDb, setUseDb] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load dictionaries from DB
  useEffect(() => {
    supabase.from('dictionaries').select('id, name, icon, type').order('created_at').then(({ data }) => {
      if (data && data.length > 0) {
        // Get word counts
        Promise.all(data.map(async (d) => {
          const { count } = await supabase.from('words').select('*', { count: 'exact', head: true }).eq('dictionary_id', d.id);
          return { ...d, wordCount: count || 0 };
        })).then(results => {
          setDictionaries(results);
          setUseDb(true);
        });
      }
    });
  }, []);

  // Load words when mode/dict selected
  useEffect(() => {
    if (selectedDictId && useDb) {
      supabase.from('words').select('word').eq('dictionary_id', selectedDictId).then(({ data }) => {
        if (data) {
          setWords(shuffleArray(data.map(w => w.word)));
          setCurrentIndex(0);
          setAnimationKey(prev => prev + 1);
        }
      });
    } else if (mode && !useDb) {
      const sourceWords = mode === 'christmas' ? christmasWords : normalWords;
      setWords(shuffleArray(sourceWords));
      setCurrentIndex(0);
      setAnimationKey(prev => prev + 1);
    }
  }, [mode, selectedDictId, useDb]);

  // Determine effective mode for theming
  const effectiveMode = useDb
    ? dictionaries.find(d => d.id === selectedDictId)?.type === 'christmas' ? 'christmas' : 'normal'
    : mode;

  useEffect(() => {
    if (effectiveMode === 'christmas') {
      document.documentElement.classList.add('christmas');
    } else {
      document.documentElement.classList.remove('christmas');
    }
    return () => {
      document.documentElement.classList.remove('christmas');
    };
  }, [effectiveMode]);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timeLeft]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(60);
      setTimerRunning(true);
      setTimerStarted(true);
    } else {
      setTimerRunning(!timerRunning);
      setTimerStarted(true);
    }
  };

  const resetTimer = () => {
    setTimeLeft(60);
    setTimerRunning(false);
    setTimerStarted(false);
  };

  const nextWord = useCallback(() => {
    if (isAnimating || currentIndex >= words.length - 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimationKey(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentIndex, words.length]);

  const resetGame = useCallback(() => {
    setWords(prev => shuffleArray([...prev]));
    setCurrentIndex(0);
    setAnimationKey(prev => prev + 1);
    resetTimer();
  }, []);

  const goBack = useCallback(() => {
    setMode(null);
    setSelectedDictId(null);
    setWords([]);
    setCurrentIndex(0);
    resetTimer();
  }, []);

  const handleSelectMode = (m: Mode) => {
    if (useDb) {
      const dict = dictionaries.find(d => d.type === m);
      if (dict) {
        setSelectedDictId(dict.id);
        setMode(m);
      }
    } else {
      setMode(m);
    }
  };

  const handleSelectCustomDict = (dict: DictOption) => {
    setSelectedDictId(dict.id);
    setMode('normal');
  };

  // Mode selection screen
  if (!mode) {
    const normalDict = dictionaries.find(d => d.type === 'normal');
    const christmasDict = dictionaries.find(d => d.type === 'christmas');
    const customDicts = dictionaries.filter(d => d.type === 'custom');

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative">
        {/* Admin button */}
        <button
          onClick={() => navigate('/admin')}
          className="absolute top-4 right-4 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all"
          title="Administrace"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gradient font-display">KUFR</h1>
          <p className="text-xl text-muted-foreground font-display">Generátor slov pro hru</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 flex-wrap justify-center">
          <button
            onClick={() => handleSelectMode('normal')}
            className="group relative px-8 py-6 rounded-2xl bg-card game-card-shadow border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-12 h-12 text-primary" />
              <span className="text-2xl font-semibold text-card-foreground font-display">Klasický režim</span>
              <span className="text-muted-foreground text-sm">
                {normalDict ? `${normalDict.wordCount} slov` : `${normalWords.length}+ slov`}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleSelectMode('christmas')}
            className="group relative px-8 py-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-green-500/10 game-card-shadow border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <Snowflake className="w-12 h-12 text-red-500" />
              <span className="text-2xl font-semibold text-card-foreground font-display">Vánoční režim</span>
              <span className="text-muted-foreground text-sm">
                {christmasDict ? `${christmasDict.wordCount} slov` : `${christmasWords.length}+ slov`}
              </span>
            </div>
          </button>

          {customDicts.map(d => (
            <button
              key={d.id}
              onClick={() => handleSelectCustomDict(d)}
              className="group relative px-8 py-6 rounded-2xl bg-card game-card-shadow border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl">{d.icon || '📚'}</span>
                <span className="text-2xl font-semibold text-card-foreground font-display">{d.name}</span>
                <span className="text-muted-foreground text-sm">{d.wordCount} slov</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex] || '';
  const isFinished = currentIndex >= words.length - 1 && words.length > 0;
  const isChristmas = effectiveMode === 'christmas';

  const timerColor = timeLeft <= 10 ? 'text-destructive' : timeLeft <= 30 ? 'text-accent' : 'text-card-foreground';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative ${isChristmas ? 'font-christmas' : 'font-display'}`}>
      {isChristmas && <Snowflakes />}

      {/* Back button */}
      <button
        onClick={goBack}
        className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300 font-display text-sm"
      >
        ← Zpět
      </button>

      {/* Counter */}
      <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
        <span className="text-muted-foreground font-display text-sm">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Timer */}
      <div className="absolute top-16 right-4 flex items-center gap-2">
        <div className={`px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center gap-2 ${timeLeft === 0 ? 'animate-pulse border-destructive' : ''}`}>
          <Timer className={`w-4 h-4 ${timerColor}`} />
          <span className={`font-mono text-lg font-bold ${timerColor}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        <button
          onClick={toggleTimer}
          className="p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all"
        >
          {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        {timerStarted && (
          <button
            onClick={resetTimer}
            className="p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-card rounded-3xl game-card-shadow border border-border p-8 md:p-12 animate-pulse-glow">
          <div className="min-h-[120px] flex items-center justify-center mb-8">
            <h2
              key={animationKey}
              className={`text-4xl md:text-6xl font-bold text-center text-card-foreground animate-word-enter ${isChristmas ? 'font-christmas' : 'font-display'}`}
            >
              {isFinished ? '🎉 Hotovo!' : timeLeft === 0 && timerStarted ? '⏰ Čas vypršel!' : currentWord.toUpperCase()}
            </h2>
          </div>

          <div className="flex justify-center gap-4">
            {!isFinished && timeLeft > 0 ? (
              <button
                onClick={nextWord}
                disabled={isAnimating || (timerStarted && !timerRunning && timeLeft > 0 && timeLeft < 60)}
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
                <RotateCcw className="w-5 h-5" />
                Hrát znovu
              </button>
            )}
          </div>
        </div>

        {isChristmas && (
          <>
            <div className="absolute -top-4 -left-4 text-4xl animate-float">🎄</div>
            <div className="absolute -top-4 -right-4 text-4xl animate-float" style={{ animationDelay: '1s' }}>⭐</div>
            <div className="absolute -bottom-4 -left-4 text-4xl animate-float" style={{ animationDelay: '0.5s' }}>🎁</div>
            <div className="absolute -bottom-4 -right-4 text-4xl animate-float" style={{ animationDelay: '1.5s' }}>🔔</div>
          </>
        )}
      </div>

      {/* Progress bar */}
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
