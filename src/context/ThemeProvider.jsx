import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext';
const THEME_KEY = 'agri_connect_theme';
const themes = ['light', 'dark'];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return themes.includes(savedTheme) ? savedTheme : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);

    const themeColor = theme === 'dark' ? '#111E20' : '#F4F5F0';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
