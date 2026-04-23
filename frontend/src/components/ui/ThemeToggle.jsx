import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

const ThemeToggle = () => {
  const { theme, toggleTheme, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-full bg-bg-card hover:bg-bg-subtle border border-border transition-all duration-300 flex items-center justify-center group"
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 overflow-hidden">
        <div 
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            theme === 'dark' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <Sun className="w-4 h-4 text-accent-warning" />
        </div>
        <div 
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          <Moon className="w-4 h-4 text-accent-primary" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
