import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import statesData from '../../data/states.json';
import useThemeStore from '../../store/useThemeStore';

// Map backend state names to states.json names if necessary
// (Already handled by normalization in our context logic, but good to have)
const STATE_NAME_MAP = {
  'Andaman & Nicobar Islands': 'Andaman and Nicobar',
  'Dadra & Nagar Haveli': 'Dādra and Nagar Haveli and Damān and Diu',
  'Daman & Diu': 'Dādra and Nagar Haveli and Damān and Diu',
  'Jammu & Kashmir': 'Jammu and Kashmir',
  'Odisha': 'Orissa',
  'Uttarakhand': 'Uttaranchal',
};

const normalizeStateName = (name) => STATE_NAME_MAP[name] || name;

const RegionalImpactMap = ({ regionalData = {} }) => {
  const { theme } = useThemeStore();

  const getStyle = (feature) => {
    const regionName = normalizeStateName(feature.properties.name || feature.properties.st_nm);
    const stateData = regionalData[regionName];
    const delta = stateData?.gdp_delta || 0;

    let fillColor = "var(--bg-card)";
    let fillOpacity = 0.2;

    if (stateData) {
      fillOpacity = 0.7;
      if (delta > 0) {
        // Positive impact colors (Green shades)
        fillColor = delta > 2 ? "#16a34a" : "#4ade80";
      } else if (delta < 0) {
        // Negative impact colors (Red shades)
        fillColor = delta < -2 ? "#dc2626" : "#f87171";
      } else {
        fillColor = "#94a3b8"; // Neutral/Zero
      }
    }

    return {
      fillColor,
      weight: 1,
      opacity: 0.5,
      color: theme === 'dark' ? '#334155' : '#cbd5e1',
      fillOpacity
    };
  };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-border relative bg-bg-card shadow-inner">
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          url={theme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; CARTO'
        />
        {statesData && (
          <GeoJSON
            data={statesData}
            style={getStyle}
            onEachFeature={(feature, layer) => {
              const name = normalizeStateName(feature.properties.name || feature.properties.st_nm);
              const data = regionalData[name];
              const delta = data?.gdp_delta || 0;
              
              layer.bindTooltip(
                `<div class="font-sans p-1">
                  <div class="font-bold text-sm">${name}</div>
                  <div class="text-xs ${delta >= 0 ? 'text-green-500' : 'text-red-500'} font-black">
                    GDP Impact: ${delta > 0 ? '+' : ''}${delta.toFixed(2)}%
                  </div>
                </div>`,
                { sticky: true, className: 'custom-map-tooltip' }
              );
            }}
          />
        )}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-bg-card/90 backdrop-blur-md p-3 rounded-lg border border-border shadow-lg flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">GDP Delta %</p>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className="w-3 h-3 rounded-sm bg-[#dc2626]" /> <span className="text-text-primary">&lt; -2%</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className="w-3 h-3 rounded-sm bg-[#f87171]" /> <span className="text-text-primary">-2% to 0%</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className="w-3 h-3 rounded-sm bg-[#4ade80]" /> <span className="text-text-primary">0% to 2%</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className="w-3 h-3 rounded-sm bg-[#16a34a]" /> <span className="text-text-primary">&gt; 2%</span>
        </div>
      </div>
    </div>
  );
};

export default RegionalImpactMap;
