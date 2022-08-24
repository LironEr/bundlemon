import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { createContext, ReactNode, useState } from 'react';
import { lightTheme, darkTheme } from '@/consts/theme';
import { useOnMount } from '@/hooks';

export const ThemeContext = createContext<{ isDarkMode: boolean; setDarkMode: (isDarkMode: boolean) => void }>({
  isDarkMode: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDarkMode: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDarkMode, setDarkModeState] = useState(false);

  useOnMount(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedValue = localStorage.getItem('isDarkMode');

    setDarkModeState(storedValue ? storedValue === 'true' : prefersDark);
  });

  const setDarkMode = (isDark: boolean) => {
    setDarkModeState(isDark);
    localStorage.setItem('isDarkMode', String(isDark));
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setDarkMode }}>
      <MuiThemeProvider theme={theme}>
        <EmotionThemeProvider theme={theme}>{children}</EmotionThemeProvider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
