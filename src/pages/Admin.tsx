import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Trash2, ArrowLeft, LogOut, Search, BookOpen, Loader2, Wand2,
  Upload, Download, Pencil, Check, X, BarChart3, History, ChevronDown,
  ChevronUp, Filter, Hash, Clock, FileText, Sparkles
} from 'lucide-react';
import { normalWords, christmasWords } from '@/data/words';

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

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

async function adminCall(action: string, password: string, data: Record<string, unknown> = {}) {
  const res = await supabase.functions.invoke('admin', {
    body: { action, password, ...data },
  });
  if (res.error) throw new Error(res.error.message || 'Chyba');
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

type Tab = 'words' | 'stats' | 'audit';
type SortMode = 'alpha' | 'alpha-desc' | 'length' | 'newest';

export default function Admin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [selectedDict, setSelectedDict] = useState<Dictionary | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('words');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [filterLength, setFilterLength] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);

  // Inline editing
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editingWordValue, setEditingWordValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Bulk selection
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());

  // Dictionary form
  const [newDictName, setNewDictName] = useState('');
  const [newDictDesc, setNewDictDesc] = useState('');
  const [newDictIcon, setNewDictIcon] = useState('📚');
  const [showNewDict, setShowNewDict] = useState(false);

  // Edit dictionary
  const [editingDict, setEditingDict] = useState<Dictionary | null>(null);
  const [editDictName, setEditDictName] = useState('');
  const [editDictDesc, setEditDictDesc] = useState('');
  const [editDictIcon, setEditDictIcon] = useState('');

  // Add words
  const [newWordsText, setNewWordsText] = useState('');
  const [showAddWords, setShowAddWords] = useState(false);

  // Audit
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiCount, setAiCount] = useState(50);
  const [aiTheme, setAiTheme] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'lehká' | 'střední' | 'těžká'>('střední');
  const [aiWordType, setAiWordType] = useState<'mix' | 'noun' | 'verb' | 'adj'>('mix');

  // Dict panel collapsed
  const [dictPanelOpen, setDictPanelOpen] = useState(true);

  const storedPassword = () => sessionStorage.getItem('admin_pw') || password;

  // ========== AUTH ==========
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

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) {
      adminCall('verify', saved).then(() => {
        setPassword(saved);
        setIsAuthenticated(true);
      }).catch(() => sessionStorage.removeItem('admin_pw'));
    }
  }, []);

  // ========== DATA LOADING ==========
  const loadDictionaries = useCallback(async () => {
    const { data } = await supabase.from('dictionaries').select('*').order('created_at');
    if (data) setDictionaries(data);
  }, []);

  const loadWords = useCallback(async (dictId: string) => {
    const { data } = await supabase.from('words').select('*').eq('dictionary_id', dictId).order('word');
    if (data) setWords(data);
  }, []);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setAuditLog(data as AuditEntry[]);
    setAuditLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadDictionaries();
  }, [isAuthenticated, loadDictionaries]);

  useEffect(() => {
    if (selectedDict) {
      loadWords(selectedDict.id);
      setSelectedWordIds(new Set());
      setEditingWordId(null);
    }
  }, [selectedDict, loadWords]);

  useEffect(() => {
    if (activeTab === 'audit' && isAuthenticated) loadAuditLog();
  }, [activeTab, isAuthenticated, loadAuditLog]);

  // ========== DICTIONARY CRUD ==========
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
      setNewDictName(''); setNewDictDesc(''); setNewDictIcon('📚'); setShowNewDict(false);
      loadDictionaries();
    } catch (e: any) { toast.error(e.message); }
    finally { setIsLoading(false); }
  };

  const handleUpdateDict = async () => {
    if (!editingDict) return;
    setIsLoading(true);
    try {
      await adminCall('update_dictionary', storedPassword(), {
        id: editingDict.id,
        name: editDictName.trim(),
        description: editDictDesc.trim() || null,
        icon: editDictIcon || '📚',
      });
      toast.success('Slovník upraven');
      setEditingDict(null);
      loadDictionaries();
      if (selectedDict?.id === editingDict.id) {
        setSelectedDict(prev => prev ? { ...prev, name: editDictName, description: editDictDesc, icon: editDictIcon } : null);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteDict = async (id: string) => {
    if (!confirm('Opravdu smazat slovník a všechna jeho slova?')) return;
    try {
      await adminCall('delete_dictionary', storedPassword(), { id });
      toast.success('Slovník smazán');
      if (selectedDict?.id === id) { setSelectedDict(null); setWords([]); }
      loadDictionaries();
    } catch (e: any) { toast.error(e.message); }
  };

  // ========== WORD CRUD ==========
  const handleAddWords = async () => {
    if (!selectedDict || !newWordsText.trim()) return;
    const wordList = newWordsText.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    if (wordList.length === 0) return;
    setIsLoading(true);
    try {
      await adminCall('add_words', storedPassword(), { dictionary_id: selectedDict.id, words: wordList });
      toast.success(`Přidáno ${wordList.length} slov`);
      setNewWordsText(''); setShowAddWords(false);
      loadWords(selectedDict.id);
    } catch (e: any) { toast.error(e.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      await adminCall('delete_word', storedPassword(), { id });
      setWords(prev => prev.filter(w => w.id !== id));
      setSelectedWordIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleBulkDelete = async () => {
    if (selectedWordIds.size === 0) return;
    if (!confirm(`Smazat ${selectedWordIds.size} vybraných slov?`)) return;
    try {
      await adminCall('delete_words_bulk', storedPassword(), { ids: Array.from(selectedWordIds) });
      setWords(prev => prev.filter(w => !selectedWordIds.has(w.id)));
      setSelectedWordIds(new Set());
      toast.success(`Smazáno ${selectedWordIds.size} slov`);
    } catch (e: any) { toast.error(e.message); }
  };

  const startEditWord = (w: Word) => {
    setEditingWordId(w.id);
    setEditingWordValue(w.word);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const saveEditWord = async () => {
    if (!editingWordId || !editingWordValue.trim()) return;
    try {
      await adminCall('update_word', storedPassword(), { id: editingWordId, word: editingWordValue.trim() });
      setWords(prev => prev.map(w => w.id === editingWordId ? { ...w, word: editingWordValue.trim() } : w));
      setEditingWordId(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const cancelEditWord = () => { setEditingWordId(null); setEditingWordValue(''); };

  // ========== CSV IMPORT/EXPORT ==========
  const handleExportCSV = () => {
    if (!selectedDict || words.length === 0) return;
    const csv = words.map(w => w.word).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDict.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportováno');
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !selectedDict) return;
      const text = await file.text();
      const wordList = text.split(/[\n,;]/).map(w => w.trim()).filter(w => w.length > 0 && w.length <= 255);
      if (wordList.length === 0) { toast.error('Žádná platná slova v souboru'); return; }
      setIsLoading(true);
      try {
        await adminCall('add_words', storedPassword(), { dictionary_id: selectedDict.id, words: wordList });
        toast.success(`Importováno ${wordList.length} slov`);
        loadWords(selectedDict.id);
      } catch (e: any) { toast.error(e.message); }
      finally { setIsLoading(false); }
    };
    input.click();
  };

  // ========== AI ==========
  const handleAiFill = async () => {
    if (!selectedDict) return;
    setAiLoading(true); setShowAiDialog(false);
    const t = toast.loading('AI generuje a validuje slova...');
    try {
      const existingWords = words.map(w => w.word);
      const res = await supabase.functions.invoke('ai-fill', {
        body: {
          password: storedPassword(), dictionaryName: selectedDict.name,
          dictionaryDescription: selectedDict.description || '', count: aiCount,
          existingWords, theme: aiTheme.trim(), difficulty: aiDifficulty, wordType: aiWordType,
        },
      });
      toast.dismiss(t);
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      const generated: string[] = res.data?.words || [];
      const stats = res.data?.stats;
      if (generated.length === 0) { toast.info('AI nevygenerovala žádná nová slova'); return; }
      await adminCall('add_words', storedPassword(), { dictionary_id: selectedDict.id, words: generated });
      toast.success(
        `AI přidala ${generated.length} slov` +
        (stats ? ` (z ${stats.generated} kandidátů, ${stats.rejected} odmítnuto)` : '')
      );
      loadWords(selectedDict.id);
    } catch (e: any) { toast.dismiss(t); toast.error(e.message || 'Chyba AI'); }
    finally { setAiLoading(false); }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Naplnit databázi výchozími slovy (Klasický + Vánoční)?')) return;
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
    } catch (e: any) { toast.error(e.message); }
    finally { setIsLoading(false); }
  };

  // ========== COMPUTED ==========
  const sortedFilteredWords = (() => {
    let result = words.filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterLength[0] > 0 || filterLength[1] < 100) {
      result = result.filter(w => w.word.length >= filterLength[0] && w.word.length <= filterLength[1]);
    }
    switch (sortMode) {
      case 'alpha': result.sort((a, b) => a.word.localeCompare(b.word, 'cs')); break;
      case 'alpha-desc': result.sort((a, b) => b.word.localeCompare(a.word, 'cs')); break;
      case 'length': result.sort((a, b) => a.word.length - b.word.length); break;
      case 'newest': result.sort((a, b) => b.id.localeCompare(a.id)); break;
    }
    return result;
  })();

  const wordStats = (() => {
    if (words.length === 0) return null;
    const lengths = words.map(w => w.word.length);
    const avgLen = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1);
    const shortest = words.reduce((a, b) => a.word.length < b.word.length ? a : b);
    const longest = words.reduce((a, b) => a.word.length > b.word.length ? a : b);
    const letterFreq: Record<string, number> = {};
    words.forEach(w => {
      const first = w.word[0]?.toUpperCase();
      if (first) letterFreq[first] = (letterFreq[first] || 0) + 1;
    });
    const topLetters = Object.entries(letterFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { total: words.length, avgLen, shortest: shortest.word, longest: longest.word, topLetters };
  })();

  const toggleSelectAll = () => {
    if (selectedWordIds.size === sortedFilteredWords.length) {
      setSelectedWordIds(new Set());
    } else {
      setSelectedWordIds(new Set(sortedFilteredWords.map(w => w.id)));
    }
  };

  // ========== AUDIT HELPERS ==========
  const actionLabels: Record<string, string> = {
    create_dictionary: '📚 Vytvořen slovník',
    update_dictionary: '✏️ Upraven slovník',
    delete_dictionary: '🗑️ Smazán slovník',
    add_words: '➕ Přidána slova',
    update_word: '✏️ Upraveno slovo',
    delete_word: '🗑️ Smazáno slovo',
    delete_words_bulk: '🗑️ Hromadně smazáno',
    seed_defaults: '🌱 Naplněno výchozími',
  };

  // ========== LOGIN SCREEN ==========
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-3xl font-bold text-gradient font-display">Administrace</h1>
            <p className="text-muted-foreground mt-2">Zadejte admin heslo</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <Input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
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

  // ========== MAIN LAYOUT ==========
  return (
    <div className="min-h-screen bg-background font-display">
      {/* Top command bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold text-gradient hidden sm:block">⚙️ Administrace</h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Tabs */}
            {selectedDict && (
              <div className="flex bg-muted rounded-lg p-0.5 mr-3">
                {([
                  ['words', '📝', 'Slova'],
                  ['stats', '📊', 'Statistiky'],
                  ['audit', '📋', 'Audit log'],
                ] as [Tab, string, string][]).map(([tab, icon, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="mr-1">{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex max-w-[1800px] mx-auto min-h-[calc(100vh-3.5rem)]">
        {/* Left: Dictionary panel */}
        <div className={`border-r border-border transition-all duration-300 flex-shrink-0 ${dictPanelOpen ? 'w-72' : 'w-12'}`}>
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {dictPanelOpen ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Slovníky</h2>
                  <button onClick={() => setDictPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleSeedDefaults} disabled={isLoading}>
                    <BookOpen className="w-3 h-3 mr-1" /> Naplnit
                  </Button>
                  <Dialog open={showNewDict} onOpenChange={setShowNewDict}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1 text-xs game-gradient text-primary-foreground">
                        <Plus className="w-3 h-3 mr-1" /> Nový
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nový slovník</DialogTitle></DialogHeader>
                      <div className="space-y-3">
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

                <div className="space-y-1">
                  {dictionaries.map(d => {
                    const isSelected = selectedDict?.id === d.id;
                    return (
                      <div
                        key={d.id}
                        className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                          isSelected
                            ? 'bg-primary/15 border border-primary/30 shadow-sm'
                            : 'hover:bg-muted border border-transparent'
                        }`}
                        onClick={() => { setSelectedDict(d); setActiveTab('words'); }}
                      >
                        <span className="text-lg flex-shrink-0">{d.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate leading-tight">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">{d.type}</p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDict(d);
                              setEditDictName(d.name);
                              setEditDictDesc(d.description || '');
                              setEditDictIcon(d.icon || '📚');
                            }}
                            className="p-1 rounded hover:bg-background"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          {d.type === 'custom' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteDict(d.id); }}
                              className="p-1 rounded hover:bg-background"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dictionaries.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 text-xs">
                      Žádné slovníky
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center pt-3 gap-2">
                <button onClick={() => setDictPanelOpen(true)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
                {dictionaries.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDict(d); setDictPanelOpen(true); }}
                    className={`text-lg p-1 rounded-lg transition-all ${selectedDict?.id === d.id ? 'bg-primary/15' : 'hover:bg-muted'}`}
                    title={d.name}
                  >
                    {d.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {selectedDict ? (
            <div className="p-4 md:p-6 space-y-4">
              {/* Dictionary header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">{selectedDict.icon}</span>
                    {selectedDict.name}
                  </h2>
                  {selectedDict.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedDict.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gradient">{words.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">slov celkem</div>
                </div>
              </div>

              {/* WORDS TAB */}
              {activeTab === 'words' && (
                <div className="space-y-3">
                  {/* Action bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Hledat slova..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-1">
                      <Filter className="w-3 h-3" /> Filtr
                    </Button>
                    <select
                      value={sortMode}
                      onChange={e => setSortMode(e.target.value as SortMode)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="alpha">A → Z</option>
                      <option value="alpha-desc">Z → A</option>
                      <option value="length">Délka ↑</option>
                      <option value="newest">Nejnovější</option>
                    </select>

                    <div className="flex gap-1 ml-auto">
                      <Button size="sm" variant="outline" onClick={handleImportCSV} disabled={isLoading} className="gap-1">
                        <Upload className="w-3 h-3" /> <span className="hidden sm:inline">Import</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={words.length === 0} className="gap-1">
                        <Download className="w-3 h-3" /> <span className="hidden sm:inline">Export</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAiDialog(true)} disabled={aiLoading} className="gap-1">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span className="hidden sm:inline">AI</span>
                      </Button>
                      <Dialog open={showAddWords} onOpenChange={setShowAddWords}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1 game-gradient text-primary-foreground">
                            <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Přidat</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Přidat slova</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Jedno slovo na řádek</p>
                            <Textarea placeholder={"pes\nkočka\ndům"} value={newWordsText} onChange={e => setNewWordsText(e.target.value)} rows={10} />
                            <Button onClick={handleAddWords} disabled={isLoading || !newWordsText.trim()} className="w-full">
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Přidat'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Filters */}
                  {showFilters && (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs">Délka:</span>
                        <Input
                          type="number" min={0} max={100} value={filterLength[0]}
                          onChange={e => setFilterLength([Number(e.target.value), filterLength[1]])}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                          type="number" min={0} max={100} value={filterLength[1]}
                          onChange={e => setFilterLength([filterLength[0], Number(e.target.value)])}
                          className="w-16 h-7 text-xs"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Zobrazeno: {sortedFilteredWords.length} / {words.length}
                      </div>
                    </div>
                  )}

                  {/* Bulk actions */}
                  {selectedWordIds.size > 0 && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
                      <span className="text-sm font-medium">Vybráno: {selectedWordIds.size}</span>
                      <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="gap-1">
                        <Trash2 className="w-3 h-3" /> Smazat vybrané
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedWordIds(new Set())}>Zrušit výběr</Button>
                    </div>
                  )}

                  {/* Word grid */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={sortedFilteredWords.length > 0 && selectedWordIds.size === sortedFilteredWords.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                      <span className="flex-1">Slovo ({sortedFilteredWords.length})</span>
                      <span className="w-12 text-center">Délka</span>
                      <span className="w-16 text-right">Akce</span>
                    </div>
                    {/* Rows */}
                    <div className="max-h-[55vh] overflow-y-auto divide-y divide-border">
                      {sortedFilteredWords.map(w => (
                        <div
                          key={w.id}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm group transition-colors ${
                            selectedWordIds.has(w.id) ? 'bg-primary/5' : 'hover:bg-muted/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedWordIds.has(w.id)}
                            onChange={() => {
                              setSelectedWordIds(prev => {
                                const n = new Set(prev);
                                n.has(w.id) ? n.delete(w.id) : n.add(w.id);
                                return n;
                              });
                            }}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            {editingWordId === w.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  ref={editInputRef}
                                  value={editingWordValue}
                                  onChange={e => setEditingWordValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveEditWord();
                                    if (e.key === 'Escape') cancelEditWord();
                                  }}
                                  className="h-7 text-sm"
                                />
                                <button onClick={saveEditWord} className="p-1 text-primary hover:text-primary/80">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={cancelEditWord} className="p-1 text-muted-foreground hover:text-foreground">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="truncate block">{w.word}</span>
                            )}
                          </div>
                          <span className="w-12 text-center text-xs text-muted-foreground">{w.word.length}</span>
                          <div className="w-16 flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditWord(w)} className="p-1 rounded hover:bg-muted">
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDeleteWord(w.id)} className="p-1 rounded hover:bg-muted">
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {sortedFilteredWords.length === 0 && (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        {words.length === 0 ? 'Slovník je prázdný' : 'Žádné výsledky'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STATS TAB */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  {wordStats ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Celkem slov', value: wordStats.total, icon: <FileText className="w-4 h-4" /> },
                          { label: 'Průměrná délka', value: wordStats.avgLen, icon: <Hash className="w-4 h-4" /> },
                          { label: 'Nejkratší', value: wordStats.shortest, icon: <ChevronDown className="w-4 h-4" /> },
                          { label: 'Nejdelší', value: wordStats.longest, icon: <ChevronUp className="w-4 h-4" /> },
                        ].map((s, i) => (
                          <div key={i} className="p-4 rounded-xl border border-border bg-card">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              {s.icon}
                              <span className="text-xs font-medium uppercase tracking-wider">{s.label}</span>
                            </div>
                            <div className="text-lg font-bold truncate">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" /> Nejčastější počáteční písmena
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {wordStats.topLetters.map(([letter, count]) => {
                            const pct = Math.round((count / wordStats.total) * 100);
                            return (
                              <div key={letter} className="flex items-center gap-1.5">
                                <span className="text-sm font-bold w-5 text-center">{letter}</span>
                                <div className="h-5 bg-muted rounded-full overflow-hidden w-24">
                                  <div
                                    className="h-full game-gradient rounded-full transition-all"
                                    style={{ width: `${Math.max(pct, 4)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">Žádná data pro statistiky</div>
                  )}
                </div>
              )}

              {/* AUDIT TAB */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <History className="w-4 h-4" /> Historie změn
                    </h3>
                    <Button size="sm" variant="ghost" onClick={loadAuditLog} disabled={auditLoading}>
                      {auditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Obnovit'}
                    </Button>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                      {auditLog.map(entry => (
                        <div key={entry.id} className="px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {actionLabels[entry.action] || entry.action}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(entry.created_at).toLocaleString('cs-CZ')}
                            </span>
                          </div>
                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground space-x-2">
                              {entry.details.name && <span>Název: <b>{String(entry.details.name)}</b></span>}
                              {entry.details.count && <span>Počet: <b>{String(entry.details.count)}</b></span>}
                              {entry.details.word && <span>Slovo: <b>{String(entry.details.word)}</b></span>}
                              {entry.details.old && (
                                <span>
                                  {String(entry.details.old)} → <b>{String(entry.details.new)}</b>
                                </span>
                              )}
                              {entry.details.sample && (
                                <span>Ukázka: {(entry.details.sample as string[]).join(', ')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {auditLog.length === 0 && !auditLoading && (
                        <div className="py-8 text-center text-sm text-muted-foreground">Žádné záznamy</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
              <div className="text-5xl mb-4">👈</div>
              <h2 className="text-xl font-bold mb-2">Vyberte slovník</h2>
              <p className="text-muted-foreground text-sm">Zvolte slovník z levého panelu pro správu slov</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>🪄 AI plnič slov</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Téma (volitelné)</label>
              <Input placeholder="např. zvířata, sport, kuchyně..." value={aiTheme} onChange={e => setAiTheme(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Prázdné = podle názvu slovníku</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Obtížnost</label>
                <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value as any)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="lehká">Lehká</option>
                  <option value="střední">Střední</option>
                  <option value="těžká">Těžká</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Typ slov</label>
                <select value={aiWordType} onChange={e => setAiWordType(e.target.value as any)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="mix">Mix</option>
                  <option value="noun">Podst. jména</option>
                  <option value="verb">Slovesa</option>
                  <option value="adj">Příd. jména</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Počet slov: {aiCount}</label>
              <input type="range" min={10} max={150} step={10} value={aiCount}
                onChange={e => setAiCount(Number(e.target.value))} className="w-full" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              ✨ AI vygeneruje slova a druhým průchodem ověří jejich vhodnost.
            </div>
            <Button onClick={handleAiFill} disabled={aiLoading} className="w-full game-gradient text-primary-foreground">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1" /> Spustit</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dictionary dialog */}
      <Dialog open={!!editingDict} onOpenChange={(open) => { if (!open) setEditingDict(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upravit slovník</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Název" value={editDictName} onChange={e => setEditDictName(e.target.value)} />
            <Input placeholder="Popis" value={editDictDesc} onChange={e => setEditDictDesc(e.target.value)} />
            <Input placeholder="Ikona" value={editDictIcon} onChange={e => setEditDictIcon(e.target.value)} maxLength={4} />
            <Button onClick={handleUpdateDict} disabled={isLoading || !editDictName.trim()} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uložit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
