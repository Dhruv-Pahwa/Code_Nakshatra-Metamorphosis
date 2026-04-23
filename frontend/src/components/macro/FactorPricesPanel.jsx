import Card from '../ui/Card';

const parseSignedNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const numeric = Number.parseFloat(String(value || '').replace(/[^0-9+-.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const toneClass = (value) => {
  const numeric = parseSignedNumber(value);
  if (numeric > 0) return 'text-accent-positive';
  if (numeric < 0) return 'text-accent-negative';
  return 'text-text-muted';
};

const FactorPricesPanel = ({ factorPrices = {}, solverStatus = '' }) => {
  const wages = Array.isArray(factorPrices?.wages) ? factorPrices.wages : [];

  return (
    <Card className="bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">Factor Prices</p>
        <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded border border-border bg-bg-main text-text-secondary">
          {solverStatus || 'Unknown'}
        </span>
      </div>

      <div className="space-y-3">
        {wages.map((item, idx) => (
          <div key={`${item?.label || 'wage'}-${idx}`} className="flex justify-between items-center py-2 border-b border-border border-dashed last:border-0">
            <span className="text-sm font-medium text-text-primary">{item?.label || `Wage ${idx + 1}`}</span>
            <span className={`text-sm font-bold ${toneClass(item?.value)}`}>{item?.value || '0.0%'}</span>
          </div>
        ))}

        <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
          <span className="text-sm font-medium text-text-primary">Capital Rental Rate</span>
          <span className={`text-sm font-bold ${toneClass(factorPrices?.rentalRate)}`}>{factorPrices?.rentalRate || '0.0%'}</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-text-primary">Land Rent</span>
          <span className={`text-sm font-bold ${toneClass(factorPrices?.landRent)}`}>{factorPrices?.landRent || '0.0%'}</span>
        </div>
      </div>
    </Card>
  );
};

export default FactorPricesPanel;
