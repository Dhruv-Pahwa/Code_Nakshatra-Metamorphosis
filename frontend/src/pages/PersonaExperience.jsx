import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
// Note: PersonaCard in components/persona/PersonaCard is a bit different from the inline one in this file originally
// but the inline list uses its own layout. I will maintain the list layout here as it was, but update data source.
import useSimulationStore from '../store/useSimulationStore';
import { Map as MapIcon, MapPin, MessageSquare, Info } from 'lucide-react';
import useThemeStore from '../store/useThemeStore';

// Assuming states.json exists at this path from our copy step
import statesData from '../data/states.json';

const INCOME_GROUPS = ['All', 'Low Income', 'Middle Income', 'High Income'];
const SECTORS = ['All', 'Agriculture', 'Industrial Production', 'Services Output'];
const IMPACT_TYPES = ['All', 'Positive', 'Negative'];

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

const parseSignedNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const numeric = Number.parseFloat(String(value || '').replace(/[^0-9+-.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const inferIncomeGroup = (numericImpact, tag) => {
  const normalizedTag = String(tag || '').toLowerCase();
  if (normalizedTag.includes('top') || numericImpact >= 60000) return 'High Income';
  if (numericImpact >= 0) return 'Middle Income';
  return 'Low Income';
};

const PersonaExperience = () => {
  const navigate = useNavigate();
  const { results, isSimulating, runStatusText, nextStep } = useSimulationStore();
  const { theme } = useThemeStore();

  const personasSection = results?.personas || {};
  const narrative = personasSection?.narrative || {};
  const personaNarrativeDriver = narrative.driverSentences?.[0] || '';
  const personas = useMemo(
    () => (Array.isArray(personasSection.personas) ? personasSection.personas : []),
    [personasSection.personas]
  );
  const confidenceValue = `${results?.analysisSummary?.confidenceInterval || '95'}%`;

  const [filterIncome, setFilterIncome] = useState('All');
  const [filterSector, setFilterSector] = useState('All');
  const [filterImpact, setFilterImpact] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState(null);

  const mockInsightStrip = narrative.summary || `${personasSection.insightTitle || 'Persona-level effects are ready for review.'} ${personasSection.insightImplication || ''}`;

  const basePersonas = useMemo(() => {
    if (personas.length === 0) return [];

    return personas.map((persona, idx) => {
      const numericImpact = parseSignedNumber(persona?.netImpact);
      const meta = persona?.metadata || {};
      
      return {
        id: persona?.id || `persona-${idx + 1}`,
        name: persona?.name || `Persona ${idx + 1}`,
        sector: persona?.sector || 'General',
        incomeGroup: inferIncomeGroup(numericImpact, persona?.tag),
        region: normalizeStateName(meta.state || 'India'),
        netImpact: persona?.netImpact || '+INR 0',
        numericImpact,
        tag: persona?.tag || 'Cohort Profile',
        description: persona?.description || 'Simulation-derived persona profile.',
        explanation: persona?.description || 'This persona summary is generated from distribution and macro solved-state outcomes.',
        confidence: confidenceValue,
        breakdown: persona?.breakdown || {
          taxAdjustments: '+INR 0',
          costOfLiving: '+INR 0',
          rebateCredit: '+INR 0',
        },
        metadata: meta,
      };
    });
  }, [personas, confidenceValue]);

  // Filtering
  const filteredPersonas = useMemo(() => {
    return basePersonas.filter(p => {
      if (filterIncome !== 'All' && p.incomeGroup !== filterIncome) return false;
      if (filterSector !== 'All' && p.sector !== filterSector) return false;
      if (filterImpact === 'Positive' && p.numericImpact < 0) return false;
      if (filterImpact === 'Negative' && p.numericImpact >= 0) return false;
      if (selectedRegion && p.region !== selectedRegion) return false;
      return true;
    });
  }, [basePersonas, filterIncome, filterSector, filterImpact, selectedRegion]);

  // Aggregate regional impacts for the map based on ALL filtered personas (from backend)
  // Since the backend samples 30, we have a diverse set but not all 1080. 
  // Map will highlight regions where we have sampled personas.
  const regionImpacts = useMemo(() => {
    const impacts = {};
    basePersonas.forEach(p => {
      if (!impacts[p.region]) impacts[p.region] = { sum: 0, count: 0 };
      impacts[p.region].sum += p.numericImpact;
      impacts[p.region].count += 1;
    });

    Object.keys(impacts).forEach(r => {
      impacts[r].avg = impacts[r].sum / impacts[r].count;
    });
    return impacts;
  }, [basePersonas]);

  // Leaflet styling function
  const getFeatureStyle = (feature) => {
    const regionName = feature.properties.name;
    const impactData = regionImpacts[regionName];

    let fillColor = "var(--bg-main)"; 
    let fillOpacity = 0.4;

    if (impactData) {
      fillOpacity = 0.7;
      if (impactData.avg >= 0) {
        fillColor = impactData.avg > 15000 ? "#22c55e" : "#4ade80"; 
      } else {
        fillColor = impactData.avg < -10000 ? "#ef4444" : "#f87171"; 
      }
    } else if (Object.keys(regionImpacts).length > 0) {
      fillOpacity = 0.1;
    }

    const isSelected = selectedRegion === regionName;
    const weight = isSelected ? 3 : 1;
    const color = isSelected
      ? (theme === 'dark' ? '#ffffff' : '#000000')
      : (theme === 'dark' ? '#444' : '#ccc');


    return {
      fillColor,
      weight,
      opacity: 1,
      color,
      fillOpacity
    };
  };

  const onEachFeature = (feature, layer) => {
    const regionName = feature.properties.name;

    layer.on({
      click: () => {
        setSelectedRegion(prev => prev === regionName ? null : regionName);
      }
    });
  };

  const handleNextStep = () => {
    nextStep();
    navigate('/causality');
  };

  return (
    <MainLayout>
      <div className="page-enter h-full flex flex-col">
        {/* Top Strip */}
        <div className="bg-bg-sidebar border-b border-border px-8 py-4 shrink-0 flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-3">
            <MapIcon size={20} className="text-text-muted" />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-0.5">Regional Insight Context</p>
              <h2 className="text-sm font-semibold text-text-primary leading-tight max-w-4xl">{mockInsightStrip}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSimulating && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-accent-positive uppercase tracking-widest">Processing Data</span>
                <p className="text-xs text-text-secondary">Mapping {basePersonas.length} personas...</p>
              </div>
            )}

            <button
              onClick={() => navigate('/persona-chat')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary text-bg-main text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-all shadow-sm"
            >
              <MessageSquare size={12} /> Immersive Explorer
            </button>
          </div>
        </div>

        {/* Workspace Columns */}
        <div className="flex-1 flex overflow-hidden mb-2">

          {/* Left: Filters */}
          <aside className="w-64 bg-bg-card border-r border-border p-6 overflow-y-auto shrink-0 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold tracking-widest uppercase text-xs text-text-primary">Regional Filters</h3>
              {(selectedRegion || filterIncome !== 'All' || filterSector !== 'All' || filterImpact !== 'All') && (
                <button
                  onClick={() => { setFilterIncome('All'); setFilterSector('All'); setFilterImpact('All'); setSelectedRegion(null); }}
                  className="text-[10px] text-accent-negative hover:underline font-bold uppercase transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            <div>
              <p className="label mb-2">INCOME GROUP</p>
              <select value={filterIncome} onChange={e => setFilterIncome(e.target.value)} className="w-full bg-bg-main border border-border text-xs rounded p-2 text-text-secondary focus:ring-1 focus:ring-accent-primary outline-none">
                {INCOME_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <p className="label mb-2">SECTOR</p>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="w-full bg-bg-main border border-border text-xs rounded p-2 text-text-secondary focus:ring-1 focus:ring-accent-primary outline-none">
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <p className="label mb-2">IMPACT DIRECTION</p>
              <select value={filterImpact} onChange={e => setFilterImpact(e.target.value)} className="w-full bg-bg-main border border-border text-xs rounded p-2 text-text-secondary focus:ring-1 focus:ring-accent-primary outline-none">
                {IMPACT_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="label mb-3">IMPACT SCALE (INR)</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#22c55e] shrink-0" />
                  <span className="text-xs font-semibold text-text-secondary">Beneficiary (&gt;15k)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#4ade80] opacity-80 shrink-0" />
                  <span className="text-xs font-semibold text-text-secondary">Stable / Light Gain</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#f87171] opacity-80 shrink-0" />
                  <span className="text-xs font-semibold text-text-secondary">Minor Loss</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#ef4444] shrink-0" />
                  <span className="text-xs font-semibold text-text-secondary">At Risk (&lt;-10k)</span>
                </div>
              </div>
            </div>
            
            <div className="mt-auto bg-bg-subtle border border-border rounded p-4">
               <div className="flex items-start gap-2">
                 <Info size={14} className="text-accent-primary shrink-0 mt-0.5" />
                 <p className="text-[10px] text-text-secondary leading-tight italic">
                   Showing {personas.length} representative personas mapped from a total catalog of 1,080 profiles.
                 </p>
               </div>
            </div>
          </aside>

          {/* Center: Map */}
          <main className="flex-1 relative bg-bg-main border-r border-border z-0">
            <MapContainer
              center={[22.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%', backgroundColor: 'var(--bg-main)' }}
              zoomControl={false}
            >
              <TileLayer
                url={theme === 'dark'
                  ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                }
                attribution='&copy; CARTO'
              />

              {statesData && (
                <GeoJSON
                  data={statesData}
                  style={getFeatureStyle}
                  onEachFeature={onEachFeature}
                />
              )}
            </MapContainer>

            {/* Map overlay controls */}
            <div className="absolute top-4 left-4 z-[400] bg-bg-card border border-border rounded-lg shadow-lg px-4 py-3 min-w-[200px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Active Viewport</p>
              <p className="text-sm font-semibold text-text-primary">
                {selectedRegion ? selectedRegion : 'National (Sampled)'}
              </p>
              {selectedRegion && regionImpacts[selectedRegion] && (
                <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                   <span className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Avg Impact</span>
                   <span className={`text-xs font-bold ${regionImpacts[selectedRegion].avg >= 0 ? 'text-accent-positive' : 'text-accent-negative'}`}>
                      INR {Math.round(regionImpacts[selectedRegion].avg).toLocaleString()}
                   </span>
                </div>
              )}
            </div>
          </main>

          {/* Right: Persona Results Panel */}
          <aside className="w-96 bg-bg-sidebar p-6 overflow-y-auto shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold tracking-widest uppercase text-xs text-text-primary">Representative Cohorts</h3>
              <span className="text-[10px] bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-muted font-bold">
                {filteredPersonas.length} MATCHES
              </span>
            </div>

            {filteredPersonas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 opacity-60">
                <MapPin size={24} className="text-text-muted mb-3" />
                <p className="text-sm text-text-secondary font-medium">No personas matched.</p>
                <p className="text-xs text-text-muted mt-2">Adjust filters or select a different state on the map.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredPersonas.map((persona) => {
                  const isPositive = persona.numericImpact >= 0;
                  return (
                    <div key={persona.id} className="bg-bg-card border border-border rounded-lg p-5 shadow-sm relative overflow-hidden group hover:border-text-muted transition-all duration-200 hover:shadow-md">
                      {/* Region Tag */}
                      <div className="absolute top-0 right-0 bg-bg-subtle border-b border-l border-border px-2.5 py-1 rounded-bl-lg">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{persona.metadata.state || 'India'}</p>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">{persona.name}</h4>
                        <p className="text-[10px] text-text-secondary font-medium mt-0.5 line-clamp-1">
                          {persona.metadata.occupation} · <span className="text-text-muted">{persona.metadata.zone}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between py-2.5 border-y border-border border-dashed mb-4 bg-bg-subtle/30 px-2 -mx-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Net Annual Impact</span>
                        <span className={`text-base font-bold tabular-nums ${isPositive ? 'text-accent-positive' : 'text-accent-negative'}`}>
                          {persona.netImpact}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {Object.entries(persona.breakdown).map(([key, value]) => (
                          <div key={key} className="border border-border bg-bg-main/50 rounded p-2">
                            <p className="text-[8px] font-bold text-text-muted uppercase tracking-tighter mb-0.5">{key.replace(/[A-Z]/g, ' $&')}</p>
                            <p className="text-[10px] font-bold text-text-primary truncate">{String(value).split(' /')[0]}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3 mb-1">
                        "{persona.explanation}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-border mt-auto">
              <Button variant="primary" onClick={handleNextStep} className="w-full justify-center py-3 text-xs tracking-widest font-black uppercase">
                Proceed to Causal Explorer
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
};

export default PersonaExperience;
