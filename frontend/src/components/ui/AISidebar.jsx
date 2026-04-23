import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Activity, 
  User as UserIcon, 
  Search,
  MessageSquare,
  ArrowRight,
  TrendingDown,
  Globe
} from 'lucide-react';
import useSimulationStore from '../../store/useSimulationStore';

const AISidebar = () => {
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    sidebarMessages, 
    sendSidebarMessage, 
    isSidebarTyping 
  } = useSimulationStore();

  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isSidebarOpen) {
      scrollToBottom();
    }
  }, [sidebarMessages, isSidebarTyping, isSidebarOpen]);

  const handleSend = () => {
    if (!input.trim() || isSidebarTyping) return;
    sendSidebarMessage(input);
    setInput('');
  };

  const suggestions = [
    "Explain this page",
    "Top 3 impacts",
    "Why did GDP change?",
    "Who is affected most?"
  ];

  if (!isSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bg-main/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={toggleSidebar}
      />

      {/* Sidebar Panel */}
      <aside className="relative w-full max-w-md h-full bg-bg-card/90 border-l border-border backdrop-blur-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-text-primary">Policy Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-positive/75 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-positive"></span>
                </span>
                <span className="text-[8px] font-bold text-accent-positive uppercase tracking-tighter">Engine Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-bg-subtle text-text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {sidebarMessages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center ${m.role === 'user' ? 'bg-accent-primary' : 'bg-accent-positive'}`}>
                  {m.role === 'user' ? <UserIcon size={12} className="text-bg-main" /> : <Activity size={12} className="text-bg-main" />}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  {m.role === 'user' ? 'Inquiry' : 'Synthesis'}
                </p>
              </div>
              
              <div className={`p-4 rounded-2xl text-xs leading-relaxed border shadow-sm max-w-[90%]
                ${m.role === 'user' 
                  ? 'bg-accent-primary/10 border-accent-primary/20 text-text-primary' 
                  : 'bg-bg-subtle/50 border-border text-text-primary italic'
                }`}
              >
                {m.content}
              </div>

            </div>
          ))}
          
          {isSidebarTyping && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-subtle/50 animate-pulse">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-accent-positive rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-accent-positive rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-accent-positive rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Synthesizing...</span>
            </div>
          )}
          
          {/* Dynamic Suggestions for last message */}
          {!isSidebarTyping && sidebarMessages.length > 0 && sidebarMessages[sidebarMessages.length - 1].role === 'assistant' && 
           sidebarMessages[sidebarMessages.length - 1].suggested_questions?.length > 0 && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-[9px] font-black uppercase tracking-widest text-accent-primary flex items-center gap-2 mb-1">
                <Sparkles size={10} /> Deep Dive Suggestions
              </p>
              <div className="flex flex-wrap gap-2 text-left">
                {sidebarMessages[sidebarMessages.length - 1].suggested_questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendSidebarMessage(q)}
                    className="px-3 py-2 rounded-xl bg-accent-primary/5 hover:bg-accent-primary/10 border border-accent-primary/20 text-[10px] font-bold text-accent-primary transition-all text-left max-w-full"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Fallback Static Suggestions (only if no dynamic ones or at start) */}
        {!isSidebarTyping && (sidebarMessages.length === 0 || !sidebarMessages[sidebarMessages.length - 1].suggested_questions?.length) && (
          <div className="px-6 py-4 flex flex-wrap gap-2 pointer-events-auto border-t border-border/50 bg-bg-card/20">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendSidebarMessage(s)}
                className="px-3 py-1.5 rounded-full bg-bg-subtle border border-border text-[10px] font-bold text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-all shadow-sm whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Footer / Input */}
        <footer className="p-6 border-t border-border bg-bg-card/40">
          <div className="relative group">
            <div className="flex items-center bg-bg-subtle rounded-xl overflow-hidden border border-border group-focus-within:border-accent-primary/50 transition-all shadow-inner">
              <Search size={16} className="ml-4 text-text-muted" />
              <textarea
                rows="1"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask your policy coach..."
                className="w-full bg-transparent py-4 px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none min-h-[56px] flex items-center"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSidebarTyping}
                className="mr-2 p-2.5 rounded-lg bg-accent-primary text-bg-main hover:opacity-80 disabled:opacity-30 transition-all active:scale-95 shadow-md"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-[8px] font-black uppercase tracking-widest text-text-muted flex items-center justify-center gap-2">
            <ArrowRight size={8} /> Shift + Enter for multiple lines
          </p>
        </footer>
      </aside>
    </div>
  );
};

export default AISidebar;
