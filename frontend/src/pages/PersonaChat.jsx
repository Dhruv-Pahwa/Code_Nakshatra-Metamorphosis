import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Send,
  Map as MapIcon,
  Users,
  ChevronLeft,
  MessageSquare,
  Activity,
  User as UserIcon,
  Search,
  ArrowRight,
  Maximize2,
  X
} from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import useThemeStore from '../store/useThemeStore';
import statesData from '../data/states.json';
import ThemeToggle from '../components/ui/ThemeToggle';

// Map persona dataset state names to states.json names
const STATE_NAME_MAP = {
  'Andaman & Nicobar Islands': 'Andaman and Nicobar',
  'Dadra & Nagar Haveli': 'Dādra and Nagar Haveli and Damān and Diu',
  'Daman & Diu': 'Dādra and Nagar Haveli and Damān and Diu',
  'Jammu & Kashmir': 'Jammu and Kashmir',
  'Odisha': 'Orissa',
  'Uttarakhand': 'Uttaranchal',
};

const normalizeStateName = (name) => STATE_NAME_MAP[name] || name;

const PersonaChat = () => {
  const navigate = useNavigate();
  const { results, isSimulating } = useSimulationStore();
  const { theme, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "I can answer specific questions about policy impacts on our diverse personas across all 36 states and UTs."
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeComparison, setActiveComparison] = useState(null); // { [state]: { score, label } }
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [tableSort, setTableSort] = useState({ key: 'score', dir: 'desc' });

  const chatEndRef = useRef(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const citationSnippets = useMemo(() => {
    const sections = [results?.macro, results?.distribution, results?.personas, results?.causal, results?.policyLab];
    return sections
      .flatMap((section) => section?.narrative?.sourceSnippets || [])
      .filter(Boolean)
      .slice(0, 5);
  }, [results]);

  const regionImpacts = useMemo(() => {
    if (!results?.personas?.personas) return {};
    const impacts = {};
    results.personas.personas.forEach(p => {
      const region = normalizeStateName(p.metadata?.state || p.region);
      if (!region) return;

      const numericVal = parseInt(String(p.netImpact).replace(/[^0-9.-]/g, '')) || 0;

      if (!impacts[region]) impacts[region] = { sum: 0, count: 0 };
      impacts[region].sum += numericVal;
      impacts[region].count += 1;
    });

    Object.keys(impacts).forEach(r => {
      impacts[r].avg = impacts[r].sum / impacts[r].count;
    });

    return impacts;
  }, [results]);

  const getFeatureStyle = (feature) => {
    const regionName = feature.properties.name;
    const impactData = regionImpacts[regionName];
    let fillColor = "var(--bg-main)";
    let fillOpacity = 0.2;

    // Use active comparison data if present
    if (activeComparison && activeComparison[regionName]) {
      const { score } = activeComparison[regionName];
      fillOpacity = 0.8;
      if (score >= 0) {
        fillColor = score > 50 ? "#22c55e" : "#4ade80";
      } else {
        fillColor = score < -50 ? "#ef4444" : "#f87171";
      }
    } else if (impactData) {
      // Fallback to baseline simulation impact
      fillOpacity = 0.6;
      if (impactData.avg >= 0) {
        fillColor = impactData.avg > 15000 ? "#22c55e" : "#4ade80";
      } else {
        fillColor = impactData.avg < -10000 ? "#ef4444" : "#f87171";
      }
    }
    const isSelected = selectedRegion === regionName;
    return {
      fillColor,
      weight: isSelected ? 2 : 1.5,
      opacity: isSelected ? 1 : 0.8,
      color: isSelected ? (theme === 'dark' ? '#ffffff' : '#000000') : (theme === 'dark' ? '#555' : '#aaa'),
      fillOpacity
    };
  };

  const handleSend = async (customQuery) => {
    const queryToSend = customQuery || input;
    if (!queryToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: queryToSend }]);
    if (!customQuery) setInput('');
    setIsTyping(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/persona/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSend,
          context: results || {},
          selectedRegion: selectedRegion
        })
      });
      const data = await response.json();

      // Store the structured data from the 'response' wrapper
      const responseData = data.response || {};
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseData.summary || "Here are the persona perspectives on your query:",
        opinions: responseData.opinions || []
      }]);

      if (responseData.regional_comparison) {
        setActiveComparison(responseData.regional_comparison);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble connecting to the insights engine." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const sampleQuestions = [
    "How does the corporate tax cut affect tech workers in Bengaluru?",
    "Will agricultural trade reform hurt small farm owners?",
    "What is the net impact on low-income urban laborers in Delhi?"
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg-main font-sans text-text-primary">
      {/* BACKGROUND MAP */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: 'var(--bg-main)' }}
          zoomControl={false}
        >
          <TileLayer
            className="india-spotlight-tiles"
            url={theme === 'dark'
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; CARTO'
          />
          {statesData && (
            <GeoJSON
              data={statesData}
              style={getFeatureStyle}
              onEachFeature={(feature, layer) => {
                layer.on('click', () => {
                  const name = feature.properties.name || feature.properties.st_nm;
                  setSelectedRegion(prev => prev === name ? null : name);
                });
              }}
            />
          )}
        </MapContainer>
        <div className="absolute inset-0 bg-bg-main/20 pointer-events-none" />
      </div>

      {/* TOP HEADER */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-6 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => navigate('/personas')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card/80 border border-border backdrop-blur-md text-xs font-bold hover:bg-bg-subtle transition-colors shadow-lg text-text-primary"
          >
            <ChevronLeft size={14} /> DASHBOARD
          </button>
          <div className="h-6 w-px bg-border/50" />
          <h1 className="bg-bg-card/80 px-4 py-1.5 rounded-full border border-border backdrop-blur-md text-sm font-black tracking-widest text-text-primary shadow-lg">
            ASK OUR PERSONAS <span className="text-accent-positive italic ml-1">BETA</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-bg-card/80 px-4 py-1.5 rounded-full border border-border backdrop-blur-md shadow-lg flex items-center gap-3">
            <span className="text-[10px] font-bold text-accent-positive uppercase tracking-widest flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-positive/75 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-positive"></span>
              </span>
              {isSimulating ? 'Refreshing' : 'Engine Online'}
            </span>
          </div>
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* LEFT PANEL: AUDIENCE / CONTEXT */}
      <aside className="absolute left-8 top-32 bottom-32 w-80 z-20 flex flex-col pointer-events-none">
        <div className="flex-1 rounded-2xl bg-bg-card/60 border border-border backdrop-blur-xl p-6 shadow-2xl overflow-y-auto pointer-events-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-accent-positive">
              <Activity size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Audience</h3>
            </div>
            {selectedRegion && (
              <button onClick={() => setSelectedRegion(null)} className="text-[9px] font-black text-rose-400 uppercase tracking-widest hover:underline">Clear Map</button>
            )}
          </div>

          <div className="space-y-8">
            <section>
              <div className="p-4 rounded-xl bg-bg-subtle border border-border">
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Selection</p>
                <p className="text-sm font-bold text-text-primary mb-2">{selectedRegion || 'National Coverage'}</p>
                <div className="h-1 w-full bg-bg-main rounded-full overflow-hidden">
                  <div className="h-full bg-accent-positive rounded-full" style={{ width: selectedRegion ? '100%' : '40%' }} />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4 text-text-primary">Baseline Indicators</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-bg-subtle border border-border">
                  <p className="text-[9px] font-bold text-text-secondary uppercase">GDP Delta</p>
                  <p className="text-lg font-black text-accent-positive">+{results?.macro?.sectors?.find(s => s.name === 'Total GDP')?.value || '2.4'}%</p>
                </div>
                <div className="p-3 rounded-xl bg-bg-subtle border border-border">
                  <p className="text-[9px] font-bold text-text-secondary uppercase">Gini Improv.</p>
                  <p className="text-lg font-black text-accent-negative">{results?.distribution?.giniDelta || '-0.012'}</p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-4">Representative Agents</p>
              <div className="space-y-3">
                {results?.personas?.personas.slice(0, 4).map((p, pIdx) => (
                  <div key={`${p.id}-${pIdx}`} className="flex items-center gap-3 p-3 rounded-xl bg-bg-subtle border border-border hover:bg-bg-subtle/80 transition-all cursor-default group">
                    <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center text-text-muted group-hover:bg-accent-positive/20 group-hover:text-accent-positive transition-colors">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{p.name}</p>
                      <p className="text-[9px] text-text-muted uppercase font-mono">{p.sector}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Regional Comparison</p>
                <div className="flex items-center gap-2">
                  {activeComparison && (
                    <button
                      onClick={() => setIsComparisonModalOpen(true)}
                      className="text-[8px] font-black text-accent-primary uppercase tracking-tighter hover:underline flex items-center gap-1"
                    >
                      <Maximize2 size={8} /> Expand analysis
                    </button>
                  )}
                  {activeComparison && (
                    <button
                      onClick={() => setActiveComparison(null)}
                      className="text-[8px] font-black text-rose-400 uppercase tracking-tighter hover:underline"
                    >
                      Reset Map
                    </button>
                  )}
                </div>
              </div>

              {!activeComparison ? (
                <div className="p-4 rounded-xl bg-bg-subtle/30 border border-dashed border-border text-center">
                  <p className="text-[10px] text-text-muted italic leading-relaxed">Ask a question to see comparative state insights visualized on the map.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(activeComparison)
                    .sort((a, b) => b[1].score - a[1].score)
                    .map(([state, data], idx) => (
                      <div key={state} className="flex items-center justify-between p-2 rounded-lg bg-bg-subtle border border-border/50 transition-all hover:border-accent-positive/30">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-text-muted">{idx + 1}</span>
                          <span className="text-[10px] font-bold text-text-primary truncate max-w-[100px]">{state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${data.score >= 0 ? 'bg-accent-positive/10 text-accent-positive' : 'bg-accent-negative/10 text-accent-negative'}`}>
                            {data.label}
                          </span>
                          <span className="text-[10px] font-bold text-text-primary w-8 text-right">{data.score > 0 ? '+' : ''}{data.score}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL: RESULTS / INSIGHTS */}
      <aside className="absolute right-8 top-32 bottom-32 w-96 z-20 flex flex-col pointer-events-none">
        <div className="flex-1 rounded-2xl bg-bg-card/60 border border-border backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden pointer-events-auto">
          <div className="p-6 border-b border-border/50 flex items-center justify-between bg-bg-card/40">
            <div className="flex items-center gap-2 text-accent-positive">
              <MessageSquare size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Insights</h3>
            </div>
            {selectedRegion && (
              <span className="text-[9px] bg-accent-positive/20 text-accent-positive px-2 py-1 rounded font-black tracking-widest uppercase">
                {selectedRegion}
              </span>
            )}
          </div>

          <div className="px-6 py-3 border-b border-border/50 bg-bg-subtle/50">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Grounding</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Answers must use computed simulation data only. Citation snippets: {citationSnippets.slice(0, 2).join(' | ') || 'Run a simulation to populate citations.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {messages.map((m, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                {/* User Message */}
                {m.role === 'user' && (
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-accent-primary">
                        <UserIcon size={10} className="text-bg-main" />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-primary text-right">
                        My Inquiry
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl text-xs leading-relaxed bg-accent-primary/10 border border-border text-text-primary max-w-[80%]">
                      {m.content}
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {m.role === 'assistant' && (
                  <div className="flex flex-col gap-4">
                    {/* Summary Bubble */}
                    <div className="flex flex-col gap-2 items-start max-w-[90%]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-accent-positive">
                          <Activity size={10} className="text-bg-main" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-primary">
                          Engine Synthesis
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl text-xs leading-relaxed bg-bg-subtle/50 border border-border text-text-primary italic">
                        {m.content}
                      </div>
                    </div>

                    {/* Opinion Cards */}
                    {m.opinions && m.opinions.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 ml-6">
                        {m.opinions.map((op, opIdx) => (
                          <div key={opIdx} className="group relative bg-bg-card/40 border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent-positive/30 transition-all duration-300 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                            {/* Header with Badges */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 pr-2">
                                <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wider mb-0.5">
                                  {op.name}
                                </h4>
                                <p className="text-[10px] text-text-secondary">
                                  {op.age} • {op.location}
                                </p>
                                <p className="text-[10px] text-accent-primary font-bold mt-0.5">{op.occupation}</p>
                              </div>
                              <div className="flex flex-col gap-1.5 items-end">
                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${op.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                                    op.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400' :
                                      'bg-amber-500/20 text-amber-400'
                                  }`}>
                                  {op.sentiment}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-text-primary leading-relaxed mb-4 font-medium italic group-hover:text-text-primary transition-colors">
                              "{op.opinion}"
                            </p>

                            <div className="mt-3 pt-3 border-t border-border/30 flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-accent-positive mt-1.5 shrink-0" />
                                <p className="text-[10px] text-text-muted italic leading-tight flex-1">
                                  {op.data_grounding}
                                </p>
                              </div>
                              {op.confidence !== undefined && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[8px] font-black uppercase text-text-secondary tracking-wider">Confidence</span>
                                  <div className="flex-1 max-w-[120px] h-1.5 bg-bg-main rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${op.confidence >= 0.7 ? 'bg-accent-positive' :
                                          op.confidence >= 0.4 ? 'bg-amber-400' :
                                            'bg-rose-400'
                                        }`}
                                      style={{ width: `${op.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] font-bold text-text-secondary min-w-[32px]">{(op.confidence * 100).toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-subtle/50 animate-pulse">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-accent-positive rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-accent-positive rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-accent-positive rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Analyzing Cohorts...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </aside>

      {/* BOTTOM CENTER: FLOATING CHAT BAR */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-30 px-4">
        {/* Sample Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-4 pointer-events-none">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="pointer-events-auto px-4 py-2 rounded-full bg-bg-card/80 border border-border backdrop-blur-md text-[10px] font-bold text-text-secondary hover:text-text-primary hover:border-accent-positive/50 transition-all shadow-xl whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="relative group p-1 rounded-2xl bg-gradient-to-r from-accent-positive/20 to-accent-primary/20 backdrop-blur-2xl shadow-2xl">
          <div className="relative flex items-center bg-bg-card/90 rounded-xl overflow-hidden border border-border group-focus-within:border-accent-positive/50 transition-all">
            <Search size={18} className="ml-4 text-text-secondary" />
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
              placeholder={selectedRegion ? `Analyze policy impact in ${selectedRegion}...` : "Ex: What is the impact on tech sectors?"}
              className="w-full bg-transparent py-4 px-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none resize-none min-h-[56px] flex items-center"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="mr-2 p-3 rounded-lg bg-accent-positive text-bg-main hover:opacity-80 disabled:opacity-30 transition-all active:scale-95 shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-secondary">
          <span className="flex items-center gap-1"><ArrowRight size={10} /> Shift + Enter for multiple lines</span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span className="flex items-center gap-1 text-accent-positive/80"><Activity size={10} /> Grounded in model baseline</span>
        </div>
      </div>

      {/* FLOATING MAP TOOLS */}
      <div className="absolute top-32 right-[calc(2rem+24rem+1rem)] z-20 flex flex-col gap-2">
        <div className="p-2 rounded-xl bg-bg-card/80 border border-border backdrop-blur-md flex flex-col gap-2 shadow-2xl">
          <button className="p-2 rounded-lg bg-bg-subtle hover:bg-bg-subtle/80 text-text-muted hover:text-accent-negative transition-colors" title="Heatmap Toggle"><Activity size={18} /></button>
          <button className="p-2 rounded-lg bg-bg-subtle hover:bg-bg-subtle/80 text-text-muted hover:text-accent-positive transition-colors" title="Export View"><MapIcon size={18} /></button>
        </div>
      </div>

      {/* REGIONAL COMPARISON MODAL */}
      {isComparisonModalOpen && activeComparison && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-12 bg-bg-main/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl h-full max-h-[80vh] bg-bg-card/80 border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
            {/* Modal Header */}
            <div className="p-8 border-b border-border/50 flex items-center justify-between bg-bg-card/40">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-text-primary mb-1">Regional Impact Comparison</h2>
                <p className="text-xs text-text-muted font-medium">Explicit delta analysis across all sampled states and UTs based on current simulation context.</p>
              </div>
              <button
                onClick={() => setIsComparisonModalOpen(false)}
                className="p-3 rounded-xl bg-bg-subtle hover:bg-rose-500/20 text-text-muted hover:text-rose-500 transition-all shadow-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <th className="px-6 py-2 cursor-pointer hover:text-accent-positive" onClick={() => setTableSort({ key: 'rank', dir: tableSort.dir === 'asc' ? 'desc' : 'asc' })}>Rank</th>
                    <th className="px-6 py-2 cursor-pointer hover:text-accent-positive" onClick={() => setTableSort({ key: 'state', dir: tableSort.dir === 'asc' ? 'desc' : 'asc' })}>State / Union Territory</th>
                    <th className="px-6 py-2 text-right cursor-pointer hover:text-accent-positive" onClick={() => setTableSort({ key: 'score', dir: tableSort.dir === 'asc' ? 'desc' : 'asc' })}>Delta Impact (Score)</th>
                    <th className="px-6 py-2 text-center">Sentiment Label</th>
                    <th className="px-6 py-2 text-right">Confidence Intensity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(activeComparison)
                    .sort((a, b) => {
                      if (tableSort.key === 'score') return tableSort.dir === 'asc' ? a[1].score - b[1].score : b[1].score - a[1].score;
                      if (tableSort.key === 'state') return tableSort.dir === 'asc' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
                      return 0;
                    })
                    .map(([state, data], idx) => (
                      <tr key={state} className="group hover:scale-[1.005] transition-transform duration-200">
                        <td className="px-6 py-4 bg-bg-subtle/50 first:rounded-l-2xl border-l border-y border-border/40 text-xs font-mono font-bold text-text-muted">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="px-6 py-4 bg-bg-subtle/50 border-y border-border/40">
                          <p className="text-sm font-black text-text-primary tracking-tight">{state}</p>
                        </td>
                        <td className="px-6 py-4 bg-bg-subtle/50 border-y border-border/40 text-right font-black text-lg">
                          <span className={data.score >= 0 ? 'text-accent-positive' : 'text-accent-negative'}>
                            {data.score > 0 ? '+' : ''}{data.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 bg-bg-subtle/50 border-y border-border/40 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${data.score >= 50 ? 'bg-accent-positive text-bg-main' :
                              data.score > 0 ? 'bg-accent-positive/20 text-accent-positive border border-accent-positive/30' :
                                data.score > -50 ? 'bg-accent-negative/20 text-accent-negative border border-accent-negative/30' :
                                  'bg-accent-negative text-bg-main'
                            }`}>
                            {data.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 bg-bg-subtle/50 last:rounded-r-2xl border-r border-y border-border/40 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-1.5 bg-bg-main rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${data.score >= 0 ? 'bg-accent-positive' : 'bg-accent-negative'}`}
                                style={{ width: `${Math.abs(data.score)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-text-muted">Intensity {Math.abs(data.score)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border/50 bg-bg-card/40 flex justify-end gap-3">
              <button
                onClick={() => setIsComparisonModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-bg-subtle border border-border text-xs font-black uppercase tracking-widest hover:bg-bg-card transition-all"
              >
                Back to Dashboard
              </button>
              <button
                className="px-6 py-2.5 rounded-xl bg-accent-positive text-bg-main text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all"
              >
                Export PDF Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaChat;
