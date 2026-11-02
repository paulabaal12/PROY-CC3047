import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/AppRouter';
import './styles/global.scss';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
