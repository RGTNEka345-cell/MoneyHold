
import React, { createContext, useContext, useState } from 'react';
import './ThemeToggle.css';

const ThemeContext = createContext(null);
const storageKey = 'moneyHoldSellerTheme';

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem(storageKey, next); } catch { /* Theme still works when storage is unavailable. */ }
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>
    <div className="seller-theme" data-theme={theme}>{children}</div>
  </ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
