import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  Zap, 
  ArrowRight, 
  Globe, 
  Cpu, 
  Users 
} from 'lucide-react';
import heroImage from '../assets/landing_hero.png';
import ThemeToggle from '../components/ui/ThemeToggle';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-main text-text-primary overflow-x-hidden selection:bg-accent-primary/30">
      {/* FLOATING THEME TOGGLE */}
      <div className="fixed top-8 right-8 z-50 animate-in fade-in duration-1000">
        <ThemeToggle />
      </div>

      {/* IMMERSIVE HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-main/60 via-transparent to-bg-main/60" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 container mx-auto px-6 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-card/50 border border-border/50 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-positive/75 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-positive"></span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted">CGE Strategic Engine v2.4</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            THE STRATEGIC EDGE OF<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-text-secondary to-text-primary opacity-90 inline-block pb-4">
              ECONOMIC INTELLIGENCE
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-text-secondary leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            A high-fidelity platform for deterministic policy modeling, 
            persona-led distributional analysis, and real-time macro trajectories. 
            Ground your decisions in rigorous data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <button 
              onClick={() => navigate('/policy')}
              className="group relative px-8 py-4 bg-text-primary text-bg-main rounded-full font-bold text-sm tracking-widest uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent-primary/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                Enter Command Center <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-positive opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
            
            <button className="px-8 py-4 bg-bg-card/40 border border-border backdrop-blur-md rounded-full font-bold text-sm tracking-widest uppercase text-text-primary hover:bg-bg-card/60 transition-all">
              Documentation
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <div className="w-0.5 h-12 bg-gradient-to-b from-text-primary to-transparent" />
        </div>
      </section>

      {/* STRATEGIC PILLARS SECTION */}
      <section className="py-32 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Pillar 1 */}
          <div className="group p-8 rounded-3xl bg-bg-card/30 border border-border hover:border-accent-positive/40 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-bg-card flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-positive/10 transition-all">
              <Cpu className="text-accent-positive" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight">Precision Solvers</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Proprietary CGE algorithms mapping hundreds of inter-state variables with zero-drift convergence.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="group p-8 rounded-3xl bg-bg-card/30 border border-border hover:border-accent-primary/40 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-bg-card flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-primary/10 transition-all">
              <Users className="text-accent-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight">Persona Empathy</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Validate macro strategies against our library of 1,000+ localized persona cohorts for true equity.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="group p-8 rounded-3xl bg-bg-card/30 border border-border hover:border-accent-warning/40 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-bg-card flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-warning/10 transition-all">
              <Activity className="text-accent-warning" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight">Causal Foresight</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Real-time causal graph inference predicting the ripple effects of tax, subsidy, and trade pivots.
            </p>
          </div>
        </div>
      </section>

      {/* MINI FOOTER */}
      <footer className="py-12 border-t border-border/50 text-center">
        <div className="flex items-center justify-center gap-8 mb-6">
          <Shield size={20} className="text-text-muted opacity-40" />
          <Zap size={20} className="text-text-muted opacity-40" />
          <Globe size={20} className="text-text-muted opacity-40" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-bold">
          Analytical Archive &copy; 2026 • Sovereign Strategic Node
        </p>
      </footer>
    </div>
  );
};

export default Landing;
