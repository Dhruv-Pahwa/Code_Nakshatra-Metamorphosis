import Card from '../ui/Card';

const parseSignedNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const numeric = Number.parseFloat(String(value || '').replace(/[^0-9+-.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const parts = [
  { key: 'wages', label: 'Wages' },
  { key: 'capital', label: 'Capital' },
  { key: 'land', label: 'Land' },
  { key: 'transfers', label: 'Transfers' },
];

const IncomeWaterfall = ({ rows = [] }) => {
  const maxAbs = Math.max(
    1,
    ...rows.flatMap((row) => parts.map((part) => Math.abs(parseSignedNumber(row?.[part.key]))))
  );

  return (
    <Card className="bg-bg-card p-5">
      <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Income Decomposition</p>
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row?.household || Math.random()}>
            <p className="text-sm font-semibold text-text-primary mb-2">{row?.household || 'Household'}</p>
            <div className="space-y-2">
              {parts.map((part) => {
                const value = parseSignedNumber(row?.[part.key]);
                const width = `${Math.max(8, (Math.abs(value) / maxAbs) * 100)}%`;
                const tone = value >= 0 ? 'bg-accent-positive/30 border-accent-positive/40 text-accent-positive' : 'bg-accent-negative/20 border-accent-negative/40 text-accent-negative';
                return (
                  <div key={part.key} className="grid grid-cols-[100px_1fr_70px] gap-3 items-center">
                    <span className="text-xs font-bold tracking-wide uppercase text-text-secondary">{part.label}</span>
                    <div className="h-8 rounded border border-border bg-bg-main overflow-hidden">
                      <div className={`h-full rounded border-r ${tone}`} style={{ width }} />
                    </div>
                    <span className={`text-sm font-bold text-right ${value >= 0 ? 'text-accent-positive' : 'text-accent-negative'}`}>
                      {value >= 0 ? '+' : ''}{value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default IncomeWaterfall;
