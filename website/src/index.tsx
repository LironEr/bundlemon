import 'regenerator-runtime/runtime.js';
import { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './consts/theme';
import Layout from './components/Layout';
import Router from './Router';

ReactDOM.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Suspense fallback={null}>
            <Router />
          </Suspense>
        </Layout>
      </EmotionThemeProvider>
    </ThemeProvider>
  </StrictMode>,
  document.getElementById('root')
);
