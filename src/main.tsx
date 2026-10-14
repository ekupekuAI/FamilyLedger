import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabaseConfigError } from './lib/supabase';

// Roboto font (required by MUI)
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {supabaseConfigError ? (
      <div style={{ maxWidth: 560, margin: '15vh auto', padding: 24, fontFamily: 'Roboto, sans-serif', lineHeight: 1.5 }}>
        <h1 style={{ fontSize: 22 }}>FamilyLedger is not configured</h1>
        <p>{supabaseConfigError}</p>
      </div>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
