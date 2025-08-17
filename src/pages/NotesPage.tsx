import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/hooks/api-settings';


// Backend resource base
const NOTES_ENDPOINT = '/notes/';

type Recurrence = 'daily' | 'weekly' | 'monthly' | null;
export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  scheduled_at?: string | null; // ISO string or null
  recurrence?: Recurrence | null;
  archived?: boolean;
};

// API helpers
const fetchNotes = async (search?: string): Promise<Note[]> => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await api.get(NOTES_ENDPOINT + params);
  // api.get may return {results: [...]} or array
  return (res as any).results || (res as any) || [];
};

const createNote = async (payload: Partial<Note>) => {
  return await api.post(NOTES_ENDPOINT, payload);
};

const updateNote = async (id: number, payload: Partial<Note>) => {
  return await api.put(`${NOTES_ENDPOINT}${id}/`, payload);
};

const deleteNote = async (id: number) => {
  return await api.delete(`${NOTES_ENDPOINT}${id}/`);
};

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Schedule state (editor modal)
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>(''); // yyyy-mm-dd
  const [scheduleTime, setScheduleTime] = useState<string>(''); // HH:MM
  const [recurrence, setRecurrence] = useState<Recurrence>(null);

  // Determine mode by path
  const mode: 'list' | 'new' | 'edit' = useMemo(() => {
    if (location.pathname.endsWith('/new')) return 'new';
    if (params.noteId) return 'edit';
    return 'list';
  }, [location.pathname, params.noteId]);

  const darkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    const load = async () => {
      try { setLoading(true); setNotes(await fetchNotes()); } finally { setLoading(false); }
    };
    load();
  }, []);

  // Populate editor when editing
  useEffect(() => {
    if (mode === 'edit' && params.noteId) {
      const n = notes.find(n => String(n.id) === String(params.noteId));
      if (n) {
        setTitle(n.title || '');
        setContent(n.content || '');
        if (n.scheduled_at) {
          try {
            const d = new Date(n.scheduled_at);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const HH = String(d.getHours()).padStart(2, '0');
            const MM = String(d.getMinutes()).padStart(2, '0');
            setScheduleDate(`${yyyy}-${mm}-${dd}`);
            setScheduleTime(`${HH}:${MM}`);
          } catch {
            setScheduleDate('');
            setScheduleTime('');
          }
        } else {
          setScheduleDate('');
          setScheduleTime('');
        }
        setRecurrence((n.recurrence as Recurrence) ?? null);
      } else {
        // If note not found locally, fetch list and try again
        (async () => {
          const list = await fetchNotes();
          setNotes(list);
          const n2 = list.find(x => String(x.id) === String(params.noteId));
          if (!n2) navigate('/notes', { replace: true });
        })();
      }
    } else if (mode === 'new') {
      setTitle('');
      setContent('');
      setScheduleDate('');
      setScheduleTime('');
      setRecurrence(null);
    }
  }, [mode, params.noteId, navigate]);

  const handleBack = () => {
    if (mode === 'list') navigate('/settings');
    else navigate('/notes');
  };

  const handleCreate = () => navigate('/notes/new');

  const handleOpen = (id: string) => navigate(`/notes/${id}`);

  const combineDateTime = (dateStr: string, timeStr: string): string | null => {
    if (!dateStr || !timeStr) return null;
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const [hh, mm] = timeStr.split(':').map(Number);
      const dt = new Date(y, (m - 1), d, hh, mm, 0);
      return dt.toISOString();
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    const scheduled_at = combineDateTime(scheduleDate, scheduleTime); // may be null
    const payload: any = {
      title,
      content,
      scheduled_at: scheduled_at,
      recurrence: recurrence ?? null,
    };

    if (mode === 'new') {
      await createNote(payload);
      setNotes(await fetchNotes());
      navigate('/notes');
    } else if (mode === 'edit' && params.noteId) {
      await updateNote(Number(params.noteId), payload);
      setNotes(await fetchNotes());
      navigate('/notes');
    }
  };

  const handleDelete = async (id?: number | string) => {
    const targetId = id ?? params.noteId;
    if (!targetId) return;
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    await deleteNote(Number(targetId));
    setNotes(await fetchNotes());
    navigate('/notes');
  };

  // Filtered list by search
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(n => (n.title || '').toLowerCase().includes(q));
  }, [notes, searchQuery]);


  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className={darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'list' ? 'Bloknot' : mode === 'new' ? 'Yangi eslatma' : 'Eslatmani tahrirlash'}
            </h1>
          </div>

          {mode === 'list' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(v => !v)}
                className={darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}
                title="Qidirish"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button onClick={handleCreate} className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Yangi
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                onClick={() => setScheduleOpen(true)}
                className={darkMode ? 'border-blue-500 text-blue-400 hover:bg-blue-900/20' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}
                title="Sana/vaqt"
              >
                <Calendar className="w-4 h-4 mr-2" /> Sana/vaqt
              </Button>
              <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">Saqlash</Button>
            </div>
          )}
        </div>

        {/* Animated Search Bar (list mode) */}
        {mode === 'list' && (
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isSearchOpen ? 'max-h-16 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Sarlavha bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded border px-3 py-2 pr-10 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  title="Tozalash"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {mode === 'list' && (
          <div className="space-y-2">
            {loading ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Yuklanmoqda...</div>
            ) : filteredNotes.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Eslatmalar yo'q</div>
            ) : (
              filteredNotes.map(n => (
                <div
                  key={n.id}
                  className={`p-4 rounded-lg border cursor-pointer flex items-start justify-between ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => handleOpen(String(n.id))}
                >
                  <div className="flex-1 pr-3">
                    <div className="font-bold uppercase text-base truncate">
                      {n.title || 'Sarlavhasiz'}
                    </div>
                    <div className={`text-sm mt-1 lowercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {n.content}
                    </div>
                    {(n.scheduled_at || n.recurrence) && (
                      <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {n.scheduled_at ? new Date(n.scheduled_at).toLocaleString() : 'Vaqtsiz'} {n.recurrence ? `• ${n.recurrence}` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                    className="p-2 rounded hover:bg-red-100"
                    title="O'chirish"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {(mode === 'new' || mode === 'edit') && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sarlavha</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded border px-3 py-3 font-bold uppercase text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Sarlavha"
              />
            </div>
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Matn</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full rounded border px-3 py-3 h-[60vh] resize-vertical lowercase ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Matn..."
              />
            </div>
            {(scheduleDate || scheduleTime || recurrence) && (
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Jadval: {scheduleDate || '—'} {scheduleTime || ''} {recurrence ? `• ${recurrence}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-black'}>
              Sana va vaqtni belgilash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sana</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Vaqt</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Davriylik</label>
              <select
                value={recurrence ?? ''}
                onChange={(e) => {
                  const v = e.target.value as 'daily' | 'weekly' | 'monthly' | '';
                  setRecurrence(v === '' ? null : v);
                }}
                className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">Tanlanmagan</option>
                <option value="daily">Kunlik</option>
                <option value="weekly">Haftalik</option>
                <option value="monthly">Oylik</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setScheduleOpen(false)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">Saqlash</Button>
              <Button variant="outline" onClick={() => {
                setScheduleOpen(false);
              }} className="flex-1">Bekor qilish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesPage;
