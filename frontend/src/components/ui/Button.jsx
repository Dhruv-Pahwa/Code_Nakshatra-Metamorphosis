const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false, type = 'button' }) => {
  const base = 'inline-flex items-center justify-center transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost: 'text-xs font-semibold tracking-widest uppercase text-text-secondary hover:text-text-primary px-4 py-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
