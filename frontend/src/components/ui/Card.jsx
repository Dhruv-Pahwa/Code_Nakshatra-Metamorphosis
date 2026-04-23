// Card — clean bordered container
const Card = ({ children, className = '', padding = 'p-6', hover = false }) => (
  <div
    className={`card ${padding} ${hover ? 'hover:border-border-strong transition-colors cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

export default Card;
