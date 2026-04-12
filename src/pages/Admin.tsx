import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, LogOut, Search, BookOpen, Loader2, Wand2 } from 'lucide-react';
import { normalWords, christmasWords } from '@/data/words';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

interface Dictionary {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  created_at: string;
}

interface Word {
  id: string;
  word: string;
  dictionary_id: string;
}

async function adminCall(action: string, password: string, data: Record<string, unknown> = {}) {
  const res = await supabase.functions.invoke('admin', {
    body: { action, password, ...data },
  });
  if (res.error) throw new Error(res.error.message || 'Chyba');
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export default function Admin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [selectedDict, setSelectedDict] = useState<Dictionary | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // New dictionary form
  const [newDictName, setNewDictName] = useState('');
  const [newDictDesc, setNewDictDesc] = useState('');
  const [newDictIcon, setNewDictIcon] = useState('📚');
  const [showNewDict, setShowNewDict] = useState(false);

  // Add words
  const [newWordsText, setNewWordsText] = useState('');
  const [showAddWords, setShowAddWords] = useState(false);

  const storedPassword = () => sessionStorage.getItem('admin_pw') || password;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await adminCall('verify', password);
      sessionStorage.setItem('admin_pw', password);
      setIsAuthenticated(true);
      toast.success('Přihlášeno');
    } catch {
      toast.error('Neplatné heslo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pw');
    setIsAuthenticated(false);
    setPassword('');
  };

  const loadDictionaries = useCallback(async () => {
    const { data } = await supabase.from('dictionaries').select('*').order('created_at');
    if (data) setDictionaries(data);
  }, []);

  const loadWords = useCallback(async (dictId: string) => {
    const { data } = await supabase.from('words').select('*').eq('dictionary_id', dictId).order('word');
    if (data) setWords(data);
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadDictionaries();
  }, [isAuthenticated, loadDictionaries]);

  useEffect(() => {
    if (selectedDict) loadWords(selectedDict.id);
  }, [selectedDict, loadWords]);

  // Check session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) {
      adminCall('verify', saved).then(() => {
        setPassword(saved);
        setIsAuthenticated(true);
      }).catch(() => sessionStorage.removeItem('admin_pw'));
    }
  }, []);

  const handleCreateDict = async () => {
    if (!newDictName.trim()) return;
    setIsLoading(true);
    try {
      await adminCall('create_dictionary', storedPassword(), {
        name: newDictName.trim(),
        description: newDictDesc.trim() || null,
        icon: newDictIcon || '📚',
        type: 'custom',
      });
      toast.success('Slovník vytvořen');
      setNewDictName('');
      setNewDictDesc('');
      setNewDictIcon('📚');
      setShowNewDict(false);
      loadDictionaries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDict = async (id: string) => {
    if (!confirm('Opravdu smazat slovník a všechna jeho slova?')) return;
    try {
      await adminCall('delete_dictionary', storedPassword(), { id });
      toast.success('Slovník smazán');
      if (selectedDict?.id === id) {
        setSelectedDict(null);
        setWords([]);
      }
      loadDictionaries();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddWords = async () => {
    if (!selectedDict || !newWordsText.trim()) return;
    const wordList = newWordsText.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    if (wordList.length === 0) return;
    setIsLoading(true);
    try {
      await adminCall('add_words', storedPassword(), {
        dictionary_id: selectedDict.id,
        words: wordList,
      });
      toast.success(`Přidáno ${wordList.length} slov`);
      setNewWordsText('');
      setShowAddWords(false);
      loadWords(selectedDict.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      await adminCall('delete_word', storedPassword(), { id });
      setWords(prev => prev.filter(w => w.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Naplnit databázi výchozími slovy (Klasický + Vánoční)? Existující slovníky zůstanou.')) return;
    setIsLoading(true);
    try {
      await adminCall('seed_defaults', storedPassword(), {
        dictionaries: [
          { name: 'Klasický režim', description: 'Běžná slova pro hru Kufr', icon: '✨', type: 'normal', words: normalWords },
          { name: 'Vánoční režim', description: 'Vánoční slova', icon: '🎄', type: 'christmas', words: christmasWords },
        ],
      });
      toast.success('Výchozí slovníky naplněny');
      loadDictionaries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const [aiLoading, setAiLoading] = useState(false);

  const handleAiFill = async (count: number = 50) => {
    if (!selectedDict) return;
    setAiLoading(true);
    try {
      const existingWords = words.map(w => w.word);
      const res = await supabase.functions.invoke('ai-fill', {
        body: {
          password: storedPassword(),
          dictionaryName: selectedDict.name,
          count,
          existingWords,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      const generated: string[] = res.data?.words || [];
      if (generated.length === 0) {
        toast.info('AI nevygenerovala žádná nová slova');
        return;
      }
      // Save to DB
      await adminCall('add_words', storedPassword(), {
        dictionary_id: selectedDict.id,
        words: generated,
      });
      toast.success(`AI přidala ${generated.length} slov`);
      loadWords(selectedDict.id);
    } catch (e: any) {
      toast.error(e.message || 'Chyba AI');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredWords = words.filter(w =>
    w.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gradient font-display">Administrace</h1>
            <p className="text-muted-foreground mt-2">Zadejte admin heslo</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <Input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full game-gradient text-primary-foreground" disabled={isLoading || !password}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Přihlásit'}
            </Button>
          </form>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Zpět na hru
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-display">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Hra
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Administrace</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Odhlásit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dictionaries list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Slovníky</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSeedDefaults} disabled={isLoading}>
                  <BookOpen className="w-4 h-4 mr-1" /> Naplnit
                </Button>
                <Dialog open={showNewDict} onOpenChange={setShowNewDict}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nový</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nový slovník</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Název" value={newDictName} onChange={e => setNewDictName(e.target.value)} />
                      <Input placeholder="Popis" value={newDictDesc} onChange={e => setNewDictDesc(e.target.value)} />
                      <Input placeholder="Ikona (emoji)" value={newDictIcon} onChange={e => setNewDictIcon(e.target.value)} maxLength={4} />
                      <Button onClick={handleCreateDict} disabled={isLoading || !newDictName.trim()} className="w-full">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vytvořit'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              {dictionaries.map(d => (
                <div
                  key={d.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDict?.id === d.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedDict(d)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{d.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.type}</p>
                    </div>
                  </div>
                  {d.type === 'custom' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDict(d.id); }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {dictionaries.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Žádné slovníky. Klikněte na "Naplnit" pro výchozí data.
                </p>
              )}
            </div>
          </div>

          {/* Words list */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDict ? (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold">
                    {selectedDict.icon} {selectedDict.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({words.length} slov)
                    </span>
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAiFill(50)}
                    disabled={aiLoading}
                    className="gap-1"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    AI plnič
                  </Button>
                  <Dialog open={showAddWords} onOpenChange={setShowAddWords}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Přidat slova</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Přidat slova</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Jedno slovo na řádek</p>
                        <Textarea
                          placeholder="pes&#10;kočka&#10;dům"
                          value={newWordsText}
                          onChange={e => setNewWordsText(e.target.value)}
                          rows={10}
                        />
                        <Button onClick={handleAddWords} disabled={isLoading || !newWordsText.trim()} className="w-full">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Přidat'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Hledat slova..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
                  {filteredWords.map(w => (
                    <div key={w.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card text-sm group">
                      <span className="truncate">{w.word}</span>
                      <button
                        onClick={() => handleDeleteWord(w.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {filteredWords.length === 0 && words.length > 0 && (
                  <p className="text-center text-muted-foreground py-4">Žádné výsledky</p>
                )}
                {words.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Slovník je prázdný</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Vyberte slovník ze seznamu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
