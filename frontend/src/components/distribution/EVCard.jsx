import Card from '../ui/Card';

const parseSignedNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const numeric = Number.parseFloat(String(value || '').replace(/[^0-9+-.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const EVCard = ({ item = {} }) => {
  const numeric = parseSignedNumber(item?.rawValue ?? item?.value);
  const tone = numeric > 0 ? 'text-accent-positive' : numeric < 0 ? 'text-accent-negative' : 'text-text-muted';

  return (
    <Card className="bg-bg-card p-4">
      <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-2">
        {item?.household || 'Household'}
      </p>
      <p className={`text-xl font-bold ${tone}`}>{item?.value || 'INR 0 / yr'}</p>
      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
        Amount this group would need to maintain pre-policy welfare under the solved scenario.
      </p>
    </Card>
  );
};

export default EVCard;
