
import React from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const light = theme === 'light';
  return <button className="seller-theme-toggle" type="button" onClick={toggleTheme}
    aria-label={`Switch to ${light ? 'dark' : 'light'} mode`} title={`Switch to ${light ? 'dark' : 'light'} mode`}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {light ? <path d="M20 15A8.5 8.5 0 019 4a8.5 8.5 0 1011 11Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    </svg>
    <span>{light ? 'Dark mode' : 'Light mode'}</span>
  </button>;
}
