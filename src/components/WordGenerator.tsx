import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, RotateCcw, Sparkles, Snowflake } from 'lucide-react';
import { normalWords, christmasWords, shuffleArray } from '@/data/words';
import { Snowflakes } from './Snowflakes';

type Mode = 'normal' | 'christmas';

export function WordGenerator() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (mode) {
      const sourceWords = mode === 'christmas' ? christmasWords : normalWords;
      setWords(shuffleArray(sourceWords));
      setCurrentIndex(0);
      setAnimationKey((prev) => prev + 1);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'christmas') {
      document.documentElement.classList.add('christmas');
    } else {
      document.documentElement.classList.remove('christmas');
    }
    return () => {
      document.documentElement.classList.remove('christmas');
    };
  }, [mode]);

  const nextWord = useCallback(() => {
    if (isAnimating || currentIndex >= words.length - 1) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setAnimationKey((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentIndex, words.length]);

  const resetGame = useCallback(() => {
    const sourceWords = mode === 'christmas' ? christmasWords : normalWords;
    setWords(shuffleArray(sourceWords));
    setCurrentIndex(0);
    setAnimationKey((prev) => prev + 1);
  }, [mode]);

  const goBack = useCallback(() => {
    setMode(null);
    setWords([]);
    setCurrentIndex(0);
  }, []);

  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gradient font-display">
            KUFR
          </h1>
          <p className="text-xl text-muted-foreground font-display">
            Generátor slov pro hru
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={() => setMode('normal')}
            className="group relative px-8 py-6 rounded-2xl bg-card game-card-shadow border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-12 h-12 text-primary" />
              <span className="text-2xl font-semibold text-card-foreground font-display">
                Klasický režim
              </span>
              <span className="text-muted-foreground text-sm">
                {normalWords.length}+ slov
              </span>
            </div>
          </button>

          <button
            onClick={() => setMode('christmas')}
            className="group relative px-8 py-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-green-500/10 game-card-shadow border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <Snowflake className="w-12 h-12 text-red-500" />
              <span className="text-2xl font-semibold text-card-foreground font-display">
                Vánoční režim
              </span>
              <span className="text-muted-foreground text-sm">
                {christmasWords.length}+ slov
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex] || '';
  const isFinished = currentIndex >= words.length - 1 && words.length > 0;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative ${mode === 'christmas' ? 'font-christmas' : 'font-display'}`}>
      {mode === 'christmas' && <Snowflakes />}
      
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

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-card rounded-3xl game-card-shadow border border-border p-8 md:p-12 animate-pulse-glow">
          {/* Word display */}
          <div className="min-h-[120px] flex items-center justify-center mb-8">
            <h2
              key={animationKey}
              className={`text-4xl md:text-6xl font-bold text-center text-card-foreground animate-word-enter ${
                mode === 'christmas' ? 'font-christmas' : 'font-display'
              }`}
            >
              {isFinished ? '🎉 Hotovo!' : currentWord.toUpperCase()}
            </h2>
          </div>

          {/* Action buttons */}
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
                <RotateCcw className="w-5 h-5" />
                Hrát znovu
              </button>
            )}
          </div>
        </div>

        {/* Decorative elements for Christmas mode */}
        {mode === 'christmas' && (
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
