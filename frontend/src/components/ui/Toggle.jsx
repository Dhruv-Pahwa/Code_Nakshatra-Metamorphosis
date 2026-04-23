const Toggle = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-3">
    {label && <span className="label">{label}</span>}
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
        ${checked ? 'bg-text-primary' : 'bg-border-strong'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-bg-main transition-transform shadow-sm
          ${checked ? 'translate-x-4' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

export default Toggle;
