import 'regenerator-runtime/runtime.js';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from './consts/theme';
import Layout from './components/Layout';
import Router from './Router';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Router />
      </Layout>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
