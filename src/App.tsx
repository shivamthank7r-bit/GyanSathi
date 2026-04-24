import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Send, 
  X, 
  Loader2, 
  Calculator, 
  Zap, 
  Beaker, 
  Dna, 
  Book, 
  Languages, 
  Type,
  Trash2,
  ChevronLeft,
  Library,
  Sparkles,
  History,
  PlusCircle,
  Clock,
  LayoutGrid,
  Info,
  Star,
  Archive,
  Edit2,
  ArchiveRestore,
  CheckCircle2,
  BadgeInfo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { SUBJECTS, cn } from '@/src/lib/utils';
import { solveProblem } from '@/src/services/geminiService';

const ICON_MAP = {
  Calculator,
  Zap,
  Beaker,
  Dna,
  Book,
  Languages,
  Type,
  LayoutGrid
};

interface SavedChat {
  id: string;
  subjectId: string;
  title: string;
  timestamp: number;
  messages: { role: 'user' | 'ai'; content: string; image?: string }[];
  isFavorite?: boolean;
  isArchived?: boolean;
}

const SUGGESTIONS = [
  "Give me some tips for exam preparation.",
  "How to improve my memory for studying?",
  "What are the best habits for a successful student?",
  "Explain the solar system briefly."
];

export default function App() {
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0]>(SUBJECTS[0]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string; image?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [historyTab, setHistoryTab] = useState<'active' | 'archived'>('active');
  const [filterSubjectId, setFilterSubjectId] = useState<string | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const history = localStorage.getItem('gyansathi_history');
    if (history) {
      try {
        setSavedChats(JSON.parse(history));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && selectedSubject && currentChatId) {
      const updatedHistory = savedChats.find(c => c.id === currentChatId) 
        ? savedChats.map(c => c.id === currentChatId ? { ...c, messages, timestamp: Date.now() } : c)
        : [{ 
            id: currentChatId, 
            subjectId: selectedSubject.id, 
            title: messages[0].content.slice(0, 40) || 'New Chat', 
            timestamp: Date.now(), 
            messages 
          }, ...savedChats];
      
      setSavedChats(updatedHistory);
      localStorage.setItem('gyansathi_history', JSON.stringify(updatedHistory));
    }
  }, [messages, currentChatId, selectedSubject]);

  const playSound = (type: 'send' | 'clear' | 'switch') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'clear') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'switch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // Audio context might be blocked or unsupported
    }
  };

  const startNewChat = (subject: typeof SUBJECTS[0]) => {
    playSound('switch');
    setSelectedSubject(subject);
    setMessages([]);
    setCurrentChatId(crypto.randomUUID());
  };

  const loadChat = (chat: SavedChat) => {
    const subject = SUBJECTS.find(s => s.id === chat.subjectId);
    if (subject) {
      playSound('switch');
      setSelectedSubject(subject);
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
      setShowHistory(false);
    }
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedChats.filter(c => c.id !== id);
    setSavedChats(updated);
    localStorage.setItem('gyansathi_history', JSON.stringify(updated));
    if (currentChatId === id) {
      setSelectedSubject(null);
      setMessages([]);
      setCurrentChatId(null);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedChats.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c);
    setSavedChats(updated);
    localStorage.setItem('gyansathi_history', JSON.stringify(updated));
  };

  const toggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedChats.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c);
    setSavedChats(updated);
    localStorage.setItem('gyansathi_history', JSON.stringify(updated));
  };

  const startRename = (chat: SavedChat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = (id: string) => {
    if (!editTitle.trim()) return;
    const updated = savedChats.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c);
    setSavedChats(updated);
    localStorage.setItem('gyansathi_history', JSON.stringify(updated));
    setEditingChatId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearChat = () => {
    if (isConfirmingClear) {
      playSound('clear');
      setMessages([]);
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000); // Reset after 3 seconds
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !image) || isLoading || !selectedSubject) return;

    playSound('send');
    const userMessage = { 
      role: 'user' as const, 
      content: input, 
      image: image?.preview 
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = image;
    setInput('');
    setImage(null);
    setIsLoading(true);

    try {
      let imageData;
      if (currentImage) {
        imageData = {
          mimeType: currentImage.file.type,
          data: currentImage.preview.split(',')[1]
        };
      }

      const result = await solveProblem({
        subject: selectedSubject.name,
        prompt: `${selectedSubject.prompt}\n\nClient Question: ${currentInput}`,
        image: imageData
      });

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: result || 'I am sorry, I could not generate a solution.' 
      }]);
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      switch (error.message) {
        case 'QUOTA_EXCEEDED':
          errorMessage = 'API limit reached. Please try again later.';
          break;
        case 'SAFETY_VIOLATION':
          errorMessage = 'The content was flagged by safety filters and cannot be processed.';
          break;
        case 'EMPTY_RESPONSE':
          errorMessage = 'The AI returned an empty response. Try rephrasing your question.';
          break;
        case 'GENERIC_API_ERROR':
          errorMessage = 'Failed to connect to the AI service. Check your internet connection.';
          break;
      }

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `⚠️ **Error**: ${errorMessage}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-[#1A1A1A] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Library size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl tracking-tight text-gray-900 leading-tight">GyanSathi</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">AI Academic Assistant</span>
              <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Gemini Active</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(true)}
            className="p-3 text-gray-500 hover:bg-gray-50 rounded-2xl transition-all relative border border-transparent hover:border-gray-200"
            title="Chat History"
          >
            <History size={22} />
            {savedChats.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
          </button>
        </div>
      </header>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Chat History</h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setHistoryTab('active')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    historyTab === 'active' ? "bg-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Active
                </button>
                <button 
                  onClick={() => setHistoryTab('archived')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    historyTab === 'archived' ? "bg-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Archived
                </button>
              </div>

              <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide flex gap-2">
                <button 
                  onClick={() => setFilterSubjectId('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0",
                    filterSubjectId === 'all' 
                      ? "bg-slate-800 text-white border-slate-800" 
                      : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                  )}
                >
                  All
                </button>
                {SUBJECTS.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => setFilterSubjectId(sub.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0",
                      filterSubjectId === sub.id 
                        ? cn(sub.color, "text-white border-transparent") 
                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>

              {savedChats.filter(c => {
                const tabFilter = historyTab === 'active' ? !c.isArchived : c.isArchived;
                const subjectFilter = filterSubjectId === 'all' ? true : c.subjectId === filterSubjectId;
                return tabFilter && subjectFilter;
              }).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <Clock size={48} className="mb-4 opacity-20" />
                  <p>No {historyTab !== 'active' ? 'archived' : ''} conversations found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedChats
                    .filter(c => {
                      const tabFilter = historyTab === 'active' ? !c.isArchived : c.isArchived;
                      const subjectFilter = filterSubjectId === 'all' ? true : c.subjectId === filterSubjectId;
                      return tabFilter && subjectFilter;
                    })
                    .sort((a, b) => {
                      if (a.isFavorite && !b.isFavorite) return -1;
                      if (!a.isFavorite && b.isFavorite) return 1;
                      return b.timestamp - a.timestamp;
                    })
                    .map((chat) => {
                      const subject = SUBJECTS.find(s => s.id === chat.subjectId);
                      const isEditing = editingChatId === chat.id;

                      return (
                        <div 
                          key={chat.id}
                          onClick={() => !isEditing && loadChat(chat)}
                          className={cn(
                            "group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                            currentChatId === chat.id ? "bg-gray-50 border-black ring-1 ring-black" : "bg-white border-gray-100 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn("w-2 h-2 rounded-full", subject?.color || 'bg-gray-400')} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  {subject?.name || 'Unknown'}
                                </span>
                                {chat.isFavorite && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                              </div>
                              
                              {isEditing ? (
                                <div className="flex items-center gap-2 mt-1 pr-12" onClick={e => e.stopPropagation()}>
                                  <input 
                                    autoFocus
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    onBlur={() => saveRename(chat.id)}
                                    onKeyDown={e => e.key === 'Enter' && saveRename(chat.id)}
                                    className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-bold outline-none focus:border-black"
                                  />
                                </div>
                              ) : (
                                <h4 className="font-bold text-sm truncate pr-16">{chat.title}</h4>
                              )}

                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(chat.timestamp).toLocaleDateString()} at {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={(e) => toggleFavorite(chat.id, e)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  chat.isFavorite ? "text-yellow-500 hover:bg-yellow-50" : "text-gray-300 hover:text-yellow-500 hover:bg-yellow-50"
                                )}
                              >
                                <Star size={14} className={chat.isFavorite ? "fill-yellow-500" : ""} />
                              </button>
                              <button 
                                onClick={(e) => startRename(chat, e)}
                                className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => toggleArchive(chat.id, e)}
                                className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                title={chat.isArchived ? "Unarchive" : "Archive"}
                              >
                                {chat.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                              </button>
                              <button 
                                onClick={(e) => deleteChat(chat.id, e)}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-500 mb-8 shadow-inner">
                <Sparkles size={48} />
              </div>
              <h2 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-800">GyanSathi AI Solver</h2>
              <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
                Expert help for {selectedSubject.name}. Start by asking a question or pick a suggested one below.
              </p>

              {/* Subject Pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-12">
                {SUBJECTS.map((sub) => {
                  const Icon = ICON_MAP[sub.icon as keyof typeof ICON_MAP] || Sparkles;
                  const isActive = selectedSubject.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => startNewChat(sub)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border",
                        isActive 
                          ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <Icon size={14} className={isActive ? "text-blue-500" : "text-gray-400"} />
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-full">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-px w-12 bg-gray-200" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggested Questions</span>
                  <div className="h-px w-12 bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 gap-3 w-full">
                  {SUGGESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="group flex items-center gap-4 bg-white/50 backdrop-blur-sm p-5 rounded-3xl border border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="font-bold text-gray-700 text-base">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-8 scrollbar-hide pb-32"
            >
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest justify-center mb-4">
                  <BadgeInfo size={12} />
                  <span>Topic: {selectedSubject.name}</span>
                </div>
                
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col gap-3", msg.role === 'user' ? 'items-end' : 'items-start')}>
                    {msg.image && (
                      <div className="max-w-md rounded-[2rem] overflow-hidden border-2 border-white shadow-2xl shadow-blue-500/10">
                        <img src={msg.image} alt="Uploaded" className="w-full h-auto" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[90%] md:max-w-[75%] px-7 py-5 rounded-[2.5rem] text-[15px] font-medium leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? 'bg-slate-800 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 rounded-tl-none text-slate-700'
                    )}>
                      {msg.role === 'ai' ? (
                        <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:rounded-2xl">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-4 text-blue-500 animate-pulse justify-center py-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Loader2 className="animate-spin" size={20} />
                    </div>
                    <span className="text-sm font-bold tracking-tight">GyanSathi is working...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 p-6 transition-all duration-500 z-40",
          messages.length > 0 ? "bg-white/80 backdrop-blur-xl border-t border-gray-100" : "bg-transparent"
        )}>
          <div className="max-w-3xl mx-auto">
            {image && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -top-28 left-6 p-3 bg-white rounded-3xl shadow-2xl border border-gray-100 flex items-center gap-4 z-20"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-inner ring-4 ring-slate-50">
                  <img src={image.preview} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-800">Analysis target</span>
                  <button onClick={removeImage} className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest hover:opacity-70 transition-opacity">Remove photo</button>
                </div>
                <button onClick={removeImage} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={18} />
                </button>
              </motion.div>
            )}

            <div className="bg-slate-100/80 backdrop-blur-md rounded-[2.5rem] p-2 pr-2 shadow-inner border border-white flex items-center">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white text-slate-400 hover:text-blue-500 hover:shadow-lg transition-all rounded-[1.8rem] shadow-sm active:scale-95"
              >
                <Camera size={26} />
              </button>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*"
              />
              <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 pl-2">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your problem or type a question..."
                  className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-base font-bold placeholder:text-gray-400 text-slate-700"
                />
                <button 
                  type="submit"
                  disabled={(!input.trim() && !image) || isLoading}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90",
                    ((!input.trim() && !image) || isLoading) 
                      ? "bg-slate-200 text-slate-400" 
                      : "bg-[#0066FF] text-white hover:bg-blue-600 shadow-blue-500/25"
                  )}
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </form>
            </div>
            
            <div className="mt-4 flex justify-center gap-6">
              {messages.length > 0 && (
                <button 
                  onClick={handleClearChat}
                  className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={12} />
                  {isConfirmingClear ? 'Confirm Reset' : 'Clear Chat'}
                </button>
              )}
              {messages.length > 0 && (
                <button 
                  onClick={() => startNewChat(selectedSubject)}
                  className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <PlusCircle size={12} />
                  New Session
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
