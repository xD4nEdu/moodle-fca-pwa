import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a Theme context
export const ThemeContext = createContext({
  darkMode: true,
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true);

  // Sync with localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const nextMode = !prev;
      if (nextMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return nextMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <div className="min-h-screen transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-fca-dark dark:text-slate-200">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
