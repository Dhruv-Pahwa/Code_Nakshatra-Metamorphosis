// SectionContainer — max-width section wrapper
const SectionContainer = ({ children, className = '' }) => (
  <div className={`w-full px-8 py-6 ${className}`}>
    {children}
  </div>
);

export default SectionContainer;
