import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PolicyStudio from './pages/PolicyStudio';
import MacroImpact from './pages/MacroImpact';
import DistributionImpact from './pages/DistributionImpact';
import PersonaExperience from './pages/PersonaExperience';
import PersonaChat from './pages/PersonaChat';
import CausalExplorer from './pages/CausalExplorer';
import PolicyLab from './pages/PolicyLab';
import ScenarioComparison from './pages/ScenarioComparison';
import Landing from './pages/Landing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/policy" element={<PolicyStudio />} />
        <Route path="/macro" element={<MacroImpact />} />
        <Route path="/distribution" element={<DistributionImpact />} />
        <Route path="/personas" element={<PersonaExperience />} />
        <Route path="/persona-chat" element={<PersonaChat />} />
        <Route path="/causality" element={<CausalExplorer />} />
        <Route path="/policy-lab" element={<PolicyLab />} />
        <Route path="/compare" element={<ScenarioComparison />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
