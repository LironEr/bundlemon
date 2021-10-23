// import './wdyr';
import 'regenerator-runtime/runtime.js';
import { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import theme from './consts/theme';
import Layout from './components/Layout';
import Router from './Router';
import FetchError from './services/FetchError';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof FetchError) {
          return error.statusCode >= 500 && failureCount <= 2 ? true : false;
        }

        return false;
      },
      refetchOnWindowFocus: false,
      cacheTime: 0,
    },
  },
});

ReactDOM.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <CssBaseline />
          <Layout>
            <Suspense fallback={null}>
              <Router />
            </Suspense>
          </Layout>
        </QueryClientProvider>
      </EmotionThemeProvider>
    </ThemeProvider>
  </StrictMode>,
  document.getElementById('root')
);
