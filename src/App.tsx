import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, PenTool, Image as ImageIcon, Sparkles, Copy, Check, Key, Loader2, Target, Brain, Layout } from 'lucide-react';

type Tab = 'ideaGenerator' | 'scriptWriter' | 'imagePrompter' | 'thumbnailPrompter';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [isAuthorized, setIsAuthorized] = useState(!!(localStorage.getItem('gemini_api_key')));
  const [activeTab, setActiveTab] = useState<Tab>('ideaGenerator');
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'tiktok'>('youtube');
  const [language, setLanguage] = useState<'indonesia' | 'english'>('indonesia');
  const [outputs, setOutputs] = useState<Record<Tab, string>>({
    ideaGenerator: '',
    scriptWriter: '',
    imagePrompter: '',
    thumbnailPrompter: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(language === 'indonesia' ? 'Menginisialisasi Jaringan Syaraf...' : 'Initializing Neural Network...');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const loadingPhrases = language === 'indonesia' ? [
    'Memetakan Loop Kebiasaan...',
    'Mengoptimalkan Jalur Saraf...',
    'Menyintesis Performa Puncak...',
    'Kalibrasi Hormon Motivasi...',
    'Mendekode Hambatan Psikologis...',
    'Menghasilkan Wawasan Praktis...',
    'Menskalakan Mindset Pertumbuhan...',
    'Memvisualisasikan Status Kesuksesan...'
  ] : [
    'Mapping Habit Loops...',
    'Optimizing Neural Pathways...',
    'Synthesizing Peak Performance...',
    'Calibrating Motivation Hormones...',
    'Decoding Psychological Blocks...',
    'Generating Actionable Insights...',
    'Scaling Growth Mindset...',
    'Visualizing Success State...'
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
      }, 1500);
    } else {
      setLoadingPhrase(language === 'indonesia' ? 'Sistem Siap...' : 'Ready for Input...');
    }
    return () => clearInterval(interval);
  }, [loading]);

  const currentOutput = outputs[activeTab];

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setIsAuthorized(true);
    }
  };

  const handleResetKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsAuthorized(false);
    setTempKey('');
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    
    // Clear current tab output before generating
    setOutputs(prev => ({ ...prev, [activeTab]: '' }));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feature: activeTab, 
          topic: input,
          apiKey: apiKey,
          platform: platform,
          language: language
        }),
      });

      const data = await response.json();
      if (data.error) {
        let errorMessage = data.error;
        if (typeof data.error === 'string' && (data.error.includes('RESOURCE_EXHAUSTED') || data.error.includes('quota'))) {
          errorMessage = "QUOTA EXCEEDED: You have reached the limit for the Free Tier of Gemini. Please wait a few minutes or try a different API Key.";
        } else if (typeof data.error === 'object') {
          // Handle stringified JSON error objects
          const errorStr = JSON.stringify(data.error);
          if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
            errorMessage = "QUOTA EXCEEDED: You have reached the limit for the Free Tier of Gemini. Please wait a few minutes or try a different API Key.";
          }
        }
        setOutputs(prev => ({ ...prev, [activeTab]: `SYSTEM ERROR: ${errorMessage}` }));
      } else {
        setOutputs(prev => ({ ...prev, [activeTab]: data.result }));
      }
    } catch (error) {
      setOutputs(prev => ({ ...prev, [activeTab]: 'Failed to connect to the server. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string = 'main') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    { id: 'ideaGenerator', label: language === 'indonesia' ? 'Pembuat Ide' : 'Idea Generator', icon: Sparkles },
    { id: 'scriptWriter', label: language === 'indonesia' ? 'Penulis Skrip' : 'Script Writer', icon: PenTool },
    { id: 'imagePrompter', label: language === 'indonesia' ? 'Pembuat Prompt' : 'Image Prompter', icon: ImageIcon },
    { id: 'thumbnailPrompter', label: language === 'indonesia' ? 'Prompt Thumbnail' : 'Thumbnail Prompter', icon: Layout },
  ];

  const renderIdeaList = (text: string) => {
    // Basic regex to match lines starting with numbers like "1. Titles - Concept"
    const lines = text.split('\n').filter(line => line.trim().match(/^\d+\./));
    if (lines.length === 0) return <pre className="whitespace-pre-wrap font-sans text-xl font-light leading-relaxed text-gray-400">{text}</pre>;

    return (
      <div className="space-y-4 relative z-10 py-2">
        <AnimatePresence mode="popLayout">
          {lines.map((line, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group/item bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start justify-between gap-4 hover:bg-[#5A9E6B]/10 hover:border-[#5A9E6B]/30 hover:glow-border transition-all cursor-default"
            >
              <div className="flex gap-4 items-start">
                <span className="text-[#5A9E6B] font-mono text-sm pt-1.5 opacity-50">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-gray-200 text-lg font-medium leading-tight">{line.replace(/^\d+\.\s*/, '')}</span>
              </div>
              <button 
                onClick={() => handleCopy(line, `idea-${idx}`)}
                className="shrink-0 p-2.5 bg-white/5 hover:bg-emerald-500/20 text-emerald-500 rounded-xl transition-all opacity-0 group-hover/item:opacity-100 shadow-lg"
              >
                {copiedId === `idea-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, #121814 0%, #050505 50%), radial-gradient(circle at 100% 100%, #0f1210 0%, #050505 50%)' }} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-8 text-center ring-1 ring-white/5">
            <div className="w-16 h-16 bg-[#5A9E6B] rounded-xl flex items-center justify-center transform rotate-45 shadow-[0_0_30px_rgba(90,158,107,0.3)]">
              <Target className="w-8 h-8 text-black transform -rotate-45" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-widest text-white">System <span className="text-[#5A9E6B]">Access</span></h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                {language === 'indonesia' 
                  ? 'Inisialisasi Mesin Pertumbuhan. Masukkan API key Gemini Anda untuk mulai membuat konten pengembangan diri.' 
                  : 'Initialize the Growth Engine. Provide your Gemini API key to begin generating self-development content.'}
              </p>
            </div>

            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              <button 
                onClick={() => setLanguage('indonesia')}
                className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all ${language === 'indonesia' ? 'bg-[#5A9E6B] text-black shadow-lg shadow-[#5A9E6B]/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Indonesia
              </button>
              <button 
                onClick={() => setLanguage('english')}
                className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all ${language === 'english' ? 'bg-[#5A9E6B] text-black shadow-lg shadow-[#5A9E6B]/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                English
              </button>
            </div>

            <div className="w-full space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A9E6B] transition-colors">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="Paste GEMINI_API_KEY here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-center text-sm focus:outline-none focus:border-[#5A9E6B]/50 focus:bg-white/10 transition-all placeholder:text-gray-700"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                />
              </div>
              <button
                onClick={handleSaveKey}
                disabled={!tempKey.trim()}
                className="w-full py-4 bg-[#5A9E6B] text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#6ab47c] transition-all shadow-[0_0_20px_rgba(90,158,107,0.2)] disabled:bg-gray-800 disabled:text-gray-500 active:scale-95"
              >
                {language === 'indonesia' ? 'Masuk ke Sistem' : 'Access System'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-white/5 w-full justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/50"></span>
              <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">Encryption Mode Active</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      {/* Visual FX Layers */}
      <div className="absolute inset-0 scanline z-50 opacity-20 pointer-events-none" />
      <div className="absolute inset-0 animate-flicker pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 80%, rgba(0,0,0,0.4) 100%)' }} />

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#5A9E6B] rounded-sm flex items-center justify-center transform rotate-45 shadow-[0_0_15px_rgba(90,158,107,0.4)]">
            <Brain className="w-4 h-4 text-black transform -rotate-45" />
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase text-white">Epic <span className="text-[#5A9E6B]">Growth</span> Machine</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5 h-9">
            <button 
              onClick={() => setLanguage('indonesia')}
              className={`px-3 py-1 text-[9px] uppercase font-bold tracking-widest rounded-md transition-all ${language === 'indonesia' ? 'bg-[#5A9E6B] text-black shadow-lg shadow-[#5A9E6B]/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              ID
            </button>
            <button 
              onClick={() => setLanguage('english')}
              className={`px-3 py-1 text-[9px] uppercase font-bold tracking-widest rounded-md transition-all ${language === 'english' ? 'bg-[#5A9E6B] text-black shadow-lg shadow-[#5A9E6B]/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              EN
            </button>
          </div>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{language === 'indonesia' ? 'Terverifikasi' : 'Authorized'}</label>
          <button 
            onClick={handleResetKey}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-[10px] uppercase font-bold tracking-tighter transition-all"
          >
            {language === 'indonesia' ? 'Keluar / Reset API' : 'Logout / Reset API'}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex justify-center gap-1 p-2 bg-black/40 border-b border-white/5 shrink-0">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as Tab);
            }}
            className={`
              px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all
              ${activeTab === tab.id ? 'text-white border-b-2 border-[#5A9E6B] bg-white/5' : 'text-gray-500 hover:text-white'}
            `}
          >
            {idx + 1}. {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        
        {/* Input Section */}
        <section className="p-8 border-r border-white/5 flex flex-col gap-6 bg-black/10 overflow-hidden">
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex justify-between items-end shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#5A9E6B]">{language === 'indonesia' ? 'Konteks Kreatif' : 'Creative Context'}</h2>
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setPlatform('youtube')}
                  className={`px-3 py-1 text-[9px] uppercase font-bold tracking-widest rounded-md transition-all ${platform === 'youtube' ? 'bg-[#5A9E6B] text-black shadow-lg shadow-[#5A9E6B]/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  YouTube
                </button>
                <button 
                  onClick={() => setPlatform('tiktok')}
                  className={`px-3 py-1 text-[9px] uppercase font-bold tracking-widest rounded-md transition-all ${platform === 'tiktok' ? 'bg-[#5A9E6B] text-black shadow-lg shadow-[#5A9E6B]/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  TikTok
                </button>
              </div>
            </div>
            <textarea
              className="w-full flex-1 bg-white/[0.02] border border-white/10 rounded-xl p-6 text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5A9E6B]/40 resize-none text-lg leading-relaxed placeholder:text-gray-700 shadow-inner custom-scrollbar overflow-y-auto"
              placeholder={
                activeTab === 'ideaGenerator' 
                  ? (language === 'indonesia' ? "Masukkan topik (contoh: 'Rutinitas pagi', 'Mengatasi Prokrastinasi')" : "Insert topic (e.g., 'Morning routine', 'Overcoming Procrastination')") :
                activeTab === 'scriptWriter' 
                  ? (language === 'indonesia' ? `Masukkan ide video untuk ${platform === 'youtube' ? 'YouTube' : 'TikTok'}...` : `Insert video idea for ${platform === 'youtube' ? 'YouTube' : 'TikTok'}...`) :
                activeTab === 'imagePrompter'
                  ? (language === 'indonesia' ? "Masukkan skrip atau narasi untuk prompt stick-figure simbolis..." : "Insert script or narration for symbolic stick-figure prompts...") :
                (language === 'indonesia' ? "Masukkan skrip atau narasi untuk prompt thumbnail yang menarik..." : "Insert script or narration for high-CTR thumbnail prompts...")
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          
          <button
            disabled={loading || !input.trim()}
            onClick={handleGenerate}
            className="w-full py-4 bg-[#5A9E6B] disabled:bg-gray-800 disabled:text-gray-500 text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#6ab47c] transition-all shadow-[0_0_30px_rgba(90,158,107,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'indonesia' ? 'Mengeksekusi...' : 'Executing...'}
              </>
            ) : (
              language === 'indonesia' ? `BUAT KONTEN ${platform.toUpperCase()}` : `Generate ${platform.toUpperCase()} Content`
            )}
          </button>
        </section>

        {/* Output Section */}
        <section className="p-8 flex flex-col gap-4 relative bg-[#080808] overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              {activeTab === 'imagePrompter' 
                ? (language === 'indonesia' ? 'Stick Figure & Prompt Gerakan' : 'Stick Figure & Motion Prompts') 
                : activeTab === 'thumbnailPrompter'
                ? (language === 'indonesia' ? 'Konsep & Prompt Thumbnail' : 'Thumbnail Concepts & Prompts')
                : (language === 'indonesia' ? 'Hasil Narasi Sinematik' : 'Cinematic Narrative Output')}
            </h2>
            {currentOutput && (
              <button
                onClick={() => handleCopy(currentOutput)}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] uppercase font-bold tracking-tighter transition-all"
              >
                {copiedId === 'main' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedId === 'main' ? (language === 'indonesia' ? 'Disalin' : 'Copied') : (language === 'indonesia' ? 'Salin Semua' : 'Copy All')}
              </button>
            )}
          </div>

          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-8 overflow-y-auto custom-scrollbar relative">
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] rounded-2xl z-20"></div>
            
            <AnimatePresence mode="wait">
              {currentOutput ? (
                <motion.div
                  key={`${activeTab}-${currentOutput.length}`}
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  {activeTab === 'ideaGenerator' 
                    ? renderIdeaList(currentOutput)
                    : (
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-xl font-light leading-relaxed text-gray-400 animate-flicker">
                          {currentOutput}
                        </pre>
                      </div>
                    )
                  }
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 font-mono tracking-tighter text-sm uppercase gap-4 opacity-40">
                  <div className="w-12 h-12 border border-gray-800 rounded-full flex items-center justify-center animate-pulse">
                    <Target className="w-6 h-6" />
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  >
                    {language === 'indonesia' ? 'Mesin Pertumbuhan Idle // Menunggu instruksi_' : 'Growth Engine Idle // Waiting for instructions_'}
                  </motion.span>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Status Footer */}
          <div className="flex items-center gap-3 pt-2 text-[10px] text-gray-600 font-mono shrink-0">
            <span className={`flex h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#5A9E6B] shadow-[0_0_10px_rgba(90,158,107,0.5)]'}`}></span>
            <span className="w-48 transition-all">{loading ? loadingPhrase : (language === 'indonesia' ? 'STATUS INTI: IDLE' : 'CORE STATUS: IDLE')}</span>
            {currentOutput && (
              <>
                <span className="ml-auto uppercase">{language === 'indonesia' ? 'Ukuran' : 'Size'}: {currentOutput.length.toLocaleString()} Chars</span>
                <span>|</span>
                <span className="uppercase">{language === 'indonesia' ? 'Kata' : 'Words'}: {currentOutput.split(/\s+/).filter(Boolean).length}</span>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
